"""F-021: the SQL export runs in a real engine and the Power BI kit's expected values hold."""

from __future__ import annotations

import csv
import sqlite3

from _ratchet import REPO_ROOT, ratchet

FINDING = "F-021"
KIT = REPO_ROOT / "docs" / "powerbi"
REQUIRED = ("README.md", "kpi_definitions.csv", "kpi_tree.sql", "measures.dax", "kpi_inputs_SYNTHETIC.csv", "theme.json")


def _sql_totals() -> tuple[int, int, int]:
    con = sqlite3.connect(":memory:")
    con.executescript((KIT / "kpi_tree.sql").read_text())
    with (KIT / "kpi_inputs_SYNTHETIC.csv").open() as fh:
        rows = [(r["period"], r["metric_id"], float(r["value"])) for r in csv.DictReader(fh)]
    con.executemany("INSERT INTO kpi_inputs VALUES (?, ?, ?)", rows)
    cp, rev, orders = con.execute("SELECT SUM(contribution_profit), SUM(net_revenue), SUM(orders) FROM kpi_tree").fetchone()
    return round(cp), round(rev), round(orders)


def _gaps() -> list[str]:
    missing = [f"docs/powerbi/{f} missing" for f in REQUIRED if not (KIT / f).is_file()]
    if missing:
        return missing
    readme = (KIT / "README.md").read_text()
    gaps = [f"README expected value {v:,} not found" for v in _sql_totals() if f"{v:,}" not in readme]
    if "SYNTHETIC" not in readme or "ILLUSTRATIVE" not in readme:
        gaps.append("kit README must label synthetic data and illustrative German labels")
    return gaps


def test_export_bridge() -> None:
    gaps = _gaps()
    ratchet(FINDING, not gaps, "; ".join(gaps))
