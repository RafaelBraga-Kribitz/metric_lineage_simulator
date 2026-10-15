"""F-013: the ratchet helper must resolve slugged finding files, or closed findings never enforce."""

from __future__ import annotations

import pytest
import yaml

from _ratchet import FINDINGS, finding_status

FINDING = "F-013"


def _closed_ids() -> list[str]:
    ids = []
    for path in sorted(FINDINGS.glob("F-[0-9]*.yaml")):
        data = yaml.safe_load(path.read_text()) or {}
        if data.get("status") == "closed":
            ids.append(str(data["id"]))
    return ids


def test_every_closed_finding_resolves_to_closed() -> None:
    # Not wrapped in ratchet(): a broken lookup is exactly what would make ratchet() lie.
    unresolved = [fid for fid in _closed_ids() if finding_status(fid) != "closed"]
    if unresolved:
        pytest.fail(f"{FINDING} regression: finding_status() cannot resolve {unresolved}")
