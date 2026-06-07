"""F-003: driver_tree_studio vitest suite must pass."""

from __future__ import annotations

import subprocess
from pathlib import Path

from _ratchet import REPO_ROOT, ratchet

FINDING = "F-003"

STUDIO = REPO_ROOT / "driver_tree_studio"


def test_driver_tree_studio_tests_pass() -> None:
    if not (STUDIO / "package.json").exists():
        ratchet(FINDING, False, "driver_tree_studio/package.json missing")
        return
    result = subprocess.run(
        ["npm", "test"],
        cwd=STUDIO,
        capture_output=True,
        text=True,
        timeout=120,
    )
    fixed = result.returncode == 0
    tail = (result.stdout + result.stderr).strip().splitlines()[-3:]
    gap = " | ".join(tail) if tail else f"npm test exit {result.returncode}"
    ratchet(FINDING, fixed, gap)
