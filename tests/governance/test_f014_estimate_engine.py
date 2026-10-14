"""F-014: estimate.ts implements the ADR-0008 BYOD contract and never claims causation."""

from __future__ import annotations

import re

from _ratchet import REPO_ROOT, ratchet

FINDING = "F-014"
STUDIO = REPO_ROOT / "driver_tree_studio"
REQUIRED_EXPORTS = (
    "estimateRelationship",
    "acceptEstimate",
    "CAUSAL_NOTE_OBSERVATIONAL",
    "outOfSampleR2",
    "correlationCi95",
    "olsFit",
)
REQUIRED_FIELDS = ("causalNote", "whatWouldProveThis", "leakageWarning", "outOfSampleR2")


def _code_without_comments(text: str) -> str:
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    return re.sub(r"//[^\n]*", "", text)


def _export_gaps(text: str) -> list[str]:
    declared = set(re.findall(r"export (?:const|function) (\w+)", text))
    gaps = [f"missing export {name}" for name in REQUIRED_EXPORTS if name not in declared]
    return gaps + [f"result lacks {f}" for f in REQUIRED_FIELDS if f"{f}:" not in text]


def _wording_gaps(text: str) -> list[str]:
    code = _code_without_comments(text)
    strings = re.findall(r'"[^"]*"|`[^`]*`', code)
    gaps = [f"user-facing string says 'cause': {s[:60]}" for s in strings if re.search(r"\bcauses?\b", s, re.I)]
    if "observational" not in code or "experimental" not in code:
        gaps.append("grade promotion (observational/experimental) missing")
    return gaps


def _gaps() -> list[str]:
    src = STUDIO / "src" / "engine" / "estimate.ts"
    test = STUDIO / "tests" / "engine" / "estimate.test.ts"
    if not src.is_file() or not test.is_file():
        return ["estimate.ts or its test missing"]
    text = src.read_text()
    return _export_gaps(text) + _wording_gaps(text)


def test_estimate_engine_contract() -> None:
    gaps = _gaps()
    ratchet(FINDING, not gaps, "; ".join(gaps))
