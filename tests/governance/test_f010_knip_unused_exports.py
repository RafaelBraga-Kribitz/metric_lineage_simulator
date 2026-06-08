"""F-010: Zero knip unused exports in driver_tree_studio."""

from __future__ import annotations

import json
import subprocess

from _ratchet import REPO_ROOT, ratchet

FINDING = "F-010"
_STUDIO = REPO_ROOT / "driver_tree_studio"


def _knip_unused_exports() -> int:
    proc = subprocess.run(
        ["knip", "--reporter", "json"],
        cwd=_STUDIO,
        capture_output=True,
        text=True,
        check=False,
    )
    if not proc.stdout.strip().startswith("{"):
        return -1
    data = json.loads(proc.stdout)
    issues = data.get("issues", [])
    if not isinstance(issues, list):
        return -1
    return sum(len(i.get("exports", [])) for i in issues)


def test_f010_no_knip_unused_exports() -> None:
    n = _knip_unused_exports()
    if n < 0:
        ratchet(FINDING, False, "knip unavailable or JSON parse failed")
        return
    ratchet(FINDING, n == 0, f"knip_unused_exports count is {n}, expected 0")
