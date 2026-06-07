# Metric Driver-Tree Studio: Build Spec v3

Supersedes v2. Path A is locked: this is a single-player, rigorous tool that demonstrates
marketing-data-science judgment. No crowdsourcing, no consensus, no backend community layer.

Author context: BRAGA portfolio, marketing data scientist transitioning into DA/BI/DS.
Goals: a personal reference, a template for building better projects, and a free interactive
tool on the BRAGA website that drives traffic and signals rigor.

This spec is the contract. Hand whole phases to Claude Code, Cursor, or Claude Artifacts.

---

## 0. Naming and positioning

Do not use the word "causal" in the product unless an actual causal method backs the claim.

Positioning line:
> An interactive driver-tree studio that separates what is true by definition, what is a
> declared assumption, and what is an untested belief, and lets you test the assumptions
> against your own data. A thinking aid for metric design, not an econometric oracle.

The honesty is the differentiator, not a disclaimer to hide.

---

## 1. Scope and the seed model

Ship one flagship model first: DTC e-commerce. Add 1 to 3 more later (subscription/PLG SaaS,
two-sided marketplace) only after the flagship is excellent.

The development seed is illustrative but structurally valid. It must:
- reconcile exactly on all identity edges,
- exercise all three edge kinds and every compute path,
- carry `evidence_grade: "illustrative"` on every `modeled` edge and `evidence_grade: "none"`
  on every `hypothesized` edge.

Hard launch gate: do not attach Rafael's name publicly or link from the portfolio until the
real one-week authoring pass replaces the illustrative numbers with defended ones. Build and
demo freely before then.

Austrian presets (Bitpanda-style, Willhaben-style, etc.) are illustrative labels on relevant
models only. Never copies of real internal metrics.

---

## 2. Core principle: three edge kinds

Every relationship between two metrics is exactly one of three kinds. This is the spine of
the system and the main rigor signal.

| Visual        | Kind           | What is known                          | Formula | Number              | In computation |
|---------------|----------------|----------------------------------------|---------|---------------------|----------------|
| Thick + blue  | `identity`     | True by definition (Revenue = P x Q)   | Yes     | Exact               | Yes, locked    |
| Solid + amber | `modeled`      | Declared behavioral effect             | No*     | Elasticity (est.)   | Yes, flagged   |
| Dashed + grey | `hypothesized` | Directional belief only, untested      | No      | None                | No, topology only |

*Modeled edges carry an elasticity and a plain-English mechanism, not a formula in the
parent's identity.

Why three and not two: "we believe A affects B but have no number yet" is a real and common
state, distinct from "we declared a number for A's effect on B." Separating them lets you map
the topology of a business before quantifying it. This mirrors Judea Pearl's causal-DAG
practice: draw the structure first, decide what to measure, then quantify. State this lineage
in a tooltip; it signals sophistication.

Edge color gives a redundant signal alongside line weight, so colorblind users still get two
cues (weight and dash pattern) without relying on color.

Progression of an edge over its life:
`hypothesized` (drawn on canvas) -> `modeled` (mechanism + elasticity declared) -> `modeled`
with rising `evidence_grade` as the user attaches evidence -> rarely, promoted to `identity`
if it turns out to be definitional.

---

## 3. Two cognitive modes, kept in sync

The tool offers two editing surfaces over one shared data model. They serve different
activities and must stay synced.

- Canvas mode (visual): topology. "What influences what?" Drag nodes, draw edges. Natural
  home for `hypothesized` edges.
- Formula/panel mode (text): quantification. "By how much, through what mechanism?" Natural
  home for `identity` (via the formula parser) and `modeled` (via the edge panel).

Single source of truth: the `BusinessModel` object. Both surfaces read from it and write to
it. Any mutation triggers recompute, and both surfaces re-render from the new state.

Edge-direction convention (get this right or nothing reconciles): a data-model edge is
`{ parent, child }` where parent is the metric being explained (the aggregate or effect) and
child is the component or driver. Computation flows from children up to parents. The canvas
renders arrows child -> parent (cause to effect, bottom-up toward the north star) for
readable diagrams, which is visually opposite to the data direction. Document this in code.

---

## 4. Data schema

TypeScript in `src/schema/types.ts`, JSON Schema in `schema/model.schema.json`. Content
models are JSON files, never hardcoded in components.

Naming conventions for this TypeScript project: snake_case for data ids, JSON field names,
and file names; PascalCase for types/interfaces/classes; camelCase for functions and
variables.

```typescript
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

export type EdgeKind = "identity" | "modeled" | "hypothesized";

export type FormulaRole = "factor" | "addend" | "subtrahend" | "divisor";

export type EvidenceGrade =
  | "none"          // hypothesized, nothing attached
  | "illustrative"  // a placeholder number, explicitly not from data
  | "anecdotal"
  | "observational"
  | "experimental";

export type Direction = "increases" | "decreases" | "unclear";

export type DistributionKind = "point" | "triangular" | "normal" | "lognormal";

export interface Distribution {
  kind: DistributionKind;
  // point: { value }; triangular: { min, mode, max };
  // normal: { mean, sd }; lognormal: { mu, sigma }
  params: Record<string, number>;
}

export interface GovernanceMeta {
  owner: string;
  business_function: string;
  data_source: string;
  warehouse_table: string;
  calculation_grain: string;
  update_frequency: string;
  dimensions: string[];
}

export interface MetricNode {
  id: string;                    // snake_case, unique within model
  name: string;
  definition: string;            // plain-English, powers the teaching layer
  unit: Unit;
  layer: MetricLayer;
  baseline: number;
  is_controllable: boolean;      // true only for input leaves
  distribution?: Distribution;   // required iff is_controllable (for Monte Carlo)
  governance: GovernanceMeta;
  explainer?: string;            // optional markdown teaching note
  // canvas layout, persisted so the visual map is stable
  position?: { x: number; y: number };
}

export interface MetricEdge {
  parent: string;                // explained metric (effect / aggregate)
  child: string;                 // component / driver

  kind: EdgeKind;

  // identity only
  formula_role?: FormulaRole;

  // modeled only
  elasticity?: number;           // percent change in parent per 1% change in child
  mechanism?: string;            // plain-English how and why

  // hypothesized only
  direction?: Direction;

  // modeled + hypothesized
  evidence_grade?: EvidenceGrade;
  evidence_note?: string;        // citation, experiment id, or test summary
  rationale?: string;            // why we believe this at all
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  levers: Record<string, { mode: "multiplier" | "absolute"; value: number }>;
}

export interface BusinessModel {
  id: string;
  name: string;
  industry: string;
  preset_labels?: string[];
  north_star_id: string;
  nodes: MetricNode[];
  edges: MetricEdge[];
  scenarios: Scenario[];
  narrative: string;             // markdown intro shown above the canvas
}
```

---

## 5. Engine layer (pure, framework-free, tested)

All in `src/engine/`, no React imports, deterministic, seeded randomness. Unit-tested with
Vitest.

Computation rules, stated precisely so the model reconciles:

- A node's value comes from exactly one structural source:
  - input leaf: its own value (lever-adjustable), then optionally adjusted by incoming
    `modeled` edges;
  - identity parent: the exact formula over its `identity` children.
- A node that is the parent of `identity` edges must not also be the parent of `modeled`
  edges. That would double-count. Enforced in validation.
- `modeled` composition rule (a declared assumption, documented as such): for a target node
  with incoming modeled edges, `effective = base * product over i of (1 + e_i *
  childDeltaPct_i)`. This assumes modeled effects are multiplicative and independent. Surface
  this assumption in the methodology panel; do not hide it.
- `hypothesized` edges contribute nothing to computation. They appear in the topology, the
  edge list, and the "untested beliefs" report only.

```typescript
// graph.ts
buildGraph(model): Graph               // adjacency + topological order
topoOrder(graph): string[]             // children before parents

// compute.ts
computeBaseline(model): Record<string, number>
applyLevers(model, levers): Record<string, number>

// whatif.ts
whatIf(model, changedLeaf, deltaPct): {
  values: Record<string, number>;
  northStarDelta: number;
  touchedModeledEdges: MetricEdge[];   // surfaced for the honesty panel
}

// sensitivity.ts
tornado(model, deltaPct = 0.1): Array<{ leaf: string; northStarDelta: number }>

// montecarlo.ts  (Web Worker; identity + modeled only)
monteCarlo(model, runs, seed): {
  northStar: number[];
  p10: number; p50: number; p90: number;
  varianceContribution: Array<{ leaf: string; share: number }>;
}

// recommend.ts  (honest: rankings and breaches, no confident prose)
recommend(model, levers): {
  topLevers: Array<{ leaf: string; northStarDelta: number }>;
  brokenGuardrails: string[];
  untestedBeliefs: MetricEdge[];       // all hypothesized edges, nudging the user to test
}
```

Invariant tests (minimum):
- zero lever change yields zero north-star change;
- identity-only models reconcile exactly after propagation;
- hypothesized edges never alter any computed value;
- Monte Carlo with point distributions equals the deterministic baseline;
- seeded Monte Carlo is reproducible;
- a node cannot be both an identity parent and a modeled parent (validation rejects it).

---

## 6. Formula parser (text drives identity topology)

`src/lib/formula.ts`. Small expression parser for identity formulas only.

- Input: `net_revenue = orders * average_order_value`
- Output: parent `net_revenue`, children `orders` and `average_order_value`, both
  `formula_role: "factor"`, `kind: "identity"`. Creates any missing nodes.
- Operators map to roles: `*` -> factor, `+` -> addend, `-` -> subtrahend, `/` -> divisor.
- Supports parentheses and operator precedence.
- Modeled and hypothesized edges are NOT authored via formulas. Modeled edges are declared in
  the edge panel (elasticity + mechanism + evidence). Hypothesized edges are drawn on the
  canvas (direction + rationale).
- Round-trip: editing the formula rewrites identity edges; deleting an identity edge on the
  canvas rewrites the formula. Keep them synced through the shared model.

---

## 7. Visual canvas (React Flow, Phase 2)

`src/components/Canvas/`. Uses React Flow.

- Custom nodes show name, current value, layer badge, and a click target for the inspector.
- Custom edges render the three kinds per Section 2 (thick/solid/dashed plus color), with a
  "?" badge on hypothesized edges and an evidence-grade chip on modeled edges.
- Drag from node to node creates an edge. A small dialog asks: identity (then opens the
  formula editor), modeled (elasticity + mechanism + evidence), or hypothesized (direction +
  rationale).
- Node positions persist to `MetricNode.position`.
- Does not run inside a Claude Artifact. Phase 0 uses a read-interactive tree instead; the
  canvas arrives with the Next.js app.

---

## 8. Bring-your-own-data testing (the hero feature)

`src/components/DataTest/` plus `src/engine/estimate.ts`. This is the feature that makes the
tool singular and is the strongest rigor signal. Single-player: the user tests against their
own uploaded data, so there is no privacy, pooling, or legal problem.

Flow:
1. User uploads a CSV. Parse with papaparse. Map columns to metric ids.
2. User selects a `modeled` or `hypothesized` edge (parent <- child) to test.
3. The engine estimates the relationship:
   - scatter plot plus correlation;
   - regression of parent on child, with the parent's other known drivers included as
     controls;
   - effect size with a confidence interval, not just a p-value;
   - an out-of-sample check (train/test split) to flag overfitting;
   - leakage guard: if child is definitionally part of parent (an identity), refuse and say
     "this is an identity, not a finding."
4. Output, in this order of prominence:
   - the verdict, which always distinguishes "these move together" (association) from
     "we have evidence of lift" (effect), and which never prints "causes" for observational
     data; use "associated with", "moves together", "consistent with";
   - a "What would prove this?" block describing the experiment (randomized holdout, geo
     test, switchback) that would raise the evidence grade to experimental.
5. On accept: update the edge's `evidence_grade` and `evidence_note`; a `hypothesized` edge
   can be promoted to `modeled` with the estimated elasticity.

Regression library: start with a small, transparent OLS (simple-statistics or a tiny custom
implementation) so the math is inspectable; document the choice.

---

## 9. Marketing-science lens (what makes it "marketing" data science)

Bake these into the DTC seed and the copy. They are the difference between generic DS and a
marketing data scientist.

- LTV is computed from a retention/survival curve with discounting, not ARPU times a guessed
  lifetime. Provide a retention-curve input and show the formula.
- CAC is fully loaded (media plus tooling plus allocated headcount), not media spend over new
  customers.
- LTV:CAC ratio and payback period are guardrails, not the north star.
- North star is contribution profit, not revenue. Resisting a vanity revenue NSM is itself a
  signal.
- Attribution is treated as a hard problem. Channel-contribution edges default to
  `hypothesized` until incrementality-tested. The tool does not assert last-click truth.
- Incrementality versus correlation is surfaced directly in the data-test verdict: "would
  they have converted anyway?"
- Built-in self-deception trap: model `loyalty_membership -> ltv` as a `hypothesized` edge.
  When data-tested, the tool finds a strong correlation and explicitly warns that it is
  likely selection (heavy buyers self-select into loyalty; the program does not manufacture
  heavy buyers), shows what a randomized-enrollment experiment would require, and refuses to
  promote it to a modeled effect without one. This single example demonstrates more rigor
  than most portfolios show in full.

---

## 10. Honesty layer

- Every `modeled` and `hypothesized` edge shows its `evidence_grade` on the edge and in an
  Assumptions Ledger panel.
- A persistent Methodology panel explains identity vs modeled vs hypothesized, the modeled
  composition assumption (Section 5), and the Pearl causal-DAG lineage.
- The tool never labels observational findings as causal.
- Every untested edge carries a "What would prove this?" prompt.
- Drop decorative confidence scores. Confidence is the `evidence_grade`, which is earned.

---

## 11. LLM integration (authoring and evidence search, never an oracle)

- Authoring assist: "describe your business" produces a draft tree. All proposed edges arrive
  as `hypothesized` with `evidence_grade: "none"`. The user edits and promotes.
- Evidence search: for a selected edge, the LLM finds existing studies or benchmarks and
  returns citations for the user to review before attaching. Never auto-attaches as fact.
- The LLM never supplies an elasticity as truth. If asked for a number, it returns a
  hypothesis flagged as needing evidence.
- Keys: in the Claude Artifact, use the provided Anthropic API (no key handling). In the
  deployed app, the user supplies their own key, kept in session/client only, never baked in.

---

## 12. Monte Carlo

- Identity and modeled edges participate; hypothesized edges do not.
- Input leaves carry distributions. Triangular maps cleanly to best/expected/worst
  (min/mode/max).
- Runs: 1000 default, 10000 browser cap, 100000 only via batched worker messages with a
  progress bar. Seeded RNG (mulberry32).
- Output: histogram, P10/P50/P90, variance contribution per leaf.
- Caveat shown on the panel: Monte Carlo propagates input uncertainty under the modeled
  assumptions; it does not validate those assumptions.

---

## 13. Channels and phasing

| Phase | Channel              | Deliverable                                                                 |
|-------|----------------------|-----------------------------------------------------------------------------|
| 0     | Claude Artifact      | One model; read-interactive tree (three edge kinds rendered); levers; results; assumptions ledger; methodology panel; LLM authoring demo via provided API; CSS transitions; URL state |
| 1     | Claude Code / Cursor | Schema (3 kinds) + engine + formula parser + Vitest; illustrative DTC seed that reconciles; prove reconciliation before any UI |
| 2     | Next.js on Vercel    | React Flow canvas with bi-directional sync; full lib set; deploy             |
| 3     | Next.js              | Bring-your-own-data testing (hero); Monte Carlo (worker); models 2 and 3; scenarios |
| 4     | Next.js              | SEO page per model; shareable URL state; iframe embed; BRAGA brand; launch (gated on real DTC authoring) |

Shareability: encode lever and scenario state in the URL query string. Links are shareable,
which suits a traffic tool, and it sidesteps the artifact localStorage ban.

---

## 14. Repository structure

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
    engine/            # graph, compute, whatif, sensitivity, montecarlo, recommend, estimate
    lib/               # formula parser, rng, url-state, formatting
    workers/           # montecarlo.worker.ts
    components/
      Canvas/          # React Flow (Phase 2)
      Tree/            # read-interactive tree (Phase 0 artifact)
      LeverPanel/
      MetricInspector/
      AssumptionsLedger/
      DataTest/        # Phase 3 hero feature
      MonteCarloPanel/
      MethodologyNote/
    content/           # one JSON file per business model
  tests/               # vitest, mirrors engine/ and lib/
  app/                 # Next.js routes (Phase 2+)
  public/
```

---

## 15. Validation rules (CI and pre-commit)

- All edges reference existing node ids; graph is a DAG.
- Exactly one `north_star` node, with no parents.
- Every `is_controllable` node is a leaf and has a `distribution`.
- `identity` edges have `formula_role` and reconcile exactly (1e-6 relative tolerance).
- `modeled` edges have `elasticity`, `mechanism`, and `evidence_grade`.
- `hypothesized` edges have `direction` and `rationale`, `evidence_grade` is `none`, and they
  carry no `elasticity`.
- No node is simultaneously an `identity` parent and a `modeled` parent.
- Hypothesized edges are excluded from reconciliation and from compute.

---

## 16. Changelog v2 to v3

- Edge kinds: two (`identity`, `assumed`) became three (`identity`, `modeled`,
  `hypothesized`).
- Visual encoding corrected: thick = identity, solid = modeled, dashed = hypothesized, plus a
  redundant color layer.
- Added the visual canvas editor (React Flow) with bi-directional sync (Phase 2).
- Added the formula parser (text drives identity topology).
- Promoted bring-your-own-data testing to the hero feature, fully specified.
- Made the marketing-science lens explicit; added the loyalty-membership selection trap to
  the seed.
- Added engine composition and edge-direction rules so the model reconciles.
- Formalized the two cognitive modes (canvas vs formula).
- Added the Pearl causal-DAG grounding.
- Clarified LLM scope and key handling.
- Removed all crowdsourcing, consensus, and platform content (Path A locked).
- Seed is illustrative but honestly labeled; public launch gated on the real authoring pass.

---

## 17. Open decisions

1. Domain and product name for the deployed tool.
2. Monorepo or separate repos for the artifact demo and the Next.js site.
3. Regression library for the data-test (simple-statistics, ml-regression, or a small custom
   OLS).
4. DTC stays the flagship: confirmed unless changed.

---

## 18. Kickoff prompt for Claude Code (Phase 1)

> Build Phase 1 of the Metric Driver-Tree Studio per this spec. Start with
> `src/schema/types.ts` exactly as specified (three edge kinds: identity, modeled,
> hypothesized). Then `schema/validate.ts` implementing every rule in Section 15, including
> identity reconciliation and the "no node is both an identity parent and a modeled parent"
> rule. Then implement the engine in `src/engine/` (graph, compute, whatif, sensitivity,
> montecarlo, recommend) and the formula parser in `src/lib/formula.ts`, all as pure
> TypeScript with no React imports, with the composition and edge-direction rules from
> Section 5. Write Vitest tests in `tests/` covering every invariant in Section 5. Then
> author ONE illustrative DTC e-commerce model in `src/content/dtc_ecommerce.json` that
> passes all validation and reconciles exactly, with contribution profit as the north star,
> every modeled edge graded "illustrative", every hypothesized edge graded "none", and the
> loyalty_membership to ltv edge present as hypothesized. Use snake_case for data ids and file
> names, PascalCase for types, camelCase for functions and variables. Type hints and
> docstrings on all exported functions. Seed all randomness. Stop after the model passes
> validation and reconciliation, show me the passing tests, and ask me to review before
> building any UI.
