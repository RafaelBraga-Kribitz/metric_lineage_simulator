"""F-001 superseded by F-006 — retained so closed_historical ratchet does not regress."""

from __future__ import annotations

from _ratchet import ratchet

FINDING = "F-001"


def test_f001_superseded_by_f006() -> None:
    ratchet(FINDING, True, "indexing requirement replaced by F-006 anti-sprawl")
