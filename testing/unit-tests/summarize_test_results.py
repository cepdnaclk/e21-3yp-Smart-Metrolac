"""
Smart-Metrolac — Unit Test & Coverage Summary
================================================
Run this AFTER `mvn clean test` has completed in code/backend/.
Parses the raw Surefire (test results) and JaCoCo (coverage) reports
Maven generates and turns them into one clean summary + chart for
your Testing section.

USAGE
-----
    cd code/backend
    mvn clean test
    python summarize_test_results.py

Looks for reports at the standard Maven locations:
    target/surefire-reports/*.xml
    target/site/jacoco/jacoco.csv

If your backend folder is somewhere else, pass it as an argument:
    python summarize_test_results.py /path/to/code/backend

Install dependency first:
    pip install matplotlib --break-system-packages
"""

import sys
import csv
import json
import xml.etree.ElementTree as ET
from pathlib import Path

import matplotlib.pyplot as plt

backend_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(".")
surefire_dir = backend_dir / "target" / "surefire-reports"
jacoco_csv = backend_dir / "target" / "site" / "jacoco" / "jacoco.csv"


def parse_surefire():
    if not surefire_dir.exists():
        print(f"ERROR: {surefire_dir} not found. Run `mvn clean test` first.")
        sys.exit(1)

    suites = []
    for xml_file in sorted(surefire_dir.glob("TEST-*.xml")):
        tree = ET.parse(xml_file)
        root = tree.getroot()
        suites.append({
            "class": root.attrib.get("name", xml_file.stem),
            "tests": int(root.attrib.get("tests", 0)),
            "failures": int(root.attrib.get("failures", 0)),
            "errors": int(root.attrib.get("errors", 0)),
            "skipped": int(root.attrib.get("skipped", 0)),
            "time_sec": float(root.attrib.get("time", 0)),
        })
    return suites


def parse_jacoco():
    if not jacoco_csv.exists():
        print(f"WARNING: {jacoco_csv} not found — coverage will be omitted. "
              f"Make sure the jacoco-maven-plugin is in pom.xml and mvn test ran successfully.")
        return []

    rows = []
    with open(jacoco_csv, newline="") as f:
        for row in csv.DictReader(f):
            line_missed = int(row["LINE_MISSED"])
            line_covered = int(row["LINE_COVERED"])
            total = line_missed + line_covered
            pct = (line_covered / total * 100) if total > 0 else None
            rows.append({
                "package": row["PACKAGE"],
                "class": row["CLASS"],
                "line_missed": line_missed,
                "line_covered": line_covered,
                "line_coverage_pct": pct,
            })
    return rows


def main():
    print("=" * 60)
    print("Smart-Metrolac — Unit Test & Coverage Summary")
    print("=" * 60)

    suites = parse_surefire()
    total_tests = sum(s["tests"] for s in suites)
    total_failures = sum(s["failures"] for s in suites)
    total_errors = sum(s["errors"] for s in suites)
    total_skipped = sum(s["skipped"] for s in suites)
    total_passed = total_tests - total_failures - total_errors - total_skipped
    total_time = sum(s["time_sec"] for s in suites)

    print(f"\nTest classes run: {len(suites)}")
    for s in suites:
        status = "PASS" if (s["failures"] == 0 and s["errors"] == 0) else "FAIL"
        print(f"  [{status}] {s['class']:<55} "
              f"{s['tests']} tests, {s['failures']} failures, "
              f"{s['errors']} errors, {s['time_sec']:.2f}s")

    print(f"\nTOTAL: {total_tests} tests | {total_passed} passed | "
          f"{total_failures} failed | {total_errors} errors | "
          f"{total_skipped} skipped | {total_time:.2f}s")

    coverage_rows = parse_jacoco()
    overall_pct = None
    if coverage_rows:
        total_covered = sum(r["line_covered"] for r in coverage_rows)
        total_missed = sum(r["line_missed"] for r in coverage_rows)
        overall_total = total_covered + total_missed
        overall_pct = (total_covered / overall_total * 100) if overall_total > 0 else 0

        print(f"\nLine coverage by class:")
        for r in sorted(coverage_rows, key=lambda x: x["line_coverage_pct"] or 0, reverse=True):
            pct_str = f"{r['line_coverage_pct']:.1f}%" if r["line_coverage_pct"] is not None else "n/a"
            print(f"  {r['class']:<45} {pct_str}")

        print(f"\nOVERALL LINE COVERAGE: {overall_pct:.1f}%")

    # Save JSON summary
    summary = {
        "total_tests": total_tests,
        "passed": total_passed,
        "failed": total_failures,
        "errors": total_errors,
        "skipped": total_skipped,
        "total_time_sec": total_time,
        "suites": suites,
        "overall_line_coverage_pct": overall_pct,
        "coverage_by_class": coverage_rows,
    }
    with open("test_summary.json", "w") as f:
        json.dump(summary, f, indent=2)
    print("\nSaved test_summary.json")

    # Chart: coverage per class (only if we have coverage data)
    if coverage_rows:
        classes = [r["class"].split(".")[-1] for r in coverage_rows if r["line_coverage_pct"] is not None]
        pcts = [r["line_coverage_pct"] for r in coverage_rows if r["line_coverage_pct"] is not None]

        fig, ax = plt.subplots(figsize=(9, max(4, len(classes) * 0.4)))
        colors = ["#1b3022" if p >= 70 else "#c3922f" if p >= 40 else "#ba1a1a" for p in pcts]
        ax.barh(classes, pcts, color=colors)
        ax.set_xlabel("Line coverage (%)")
        ax.set_xlim(0, 100)
        ax.set_title(f"Smart-Metrolac Backend — Unit Test Line Coverage (All 50 Classes)\n"
                     f"{total_passed}/{total_tests} tests passing | Overall: {overall_pct:.1f}%")
        ax.grid(axis="x", alpha=0.25)
        plt.tight_layout()
        plt.savefig("test_coverage_chart_full.png", dpi=200)
        print("Saved test_coverage_chart_full.png (all classes — includes untested DTOs/config/controllers)")
        plt.close(fig)

        # ---- Presentation-friendly version: only classes with actual coverage > 0% ----
        tested = [(c, p) for c, p in zip(classes, pcts) if p > 0]
        tested.sort(key=lambda x: x[1], reverse=True)
        if tested:
            t_classes = [c for c, _ in tested]
            t_pcts = [p for _, p in tested]
            t_colors = ["#1b3022" if p >= 70 else "#c3922f" if p >= 40 else "#ba1a1a" for p in t_pcts]

            fig2, ax2 = plt.subplots(figsize=(9, max(3, len(t_classes) * 0.5)))
            bars = ax2.barh(t_classes, t_pcts, color=t_colors)
            for bar, pct in zip(bars, t_pcts):
                ax2.text(pct + 1.5, bar.get_y() + bar.get_height() / 2, f"{pct:.0f}%",
                          va="center", fontsize=10)
            ax2.set_xlabel("Line coverage (%)")
            ax2.set_xlim(0, 105)
            ax2.set_title(f"Smart-Metrolac Backend — Coverage of Classes With Unit Tests\n"
                          f"{total_passed}/{total_tests} tests passing across {len(t_classes)} tested classes")
            ax2.grid(axis="x", alpha=0.25)
            plt.tight_layout()
            plt.savefig("test_coverage_chart_tested_only.png", dpi=200)
            print("Saved test_coverage_chart_tested_only.png (presentation-friendly — only classes with tests)")
            plt.close(fig2)


if __name__ == "__main__":
    main()