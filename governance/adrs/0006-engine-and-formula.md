---
id: 0006
title: "Engine layer and formula parser contract"
status: accepted
date: 2026-06-07
deciders: [Rafael Braga]
supersedes: null
superseded_by: null
---

# ADR-0006: Engine layer and formula parser contract

## Context

Pure TypeScript engine in `driver_tree_studio/src/engine/` and `src/lib/`. No React.
Deterministic except seeded Monte Carlo. Absorbs build spec v4 §5–6 and Phase 1 steps 3–9.

## Decision

### Structural computation rules

- Each node's value has one structural source: **leaf** (baseline/lever, then modeled
  multipliers) OR **identity parent** (formula over identity children).
- No node is both identity-parent and modeled-parent (validation enforces).
- **identity:** recompute in topological order via formula_role.
- **modeled:** `effective = base × Π applyForm(form, childDeltaPct, edge)` where
  `childDeltaPct = (childEffective - childBaseline) / childBaseline`.
- **hypothesized:** contributes nothing.

**Declared assumption:** modeled effects are multiplicative and independent. Surface in
methodology panel.

### applyForm multipliers (childDeltaPct = d, elasticity = e)

| Form | Multiplier |
|---|---|
| linear | `1 + e × d` |
| logarithmic | `1 + e × ln(1 + d)` (guard `1 + d > 0`) |
| power | `(1 + d) ** e` (guard `1 + d ≥ 0`) |
| s_curve | `1 + e × (2 × logistic(k × d) - 1)` where `k = form_params.k ?? 1` |

Each form returns 1.0 at `d = 0`.

### Module API (Phase 1 implemented)

| Module | Exports |
|---|---|
| `graph.ts` | `buildGraph`, `topoOrder` — child before parent |
| `compute.ts` | `computeBaseline`, `applyLevers`, `applyForm`, `computeForMonteCarlo` |
| `whatif.ts` | `whatIf(model, leafId, deltaPct)` → values, northStarDelta, touchedModeledEdges |
| `sensitivity.ts` | `tornado(model, deltaPct=0.1)` — symmetric ± per leaf; report larger \|Δ\| |
| `montecarlo.ts` | `monteCarlo(model, runs, seed)` → samples, p10, p50, p90, varianceContribution |
| `recommend.ts` | `recommend(model, levers)` → topLevers, brokenGuardrails, untestedBeliefs |
| `lib/formula.ts` | `parseFormula(formula, existingNodes)` → newEdges, newNodes |
| `lib/rng.ts` | `mulberry32`, `sampleDistribution`, `percentile` |

### whatIf / tornado

- `whatIf`: lever `{ mode: "multiplier", value: 1 + deltaPct }` on changed leaf.
- `touchedModeledEdges`: modeled edges on path from leaf to north_star (BFS child→parent).
- `tornado`: for each controllable leaf, run +δ and −δ; take max absolute northStarDelta.

### Monte Carlo (Phase 1)

- Sample controllable leaf `distribution` each run.
- Sample `elasticity_distribution` on modeled edges when present.
- Use **independent RNG streams** for leaf vs edge sampling (same seed → same leaf draws
  when comparing point vs distribution elasticity in tests).
- `varianceContribution[leafId] = pearson(leafSamples, nsSamples)²`, normalized to sum 1.

### recommend (Phase 1 simplification)

- `topLevers`: tornado top 5.
- `brokenGuardrails`: guardrail/counter nodes where value `< baseline - 1e-9`.
- `untestedBeliefs`: all `kind === "hypothesized"` edges.

### Formula parser

Input: `"net_revenue = orders * average_order_value"`. Operators: `+ - * /` and parens.

| Operator | formula_role |
|---|---|
| `*` | factor |
| `+` | addend |
| `-` | subtrahend (right operand of binary minus) |
| `/` | divisor |

First term in `+`/`-` chain gets addend role. Produces **identity edges only**. Stub nodes
for unknown ids with placeholder governance.

### Phase 5+ modules (not Phase 1)

`valueOfInformation.ts`, `prioritize.ts`, `estimate.ts` — specified in ADR-0008.

### Minimum invariant tests

- Empty levers → baseline unchanged.
- Identity-only models reconcile exactly.
- Hypothesized edges never change computed values.
- MC with point distributions ≈ deterministic baseline.
- Seeded MC reproducible.
- Each functional form = 1.0 at d=0.
- Elasticity-distribution MC strictly wider spread than point elasticity (synthetic 2-node test).

## References

- build spec v4 §5–6; Phase 1 engine steps
