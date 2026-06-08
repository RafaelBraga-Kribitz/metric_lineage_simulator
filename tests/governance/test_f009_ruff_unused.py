"""F-009: Zero ruff unused imports/vars in Python governance scan paths."""

from __future__ import annotations

import sys

from _ratchet import REPO_ROOT, ratchet

FINDING = "F-009"


def _ruff_unused_count() -> tuple[int, bool]:
    sys.path.insert(0, str(REPO_ROOT / "scripts"))
    try:
        import debt_scan  # noqa: PLC0415

        cfg = debt_scan._load_config()
        py_paths = debt_scan._resolve_paths(cfg["scan_paths"].get("python", []))
        metrics = debt_scan.scan_python(cfg["thresholds"], py_paths)
        metric = metrics.get("ruff_unused", {})
        if not metric.get("available"):
            return -1, False
        return int(metric["value"]), True
    finally:
        if str(REPO_ROOT / "scripts") in sys.path:
            sys.path.remove(str(REPO_ROOT / "scripts"))


def test_f009_no_ruff_unused() -> None:
    n, available = _ruff_unused_count()
    if not available:
        ratchet(FINDING, False, "ruff not installed — see governance/DEBT_TOOLS.md")
        return
    ratchet(FINDING, n == 0, f"ruff_unused count is {n}, expected 0")
