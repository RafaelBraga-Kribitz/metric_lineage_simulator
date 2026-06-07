---
id: 0005
title: "Data schema conventions and validation rules"
status: accepted
date: 2026-06-07
deciders: [Rafael Braga]
supersedes: null
superseded_by: null
---

# ADR-0005: Data schema conventions and validation rules

## Context

Normative schema and validation from build spec v4 §4, §16 and Phase 1 implementation.
TypeScript shapes are implemented in [`driver_tree_studio/src/schema/types.ts`](../../driver_tree_studio/src/schema/types.ts); this ADR is the contract those types must satisfy.

## Decision

### Naming conventions

- snake_case: data ids, JSON field names, file names
- PascalCase: types, interfaces, classes
- camelCase: functions, variables

### Content models

JSON files under `driver_tree_studio/src/content/`. Never hardcode models in React components.

### Core types (summary)

| Type | Purpose |
|---|---|
| `Unit` | currency, count, ratio, percent, duration_s |
| `MetricLayer` | north_star … counter (see types.ts) |
| `EdgeKind` | identity, modeled, hypothesized |
| `FormulaRole` | factor, addend, subtrahend, divisor |
| `FunctionalForm` | linear, logarithmic, power, s_curve |
| `EvidenceGrade` | none, illustrative, estimated, anecdotal, observational, experimental |
| `Distribution` | point, triangular, normal, lognormal with params |
| `BusinessModel` | nodes, edges, north_star_id, scenarios, narrative |

Full field lists: `types.ts` is authoritative implementation.

### validate(model) — rule order

Export `validate(model): { valid: boolean; errors: string[] }` from
`driver_tree_studio/src/schema/validate.ts`. Checks **in this order**:

1. **[edge-ref]** Edge endpoints resolve to existing node ids.
2. **[dag]** DAG (no cycles on parent→child orientation).
3. **[north-star]** Exactly one `layer === "north_star"` node; it must not appear as `child`
   of any edge; must match `model.north_star_id`.
4. **[controllable-leaf]** Each `is_controllable` node: no identity edge with that node as
   `parent` (leaf in identity tree); `distribution` required.
5. **[edge-*]** Per-edge required fields:
   - **identity:** `formula_role` set; no modeled/hypothesized fields.
   - **modeled:** `functional_form`, `mechanism`, `evidence_grade`; exactly one of
     `elasticity` OR `elasticity_distribution`.
   - **hypothesized:** `direction`, `rationale`; `evidence_grade === "none"`; no elasticity
     fields.
6. **[double-count]** No node is both an identity-parent target and modeled-parent target.
7. **[reconciliation]** Identity parents recomputed from children via formula_role in topo
   order; relative error `|computed - baseline| / max(|baseline|, 1) < 1e-6`.

Error messages must be prefixed with rule label, e.g.
`[reconciliation] net_revenue: expected 100000, got 99980 (rel 2e-4)`.

### Future validation (Phase 2+)

When funnel decomposition lands: funnel stage rates must multiply to stored
`conversion_rate` baseline (ADR-0008). Not required for current DTC seed.

### Tests

`tests/schema/validate.test.ts`: DTC seed passes; **one failing case per rule** asserting
the specific error prefix.

## References

- build spec v4 §4, §16; Phase 1 validate steps
