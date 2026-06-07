# Metric Driver-Tree and What-If Simulator: Build Spec v2

Rebuilt from the original "Hyper-Detailed Metric Family Lineage Simulator" master prompt.
Author context: BRAGA portfolio, marketing data scientist transitioning into DA/BI/DS.
Goal: a real, executable, long-term career asset that is (a) a personal reference, (b) a
template for building better projects, (c) a free interactive tool on the BRAGA website to
drive traffic and demonstrate rigor.

This spec is the contract. Hand whole phases to Claude Code, Cursor, or Claude Artifacts.

---

## 0. Naming and positioning

Do not use the word "causal" anywhere in the product unless you implement actual causal
methods. You do not, so you will not.

Product name candidates (pick one, keep it honest):
- "Driver Tree Studio"
- "Metric Decomposition Lab"
- "The Honest North-Star Simulator"

Positioning line for the website and LinkedIn:
> An interactive driver-tree and what-if simulator that propagates definitional
> relationships exactly and behavioral assumptions transparently. A thinking aid for
> metric design, not an econometric model.

The honesty is the marketing hook. "The metric tool that will not lie to you about
causation" is the differentiator for a marketing data scientist.

---

## 1. Scope decision (replaces the 150-model library)

Ship 3 to 5 models, each authored to an exemplary, internally consistent standard. Order
by relevance to your background and Austrian targets:

1. DTC e-commerce (flagship; closest to your 20 years in marketing).
2. Subscription / PLG SaaS (recurring revenue, churn, expansion; high recruiter demand).
3. Two-sided marketplace (liquidity, take rate; maps to Willhaben-style businesses).
4. Crypto exchange (optional; maps to Bitpanda, the original default model).
5. Online casino / sportsbook (optional; the GGR identity is clean and pedagogically nice).

Rule: every model must reconcile. If you cannot defend a number, do not include it. One
correct model beats fifty hallucinated ones for both hiring and credibility.

Austrian regional presets (AVL, Magna, Knapp, Bitpanda, Willhaben, Voestalpine, Red Bull,
etc.) stay as illustrative labels on the relevant models only, never as separate models and
never as copies of real internal metrics.

---

## 2. Core principle: two edge kinds

Every relationship between metrics is one of exactly two kinds. This is the spine of the
whole system.

| Edge kind  | Meaning                                  | Propagation        | UI         | Trust |
|------------|------------------------------------------|--------------------|------------|-------|
| `identity` | True by definition (Revenue = P x Q)     | Exact arithmetic   | Solid line | Total |
| `assumed`  | Behavioral elasticity (illustrative)     | Flagged, editable  | Dashed line| None  |

Every `assumed` edge appears in an Assumptions Ledger with its value, a one-line rationale,
and the disclaimer: "Illustrative assumption, not estimated from data." Users can edit
assumed edges. Identity edges are locked.

Drop the standalone "Confidence Score" decoration. If you want a confidence signal, derive
it: `identity` edges are high; `assumed` edges inherit a low/medium flag from the
`confidenceNote`. Never display a number you cannot explain.

---

## 3. Data schema (the architecture)

TypeScript, in `src/schema/types.ts`. A matching JSON Schema lives in `schema/model.schema.json`
for validation. Content models are JSON files, never hardcoded in components.

```typescript
// ---- Units and enums -------------------------------------------------------
export type Unit = "currency" | "count" | "ratio" | "percent" | "duration_s";

export type MetricLayer =
  | "north_star"
  | "strategic_objective"
  | "outcome"
  | "driver"
  | "operational"
  | "input"        // leaf, user-controllable
  | "guardrail"
  | "counter";

export type EdgeKind = "identity" | "assumed";

export type FormulaRole = "factor" | "addend" | "subtrahend" | "divisor";

export type DistributionKind = "point" | "triangular" | "normal" | "lognormal";

// ---- Monte Carlo input distributions --------------------------------------
export interface Distribution {
  kind: DistributionKind;
  // point: { value }
  // triangular: { min, mode, max }
  // normal: { mean, sd }
  // lognormal: { mu, sigma }
  params: Record<string, number>;
}

// ---- Governance metadata (separate ontology from the math graph) ----------
export interface GovernanceMeta {
  owner: string;                 // role, e.g. "Head of Growth"
  business_function: string;     // e.g. "Marketing"
  data_source: string;           // e.g. "events.checkout"
  warehouse_table: string;       // e.g. "marts.fct_orders"
  calculation_grain: string;     // e.g. "per order"
  update_frequency: string;      // e.g. "daily"
  dimensions: string[];          // e.g. ["country", "channel", "device"]
}

// ---- Nodes -----------------------------------------------------------------
export interface MetricNode {
  id: string;                    // snake_case, unique within model
  name: string;
  definition: string;            // plain-English, powers the teaching layer
  unit: Unit;
  layer: MetricLayer;
  baseline: number;              // baseline value for the "as-is" state
  is_controllable: boolean;      // true only for input leaves
  distribution?: Distribution;   // required iff is_controllable for Monte Carlo
  governance: GovernanceMeta;
  explainer?: string;            // optional longer teaching note, markdown
}

// ---- Edges -----------------------------------------------------------------
export interface MetricEdge {
  parent: string;                // metric id
  child: string;                 // metric id
  kind: EdgeKind;
  // identity edges: how the child combines into the parent formula
  formula_role?: FormulaRole;
  // assumed edges: elasticity = % change in parent per 1% change in child
  elasticity?: number;
  confidence_note?: string;      // required on assumed edges
}

// ---- Scenarios -------------------------------------------------------------
export interface Scenario {
  id: string;
  name: string;                  // "Aggressive Growth", "Profit Optimization"...
  description: string;
  // map of input metric id -> multiplier or absolute override
  levers: Record<string, { mode: "multiplier" | "absolute"; value: number }>;
}

// ---- Model -----------------------------------------------------------------
export interface BusinessModel {
  id: string;
  name: string;
  industry: string;
  preset_labels?: string[];      // illustrative only, e.g. ["Bitpanda-style"]
  north_star_id: string;
  nodes: MetricNode[];
  edges: MetricEdge[];
  scenarios: Scenario[];
  narrative: string;             // markdown intro shown above the tree
}
```

Validation rules enforced by `schema/validate.ts` (run in CI and before any commit):
- Every edge references existing node ids.
- The graph is a DAG (no cycles).
- Exactly one `north_star` node, and it has no parents.
- Every `is_controllable` node is a leaf and has a `distribution`.
- Every `assumed` edge has `elasticity` and `confidence_note`.
- Every `identity` edge has `formula_role`.
- Identity reconciliation: recomputing each parent from its identity children equals its
  stored `baseline` within tolerance (1e-6 relative). This test is what proves the model is
  not hallucinated.

---

## 4. Engine layer (pure, framework-free, tested)

All in `src/engine/`, no React imports, fully unit-tested with Vitest. Pure functions only,
deterministic, seeded randomness for Monte Carlo.

```typescript
// graph.ts
buildGraph(model: BusinessModel): Graph        // adjacency + topo order
topoOrder(graph: Graph): string[]              // parents after children

// compute.ts
computeBaseline(model): Record<string, number> // exact rollup of identities
applyLevers(model, levers): Record<string, number>
//   identity edges: exact recompute in topo order
//   assumed edges: parent_delta_pct = elasticity * child_delta_pct, flagged

// whatif.ts
whatIf(model, changedLeaf, deltaPct): {
  values: Record<string, number>;
  northStarDelta: number;
  touchedAssumedEdges: MetricEdge[];   // surfaced for the honesty panel
}

// sensitivity.ts
tornado(model, deltaPct = 0.1): Array<{ leaf: string; northStarDelta: number }>
//   one-at-a-time +/- delta on each leaf, ranked by absolute NSM impact
//   replaces the vague "sensitivity score"

// montecarlo.ts
monteCarlo(model, runs, seed): {
  northStar: number[];                  // sampled outcomes
  p10: number; p50: number; p90: number;
  varianceContribution: Array<{ leaf: string; share: number }>;
}
//   sample each input leaf from its distribution, propagate, collect.
//   MUST run in a Web Worker. Default runs = 1000, cap browser at 10000,
//   warn that 100000 requires batching. Seeded RNG (e.g. mulberry32) for
//   reproducibility.

// recommend.ts  (honest, not "AI advice")
recommend(model, levers): {
  topLevers: Array<{ leaf: string; northStarDelta: number }>;  // from tornado
  brokenGuardrails: string[];   // guardrail/counter metrics that degraded
  // no free-text confident prose; report rankings and threshold breaches only
}
```

Invariant tests (Vitest), at minimum:
- Zero lever change produces zero NSM change.
- Identity-only models reconcile exactly (no drift after propagation).
- Monte Carlo with point distributions equals the deterministic baseline.
- Tornado is symmetric for linear identities.
- Seeded Monte Carlo is reproducible across runs.

---

## 5. UI layer (channel-aware)

Components in `src/components/`. Same components consume the same JSON in both the artifact
demo and the Next.js site.

Core components:
- `ModelSelector` — switch between the 3 to 5 models.
- `DriverTree` — collapsible nodes, color-coded by layer, solid vs dashed edges by
  `EdgeKind`, animated value updates (CSS transitions in artifact, Framer Motion on site).
- `LeverPanel` — slider + numeric input + percent/absolute toggle, bound to input leaves.
- `ResultsPanel` — north star plus key outcomes, with baseline vs current delta.
- `MetricInspector` — on node click: definition, governance metadata, explainer, and which
  edges feed it.
- `AssumptionsLedger` — every `assumed` edge, editable, with disclaimer. This is the trust
  centerpiece.
- `ScenarioSelector` — load predefined scenarios; encode current state into the URL.
- `SensitivityTornado` — Recharts horizontal bar, ranked levers.
- `MonteCarloPanel` — histogram + P10/P50/P90 + variance-contribution bars; run button
  dispatches to the Web Worker.
- `MethodologyNote` — always-visible link to the honesty disclaimer (Section 2).

Teaching layer: every `MetricLayer` and every panel has a `?` that explains the concept
(what a north star is, leading vs lagging, guardrail vs counter, why assumed edges are
dashed). This is what makes the tool uniquely yours and feeds SEO.

---

## 6. Channel and delivery

| Phase | Channel                 | Constraints to respect                                            |
|-------|-------------------------|-------------------------------------------------------------------|
| 0     | Claude Artifact         | Recharts + inline SVG only; CSS transitions; no localStorage; URL/React state; one model |
| 1     | Claude Code / Cursor    | Extract schema + engine + Vitest tests into a real repo           |
| 2     | Next.js on Vercel       | Data-as-JSON; full lib set (Framer Motion, shadcn); deploy        |
| 3     | Next.js                 | Models 2 to 5; Monte Carlo Web Worker; scenarios                  |
| 4     | Next.js                 | SEO page per model; shareable URL state; iframe embed; BRAGA brand|

Shareability: encode lever state in the URL query string. Better than localStorage for a
traffic tool (links are shareable), and it sidesteps the artifact localStorage ban.

Repo structure (your standard, adapted to a TypeScript web project):

```text
driver_tree_studio/
  README.md
  package.json
  tsconfig.json
  schema/
    model.schema.json
    validate.ts
  src/
    schema/types.ts
    engine/            # graph, compute, whatif, sensitivity, montecarlo, recommend
    workers/           # montecarlo.worker.ts
    components/
    content/           # one JSON file per business model
    lib/               # rng, url-state, formatting
  tests/               # vitest, mirrors engine/
  app/ or pages/       # Next.js routes (Phase 2+)
  public/
```

---

## 7. Monte Carlo specification (was missing entirely)

- Each input leaf carries a `Distribution`. No distribution, no Monte Carlo for that leaf
  (it is held at baseline).
- Default triangular distribution maps cleanly to the "best / expected / worst" the original
  prompt wanted: `min` = worst, `mode` = expected, `max` = best.
- Runs: 1000 default, 10000 cap in browser, 100000 only with batched worker messages and a
  progress bar.
- Output: histogram, P10/P50/P90, and variance contribution per leaf (first-order Sobol-style
  or simple correlation-of-inputs-to-output as a starting approximation; document which).
- Honesty caveat shown on the panel: "Monte Carlo propagates input uncertainty under the
  model's assumed relationships. It does not validate those relationships."

---

## 8. What was cut and why

- 150-model library: unmaintainable, hallucination risk, weak positioning. Cut to 3 to 5.
- "Causal Impact Engine" naming and concept: replaced by explicit identity vs assumed edges.
- Decorative "Confidence Score / Level": cut or derived, never faked.
- OKRs / team KPIs / ownership inside the math tree: moved to the governance metadata layer.
- "Single artifact, no placeholders, one response": replaced by phased build matching the
  smallest-correct-unit protocol.
- 100000-sim main-thread Monte Carlo: moved to a Web Worker with caps.

---

## 9. Open decisions for you (smallest set)

1. Flagship model: confirm DTC e-commerce, or swap for subscription SaaS.
2. Domain and brand name for the deployed tool.
3. Whether Phase 0 demo and Phase 2 site should share a monorepo or stay separate.

---

## 10. Ready-to-paste kickoff prompt for Claude Code (Phase 0 + 1)

> Build the first two phases of the Driver Tree Studio described in this spec. Start by
> creating `src/schema/types.ts` exactly as specified, then `schema/validate.ts` with all
> validation rules including identity reconciliation. Then implement the engine in
> `src/engine/` (graph, compute, whatif, sensitivity, montecarlo, recommend) as pure
> TypeScript with no React imports, and write Vitest tests in `tests/` covering every
> invariant in Section 4. Then author ONE complete business model JSON in
> `src/content/dtc_ecommerce.json` that passes all validation and reconciles exactly; show
> me the reconciliation test passing before building any UI. Use snake_case for data ids and
> file names, PascalCase for types, camelCase for functions and variables. Type hints and
> docstrings on all exported functions. Set seeds for all randomness. Do not invent
> elasticities silently: every assumed edge must carry a confidence_note. Stop after the
> model passes validation and ask me to review before starting the UI.
