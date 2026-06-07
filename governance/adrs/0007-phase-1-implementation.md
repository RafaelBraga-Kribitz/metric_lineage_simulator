---
id: 0007
title: "Phase 1 implementation contract (TS core, no UI)"
status: accepted
date: 2026-06-07
deciders: [Rafael Braga]
supersedes: null
superseded_by: null
---

# ADR-0007: Phase 1 implementation contract (TS core, no UI)

## Context

Phase 1 extracts Phase 0 prototype logic into typed, tested package `driver_tree_studio/`.
This ADR replaces `phase-1_Metric_Driver-Tree_Studio.md` as the implementation SSOT.

## Decision

### Goal

Strict-mode TS core: schema, validation, engine, formula parser, Monte Carlo, recommender,
vitest coverage, reconciled DTC seed JSON. **No React, Vite, or UI.** Stop after tests
pass for human review before component work.

### Resolved ambiguities

- Modeled edges require `functional_form`, `mechanism`, `evidence_grade`, and
  (`elasticity` OR `elasticity_distribution`). Engine dispatches on `functional_form`
  per ADR-0006.
- Tornado: symmetric ±`deltaPct` per leaf; report larger absolute `northStarDelta`.

### Directory layout

```text
driver_tree_studio/
  package.json          # vitest, typescript, ts-node
  tsconfig.json         # strict, noUncheckedIndexedAccess, ES2022
  src/schema/types.ts, validate.ts
  src/engine/graph.ts, compute.ts, whatif.ts, sensitivity.ts, montecarlo.ts, recommend.ts
  src/lib/formula.ts, rng.ts
  src/content/dtc_ecommerce.json
  tests/schema/, tests/engine/, tests/lib/, tests/content/
```

### DTC seed requirements (`dtc_ecommerce.json`)

- `north_star_id`: `contribution_profit`, baseline `48000`.
- Identity tree:
  - `contribution_profit = net_revenue - variable_costs`
  - `net_revenue = orders × average_order_value`
  - `variable_costs = orders × cost_per_order`
  - `orders = sessions × conversion_rate`
  - `sessions = new_sessions + returning_sessions`
- Modeled: `email_capture_rate → returning_sessions` (linear, e=0.3, illustrative).
- Hypothesized: `page_load_speed → conversion_rate` (decreases, none).
- Hypothesized: `loyalty_membership → customer_ltv` (increases, none, selection-trap rationale).
- Triangular distribution on every controllable leaf: min 0.7×, mode baseline, max 1.4× baseline.
- `GovernanceMeta` on every node.
- `scenarios: []`, `industry: "dtc_ecommerce"`, narrative set.

### Test matrix (vitest)

| File | Covers |
|---|---|
| `validate.test.ts` | DTC pass + one fail per validation rule |
| `formula.test.ts` | × factors; +/− roles; parens; stubs |
| `graph.test.ts` | topo order; cycle detection |
| `compute.test.ts` | identity recompute; 4 functional forms; empty levers |
| `whatif.test.ts` | known elasticity; touchedModeledEdges path |
| `sensitivity.test.ts` | tornado sort; symmetric ± |
| `montecarlo.test.ts` | p10<p50<p90; variance sum≈1; elasticity-distribution spread |
| `recommend.test.ts` | hypothesized in untestedBeliefs |
| `dtc_seed.test.ts` | validate valid; reconciliation |

### Verification commands (Gate 1 inputs)

```bash
cd driver_tree_studio && npx vitest run          # all green
cd driver_tree_studio && npm test                 # alias
make verify                                       # governance + adversary
```

Reconciliation: identity parents must reconcile within 1e-6 (covered by validate + dtc_seed tests).

### Phase 1 status

**Complete** as of 2026-06-07: 36 vitest passing. Review Gate 1 approved 2026-06-07
(Phase 0 artifact + full vitest output + validate output per charter §4).

### Out of scope (Phase 1)

- React, Vite, any UI.
- VoI / Guesstimate UI panels (Phase 5).
- npm scripts beyond `test` and `typecheck` unless needed for validation.
- Additional business model seeds beyond DTC.

### Phase 0 artifact

`archive/phase-0/driver-tree-studio.tsx` — throwaway Claude Artifacts demo; logic lives in
`driver_tree_studio/`. Run via `demo/` Vite shell.

## References

- ADR-0005, ADR-0006; absorbed phase-1 handoff
