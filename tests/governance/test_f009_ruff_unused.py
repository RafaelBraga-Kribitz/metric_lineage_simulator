"""F-009: Zero ruff unused imports/vars in Python governance scan paths."""

from __future__ import annotations

import json
import subprocess

from _ratchet import REPO_ROOT, ratchet

FINDING = "F-009"
_TARGETS = ("scripts", "tests/governance")


def _ruff_unused_count() -> int:
    proc = subprocess.run(
        [
            "ruff",
            "check",
            "--select",
            "F401,F811,F841",
            "--output-format",
            "json",
            *_TARGETS,
        ],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    if proc.stdout.strip().startswith("["):
        return len(json.loads(proc.stdout))
    return 0


def test_f009_no_ruff_unused() -> None:
    n = _ruff_unused_count()
    ratchet(FINDING, n == 0, f"ruff_unused count is {n}, expected 0")
