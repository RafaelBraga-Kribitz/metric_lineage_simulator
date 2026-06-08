"""F-010: Zero knip unused exports in driver_tree_studio."""

from __future__ import annotations

import sys

from _ratchet import REPO_ROOT, ratchet

FINDING = "F-010"


def _knip_unused_exports() -> tuple[int, bool]:
    sys.path.insert(0, str(REPO_ROOT / "scripts"))
    try:
        import debt_scan  # noqa: PLC0415

        cfg = debt_scan._load_config()
        ts_paths = debt_scan._resolve_paths(cfg["scan_paths"].get("typescript", []))
        metrics = debt_scan.scan_ts_js(cfg["thresholds"], ts_paths)
        metric = metrics.get("knip_unused_exports", {})
        if not metric.get("available"):
            return -1, False
        return int(metric["value"]), True
    finally:
        if str(REPO_ROOT / "scripts") in sys.path:
            sys.path.remove(str(REPO_ROOT / "scripts"))


def test_f010_no_knip_unused_exports() -> None:
    n, available = _knip_unused_exports()
    if not available:
        ratchet(FINDING, False, "knip not installed — see governance/DEBT_TOOLS.md")
        return
    ratchet(FINDING, n == 0, f"knip_unused_exports count is {n}, expected 0")
