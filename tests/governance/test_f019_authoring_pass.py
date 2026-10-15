"""F-019: every modeled seed edge is sourced or visibly illustrative; the headline result is committed."""

from __future__ import annotations

import json

from _ratchet import REPO_ROOT, ratchet

FINDING = "F-019"
SEED = REPO_ROOT / "driver_tree_studio" / "src" / "content" / "dtc_ecommerce.json"
RESULTS = REPO_ROOT / "docs" / "results"


def _edge_gaps(edge: dict) -> list[str]:
    tag = f"{edge['child']}->{edge['parent']}"
    grade = edge.get("evidence_grade")
    if grade == "illustrative":
        return [] if "illustrative" in (edge.get("evidence_note", "") + edge.get("mechanism", "")).lower() else [f"{tag}: illustrative but not flagged in text"]
    sources = edge.get("evidence_source") or []
    if not sources:
        return [f"{tag}: grade {grade} without evidence_source"]
    return [f"{tag}: source lacks url/year/measures" for s in sources if not (s.get("url", "").startswith("https://") and s.get("year") and s.get("measures"))]


def _gaps() -> list[str]:
    model = json.loads(SEED.read_text())
    gaps: list[str] = []
    for edge in model["edges"]:
        if edge["kind"] == "modeled":
            gaps += _edge_gaps(edge)
    for name in ("worked_example.md", "worked_example.json"):
        if not (RESULTS / name).is_file():
            gaps.append(f"docs/results/{name} missing")
    return gaps


def test_authoring_pass() -> None:
    gaps = _gaps()
    ratchet(FINDING, not gaps, "; ".join(gaps))
