"""
Smart-Metrolac — Scalability / Load Test
==========================================
Simulates N concurrent IoT devices, each publishing real DRC-reading
payloads over MQTT (matching MqttMeasurementService's expected schema
exactly), then polls your deployed REST API to confirm every reading
was actually stored and to time how the pipeline behaves as load ramps
up — device -> MQTT broker -> Spring Boot -> PostgreSQL -> dashboard API.

WHAT THIS PROVES
-----------------
1. Correctness under load: did all N x M messages actually get stored,
   or did some get dropped/lost when many devices send at once?
2. Throughput: how many readings/second the pipeline can absorb.
3. A "delivery curve" chart: cumulative invoices stored over time,
   which is the standard way to present a scalability result.

WHAT THIS DOES NOT DO
----------------------
It does not open your React dashboard in a browser and watch pixels
update. For that "the dashboard itself updates live" claim, screen-record
the dashboard (any role view) while this script runs — the delivery
curve this script produces should visually match what you see updating
on screen. Pair the two as your Testing-section evidence.

BEFORE YOU RUN THIS
--------------------
Fill in the CONFIG block below with real values:
  - MQTT_* : the same values set as mqtt.broker.url / mqtt.topic / etc.
             environment variables on your EC2 deployment.
  - REST_BASE_URL : your deployed backend's public URL.
  - LOGIN_EMAIL / LOGIN_PASSWORD : a real company_admin or
             collection_center_admin account in your deployed DB.
  - CENTER_ID : a real collection_center_id.
  - FARMER_IDS : a list of real farmer_ids that belong to that center.

Install dependencies first:
    pip install paho-mqtt requests matplotlib --break-system-packages

Then run:
    python load_test.py
"""

import json
import os
import time
import uuid
import threading
import statistics
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor

import requests
import paho.mqtt.client as mqtt

# ============================== CONFIG ===============================
# For local validation, point these at your local backend / local MQTT broker.
MQTT_BROKER_HOST = "localhost"
MQTT_BROKER_PORT = 1883
MQTT_TOPIC       = "smartmetrolac/device01/telemetry"
MQTT_USERNAME    = ""
MQTT_PASSWORD    = ""

REST_BASE_URL    = "http://localhost:8080"
LOGIN_EMAIL      = "localadmin"
LOGIN_PASSWORD   = "localtest123"

CENTER_ID        = 1
FARMER_IDS       = [3]

CENTER_ID        = 1
FARMER_IDS       = [3]

NUM_DEVICES          = 50
MESSAGES_PER_DEVICE  = 10
SEND_INTERVAL_SEC    = 2.0
POLL_TIMEOUT_SEC      = 60
POLL_INTERVAL_SEC     = 1.0
# =======================================================================
# =======================================================================

TOTAL_EXPECTED = NUM_DEVICES * MESSAGES_PER_DEVICE

_lock = threading.Lock()
_sent_ok = 0
_send_failures = 0
_send_start_time = None
_send_end_time = None


def make_payload(farmer_id: int, center_id: int) -> dict:
    """Builds a payload matching MqttMeasurementService's exact expected schema."""
    now = datetime.now(timezone.utc).replace(tzinfo=None)  # backend expects a plain LocalDateTime
    drc = round(28 + (uuid.uuid4().int % 1200) / 100, 2)   # realistic-looking 28-40% range
    litres = round(5 + (uuid.uuid4().int % 2000) / 100, 2)
    return {
        "farmer_id": farmer_id,
        "collection_center_id": center_id,
        "drc": drc,
        "total_litres": litres,
        "total_amount": round(drc * litres * 3.2, 2),  # placeholder price factor, not load-bearing
        "temperature": round(25 + (uuid.uuid4().int % 80) / 10, 1),
        "ph_status": "normal",
        "tds_status": "normal",
        "measurement_datetime": now.isoformat(timespec="seconds"),
    }


def device_worker(device_index: int):
    global _sent_ok, _send_failures
    client_id = f"loadtest-device-{device_index}-{uuid.uuid4().hex[:6]}"
    client = mqtt.Client(client_id=client_id)
    if MQTT_USERNAME:
        client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)

    try:
        client.connect(MQTT_BROKER_HOST, MQTT_BROKER_PORT, keepalive=30)
        client.loop_start()
    except Exception as e:
        print(f"[device {device_index}] connection failed: {e}")
        with _lock:
            _send_failures += MESSAGES_PER_DEVICE
        return

    for i in range(MESSAGES_PER_DEVICE):
        farmer_id = FARMER_IDS[(device_index + i) % len(FARMER_IDS)]
        payload = make_payload(farmer_id, CENTER_ID)
        try:
            info = client.publish(MQTT_TOPIC, json.dumps(payload), qos=1)
            info.wait_for_publish(timeout=5)
            with _lock:
                _sent_ok += 1
        except Exception as e:
            print(f"[device {device_index}] publish #{i} failed: {e}")
            with _lock:
                _send_failures += 1
        time.sleep(SEND_INTERVAL_SEC)

    client.loop_stop()
    client.disconnect()


def run_device_swarm():
    global _send_start_time, _send_end_time
    print(f"Launching {NUM_DEVICES} simulated devices, "
          f"{MESSAGES_PER_DEVICE} readings each ({TOTAL_EXPECTED} total messages)...")
    _send_start_time = time.monotonic()
    with ThreadPoolExecutor(max_workers=NUM_DEVICES) as pool:
        pool.map(device_worker, range(NUM_DEVICES))
    _send_end_time = time.monotonic()
    elapsed = _send_end_time - _send_start_time
    print(f"Send phase complete in {elapsed:.2f}s "
          f"({_sent_ok} sent ok, {_send_failures} failed to publish)")
    return elapsed


def login() -> str:
    resp = requests.post(
        f"{REST_BASE_URL}/api/auth/login",
        json={"username": LOGIN_EMAIL, "password": LOGIN_PASSWORD},
        timeout=10,
    )
    resp.raise_for_status()
    data = resp.json()
    token = data.get("token") or data.get("accessToken") or data.get("jwt")
    if not token:
        raise RuntimeError(
            f"Could not find a JWT in the login response. "
            f"Adjust the key lookup in login() to match your actual response shape: {data}"
        )
    return token


def get_invoice_count(token: str) -> int:
    resp = requests.get(
        f"{REST_BASE_URL}/api/invoices",
        params={"centerId": CENTER_ID},
        headers={"Authorization": f"Bearer {token}"},
        timeout=15,
    )
    resp.raise_for_status()
    return len(resp.json())


def poll_delivery_curve(token: str, baseline_count: int):
    """Polls the API repeatedly and records (elapsed_seconds, delivered_count)
    until either everything sent has landed, or POLL_TIMEOUT_SEC elapses."""
    curve = []
    start = time.monotonic()
    delivered = 0
    while True:
        elapsed = time.monotonic() - start
        try:
            current = get_invoice_count(token)
            delivered = max(0, current - baseline_count)
        except Exception as e:
            print(f"  poll error (continuing): {e}")
        curve.append((elapsed, delivered))
        print(f"  t={elapsed:5.1f}s  delivered={delivered}/{TOTAL_EXPECTED}")
        if delivered >= _sent_ok or elapsed >= POLL_TIMEOUT_SEC:
            break
        time.sleep(POLL_INTERVAL_SEC)
    return curve, delivered


def main():
    print("=" * 60)
    print("Smart-Metrolac Scalability Test")
    print("=" * 60)

    print("\nLogging in...")
    token = login()
    print("Login OK.")

    print("\nFetching baseline invoice count for this center...")
    baseline = get_invoice_count(token)
    print(f"Baseline count = {baseline}")

    print()
    send_elapsed = run_device_swarm()

    print("\nPolling API for delivery confirmation...")
    curve, delivered = poll_delivery_curve(token, baseline)

    loss = _sent_ok - delivered
    loss_pct = (loss / _sent_ok * 100) if _sent_ok else 0
    send_throughput = _sent_ok / send_elapsed if send_elapsed > 0 else 0
    time_to_full_delivery = curve[-1][0] if delivered >= _sent_ok else None

    print("\n" + "=" * 60)
    print("RESULTS")
    print("=" * 60)
    print(f"Simulated devices:          {NUM_DEVICES}")
    print(f"Messages per device:        {MESSAGES_PER_DEVICE}")
    print(f"Total messages attempted:   {TOTAL_EXPECTED}")
    print(f"Successfully published:     {_sent_ok}")
    print(f"Failed to publish:          {_send_failures}")
    print(f"Send-phase duration:        {send_elapsed:.2f}s")
    print(f"Publish throughput:         {send_throughput:.2f} msgs/sec")
    print(f"Confirmed stored via API:   {delivered}/{_sent_ok}")
    print(f"Data loss:                  {loss} messages ({loss_pct:.1f}%)")
    if time_to_full_delivery is not None:
        print(f"Time to full delivery:      {time_to_full_delivery:.2f}s after send phase ended")
    else:
        print(f"Time to full delivery:      NOT reached within {POLL_TIMEOUT_SEC}s timeout")

    # Save raw results for plotting / the report
    with open("load_test_results.json", "w") as f:
        json.dump({
            "num_devices": NUM_DEVICES,
            "messages_per_device": MESSAGES_PER_DEVICE,
            "total_expected": TOTAL_EXPECTED,
            "sent_ok": _sent_ok,
            "send_failures": _send_failures,
            "send_elapsed_sec": send_elapsed,
            "publish_throughput_msgs_per_sec": send_throughput,
            "delivered": delivered,
            "loss": loss,
            "loss_pct": loss_pct,
            "time_to_full_delivery_sec": time_to_full_delivery,
            "delivery_curve": curve,
        }, f, indent=2)
    print("\nRaw results saved to load_test_results.json")
    print("Run `python plot_results.py` next to generate the chart.")


if __name__ == "__main__":
    main()