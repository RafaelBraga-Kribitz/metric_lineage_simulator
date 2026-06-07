---
id: 0001
title: "Adopt charter business case from Phase 1 and build spec v4"
status: accepted
date: 2026-06-07
deciders: [Rafael Braga]
supersedes: null
superseded_by: 0003
---

# ADR-0001: Adopt charter business case from Phase 1 and build spec v4

## Context

`PROJECT_CHARTER.md` §3 shipped as template placeholders during governance bootstrap (finding F-005). Phase 1 implementation and `metric_driver_tree_studio_build_spec_v4.md` already define problem, goal, scope locks, and success gates. The charter must state them once as SSOT without duplicating full specs.

## Decision

Fill §3 Business Case from Phase 1 handoff and build spec v4 positioning (three edge kinds, experimentation flywheel, no false causal claims). Keep detail in indexed specs; charter holds scannable summary only.

## Consequences

### Positive

- SSOT answers "what is this project" without reading seven root markdown files.
- F-005 verification script passes; charter remains under 200 lines.

### Negative

- Spec index rows (F-001) still pending; charter links authoritative spec path only inline in §3.

### Neutral

- `last_updated` metadata bumped to 2026-06-07.

## Alternatives considered

- **Duplicate full build spec in charter** — rejected; violates ≤200-line scannable budget.
- **Defer charter fill until UI phase** — rejected; governance queue blocks doc indexing work.

## References

- `phase-1_Metric_Driver-Tree_Studio.md`
- `metric_driver_tree_studio_build_spec_v4.md`
- Finding F-005
