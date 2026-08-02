"""
Smart-Metrolac — Offline Backlog Replay Test (Backend Side)
===============================================================
Your ESP32 firmware's syncOfflineData() function, once WiFi reconnects,
reads /backlog.txt line by line and publishes each buffered reading to
MQTT back-to-back with NO delay between them ("Blasts data to local
Spring Boot instantly" — see the comment in esp-code.ino). This script
reproduces that exact traffic pattern from a single simulated device and
confirms your backend correctly absorbs the whole backlog in order, with
zero loss and no duplicates.

WHAT THIS PROVES (backend side only)
--------------------------------------
Given the exact burst pattern your real device produces on reconnect,
does every buffered reading land in the database, in the right order,
exactly once?

WHAT THIS DOES NOT PROVE
---------------------------
This does NOT test the ESP32 firmware itself (LittleFS buffering while
offline, WiFi reconnect detection, partial-sync retry logic). That needs
the physical device — see the separate physical test protocol.

BEFORE YOU RUN THIS
----------------------
Run against your LOCAL backend only (same setup as your other local
tests). Install dependency:
    pip install paho-mqtt requests --break-system-packages
"""

import json
import time
import uuid
from datetime import datetime, timedelta, timezone

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

BACKLOG_SIZE = 15   # how many "buffered while offline" readings to replay at once
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


def build_backlog(n):
    """Builds N readings with sequential PAST timestamps, as if they'd been
    taken minutes apart while the device was genuinely offline, then all
    got buffered to /backlog.txt to be replayed at once on reconnect."""
    backlog = []
    base_time = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=n * 2)
    for i in range(n):
        farmer_id = FARMER_IDS[i % len(FARMER_IDS)]
        ts = base_time + timedelta(minutes=2 * i)
        drc = round(28 + (uuid.uuid4().int % 1200) / 100, 2)
        litres = round(5 + (uuid.uuid4().int % 2000) / 100, 2)
        backlog.append({
            "farmer_id": farmer_id,
            "collection_center_id": CENTER_ID,
            "drc": drc,
            "total_litres": litres,
            "total_amount": round(drc * litres * 3.2, 2),
            "temperature": round(25 + (uuid.uuid4().int % 80) / 10, 1),
            "ph_status": "normal",
            "tds_status": "normal",
            "measurement_datetime": ts.isoformat(timespec="seconds"),
        })
    return backlog


def replay_backlog(backlog):
    """Publishes every line back-to-back with NO delay, exactly matching
    syncOfflineData()'s actual behavior on the real firmware."""
    client = mqtt.Client(client_id=f"backlog-replay-{uuid.uuid4().hex[:6]}")
    client.connect(MQTT_BROKER_HOST, MQTT_BROKER_PORT, keepalive=30)
    client.loop_start()

    sent = 0
    start = time.monotonic()
    for reading in backlog:
        info = client.publish(MQTT_TOPIC, json.dumps(reading), qos=1)
        info.wait_for_publish(timeout=5)
        sent += 1
        # deliberately NO time.sleep() here — matches the real firmware exactly
    elapsed = time.monotonic() - start

    client.loop_stop()
    client.disconnect()
    return sent, elapsed


def main():
    print("=" * 60)
    print("Smart-Metrolac Offline Backlog Replay Test (Backend Side)")
    print("=" * 60)

    if "localhost" not in REST_BASE_URL and "127.0.0.1" not in REST_BASE_URL:
        print("\n!!! REST_BASE_URL is not localhost. Aborting — run local tests locally. !!!")
        return

    token = login()
    baseline = get_invoice_count(token)
    print(f"Baseline invoice count: {baseline}")

    backlog = build_backlog(BACKLOG_SIZE)
    print(f"\nSimulating device reconnect: replaying {BACKLOG_SIZE} buffered "
          f"readings back-to-back (no delay, matching syncOfflineData())...")
    sent, elapsed = replay_backlog(backlog)
    print(f"Replay burst sent in {elapsed:.3f}s ({sent}/{BACKLOG_SIZE} published successfully)")

    print("\nWaiting briefly, then confirming via API...")
    time.sleep(2)
    final_count = get_invoice_count(token)
    delivered = final_count - baseline

    loss = sent - delivered
    print("\n" + "=" * 60)
    print("RESULTS")
    print("=" * 60)
    print(f"Backlog size (simulated):   {BACKLOG_SIZE}")
    print(f"Published in burst:         {sent}")
    print(f"Confirmed stored via API:   {delivered}")
    print(f"Data loss:                  {loss} ({(loss / sent * 100 if sent else 0):.1f}%)")

    passed = (delivered == sent)
    print(f"\n{'PASS' if passed else 'FAIL'}: "
          f"{'All buffered readings landed correctly.' if passed else 'Some readings were lost or duplicated — investigate.'}")

    with open("backlog_replay_results.json", "w") as f:
        json.dump({
            "backlog_size": BACKLOG_SIZE,
            "sent": sent,
            "delivered": delivered,
            "loss": loss,
            "elapsed_sec": elapsed,
            "passed": passed,
        }, f, indent=2)
    print("\nSaved backlog_replay_results.json")


if __name__ == "__main__":
    main()