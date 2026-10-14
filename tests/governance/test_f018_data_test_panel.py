"""F-018: the BYOD data-test panel is wired in and shows the fixed note on every verdict."""

from __future__ import annotations

from _ratchet import REPO_ROOT, ratchet

FINDING = "F-018"
STUDIO = REPO_ROOT / "driver_tree_studio"


def _read(rel: str) -> str:
    p = STUDIO / rel
    return p.read_text() if p.is_file() else ""


def _gaps() -> list[str]:
    panel = _read("src/components/DataTest/DataTestPanel.tsx")
    if not panel:
        return ["DataTestPanel.tsx missing"]
    gaps = []
    for needle, why in (
        ("estimateRelationship(", "panel does not call estimateRelationship"),
        ("acceptEstimate(", "panel does not offer acceptEstimate"),
        ("result.causalNote", "panel does not render the fixed causal note"),
        ("result.whatWouldProveThis", "panel does not render what_would_prove_this"),
        ("result.leakageWarning", "panel does not render the leakage warning"),
    ):
        if needle not in panel:
            gaps.append(why)
    if "<DataTestPanel" not in _read("src/components/Analysis/AnalysisPanel.tsx"):
        gaps.append("DataTestPanel not rendered in AnalysisPanel")
    if "SYNTHETIC" not in _read("src/lib/sampleData.ts"):
        gaps.append("sample data not labelled SYNTHETIC")
    if not (STUDIO / "e2e" / "datatest.spec.ts").is_file():
        gaps.append("e2e datatest spec missing")
    return gaps


def test_data_test_panel() -> None:
    gaps = _gaps()
    ratchet(FINDING, not gaps, "; ".join(gaps))
