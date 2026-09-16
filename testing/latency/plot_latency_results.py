"""
Generates a presentation-friendly latency chart from latency_test_results.json.
Run this after latency_test.py.

    pip install matplotlib --break-system-packages
    python3 plot_latency_results.py
"""

import json
import matplotlib.pyplot as plt

with open("latency_test_results.json") as f:
    data = json.load(f)

latencies = data["latencies_ms"]
trials = list(range(1, len(latencies) + 1))

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))

# ---- Panel 1: per-trial latency ----
ax1.bar(trials, latencies, color="#1b3022")
ax1.axhline(data["median_ms"], color="#3ca1a0", linestyle="--", linewidth=1.5,
            label=f"Median ({data['median_ms']:.0f} ms)")
ax1.set_xlabel("Trial #")
ax1.set_ylabel("Latency (ms)")
ax1.set_title("Latency per Reading")
ax1.legend(loc="upper right")
ax1.grid(axis="y", alpha=0.25)

# ---- Panel 2: summary stats as a clean bar comparison ----
stats_labels = ["Min", "Median", "Average", "95th %ile", "Max"]
stats_values = [data["min_ms"], data["median_ms"], data["avg_ms"], data["p95_ms"], data["max_ms"]]
colors = ["#3ca1a0", "#1b3022", "#1b3022", "#c3922f", "#ba1a1a"]
bars = ax2.bar(stats_labels, stats_values, color=colors)
for bar, val in zip(bars, stats_values):
    ax2.text(bar.get_x() + bar.get_width() / 2, val + max(stats_values) * 0.02,
              f"{val:.0f}", ha="center", fontsize=10, fontweight="bold")
ax2.set_ylabel("Latency (ms)")
ax2.set_title("Summary Statistics")
ax2.grid(axis="y", alpha=0.25)

fig.suptitle(
    f"Smart-Metrolac Single-Reading Latency ({data['completed']}/{data['num_trials']} trials completed)",
    fontsize=13,
)

plt.tight_layout(rect=[0, 0, 1, 0.94])
plt.savefig("latency_test_chart.png", dpi=200)
print("Saved latency_test_chart.png")