"""
Generates a clear, presentation-friendly chart from load_test_results.json.
Run this after load_test.py finishes.

    pip install matplotlib --break-system-packages
    python plot_results.py
"""

import json
import matplotlib.pyplot as plt

with open("load_test_results.json") as f:
    data = json.load(f)

curve = data["delivery_curve"]
total_expected = data["total_expected"]
sent_ok = data["sent_ok"]
delivered = data["delivered"]
loss = data["loss"]
loss_pct = data["loss_pct"]
throughput = data["publish_throughput_msgs_per_sec"]
time_to_full = data["time_to_full_delivery_sec"]

# Distinct time points in the delivery curve (rounded to avoid float-noise duplicates)
distinct_times = sorted(set(round(t, 3) for t, _ in curve))
has_meaningful_curve = len(distinct_times) > 1

fig, axes = plt.subplots(1, 2 if has_meaningful_curve else 1,
                          figsize=(12, 5.5) if has_meaningful_curve else (7, 5.5))
if not has_meaningful_curve:
    axes = [axes]

# ---- Panel 1: Sent vs Delivered bar chart (always shown — the clearest possible result) ----
ax1 = axes[0]
bars = ax1.bar(
    ["Messages\nSent", "Confirmed\nDelivered"],
    [sent_ok, delivered],
    color=["#3ca1a0", "#1b3022"],
    width=0.5,
)
for bar, value in zip(bars, [sent_ok, delivered]):
    ax1.text(bar.get_x() + bar.get_width() / 2, value + max(sent_ok, delivered) * 0.02,
              str(value), ha="center", fontsize=13, fontweight="bold")
ax1.set_ylim(0, max(sent_ok, delivered) * 1.15)
ax1.set_ylabel("Number of messages")
ax1.set_title("Sent vs. Delivered")
ax1.grid(axis="y", alpha=0.25)

# ---- Panel 2: Delivery-over-time curve (only if delivery wasn't instantaneous) ----
if has_meaningful_curve:
    ax2 = axes[1]
    times = [t for t, _ in curve]
    delivered_vals = [d for _, d in curve]

    # auto-scale to milliseconds if the whole test finished in under a second —
    # avoids matplotlib falling back to unreadable scientific notation (e.g. 1e-6)
    max_t = max(times) if times else 0
    if max_t < 1:
        times = [t * 1000 for t in times]
        x_label = "Time since send phase ended (milliseconds)"
    else:
        x_label = "Time since send phase ended (seconds)"

    ax2.plot(times, delivered_vals, marker="o", linewidth=2, color="#1b3022")
    ax2.axhline(sent_ok, color="#3ca1a0", linestyle="--", linewidth=1.5, label=f"Total sent ({sent_ok})")
    ax2.set_xlabel(x_label)
    ax2.set_ylabel("Invoices confirmed stored")
    ax2.set_title("Delivery Over Time")
    ax2.legend(loc="lower right")
    ax2.grid(alpha=0.25)
    # give a single/near-instant point some visual breathing room
    if len(distinct_times) <= 2:
        span = max(times) - min(times) if len(times) > 1 else 1
        pad = span if span > 0 else 1
        ax2.set_xlim(min(times) - pad, max(times) + pad)

fig.suptitle(
    f"Smart-Metrolac Scalability Test — {data['num_devices']} simulated devices × "
    f"{data['messages_per_device']} readings ({total_expected} total messages)",
    fontsize=13,
)

if time_to_full is not None and time_to_full < 1:
    delivery_time_str = f"{time_to_full * 1000:.1f} ms"
elif time_to_full is not None:
    delivery_time_str = f"{time_to_full:.1f}s"
else:
    delivery_time_str = "timeout"

footer = (
    f"Publish throughput: {throughput:.2f} msgs/sec   |   "
    f"Data loss: {loss} ({loss_pct:.1f}%)   |   "
    f"Time to full delivery: {delivery_time_str}"
)
fig.text(0.5, 0.01, footer, ha="center", fontsize=10, color="#434843")

plt.tight_layout(rect=[0, 0.05, 1, 0.93])
plt.savefig("scalability_test_chart.png", dpi=200)
print("Saved scalability_test_chart.png")
if not has_meaningful_curve:
    print(f"Note: delivery was near-instantaneous ({delivery_time_str} to confirm all "
          f"{delivered} messages), so only the Sent-vs-Delivered panel is shown — "
          f"a delivery-over-time curve isn't meaningful when everything lands in one poll.")