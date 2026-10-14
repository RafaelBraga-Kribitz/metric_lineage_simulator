"""F-022: the README states the decision, shows the product, and never drifts from the result file."""

from __future__ import annotations

import json
import re

from _ratchet import REPO_ROOT, ratchet

FINDING = "F-022"
README = REPO_ROOT / "README.md"
RESULT = REPO_ROOT / "docs" / "results" / "worked_example.json"
ASSETS = ("docs/assets/hero.png", "docs/assets/what-to-test-first.png", "docs/assets/demo.gif")
BANNED = (r"\bcausal\b", r"no results yet", r"UI pending", r"pending a Figma")


def _first_screen_gaps(text: str) -> list[str]:
    h2 = re.findall(r"^## (.+)$", text, re.M)
    gaps = [] if h2 and h2[0] == "Decision summary" else ["first H2 must be 'Decision summary'"]
    first = text.split("\n## ", 2)[1] if text.count("\n## ") >= 2 else ""
    for needle, why in (("what-to-test-first.png", "chart"), ("npm ci", "run instructions"), ("estimated", "evidence grade"), ("https://web.dev/", "source")):
        if needle not in first:
            gaps.append(f"first screen lacks {why}")
    return gaps


def _result_gaps(text: str) -> list[str]:
    top = json.loads(RESULT.read_text())["rows"][0]
    voi = f"€{round(top['voiScore']):,}"
    return [] if voi in text else [f"README does not quote the committed headline VoI {voi}"]


def _gaps() -> list[str]:
    text = README.read_text()
    gaps = [f"missing {a}" for a in ASSETS if not (REPO_ROOT / a).is_file()]
    gaps += [f"README contains banned phrase /{p}/" for p in BANNED if re.search(p, text, re.I)]
    return gaps + _first_screen_gaps(text) + _result_gaps(text)


def test_readme_portfolio_grade() -> None:
    gaps = _gaps()
    ratchet(FINDING, not gaps, "; ".join(gaps))
