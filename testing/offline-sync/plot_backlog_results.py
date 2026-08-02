"""
Generates a small presentation chart from backlog_replay_results.json.
Run this after backlog_replay_test.py.

    pip install matplotlib --break-system-packages
    python3 plot_backlog_results.py
"""

import json
import matplotlib.pyplot as plt

with open("backlog_replay_results.json") as f:
    data = json.load(f)

sent = data["sent"]
delivered = data["delivered"]
loss = data["loss"]
passed = data["passed"]

fig, ax = plt.subplots(figsize=(6, 5.5))
bars = ax.bar(
    ["Backlog\nPublished", "Confirmed\nStored"],
    [sent, delivered],
    color=["#3ca1a0", "#1b3022" if passed else "#ba1a1a"],
    width=0.5,
)
for bar, value in zip(bars, [sent, delivered]):
    ax.text(bar.get_x() + bar.get_width() / 2, value + max(sent, delivered) * 0.03,
             str(value), ha="center", fontsize=14, fontweight="bold")

ax.set_ylim(0, max(sent, delivered) * 1.2)
ax.set_ylabel("Number of readings")
result_word = "PASS" if passed else "FAIL"
ax.set_title(
    f"Offline Backlog Replay — {result_word}\n"
    f"{data['backlog_size']} buffered readings replayed on reconnect, {loss} lost"
)
ax.grid(axis="y", alpha=0.25)

plt.tight_layout()
plt.savefig("backlog_replay_chart.png", dpi=200)
print("Saved backlog_replay_chart.png")