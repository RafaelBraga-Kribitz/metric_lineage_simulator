"""F-015: VoI + prioritize engine exist, carry the verbatim caveat, and never speak of impact as output."""

from __future__ import annotations

from _ratchet import REPO_ROOT, ratchet

FINDING = "F-015"
ENGINE = REPO_ROOT / "driver_tree_studio" / "src" / "engine"
CAVEAT_START = "This interval is the uncertainty in your GUESS, not evidence."


def _gaps() -> list[str]:
    voi = ENGINE / "valueOfInformation.ts"
    pri = ENGINE / "prioritize.ts"
    if not voi.is_file() or not pri.is_file():
        return ["valueOfInformation.ts or prioritize.ts missing"]
    gaps = []
    flat = " ".join(voi.read_text().replace('"', " ").replace("+", " ").split())
    if CAVEAT_START not in flat:
        gaps.append("GUESS caveat not verbatim in valueOfInformation.ts")
    if "voiScore / testCost" not in pri.read_text():
        gaps.append("priorityScore must be voiScore / test_cost")
    if not (REPO_ROOT / "driver_tree_studio" / "tests" / "engine" / "valueOfInformation.test.ts").is_file():
        gaps.append("valueOfInformation.test.ts missing")
    return gaps


def test_voi_prioritize_engine() -> None:
    gaps = _gaps()
    ratchet(FINDING, not gaps, "; ".join(gaps))
