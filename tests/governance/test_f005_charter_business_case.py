"""F-005: PROJECT_CHARTER §3 must not contain unfilled template placeholders."""

from __future__ import annotations

import re

from _ratchet import REPO_ROOT, ratchet

FINDING = "F-005"

PLACEHOLDER_PATTERNS = (
    r"<!--\s*2-4 sentences",
    r"<!--\s*1 sentence",
    r"<!--\s*Hard scope locks",
    r"<!--\s*Constraints accepted",
    r"<criterion \d+>",
)


def test_charter_business_case_filled() -> None:
    charter = (REPO_ROOT / "PROJECT_CHARTER.md").read_text()
    section = charter.split("## 3. Business Case", 1)[-1].split("## 4.", 1)[0]
    hits = [p for p in PLACEHOLDER_PATTERNS if re.search(p, section)]
    fixed = len(hits) == 0
    ratchet(FINDING, fixed, f"template placeholders remain: {hits}")
