# Smart-Metrolac — Scalability Test

Simulates multiple IoT devices sending real DRC readings over MQTT to your
**deployed** backend, then confirms via the REST API that every reading
landed in the database — producing a chart and numbers you can use as real
evidence in your Testing section.

## What it actually tests

Full pipeline: simulated ESP32 devices → MQTT broker → Spring Boot
(`MqttMeasurementService`) → PostgreSQL → REST API (`/api/invoices`).

It proves two things:
1. **Correctness under load** — do all messages get stored, or does data
   get dropped when many devices publish at once?
2. **Throughput / latency** — how fast the pipeline absorbs a burst of
   readings, shown as a delivery curve (invoices confirmed over time).

It does **not** watch your React dashboard update in a browser — see
"Pairing with a visual dashboard demo" below for that part.

## Setup

```bash
pip install paho-mqtt requests matplotlib --break-system-packages
```

## Configure `load_test.py`

Open the `CONFIG` block at the top and fill in real values:

| Variable | Where to find it |
|---|---|
| `MQTT_BROKER_HOST`, `MQTT_BROKER_PORT` | Same as the `mqtt.broker.url` environment variable set on your EC2 deployment |
| `MQTT_TOPIC` | Same as your `mqtt.topic` environment variable |
| `MQTT_USERNAME` / `MQTT_PASSWORD` | Same as `mqtt.username` / `mqtt.password`, if set |
| `REST_BASE_URL` | Your deployed backend's public URL, e.g. `http://<ec2-ip>:8080` |
| `LOGIN_EMAIL` / `LOGIN_PASSWORD` | A real `company_admin` or `collection_center_admin` account |
| `CENTER_ID` | A real `collection_center_id` from your database |
| `FARMER_IDS` | A few real `farmer_id`s registered under that center |
| `NUM_DEVICES` / `MESSAGES_PER_DEVICE` | Your load profile — see suggestions below |

**One thing to check before running:** `login()` looks for the JWT under
`token`, `accessToken`, or `jwt` in the login response. If your
`AuthController` returns it under a different key, open `load_test.py` and
adjust that one line — the script will print the raw response if it can't
find it, so you'll know immediately.

## Suggested load profiles

Run it a few times at increasing scale — that progression is itself good
evidence for a scalability section (shows behavior doesn't fall over as
load increases):

| Run | Devices | Msgs/device | Total messages |
|---|---|---|---|
| Baseline | 5 | 3 | 15 |
| Moderate | 20 | 5 | 100 |
| Stress | 50 | 5 | 250 |

## Run it

```bash
python load_test.py
python plot_results.py
```

This produces:
- Console output with a live send/delivery log
- `load_test_results.json` — raw numbers
- `scalability_test_chart.png` — the delivery-curve chart

## Pairing with a visual dashboard demo

The script proves the backend/database side. To also show the **dashboard**
staying responsive, screen-record any dashboard view (Company Admin works
well — it likely shows the most data) while `load_test.py` is running.
The invoice count/chart on screen should climb in step with the delivery
curve the script produces. That paired evidence — quantitative chart +
visual recording — is stronger than either alone for your Testing section.

## Writing it up

A short paragraph like this works well alongside the chart:

> To validate scalability, [N] simulated devices concurrently published
> [M] DRC readings each ([total] messages total) over MQTT to the deployed
> backend. All messages were published within [X]s (a publish throughput of
> [Y] messages/second), and [Z]% were confirmed stored via the REST API
> within [T]s of the send phase completing, with [loss]% message loss.

Fill in the bracketed values from your actual `load_test_results.json`
after running it — don't estimate or round generously; the real numbers,
whatever they are, are more convincing than an inflated guess.

## If you see high loss or failures

That's not necessarily bad news for your report — it can be an honest,
useful finding (e.g. "the system handled N devices reliably but showed
Z% loss at 2N, indicating a scaling limit around..."). Your APEXIS paper
already shows you're comfortable disclosing real limitations rather than
hiding them — the same instinct applies here.