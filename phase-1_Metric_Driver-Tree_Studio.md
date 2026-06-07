Phase 1 — Metric Driver-Tree Studio (TS core, no UI)

 Context

 Phase 0 produced driver-tree-studio.tsx, a single-file React prototype with untyped JS objects, an inline DTC seed (DTC_MODEL), and a recursive compute function. Phase 1 extracts that logic into a properly-typed, tested TypeScript package under a fresh
 driver_tree_studio/ directory, governed by metric_driver_tree_studio_build_spec_v4.md. The goal: a strict-mode TS core (schema, validation, engine, formula parser, Monte Carlo, recommender) with vitest coverage and a reconciled DTC seed JSON — no React, no Vite, no
 UI. Stop after tests pass for human review before any component work.

 Resolved ambiguities (user-confirmed):
 - Modeled edges: follow spec v4 — require functional_form, mechanism, evidence_grade, and (elasticity OR elasticity_distribution). Engine dispatches on functional_form per section 5.
 - Tornado: symmetric ±deltaPct per leaf; report larger absolute northStarDelta.

 Directory layout

 driver_tree_studio/
 ├── package.json                 (deps: typescript, ts-node, vitest, @types/node)
 ├── tsconfig.json                (strict, noUncheckedIndexedAccess, target ES2022, moduleResolution node16)
 ├── src/
 │   ├── schema/
 │   │   ├── types.ts
 │   │   └── validate.ts          (NB: spec says `schema/validate.ts`; placing under src/ for consistency)
 │   ├── engine/
 │   │   ├── graph.ts
 │   │   ├── compute.ts
 │   │   ├── whatif.ts
 │   │   ├── sensitivity.ts
 │   │   ├── montecarlo.ts
 │   │   └── recommend.ts
 │   ├── lib/
 │   │   ├── formula.ts
 │   │   └── rng.ts               (mulberry32, sampleTriangular — extracted)
 │   └── content/
 │       └── dtc_ecommerce.json
 └── tests/
     ├── schema/validate.test.ts
     ├── engine/{graph,compute,whatif,sensitivity,montecarlo,recommend}.test.ts
     ├── lib/formula.test.ts
     └── content/dtc_seed.test.ts

 Step-by-step

 1. src/schema/types.ts

 Port the exact shapes from spec §4 (lines 132–218 of metric_driver_tree_studio_build_spec_v4.md). Include FunctionalForm (spec defines it between FormulaRole and EvidenceGrade even though omitted from the prompt's header summary). All exports named; no default
 exports; no any.

 2. src/schema/validate.ts

 Export validate(model: BusinessModel): { valid: boolean; errors: string[] }. Rule checks in this order:
 1. Edge endpoints resolve to existing node ids.
 2. DAG (DFS with white/gray/black coloring on parent→child relation as oriented in MetricEdge).
 3. Exactly one north_star node; it has no incoming edges (no parent edge where it is child of an aggregation — convention: a node is "root" when no edge has it as child with kind === "identity" and it is not a child in any modeled edge either; revisit during impl,
 use existing TSX convention).
 4. Each is_controllable node: no outgoing identity edges (i.e., is not a child of any identity edge where it is the driver?) — per spec, a controllable input is a leaf in the identity tree. Implementation: for each controllable node, assert no identity edge exists
 with that node as parent (i.e., it does not decompose further). Also require distribution present.
 5. Per-edge required-field checks per kind:
   - identity: formula_role set; no modeled/hypothesized fields.
   - modeled: functional_form, mechanism, evidence_grade set; one of elasticity/elasticity_distribution set.
   - hypothesized: direction, rationale set; evidence_grade === "none"; no elasticity/elasticity_distribution.
 6. No node is both an identity-parent and modeled-parent target (would double-count).
 7. Identity reconciliation: compute each identity parent from its identity children using formula_role semantics (factor → ×, addend → +, subtrahend → −, divisor → ÷) in topological order; assert |computed - baseline| / max(|baseline|, 1) < 1e-6.

 Return clear error messages prefixed by rule label (e.g., "[reconciliation] net_revenue: expected 100000, got 99980 (rel 2e-4)").

 3. src/engine/graph.ts

 - buildGraph(model) → { parentsOf: Map<id, Edge[]>, childrenOf: Map<id, Edge[]>, nodesById }.
 - topoOrder(model) → string[] of node ids, children before parents (Kahn's algorithm on the child→parent orientation).
 - JSDoc block at top documenting direction convention verbatim from spec §5: {parent, child} means parent is explained; flow is child → parent.

 4. src/engine/compute.ts

 - computeBaseline(model) → Record<id, number>: walk topo order; for nodes whose incoming edges include identity edges, recompute via formula_role; for nodes with modeled-only inputs the baseline equals the stored baseline (modeled edges only affect deltas).
 - applyLevers(model, levers) → Record<id, number>:
   - For each leaf id in levers, compute effective leaf value: multiplier → baseline × value; absolute → value.
   - Walk topo order. For identity parents: recompute from current child values via formula_role.
   - For modeled targets: effective = base * Π applyForm(form, childDeltaPct, edge) where childDeltaPct = (childEffective - childBaseline) / childBaseline. applyForm switch:
       - linear: 1 + e * d
     - logarithmic: 1 + e * Math.log(1 + d) (guard 1 + d > 0)
     - power: Math.pow(1 + d, e) (guard 1 + d >= 0)
     - s_curve: 1 + e * (2 * logistic(k * d) - 1), k = form_params.k ?? 1
   - JSDoc note: "Modeled effects assumed multiplicative and independent."
   - Hypothesized edges contribute nothing.

 5. src/engine/whatif.ts

 whatIf(model, changedLeafId, deltaPct) → { values, northStarDelta, touchedModeledEdges }. Calls applyLevers with {[changedLeafId]: {mode:"multiplier", value: 1 + deltaPct}}. touchedModeledEdges = modeled edges on any path from the changed leaf to north_star (BFS in
 child→parent direction over both identity and modeled edges, collect modeled ones).

 6. src/engine/sensitivity.ts

 tornado(model, deltaPct = 0.1): for each is_controllable leaf, run whatIf(model, id, +deltaPct) and whatIf(model, id, -deltaPct); take max(|posDelta|, |negDelta|) as the reported northStarDelta (signed = the larger-magnitude direction). Sort desc by absolute value.

 7. src/engine/montecarlo.ts

 - src/lib/rng.ts: port mulberry32(seed) and sampleTriangular(rng, {min, mode, max}) from driver-tree-studio.tsx lines 577–592. Add percentile(sortedArr, p).
 - monteCarlo(model, runs, seed):
   - For each run: sample each controllable leaf from its Distribution; for each modeled edge with elasticity_distribution, sample elasticity per run; recompute via the same engine.
   - Collect north-star samples.
   - Return { samples, p10, p50, p90, varianceContribution }.
   - varianceContribution[leafId] = Pearson r(leafSamples, nsSamples)^2, then normalize so sum = 1.

 8. src/engine/recommend.ts

 recommend(model, levers) → { topLevers, brokenGuardrails, untestedBeliefs }.
 - topLevers: result of tornado(model) (top 5).
 - brokenGuardrails: nodes with layer === "guardrail" | "counter" where applyLevers(model, levers)[id] is worse than baseline (interpret "worse" via a small sign convention: guardrails are "lower is worse" unless definition indicates otherwise → for Phase 1, simply
 flag any deviation > 1e-9 below baseline; document the simplification in JSDoc).
 - untestedBeliefs: all edges with kind === "hypothesized".

 9. src/lib/formula.ts

 parseFormula(formula, existingNodes) → { newEdges, newNodes }.
 - Tokenizer: identifiers [a-zA-Z_][a-zA-Z0-9_]*, operators + - * /, parens.
 - Parser: recursive descent (term/factor) producing an AST.
 - Flatten AST to identity edges with formula_role mapped: * → factor, + → addend, - → subtrahend, / → divisor. (Operator precedence preserved; subtrahend only applied where the right operand of - appears.)
 - For ids not in existingNodes, emit MetricNode stubs with placeholder governance and baseline 0 (caller fills in).
 - Only identity edges produced.

 10. src/content/dtc_ecommerce.json

 Port DTC_MODEL from driver-tree-studio.tsx (lines 16–92) and augment:
 - Set north_star_id: "contribution_profit", baseline 48000.
 - Identity tree exactly per prompt Step 6.
 - Add GovernanceMeta (owner, business_function, data_source, warehouse_table, calculation_grain, update_frequency, dimensions) to every node.
 - Triangular distribution {min: 0.7*baseline, mode: baseline, max: 1.4*baseline} on every controllable leaf.
 - Modeled edge email_capture_rate → returning_sessions: functional_form: "linear", elasticity: 0.3, mechanism: "...", evidence_grade: "illustrative".
 - Hypothesized edge page_load_speed → conversion_rate: direction: "decreases", evidence_grade: "none", rationale: "...".
 - Hypothesized edge loyalty_membership → customer_ltv: direction: "increases", evidence_grade: "none", rationale = verbatim selection-trap warning from TSX line 58 / spec §9 ("Loyalty members show higher LTV in cohort data, but this is almost certainly selection:
 heavy buyers enroll, not vice versa. Do not model as causal without a randomized enrollment experiment.").
 - Include scenarios: [], narrative, industry: "dtc_ecommerce".

 11. Tests (vitest)

 - validate.test.ts: one passing case (the DTC seed) + one failing case per rule, each asserting the specific error string.
 - formula.test.ts: "net_revenue = orders * average_order_value" → 2 factor edges; "profit = revenue - cost" → addend + subtrahend; precedence test with parens; stub-node creation test.
 - graph.test.ts: topo order correctness; cycle detection.
 - compute.test.ts: identity recomputation; each of the 4 functional_form modes; baseline equals input when no levers.
 - whatif.test.ts: known-elasticity case; touchedModeledEdges includes only edges on the path.
 - sensitivity.test.ts: tornado ordering; symmetric +/- behavior.
 - montecarlo.test.ts:
   - With runs=2000, seed=42 on DTC seed, p10 < p50 < p90; Σ varianceContribution ≈ 1.
   - Elasticity-distribution path (covers the Guesstimate engine, not exercised by DTC seed): build a small synthetic 2-node model (y ← x, one modeled edge). Run MC twice with the same seed and same leaf distribution on x: once with a point elasticity: 0.5, once with
 a triangular elasticity_distribution {min: 0.2, mode: 0.5, max: 0.8}. Assert the stdev (or p90−p10 spread) of north-star samples is strictly wider in the distribution case. ~2 lines of model definition, 1 assertion. Without this the elasticity-sampling code path has
 zero coverage until Phase 5.
 - recommend.test.ts: hypothesized edges surface in untestedBeliefs.
 - dtc_seed.test.ts: validate(seed).valid === true; reconciliation passes.

 12. Run & report

 - npx vitest run → must be all green.
 - Run validate() on the seed, print result.
 - Print reconciliation deltas for each identity parent.

 Critical files to read during implementation

 - /Users/rbk/Desktop/metric_lineage_simulator/metric_driver_tree_studio_build_spec_v4.md — §4 types, §5 compute, §9 selection-trap, §15 validation.
 - /Users/rbk/Desktop/metric_lineage_simulator/driver-tree-studio.tsx — DTC seed (lines 16–92), computeValues (181–226), mulberry32/sampleTriangular/percentile (577–596), VoI loop (604–765, for later phase).

 Verification

 1. From driver_tree_studio/: npx vitest run → all tests pass.
 2. npx ts-node -e "import {validate} from './src/schema/validate'; import seed from './src/content/dtc_ecommerce.json'; console.log(JSON.stringify(validate(seed as any), null, 2))" → { valid: true, errors: [] }.
 3. Reconciliation script prints |delta| < 1e-6 for net_revenue, variable_costs, orders, sessions, contribution_profit.
 4. Stop. Do not create UI files. Do not add npm scripts beyond test (vitest) and dev (ts-node) if needed.

 Out of scope (Phase 1)

 - React components, Vite, any UI.
 - Value-of-Information panel (Phase 2+).
 - npm scripts beyond ts-node + vitest.
 - Additional business model seeds beyond DTC.