---
id: 0003
title: "Consolidate product SSOT into charter and normative ADRs"
status: accepted
date: 2026-06-07
deciders: [Rafael Braga]
supersedes: null
superseded_by: null
---

# ADR-0003: Consolidate product SSOT into charter and normative ADRs

## Context

Product authority lived in ~2,500 lines of root markdown (build specs v2–v4, phase handoff,
superseded workflow files). That caused sprawl, duplicate SSOT claims, and agents re-reading
stale files. Governance allows decisions in `PROJECT_CHARTER.md` or `governance/adrs/` only.

## Decision

1. **Executive SSOT:** [`PROJECT_CHARTER.md`](../../PROJECT_CHARTER.md) (≤200 lines) — entry point, phase status, ADR index.
2. **Normative detail:** ADRs 0004–0008 (this series) — replace all build specs and phase handoff.
3. **Transient prompts only:** [`tool_workflow_and_prompts_v4.md`](../../tool_workflow_and_prompts_v4.md) at repo root until prompts migrate; not product SSOT.
4. **Implementation SSOT for types:** [`driver_tree_studio/src/schema/types.ts`](../../driver_tree_studio/src/schema/types.ts) — code matches ADR-0005; charter does not duplicate TypeScript blocks.
5. **Delete after consolidation** (enforced by F-006): root files listed below.

## Spec supersession table

| Era | File (removed) | What it was | Absorbed into |
|---|---|---|---|
| v2 | `metric_lineage_simulator_build_spec_v2.md` | Two-edge lineage sim; 3–5 model library | ADR-0004 (lineage), ADR-0008 (deferred models) |
| v3 | `metric_driver_tree_studio_build_spec_v3.md` | Three edges; Path A; single DTC seed | ADR-0004, ADR-0007 |
| v4 | `metric_driver_tree_studio_build_spec_v4.md` | Flywheel; functional forms; full engine | ADR-0004–0008 |
| Phase 1 | `phase-1_Metric_Driver-Tree_Studio.md` | TS core checklist | ADR-0007 |
| v3 workflow | `tool_workflow_and_prompts_v3.md` | Superseded prompts | Deleted (merged into v4) |
| addendum | `prompts_addendum_v4.md` | VoI addendum | Deleted (merged into workflow v4) |

## Files deleted at repo root (post-consolidation)

- `metric_lineage_simulator_build_spec_v2.md`
- `metric_driver_tree_studio_build_spec_v3.md`
- `metric_driver_tree_studio_build_spec_v4.md`
- `phase-1_Metric_Driver-Tree_Studio.md`
- `prompts_addendum_v4.md`
- `tool_workflow_and_prompts_v3.md`

## Section mapping (loss-prevention)

| Source | Destination |
|---|---|
| v2 §0–2 positioning, two edges | ADR-0004 § lineage + supersession |
| v2 §1 multi-model scope | ADR-0008 § deferred models |
| v3 §1–3 Path A, three edges, modes | ADR-0004 |
| v4 §0–3 positioning, flywheel, edges, modes | ADR-0004 |
| v4 §4, §16 schema + validation | ADR-0005 |
| v4 §5–6 engine + formula | ADR-0006 |
| v4 §7–14 phases 2–5, UI, BYOD, honesty | ADR-0008 |
| v4 §9 marketing-science | ADR-0004 § marketing |
| v4 §17–18 changelog, open decisions | ADR-0008 § open decisions |
| phase-1 full checklist | ADR-0007 |
| workflow v4 §0 tool roles, §4 phase table | PROJECT_CHARTER §4 |

## Consequences

### Positive

- Single entry point; no competing “authoritative build spec” paths.
- F-006 ratchet forbids root spec sprawl from returning.

### Negative

- ADR edits required for normative changes (correct governance trade-off).

## References

- Supersedes indexing approach in ADR-0001, ADR-0002 (mark those `superseded_by: 0003`).
- Finding F-006
