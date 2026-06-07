---
id: 0002
title: "Expand charter with spec lineage, phase roadmap, and doc index"
status: accepted
date: 2026-06-07
deciders: [Rafael Braga]
supersedes: null
superseded_by: 0003
---

# ADR-0002: Expand charter with spec lineage, phase roadmap, and doc index

## Context

ADR-0001 filled §3 from Phase 1 only. The project's former SSOT was `metric_driver_tree_studio_build_spec_v4.md`, but the full arc spans v2 lineage simulator → v3 three-edge studio → v4 experimentation flywheel, orchestrated by `tool_workflow_and_prompts_v4.md`. F-001 required indexing root specs; agents were re-deriving history from chat instead of disk.

## Decision

Restructure `PROJECT_CHARTER.md` to hold: spec lineage table (§3.3), delivery phases from tool workflow (§3.4), and a complete §4 index of all root markdown specs and workflow files. Keep implementation detail in linked specs; charter stays scannable (≤200 lines).

Mirror the same structure in `governance-bootstrap/templates/PROJECT_CHARTER.md` for future bootstraps.

## Consequences

### Positive

- One read gives big picture: where the product came from, current phase, what is authoritative.
- F-001 closes via indexed filenames in charter body.

### Negative

- Charter must be updated when phases advance or new root docs appear.

### Neutral

- Historical v2/v3 specs remain in repo as lineage, not deleted.

## Alternatives considered

- **Keep charter Phase-1-only** — rejected; loses supersession and workflow context.
- **Duplicate build spec v4 into charter** — rejected; violates 200-line budget.

## References

- `metric_lineage_simulator_build_spec_v2.md`
- `metric_driver_tree_studio_build_spec_v3.md`
- `metric_driver_tree_studio_build_spec_v4.md`
- `tool_workflow_and_prompts_v4.md`
- Findings F-001, F-005
