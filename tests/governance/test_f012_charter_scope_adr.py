"""F-012: charter scope matches ADR-0010 (proposed) and the progress log exists."""

from __future__ import annotations

import re

from _ratchet import REPO_ROOT, ratchet

FINDING = "F-012"
ADR = REPO_ROOT / "governance" / "adrs" / "0010-portfolio-completion-scope.md"
CHARTER = REPO_ROOT / "PROJECT_CHARTER.md"
PROGRESS = REPO_ROOT / "docs" / "PROGRESS.md"


def _adr_gaps() -> list[str]:
    if not ADR.is_file():
        return ["ADR-0010 missing"]
    text = ADR.read_text()
    gaps = []
    if not re.search(r"^status: (proposed|accepted)$", text, re.M):
        gaps.append("ADR-0010 status must be proposed or accepted")
    for p in ("P1", "P2", "P3", "P4", "P5", "P6"):
        if f"**{p} " not in text:
            gaps.append(f"ADR-0010 missing proposal {p}")
    return gaps


def _charter_gaps() -> list[str]:
    text = CHARTER.read_text()
    gaps = []
    if "0010-portfolio-completion-scope.md" not in text:
        gaps.append("charter does not index ADR-0010")
    if "Claude Code never writes React;" in text:
        gaps.append("charter still states the superseded no-React constraint")
    if "docs/PROGRESS.md" not in text:
        gaps.append("charter does not point to docs/PROGRESS.md")
    return gaps


def test_charter_scope_matches_adr_0010() -> None:
    gaps = _adr_gaps() + _charter_gaps()
    if not PROGRESS.is_file():
        gaps.append("docs/PROGRESS.md missing")
    ratchet(FINDING, not gaps, "; ".join(gaps))
