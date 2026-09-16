"""
Smart-Metrolac — Sensor Repeatability Analysis
==================================================
Given the SAME physical latex sample measured multiple times with the
device, this checks how tightly the readings cluster together — i.e. is
the device consistent with itself? (This is different from the Lalan
Rubber accuracy test, which compares device readings against the ISO 126
lab standard on DIFFERENT samples.)

HOW TO COLLECT THE DATA (physical steps — needs the device)
---------------------------------------------------------------
1. Prepare ONE latex sample, well-mixed so it's uniform throughout.
2. Take a DRC reading with the device. Record it in readings.csv.
3. Without changing the sample, take another reading. Record it.
4. Repeat for at least 8-10 readings total. Try to keep conditions
   consistent between readings (same temperature, same sample, minimal
   time gap) so you're isolating the device's own measurement noise,
   not real changes in the sample.
5. Fill in readings.csv (a template is provided alongside this script)
   with one DRC value per line.
6. Run this script.

WHAT "GOOD" LOOKS LIKE
--------------------------
A tight cluster (low standard deviation, small range) means the device
gives consistent readings on a stable sample — good repeatability.
A wide spread suggests either sensor noise, an unstable sample, or a
calibration issue worth investigating.

Install dependency:
    pip install matplotlib --break-system-packages
"""

import csv
import statistics
import matplotlib.pyplot as plt

INPUT_CSV = "readings.csv"


def load_readings(path):
    readings = []
    with open(path) as f:
        reader = csv.DictReader(f)
        for row in reader:
            val = row.get("drc", "").strip()
            if val:
                readings.append(float(val))
    return readings


def main():
    try:
        readings = load_readings(INPUT_CSV)
    except FileNotFoundError:
        print(f"ERROR: {INPUT_CSV} not found. Copy readings_template.csv to "
              f"{INPUT_CSV} and fill in your real measurements first.")
        return

    if len(readings) < 3:
        print(f"ERROR: only {len(readings)} readings found in {INPUT_CSV}. "
              f"Need at least 3 (ideally 8-10) for a meaningful repeatability check.")
        return

    mean = statistics.mean(readings)
    median = statistics.median(readings)
    stdev = statistics.stdev(readings)  # sample stdev, since this is a sample of possible readings
    minimum = min(readings)
    maximum = max(readings)
    spread = maximum - minimum
    cv_pct = (stdev / mean * 100) if mean else 0  # coefficient of variation

    print("=" * 60)
    print("Smart-Metrolac Sensor Repeatability Analysis")
    print("=" * 60)
    print(f"Number of readings:     {len(readings)}")
    print(f"Readings (%):           {readings}")
    print(f"Mean:                   {mean:.3f}%")
    print(f"Median:                 {median:.3f}%")
    print(f"Standard deviation:     {stdev:.3f}%")
    print(f"Coefficient of variation: {cv_pct:.2f}%")
    print(f"Min / Max:              {minimum:.2f}% / {maximum:.2f}%")
    print(f"Range (spread):         {spread:.3f}%")

    if cv_pct < 2:
        verdict = "Excellent repeatability (CV < 2%)"
    elif cv_pct < 5:
        verdict = "Good repeatability (CV < 5%)"
    else:
        verdict = "High variability (CV >= 5%) — worth investigating sensor noise or sample stability"
    print(f"\nVerdict: {verdict}")

    # ---- Chart ----
    fig, ax = plt.subplots(figsize=(8, 5.5))
    trials = list(range(1, len(readings) + 1))
    ax.scatter(trials, readings, color="#1b3022", s=80, zorder=3)
    ax.plot(trials, readings, color="#1b3022", alpha=0.3, zorder=2)
    ax.axhline(mean, color="#3ca1a0", linestyle="--", linewidth=1.5,
                label=f"Mean ({mean:.2f}%)")
    ax.axhspan(mean - stdev, mean + stdev, color="#3ca1a0", alpha=0.12,
               label=f"±1 std dev ({stdev:.2f}%)")
    ax.set_xlabel("Trial #")
    ax.set_ylabel("DRC Reading (%)")
    ax.set_xticks(trials)
    ax.set_title(f"Sensor Repeatability — Same Sample, {len(readings)} Trials\n"
                 f"Mean: {mean:.2f}% | Std Dev: {stdev:.2f}% | CV: {cv_pct:.2f}%")
    ax.legend(loc="best")
    ax.grid(alpha=0.25)
    plt.tight_layout()
    plt.savefig("repeatability_chart.png", dpi=200)
    print("\nSaved repeatability_chart.png")


if __name__ == "__main__":
    main()
