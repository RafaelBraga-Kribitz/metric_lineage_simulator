"""F-008: Technical-debt ratchet installed with baseline and passing debt-check."""

from __future__ import annotations

import subprocess
from pathlib import Path

from _ratchet import REPO_ROOT, ratchet

FINDING = "F-008"


def _debt_ratchet_ready() -> tuple[bool, str]:
    gaps: list[str] = []
    for rel in ("scripts/debt_scan.py", "scripts/check_debt_ratchet.py"):
        if not (REPO_ROOT / rel).is_file():
            gaps.append(f"missing {rel}")
    baseline = REPO_ROOT / "governance" / "DEBT_BASELINE.json"
    if not baseline.is_file():
        gaps.append("missing governance/DEBT_BASELINE.json")
    else:
        proc = subprocess.run(
            ["make", "debt-check"],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        out = proc.stdout + proc.stderr
        if proc.returncode != 0 or "[PASS]" not in out:
            gaps.append(f"make debt-check failed (exit {proc.returncode})")
    if gaps:
        return False, "; ".join(gaps)
    return True, ""


def test_f008_debt_ratchet_installed() -> None:
    ok, msg = _debt_ratchet_ready()
    ratchet(FINDING, ok, msg or "debt ratchet not installed")
