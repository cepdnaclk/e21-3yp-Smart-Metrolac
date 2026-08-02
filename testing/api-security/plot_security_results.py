"""
Generates a presentation-friendly pass/fail checklist chart from
security_test_results.json. Run this after api_security_test.py.

    pip install matplotlib --break-system-packages
    python3 plot_security_results.py
"""

import json
import matplotlib.pyplot as plt

with open("security_test_results.json") as f:
    results = json.load(f)

n = len(results)
fig, ax = plt.subplots(figsize=(11, 0.7 * n + 1))
ax.set_xlim(0, 10)
ax.set_ylim(0, n)
ax.axis("off")

for i, r in enumerate(results):
    y = n - i - 1
    bg = "#e6f4ea" if r["passed"] else "#fde8e6"
    icon = "✓" if r["passed"] else "✗"
    icon_color = "#1b3022" if r["passed"] else "#ba1a1a"

    ax.add_patch(plt.Rectangle((0, y), 10, 0.9, facecolor=bg, edgecolor="none"))
    ax.text(0.15, y + 0.45, icon, fontsize=16, fontweight="bold",
            color=icon_color, va="center", ha="left")
    ax.text(0.7, y + 0.45, r["test"], fontsize=11, va="center", ha="left", color="#1c1b1b")
    ax.text(9.85, y + 0.45,
            f"expected {r['expected']}, got {r['actual']}",
            fontsize=9, va="center", ha="right", color="#434843")

passed = sum(1 for r in results if r["passed"])
ax.set_title(
    f"Smart-Metrolac API Security / Access Control\n{passed}/{n} checks passed",
    fontsize=14, pad=15,
)

plt.tight_layout()
plt.savefig("security_test_chart.png", dpi=200, bbox_inches="tight")
print("Saved security_test_chart.png")