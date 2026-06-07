"""F-001: Root build specs must be indexed in PROJECT_CHARTER §4."""

from __future__ import annotations

import re
from pathlib import Path

from _ratchet import REPO_ROOT, ratchet

FINDING = "F-001"

SPEC_GLOBS = (
    "metric_*_build_spec*.md",
    "phase-*.md",
    "tool_workflow*.md",
    "prompts_addendum*.md",
)


def _root_spec_files() -> list[Path]:
    files: list[Path] = []
    for pattern in SPEC_GLOBS:
        files.extend(REPO_ROOT.glob(pattern))
    return sorted({p.name for p in files})


def test_charter_indexes_root_specs() -> None:
    charter = (REPO_ROOT / "PROJECT_CHARTER.md").read_text()
    specs = _root_spec_files()
    missing = [name for name in specs if name not in charter]
    fixed = len(missing) == 0
    ratchet(
        FINDING,
        fixed,
        f"unindexed root specs: {', '.join(missing) or '(none listed)'}",
    )
