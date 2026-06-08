"""F-011: Python governance paths within radon complexity cap."""

from __future__ import annotations

import sys

from _ratchet import REPO_ROOT, ratchet

FINDING = "F-011"
_CAP = 10


def _radon_complex_blocks() -> int:
    sys.path.insert(0, str(REPO_ROOT / "scripts"))
    try:
        import debt_scan  # noqa: PLC0415

        cfg = debt_scan._load_config()
        py_paths = debt_scan._resolve_paths(cfg["scan_paths"].get("python", []))
        metrics = debt_scan.scan_python(cfg["thresholds"], py_paths)
        value = metrics.get("radon_complex_blocks", {}).get("value")
        return int(value) if value is not None else -1
    finally:
        if str(REPO_ROOT / "scripts") in sys.path:
            sys.path.remove(str(REPO_ROOT / "scripts"))


def test_f011_radon_within_cap() -> None:
    n = _radon_complex_blocks()
    if n < 0:
        ratchet(FINDING, False, "radon metric unavailable")
        return
    ratchet(FINDING, n == 0, f"radon_complex_blocks is {n}, expected 0 (cap CC>{_CAP})")
