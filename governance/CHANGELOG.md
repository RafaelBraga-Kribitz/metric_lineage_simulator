# Governance Changelog

## 2026-06-07 — F-006 draft: charter + ADR consolidation

- ADRs 0003–0008 absorb build specs v2–v4 and Phase 1 handoff.
- Executive charter v0.3 (122 lines); F-001 → closed_historical; F-006 open until deletes.

## 2026-06-07 — F-001 closed

- Expanded `PROJECT_CHARTER.md` with spec lineage (v2→v3→v4), phase roadmap, full §4 index; ADR-0002.
- Updated `governance-bootstrap/templates/PROJECT_CHARTER.md` to same structure for future bootstraps.

## 2026-06-07 — F-005 closed

- Filled `PROJECT_CHARTER.md` §3 Business Case; ADR-0001 documents the change.

## 2026-06-07 — F-004 closed

- Added `montecarlo.test.ts` and `recommend.test.ts`; split MC leaf/edge RNG streams.

## 2026-06-07 — F-003 closed

- Fixed `parseFormula` addend/subtrahend mapping for `+`/`-` expressions.

## 2026-06-07 — Governance bootstrap (midflight)

- Installed governance scaffolding from `governance-bootstrap/` kit.
- Filed findings F-001 through F-005 (no fixes in bootstrap commit).
- Mode: midflight (~2980 LOC TypeScript, partial vitest suite, no CI yet).
