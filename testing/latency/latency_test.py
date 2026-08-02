"""
Smart-Metrolac — Single-Reading Latency Test
================================================
Measures how long ONE normal reading takes to go from "published by the
device" to "visible via the dashboard API" — under everyday conditions,
not bulk load. This is the number a farmer or collection center actually
experiences when a single measurement is taken, as opposed to the
scalability test's bulk-throughput numbers.

WHAT THIS PROVES
-----------------
Real round-trip latency (median, average, 95th percentile) for a single
MQTT publish -> Spring Boot -> PostgreSQL -> REST API visibility cycle,
under normal (non-bulk) conditions.

BEFORE YOU RUN THIS
----------------------
Run against your LOCAL backend, same setup as your other local tests.
Install dependencies:
    pip install paho-mqtt requests matplotlib --break-system-packages
"""

import json
import time
import uuid
import statistics
from datetime import datetime, timezone

import requests
import paho.mqtt.client as mqtt

# ============================== CONFIG ===============================
MQTT_BROKER_HOST = "localhost"
MQTT_BROKER_PORT = 1883
MQTT_TOPIC       = "smartmetrolac/device01/telemetry"

REST_BASE_URL   = "http://localhost:8080"
LOGIN_USERNAME  = "localadmin"
LOGIN_PASSWORD  = "localtest123"

CENTER_ID  = 1
FARMER_IDS = [3]

NUM_TRIALS       = 20     # number of single readings to measure
GAP_BETWEEN_SEC  = 1.0    # pause between trials, so they don't overlap
POLL_INTERVAL_SEC = 0.05  # how finely to poll for arrival (50ms = decent precision)
POLL_TIMEOUT_SEC   = 10   # give up on a trial after this long
# =======================================================================


def login():
    resp = requests.post(f"{REST_BASE_URL}/api/auth/login",
                          json={"username": LOGIN_USERNAME, "password": LOGIN_PASSWORD}, timeout=10)
    resp.raise_for_status()
    return resp.json()["token"]


def get_invoice_count(token):
    resp = requests.get(f"{REST_BASE_URL}/api/invoices",
                         params={"centerId": CENTER_ID},
                         headers={"Authorization": f"Bearer {token}"}, timeout=15)
    resp.raise_for_status()
    return len(resp.json())


def make_single_reading(trial_index):
    farmer_id = FARMER_IDS[trial_index % len(FARMER_IDS)]
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    drc = round(28 + (uuid.uuid4().int % 1200) / 100, 2)
    litres = round(5 + (uuid.uuid4().int % 2000) / 100, 2)
    return {
        "farmer_id": farmer_id,
        "collection_center_id": CENTER_ID,
        "drc": drc,
        "total_litres": litres,
        "total_amount": round(drc * litres * 3.2, 2),
        "temperature": round(25 + (uuid.uuid4().int % 80) / 10, 1),
        "ph_status": "normal",
        "tds_status": "normal",
        "measurement_datetime": now.isoformat(timespec="seconds"),
    }


def run_single_trial(client, token, trial_index, baseline):
    reading = make_single_reading(trial_index)
    publish_time = time.monotonic()
    info = client.publish(MQTT_TOPIC, json.dumps(reading), qos=1)
    info.wait_for_publish(timeout=5)

    deadline = publish_time + POLL_TIMEOUT_SEC
    while time.monotonic() < deadline:
        current = get_invoice_count(token)
        if current > baseline:
            arrival_time = time.monotonic()
            return (arrival_time - publish_time) * 1000, current  # ms
        time.sleep(POLL_INTERVAL_SEC)
    return None, baseline  # timed out


def main():
    print("=" * 60)
    print("Smart-Metrolac Single-Reading Latency Test")
    print("=" * 60)

    if "localhost" not in REST_BASE_URL and "127.0.0.1" not in REST_BASE_URL:
        print("\n!!! REST_BASE_URL is not localhost. Aborting. !!!")
        return

    token = login()
    client = mqtt.Client(client_id=f"latency-test-{uuid.uuid4().hex[:6]}")
    client.connect(MQTT_BROKER_HOST, MQTT_BROKER_PORT, keepalive=30)
    client.loop_start()

    latencies_ms = []
    baseline = get_invoice_count(token)
    print(f"Baseline invoice count: {baseline}\n")

    for i in range(NUM_TRIALS):
        latency_ms, new_count = run_single_trial(client, token, i, baseline)
        if latency_ms is not None:
            latencies_ms.append(latency_ms)
            print(f"  Trial {i + 1:2d}/{NUM_TRIALS}: {latency_ms:6.1f} ms")
            baseline = new_count
        else:
            print(f"  Trial {i + 1:2d}/{NUM_TRIALS}: TIMED OUT (no arrival within {POLL_TIMEOUT_SEC}s)")
        time.sleep(GAP_BETWEEN_SEC)

    client.loop_stop()
    client.disconnect()

    print("\n" + "=" * 60)
    print("RESULTS")
    print("=" * 60)
    completed = len(latencies_ms)
    print(f"Completed trials:  {completed}/{NUM_TRIALS}")

    if completed > 0:
        avg = statistics.mean(latencies_ms)
        median = statistics.median(latencies_ms)
        p95 = sorted(latencies_ms)[int(len(latencies_ms) * 0.95) - 1] if completed >= 2 else latencies_ms[0]
        minimum = min(latencies_ms)
        maximum = max(latencies_ms)

        print(f"Average latency:   {avg:.1f} ms")
        print(f"Median latency:    {median:.1f} ms")
        print(f"95th percentile:   {p95:.1f} ms")
        print(f"Min / Max:         {minimum:.1f} ms / {maximum:.1f} ms")

        with open("latency_test_results.json", "w") as f:
            json.dump({
                "num_trials": NUM_TRIALS,
                "completed": completed,
                "latencies_ms": latencies_ms,
                "avg_ms": avg,
                "median_ms": median,
                "p95_ms": p95,
                "min_ms": minimum,
                "max_ms": maximum,
            }, f, indent=2)
        print("\nSaved latency_test_results.json")
        print("Run `python3 plot_latency_results.py` next to generate the chart.")
    else:
        print("No trials completed successfully — check your local backend/broker are running.")


if __name__ == "__main__":
    main()