# Smart-Metrolac — Hardware-Dependent Tests

These two tests need the physical device. Everyone on the team can run
either whenever they have it — no special setup beyond the device itself
and (for Test 2) a laptop with the backend/broker reachable.

---

## Test 1: Sensor Repeatability

**Question it answers:** given the SAME latex sample, does the device
give consistent DRC readings each time? (Different from the Lalan Rubber
accuracy test, which compares readings against the ISO 126 lab standard
on different samples — this one checks the device's consistency with
itself.)

### Steps

1. Prepare ONE latex sample, well-mixed so it's uniform throughout.
2. Take a DRC reading with the device.
3. Without changing the sample, take another reading.
4. Repeat for **at least 8–10 readings total**. Keep conditions
   consistent between readings (same temperature, same sample, minimal
   time gap) — you're isolating the device's own measurement noise, not
   real changes in the sample.
5. Copy `readings_template.csv` to `readings.csv` and fill in one DRC
   value per line, in the `drc` column.
6. Run:
   ```bash
   pip install matplotlib --break-system-packages
   python3 sensor_repeatability_analysis.py
   ```

### What you get

- Mean, standard deviation, coefficient of variation (CV%), min/max, range
- A plain-language verdict (Excellent / Good / High variability)
- `repeatability_chart.png` — trial-by-trial scatter with the mean and
  ±1 standard deviation band shaded

### What counts as a good result

- **CV < 2%** — excellent repeatability
- **CV < 5%** — good repeatability
- **CV ≥ 5%** — worth investigating (sensor noise, unstable sample, or a
  calibration issue) — this is still a legitimate, useful finding for
  the report even if it's not the number you were hoping for

---

## Test 2: Offline / Store-and-Forward (Physical)

**Question it answers:** when the device genuinely loses WiFi, does it
actually buffer readings locally (not lose them), and correctly replay
the whole backlog once reconnected?

This complements the backend-side `backlog_replay_test.py` (already done,
see `testing/offline-sync/`) — that script proved the backend can absorb
a replayed backlog correctly; this test proves the device itself buffers
and replays correctly in the first place.

### Steps

1. Connect the ESP32 to a laptop via USB and open the Arduino IDE Serial
   Monitor (or your preferred serial tool). **Screen-record or
   screenshot this the whole time — it's your evidence.**
2. With the device on WiFi normally, take 2–3 real measurements and
   confirm they arrive on the dashboard as usual. This is your baseline.
3. Disconnect WiFi from the device — turn off the router, change the
   WiFi password temporarily, or move the device out of range. Watch for
   `WARNING: Offline mode` in the Serial Monitor or `[WIFI: OFFLINE]` on
   the LCD.
4. Take 3–5 measurements while offline. You should see
   `Network offline. Saving invoice to LittleFS...` and
   `Offline data saved successfully.` for each one — this proves
   readings are being buffered, not lost.
5. Restore WiFi. Watch for `--- BACKGROUND SYNC START ---`, a
   `Synced: ...` line per buffered reading, and finally
   `--- SYNC COMPLETE ---`.
6. Check the dashboard or query the API — every reading taken while
   offline should now be present, in order, with no duplicates or gaps.

### What counts as proof

The Serial Monitor recording/screenshots from steps 3–5, plus a
dashboard screenshot from step 6 showing all the offline readings
present. If you want, run `backlog_replay_test.py` (in
`testing/offline-sync/`) right after as a second data point — it won't
replace this physical test, but it's a nice quantitative pairing showing
the backend side holds up too.

---

## Once you've run these

Send the raw numbers (repeatability readings, or the physical test
screenshots) back and they can get turned into the same chart style as
the rest of the Testing section for the report/presentation.