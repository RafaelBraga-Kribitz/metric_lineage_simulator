# Tool Workflow and Prompts: Metric Driver-Tree Studio v4

Consolidated workflow and prompts. Supersedes `tool_workflow_and_prompts_v3.md` and
`prompts_addendum_v4.md`.

**Product SSOT:** [`PROJECT_CHARTER.md`](PROJECT_CHARTER.md) and normative ADRs
[`governance/adrs/0003-documentation-consolidation.md`](governance/adrs/0003-documentation-consolidation.md)
through [`0008`](governance/adrs/0008-phases-2-through-5.md). Phase 1 implementation:
[`governance/adrs/0007-phase-1-implementation.md`](governance/adrs/0007-phase-1-implementation.md).

This file holds **copy-paste prompts only** (transient; will be discarded later).

All prompts are copy-pasteable. Prerequisites are listed before each prompt so you know
what must exist before you use it. Do not start a phase before its prerequisites are met.

---

## 0. Tool roles and hard constraints

| Tool | Role | Hard constraint |
|------|------|-----------------|
| Claude Chat (claude.ai, this conversation) | Strategy, architecture, review gates, writing and improving prompts for other tools | Never generates production code files |
| Claude Code (CLI) | Schema, engine, formula parser, tests, workers, seed JSON, CLI tasks | Never writes React components or any visual layer |
| Claude Artifacts (claude.ai artifact panel) | Phase 0 demo, UI concept validation, component-pattern exploration | Never production code; always replaced by Cursor implementation |
| Claude with Figma MCP | Design system, node/edge visual specs, component reference frames | Before Cursor begins; not during; produces a reference, not code |
| Cursor IDE | Next.js app, React Flow canvas, component library, full integration | After Phase 1 engine is proved and passing tests; after design ref exists |
| Cowork | JSON model file management, documentation, changelog, content directory hygiene | No code generation; no engine logic |

---

## 1. Phase 0: Claude Artifacts (parallel with Phase 1)

### Purpose
Prove that the three-edge-kind visual encoding works, that the lever-to-result feedback
loop is readable, and that the honesty layer communicates well. This is a throwaway demo
that informs Phase 2, not code to be copied.

### Prerequisites
- None. This is the first thing to run, in parallel with Phase 1.

### How to use
Paste the prompt below into a new claude.ai conversation with Artifacts enabled. The seed
is embedded in the prompt so no files are needed.

---

ARTIFACT PROMPT (paste in full):

Build a self-contained React artifact called the Metric Driver-Tree Studio demo. Use React
with useState and useEffect. Use Recharts for the results panel. No Framer Motion, no
localStorage, no external state management. CSS transitions only. URL/React state only.

The artifact must implement everything below exactly.

--- VISUAL ENCODING ---
Three edge kinds, always visually distinct:
- identity: thick (strokeWidth 4) + blue (#2563EB) solid line
- modeled: normal (strokeWidth 2) + amber (#D97706) solid line
- hypothesized: normal (strokeWidth 2) + grey (#9CA3AF) dashed line, plus a "?" badge
  centered on the line

--- ILLUSTRATIVE DTC SEED (hard-coded in a const at the top of the file) ---

const DTC_MODEL = {
  id: "dtc_ecommerce",
  name: "DTC E-Commerce",
  north_star_id: "contribution_profit",
  nodes: [
    { id: "contribution_profit", name: "Contribution Profit", layer: "north_star",
      unit: "currency", baseline: 48000, is_controllable: false,
      definition: "Net revenue minus all variable costs. The honest north star: revenue growth that destroys margin is not growth." },
    { id: "net_revenue", name: "Net Revenue", layer: "outcome", unit: "currency",
      baseline: 120000, is_controllable: false,
      definition: "Gross revenue minus returns and discounts." },
    { id: "variable_costs", name: "Variable Costs", layer: "outcome", unit: "currency",
      baseline: 72000, is_controllable: false,
      definition: "Fulfillment, COGS, payment processing, and marketing spend combined." },
    { id: "orders", name: "Orders", layer: "driver", unit: "count",
      baseline: 1200, is_controllable: false,
      definition: "Completed, paid orders in the period." },
    { id: "average_order_value", name: "Average Order Value", layer: "input", unit: "currency",
      baseline: 100, is_controllable: true,
      definition: "Net revenue divided by orders." },
    { id: "sessions", name: "Sessions", layer: "driver", unit: "count",
      baseline: 40000, is_controllable: false,
      definition: "Total site sessions in the period." },
    { id: "conversion_rate", name: "Conversion Rate", layer: "input", unit: "percent",
      baseline: 0.03, is_controllable: true,
      definition: "Orders divided by sessions. Sensitive to page speed, UX, pricing, and offer." },
    { id: "new_sessions", name: "New Sessions", layer: "input", unit: "count",
      baseline: 30000, is_controllable: true,
      definition: "Sessions from users with no prior visit cookie." },
    { id: "returning_sessions", name: "Returning Sessions", layer: "driver", unit: "count",
      baseline: 10000, is_controllable: false,
      definition: "Sessions from users who have visited before. Influenced by retention-driving programs." },
    { id: "email_capture_rate", name: "Email Capture Rate", layer: "input", unit: "percent",
      baseline: 0.08, is_controllable: true,
      definition: "Share of new sessions that opt in to email. A leading indicator of returning session volume." },
    { id: "cost_per_order", name: "Cost Per Order", layer: "input", unit: "currency",
      baseline: 60, is_controllable: true,
      definition: "All variable costs divided by orders. Includes fulfillment, COGS, payment fees, and allocated marketing." },
    { id: "page_load_speed", name: "Page Load Speed (p95, s)", layer: "input", unit: "duration_s",
      baseline: 3.2, is_controllable: true,
      definition: "95th-percentile page load time in seconds. Hypothesized to affect conversion; direction is negative (lower is better) but elasticity is unquantified." },
    { id: "loyalty_membership", name: "Loyalty Program Membership Rate", layer: "input",
      unit: "percent", baseline: 0.22, is_controllable: true,
      definition: "Share of customers enrolled in the loyalty program. WARNING: high LTV correlation is likely selection, not causation. Heavy buyers self-select into programs; the program does not manufacture heavy buyers. Requires a randomized enrollment experiment to isolate lift." },
    { id: "customer_ltv", name: "Customer LTV (12-month)", layer: "guardrail", unit: "currency",
      baseline: 240, is_controllable: false,
      definition: "Estimated 12-month revenue per acquired customer, computed from a retention curve. Not the NSM; used as a guardrail against CAC overinvestment." },
    { id: "customer_cac", name: "Fully Loaded CAC", layer: "guardrail", unit: "currency",
      baseline: 45, is_controllable: false,
      definition: "Total marketing and sales cost (media + tooling + allocated headcount) divided by new customers. Never media spend alone." }
  ],
  edges: [
    { parent: "contribution_profit", child: "net_revenue", kind: "identity",
      formula_role: "addend" },
    { parent: "contribution_profit", child: "variable_costs", kind: "identity",
      formula_role: "subtrahend" },
    { parent: "net_revenue", child: "orders", kind: "identity", formula_role: "factor" },
    { parent: "net_revenue", child: "average_order_value", kind: "identity",
      formula_role: "factor" },
    { parent: "variable_costs", child: "orders", kind: "identity", formula_role: "factor" },
    { parent: "variable_costs", child: "cost_per_order", kind: "identity",
      formula_role: "factor" },
    { parent: "orders", child: "sessions", kind: "identity", formula_role: "factor" },
    { parent: "orders", child: "conversion_rate", kind: "identity", formula_role: "factor" },
    { parent: "sessions", child: "new_sessions", kind: "identity", formula_role: "addend" },
    { parent: "sessions", child: "returning_sessions", kind: "identity",
      formula_role: "addend" },
    { parent: "returning_sessions", child: "email_capture_rate", kind: "modeled",
      elasticity: 0.3, mechanism: "Higher email capture grows the re-engagement list, lifting returning session volume over the following 30 days.",
      evidence_grade: "illustrative",
      evidence_note: "Illustrative placeholder. Replace with real estimate from your email/session data before publishing." },
    { parent: "conversion_rate", child: "page_load_speed", kind: "hypothesized",
      direction: "decreases",
      rationale: "Slower pages likely reduce conversions, but the elasticity is unknown and highly dependent on traffic mix and device type." },
    { parent: "customer_ltv", child: "loyalty_membership", kind: "hypothesized",
      direction: "increases",
      rationale: "Loyalty members show higher LTV in cohort data, but this is almost certainly selection: heavy buyers enroll, not vice versa. Do not model as causal without a randomized enrollment experiment." },
    { parent: "customer_ltv", child: "average_order_value", kind: "modeled",
      elasticity: 0.6, mechanism: "Higher AOV per order compounds over repeat purchases into a higher 12-month LTV.",
      evidence_grade: "illustrative",
      evidence_note: "Illustrative. Derived from a simple repeat-purchase model; not from a survival curve." }
  ]
};

--- IDENTITY RECONCILIATION (compute once on load, show a green badge if it passes) ---

Compute contribution_profit from the identity tree:
  contribution_profit = (orders * average_order_value) - (orders * cost_per_order)
  orders = sessions * conversion_rate
  sessions = new_sessions + returning_sessions

returning_sessions baseline = 10000.
The modeled edge email_capture_rate -> returning_sessions has elasticity 0.3.
In the baseline state, no levers are moved, so returning_sessions = baseline = 10000.
contribution_profit baseline should equal 48000. Show a reconciliation badge.

--- PANELS TO BUILD ---

1. DRIVER TREE PANEL
Render the metric hierarchy as a vertical tree using inline SVG. Nodes as rounded
rectangles, colored by layer (north_star: blue, outcome: teal, driver: slate, input: white,
guardrail: rose). Edges drawn as SVG lines/paths using the three-kind encoding above. Nodes
are clickable to open the MetricInspector. Hypothesized edges show a "?" badge centered on
the line.

2. LEVER PANEL
Show all is_controllable nodes as sliders. Slider range: 50% to 200% of baseline.
Show the current value and the percentage change from baseline. On any slider change,
recompute the entire tree and update all displayed values in real time.

Modeled edge composition rule (implemented as declared assumption, shown in a tooltip on the
panel header): effective_returning_sessions = baseline * (1 + 0.3 * emailCaptureDeltaPct).
This assumes multiplicative, independent modeled effects. State this explicitly.

3. RESULTS PANEL
Show contribution_profit as the headline number with delta from baseline (absolute and
percent). Below it, show net_revenue and variable_costs in the same format. Use a small
Recharts BarChart (baseline vs current for these three metrics).

4. METRIC INSPECTOR (on node click)
Show: name, definition, current value, baseline, delta, edge kind legend for its edges,
evidence_grade of incoming edges, and the full edge rationale/evidence_note where present.
For loyalty_membership, show the full selection-trap warning in the definition.

5. ASSUMPTIONS LEDGER
A collapsible panel listing all modeled and hypothesized edges with:
- parent and child names
- edge kind badge (color-coded)
- evidence_grade badge
- mechanism or rationale
- evidence_note if present
- A disclaimer at the top of the ledger: "Modeled edges use illustrative elasticities.
  Hypothesized edges have no quantification. Neither should be treated as empirical evidence."

6. METHODOLOGY NOTE
A permanently visible small panel or expandable section with this text (verbatim, not
paraphrased):
"This tool separates three kinds of metric relationship:
Identity: true by definition, computes exactly.
Modeled: a declared behavioral assumption with an elasticity. Flagged and editable.
Hypothesized: a directional belief with no quantification. Not included in computation.
This distinction follows the practice of building a causal structure (DAG) before
quantifying it. Real elasticities require data and a causal identification strategy.
This tool is a thinking aid, not an econometric model."

--- GENERAL REQUIREMENTS ---
- All values formatted as their unit (currency: EUR with 0 decimals, percent: 2 decimal
  places, count: comma-separated integer, duration: 1 decimal + "s").
- Dark-mode-friendly neutral background (#0F172A), white text, no harsh colors.
- Responsive: readable at 1200px and 800px width.
- One React file, no external CSS files, no localStorage, no fetch calls.

--- END OF ARTIFACT PROMPT ---

### Phase 0 follow-up: Value of Information prototype

Purpose: add ONE thing to the existing Phase 0 artifact, a value-of-information prototype, to
de-risk the highest-risk design decision (the VoI framing) before building it for real in
Phase 5. Do not rebuild the artifact. Do not touch anything that already works.

Paste this as a follow-up message in the same conversation that holds the artifact:

---

ARTIFACT FOLLOW-UP PROMPT (paste in full):

Add a new collapsible panel to the existing Metric Driver-Tree Studio artifact called "Value
of Information (prototype)". Do NOT modify the existing tree, levers, results, ledger,
methodology, or inspector. This is purely additive. Reuse the existing computeValues function.

The panel does the following:

1. EDGE PICKER
A dropdown listing the two hypothesized edges and the two modeled edges. Default to
"Conversion Rate <- Page Load Speed" (hypothesized).

2. GUESS INPUTS
For the selected edge, three number inputs forming a triangular distribution on the elasticity:
low, likely, high. Defaults: low 0.05, likely 0.15, high 0.40 (illustrative).
A dropdown for functional form: "linear" or "diminishing returns (logarithmic)". Default
linear.
A note: "You are quantifying a belief you have not tested. These numbers are a guess."

3. RUN
A button "Run value-of-information". On click, run 2000 Monte Carlo samples. For each sample:
- draw an elasticity e from the triangular(low, likely, high) distribution;
- treat the selected edge as a modeled edge with that e and the chosen form (even if it is
  hypothesized in the base model);
- recompute the north star (contribution_profit) using the existing computeValues logic with
  this single temporary modeled edge applied to its parent;
- for the linear form the parent multiplier is (1 + e * childDeltaPct); for diminishing
  returns it is (1 + e * ln(1 + childDeltaPct)); here childDeltaPct is the lever change on the
  child if the user has moved it, else 0, so to make the prototype meaningful, apply a fixed
  illustrative +20% change to the child for the simulation and say so in the UI.
Collect the 2000 north star values.

4. OUTPUT (this framing is the whole point; copy it exactly)
- A small histogram (reuse Recharts) of the 2000 north star outcomes.
- P10, P50, P90 badges.
- A headline: "If your guess is right, a +20% change in [child] moves Contribution Profit
  across this range."
- A value-of-information line: "The wider this range and the larger the swing, the more this
  guess is worth testing before you act on it."
- A red caveat box, always visible: "This interval is the uncertainty in your GUESS, not
  evidence. A distribution looks like data and is not. Its only purpose is to help you decide
  what to test, never to estimate impact."

5. A single "priority hint" line below the output: "Priority to test = size of this swing
  divided by how hard the test is. High swing plus cheap test means test it first."

Keep it visually consistent with the existing dark theme and panel style. Seeded RNG so
results are stable across reruns (implement mulberry32 with a fixed seed). Do not add
localStorage, fetch, or any new dependency.

--- END OF ARTIFACT FOLLOW-UP PROMPT ---

Why only this and not the funnel, verbal builder, or prioritization: those belong in the real
Next.js app, not a throwaway demo. The VoI framing is the one design decision cheap to
prototype and expensive to get wrong, so it is the only thing worth adding to the artifact.

---

## 2. Phase 1: Claude Code (parallel with Phase 0)

### Purpose
Build the pure logic foundation: TypeScript schema, engine functions, formula parser,
Vitest tests, and the illustrative DTC seed JSON. Nothing visual. Prove reconciliation
before any UI exists.

### Prerequisites
- Build Spec v4 markdown file (hand it to Claude Code as a context file or paste it in).
- Node.js 20+, npm, git initialized.
- No existing `driver_tree_studio/` directory yet.

### How to use
Open a Claude Code session. If using the file context feature, attach
Attach [`PROJECT_CHARTER.md`](PROJECT_CHARTER.md) and [`governance/adrs/0007-phase-1-implementation.md`](governance/adrs/0007-phase-1-implementation.md). Then paste the prompt below.

---

CLAUDE CODE PHASE 1 PROMPT:

You are building Phase 1 of the Metric Driver-Tree Studio per the attached build spec v4.
This phase is pure TypeScript: schema, engine, formula parser, tests, and seed JSON. No
React, no Vite, no UI of any kind. Stop when tests pass and ask me to review before writing
any component.

SETUP:
- Initialize a new directory `driver_tree_studio/`.
- `npm init -y`, then add dependencies: typescript, ts-node, vitest, @types/node.
- Configure tsconfig.json for strict TypeScript (strict: true, noUncheckedIndexedAccess:
  true, target: ES2022, moduleResolution: bundler or node16).

STEP 1: Schema
Create `src/schema/types.ts` with exactly these types: Unit, MetricLayer, EdgeKind,
FormulaRole, EvidenceGrade, Direction, DistributionKind, Distribution, GovernanceMeta,
MetricNode, MetricEdge, Scenario, BusinessModel.
Three edge kinds: "identity", "modeled", "hypothesized". Definitions per spec section 4.
Export all types. No default exports.

STEP 2: Validation
Create `schema/validate.ts` implementing all rules from spec section 15:
- All edges reference existing node ids; graph is a DAG (no cycles).
- Exactly one north_star node with no parents.
- Every is_controllable node is a leaf (no outgoing identity edges) and has a distribution.
- identity edges have formula_role; modeled edges have elasticity, mechanism,
  evidence_grade; hypothesized edges have direction, rationale, evidence_grade must be
  "none", and they carry no elasticity.
- No node is simultaneously an identity parent and a modeled parent (would double-count).
- Identity reconciliation: recompute each identity parent from its children and check that
  the result equals the stored baseline within 1e-6 relative tolerance.
Validate returns { valid: boolean; errors: string[] }. Export it.

STEP 3: Engine
Create `src/engine/graph.ts`: buildGraph(model) returning adjacency lists and topoOrder().
Direction convention: a data edge { parent, child } means the parent is the explained
metric; the child is the component or driver. Compute flows child -> parent. topoOrder()
returns children before parents. Document this convention in a comment.

Create `src/engine/compute.ts`: computeBaseline(model) and applyLevers(model, levers).
Computation rules (from spec section 5):
- identity parents: exact formula from identity children, in topo order.
- modeled targets: effectiveValue = base * product over incoming modeled edges of
  (1 + edge.elasticity * childDeltaPct). Assumes multiplicative, independent effects.
  Document this assumption in a comment.
- hypothesized edges: contribute nothing to computation.
- levers: Record<nodeId, { mode: "multiplier"|"absolute"; value: number }>.

Create `src/engine/whatif.ts`: whatIf(model, changedLeafId, deltaPct) returning
{ values, northStarDelta, touchedModeledEdges }.

Create `src/engine/sensitivity.ts`: tornado(model, deltaPct = 0.1) returning
Array<{ leafId: string; northStarDelta: number }> sorted by absolute impact descending.

Create `src/engine/montecarlo.ts`: monteCarlo(model, runs, seed) using a seeded RNG
(implement mulberry32). Sample input distributions, propagate through identity and modeled
edges, collect north star values. Return { samples, p10, p50, p90, varianceContribution }.
varianceContribution: for each input leaf, Pearson correlation squared between that leaf's
samples and the north star samples, normalized so contributions sum to 1.

Create `src/engine/recommend.ts`: recommend(model, levers) returning
{ topLevers, brokenGuardrails, untestedBeliefs }. topLevers from tornado. brokenGuardrails:
guardrail/counter nodes where applyLevers value is worse than baseline. untestedBeliefs: all
hypothesized edges.

STEP 4: Formula parser
Create `src/lib/formula.ts`: parseFormula(formula: string, existingNodes: MetricNode[])
returning { newEdges: MetricEdge[]; newNodes: MetricNode[] }.
Input format: "net_revenue = orders * average_order_value".
Supports +, -, *, / and parentheses. Operator to formula_role: * -> factor, + -> addend,
- -> subtrahend, / -> divisor. Creates MetricNode stubs for ids not in existingNodes.
Only produces identity edges. Export parseFormula.

STEP 5: Tests
Create `tests/` mirroring `src/engine/` and `src/lib/`. Cover every invariant from spec
section 5 plus:
- parseFormula produces correct edges and roles.
- validate catches every rule violation with a clear error message.
- validate passes on a valid model.
Run with: npx vitest run. All tests must pass before you stop.

STEP 6: DTC seed
Create `src/content/dtc_ecommerce.json` matching BusinessModel schema with:
- contribution_profit as north_star (baseline 48000).
- Full identity tree: contribution_profit = net_revenue - variable_costs;
  net_revenue = orders * average_order_value;
  variable_costs = orders * cost_per_order;
  orders = sessions * conversion_rate;
  sessions = new_sessions + returning_sessions.
- returning_sessions modeled edge from email_capture_rate (elasticity 0.3,
  evidence_grade: "illustrative").
- conversion_rate hypothesized edge from page_load_speed (direction: "decreases",
  evidence_grade: "none").
- customer_ltv hypothesized edge from loyalty_membership (direction: "increases",
  evidence_grade: "none", rationale: includes the selection-trap warning from spec
  section 9).
- All input leaves with plausible baselines and triangular distributions
  (min 0.7*baseline, mode baseline, max 1.4*baseline).
- governance metadata on every node (owner, business_function, data_source, etc.).
Run validate() on the seed at the end. Show the validate output. Show reconciliation passing.

STOP HERE. Print the full test output and validate output. Ask me to review before
writing any UI or adding any npm scripts beyond what is needed for ts-node and vitest.

Naming conventions: snake_case for data ids, JSON field names, file names. PascalCase for
types and interfaces. camelCase for functions and variables. JSDoc on all exported functions.
No any types. No unused imports.

--- END OF CLAUDE CODE PHASE 1 PROMPT ---

---

## 3. Review Gate 1 (Claude Chat, this conversation)

### When
After both Phase 0 (artifact renders, methodology note is word-for-word correct, honesty
layer is visible, VoI prototype panel works) AND Phase 1 (all Vitest tests pass, validate
output is clean, seed reconciles to 1e-6) are complete.

### What to bring here
- The Phase 0 artifact link or a screenshot of the rendered tree.
- A screenshot of the VoI prototype panel with the red caveat visible.
- The Phase 1 test output (paste the full vitest output).
- The validate() output for the DTC seed.

### What I will check
- Identity reconciliation passes exactly.
- Three edge kinds render with the correct visual encoding in the artifact.
- The methodology note is verbatim and permanently visible.
- The loyalty_membership selection trap warning appears in the inspector.
- The VoI prototype states value of information, not impact; the red caveat is always visible.
- No edge in the seed has `evidence_grade: "experimental"` or implies causal certainty.
- Test suite covers all invariants.

Do not proceed to Phase 2 until this gate is passed.

---

## 4. Design (Claude.ai with Figma MCP)

### When
After Gate 1 passes, before starting Cursor Phase 2.

### Purpose
Define the design system (tokens, typography, node styles, edge styles) and create Figma
frames showing the canvas layout, the three-kind edge rendering, and the key panels. Cursor
uses these as a visual reference; it does not invent styles.

### Prerequisites
- Figma MCP connected (you have it: https://mcp.figma.com/mcp).
- A Figma file created and the file ID available.
- Phase 0 artifact reviewed (you know what works visually and what needs improvement).

### How to use
Open a claude.ai conversation with the Figma MCP active. Paste the prompt below.

---

CLAUDE WITH FIGMA MCP PROMPT:

I am building a React Next.js app called Metric Driver-Tree Studio. I need a design
reference in Figma before coding begins.

The app has three edge kinds for metric relationships, each visually distinct:
- Identity (thick 4px, #2563EB blue, solid): definitional
- Modeled (2px, #D97706 amber, solid): behavioral assumption
- Hypothesized (2px, #9CA3AF grey, dashed): directional belief only

Using the Figma MCP, create a new page in my Figma file called "Design Reference" and build:

1. COLOR TOKENS FRAME
A frame showing all design tokens:
- Background: #0F172A (app bg), #1E293B (panel bg), #334155 (card bg)
- Text: #F8FAFC (primary), #94A3B8 (secondary), #64748B (muted)
- Edge identity: #2563EB, Edge modeled: #D97706, Edge hypothesized: #9CA3AF
- Layer badges: north_star #7C3AED, outcome #0891B2, driver #475569, input #1E293B,
  guardrail #DC2626, counter #EA580C
- States: success #16A34A, warning #CA8A04, error #DC2626

2. NODE COMPONENT FRAME
A metric node component showing:
- Rounded rectangle, 200x80px, background #1E293B, 1px border #334155
- Top: layer badge (pill, 10px font, appropriate color)
- Middle: metric name (14px semibold, #F8FAFC)
- Bottom: current value and delta from baseline (12px, green/red for positive/negative)
- Four variants: one for each of north_star, driver, input, guardrail layers
- A hover state: border becomes the layer color

3. EDGE STYLE FRAME
Show the three edge types as horizontal lines with labels:
- Identity: thick solid blue line, label "Identity (exact)"
- Modeled: normal solid amber line with a small amber chip showing "e=0.30 | anecdotal",
  label "Modeled (assumption)"
- Hypothesized: dashed grey line with a grey "?" badge centered on it,
  label "Hypothesized (untested)"

4. CANVAS LAYOUT FRAME (1440x900)
A full-app layout showing:
- Left sidebar (280px): model selector at top, lever sliders panel, assumptions ledger
  (collapsed)
- Center (fill): the metric tree canvas area, nodes and edges visible
- Right panel (320px): metric inspector (showing a selected node's details)
- Bottom bar (48px): methodology note as a collapsed bar with a "?" icon

5. ASSUMPTIONS LEDGER FRAME
Show the ledger as a list of edge rows:
- Each row: parent -> child name, edge-kind badge, evidence-grade badge, truncated rationale
- A header row: "All assumptions are declared. None are hidden."
- First row shows the loyalty_membership -> customer_ltv hypothesized edge with the
  selection-trap warning visible

Return the Figma file URL and the frame IDs when done.

--- END OF FIGMA MCP PROMPT ---

---

## 5. Phase 2: Cursor IDE

### Purpose
Build the real Next.js application. React Flow canvas with bi-directional sync. Deploy to
Vercel. This is where the project becomes a real product.

### Prerequisites
- Phase 1 `driver_tree_studio/` repo exists and all tests pass.
- Figma design reference exists (frames from Section 4).
- Review Gate 1 passed.

### Step 5a: Enrich the DTC funnel (Claude Code, before Phase 2 UI)

Run in Claude Code against the Phase 1 repo before opening Cursor:

---

CLAUDE CODE PHASE 2a PROMPT (DTC funnel):

Update `src/content/dtc_ecommerce.json`. Decompose conversion_rate into a funnel:
conversion_rate = product_view_rate * add_to_cart_rate * checkout_start_rate *
purchase_completion_rate, as identity edges. Add the four rate nodes as input leaves with
baselines product_view_rate 0.60, add_to_cart_rate 0.25, checkout_start_rate 0.50,
purchase_completion_rate 0.40 (product = 0.03, matching the existing conversion_rate
baseline). Set funnel_stage_order 1..4 on them. Add triangular distributions. Keep
conversion_rate as an identity parent of the four rates (remove its is_controllable flag
since it is now derived). Re-run validate() and reconciliation; confirm contribution_profit
still equals 48000. Show the passing output. Do not touch the engine or any UI.

--- END OF CLAUDE CODE PHASE 2a PROMPT ---

### Step 5b: Next.js app (Cursor)

Open the `driver_tree_studio/` directory in Cursor. Create a `.cursor/rules` file (or add
to `CLAUDE.md`) with the project rules below, then start a Composer session with the
starter prompt.

---

CURSOR RULES FILE (`.cursor/rules` or `CLAUDE.md`):

Project: Metric Driver-Tree Studio
Stack: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, React Flow,
Recharts, Framer Motion.

HARD RULES:
- Never touch anything in `src/engine/`, `src/lib/formula.ts`, or `src/schema/types.ts`.
  These are owned by Claude Code. Cursor only reads them as imports.
- Never write logic that duplicates engine functions. Always import from `src/engine/`.
- All components in `src/components/` with a dedicated subdirectory per component.
- All styles via Tailwind utility classes only; no inline style objects except for React
  Flow node/edge renderers where dynamic values are unavoidable.
- No hardcoded colors. Use the CSS custom properties defined in globals.css matching the
  design tokens.
- Every component file has a JSDoc block at the top: purpose, props, usage example.
- After every Composer session, run `npm run typecheck` and `npm run test` and fix all
  errors before closing.
- The three edge kinds are always visually encoded as: identity = thick(4) + blue, modeled
  = normal(2) + amber, hypothesized = dashed(2) + grey + "?" badge. Never deviate.
- The methodology note panel text is verbatim from the spec and must never be shortened
  or paraphrased.
- The data-test engine never prints the word "causes" for observational results.
  Always: "associated with", "moves together", "consistent with".

EDGE-DIRECTION CONVENTION (critical):
  Data model edges are { parent: explainedMetric, child: driverMetric }.
  React Flow edges render child -> parent (cause flows toward the north star).
  These are opposite. Do not confuse them. Parent is always the aggregate/north-star-side.

--- END OF CURSOR RULES ---

---

CURSOR COMPOSER PHASE 2 STARTER PROMPT:

Context: the `src/engine/`, `src/schema/`, and `src/content/` directories already exist and
are passing all Vitest tests. Do not modify them. All imports must come from these
directories.

Phase 2 goal: build the Next.js app shell, the React Flow canvas with bi-directional sync,
and deploy to Vercel.

STEP 1: Next.js setup
- Add Next.js 14 (App Router), Tailwind, shadcn/ui, React Flow (reactflow), Recharts,
  Framer Motion to the existing project.
- Configure Tailwind with the design tokens from the Figma reference (colors in section 4
  of the workflow file) as CSS custom properties in globals.css.
- Create `app/layout.tsx` and `app/page.tsx` with a dark (#0F172A) background.

STEP 2: Load and display one model
- Create `src/lib/modelLoader.ts` that imports `dtc_ecommerce.json` and returns a
  BusinessModel.
- Create a `useMetricModel` hook in `src/hooks/` that holds model state, calls
  computeBaseline from the engine, and exposes { model, values, applyLevers, whatIf }.

STEP 3: React Flow canvas
- Create `src/components/Canvas/MetricCanvas.tsx` using ReactFlow.
- Custom node: `src/components/Canvas/MetricNode.tsx` (per the Figma node design: layer
  badge, name, value, delta).
- Custom edges: `src/components/Canvas/MetricEdge.tsx` with three variants exactly matching
  the visual encoding in the cursor rules. The hypothesized edge variant must show the "?"
  badge using a React Flow EdgeLabelRenderer.
- Node positions come from MetricNode.position in the model. Dragging a node updates
  position in state.
- Clicking a node opens the MetricInspector panel (right sidebar).
- Dragging from one node to another opens an edge-creation dialog: choose kind (identity,
  modeled, hypothesized), fill required fields, write to model state.
- The canvas is read-only for identity edges (no delete, no reconnect). Modeled and
  hypothesized edges can be deleted or edited.

STEP 4: Bi-directional formula sync
- Below the canvas, add a formula input field. Format: "parent_id = child_id * child_id".
- On submit, call parseFormula from `src/lib/formula.ts`, merge new edges and nodes into
  model state, and rerender the canvas.
- Editing an identity edge on the canvas regenerates the formula string shown in the field.

STEP 5: Left sidebar
- Model selector (dropdown, single model for now).
- Lever sliders for all is_controllable nodes.
- Assumptions ledger (collapsible) as described in spec section 10.

STEP 6: Right panel - MetricInspector
- Shows on node click: name, definition, current value, delta from baseline, governance
  metadata, incoming edge list with kind badges and evidence_grade badges, explainer text.

STEP 7: Bottom bar - Methodology note
- A permanently visible collapsed bar showing "This tool separates identities, declared
  assumptions, and untested beliefs. Click to read more."
- Expanded: full verbatim text from spec section 10.

STEP 8: Vercel deploy
- Add `vercel.json` if needed.
- Confirm `npm run build` completes with no errors.
- Run `vercel deploy`.

After each step, run `npm run typecheck`. After step 5, run `npm run test`. Fix all errors.
Do not proceed to step N+1 with failing types or tests.

--- END OF CURSOR PHASE 2 PROMPT ---

### Step 5c: FunnelChart component (Cursor, same Phase 2 session)

Add to the Phase 2 Cursor session after the starter prompt steps:

---

CURSOR COMPOSER PHASE 2 FUNNEL PROMPT:

Create `src/components/FunnelChart/FunnelChart.tsx`. Render a horizontal funnel for the
DTC session-to-order path using the funnel_stage_order inputs: Sessions -> Product Views ->
Carts -> Checkouts -> Orders. Show the absolute count at each stage and the stage conversion
percentage between stages. Render only when the current model has nodes with
funnel_stage_order set; otherwise render nothing. Place it as a tab or toggle next to the
existing bar chart in the results area, not as a replacement. Use the design tokens. Run
npm run typecheck after.

--- END OF CURSOR PHASE 2 FUNNEL PROMPT ---

### Step 5d: VerbalBuilder component (Cursor, same Phase 2 session)

Add to the Phase 2 Cursor session:

---

CURSOR COMPOSER PHASE 2 VERBAL BUILDER PROMPT:

Create `src/components/VerbalBuilder/VerbalBuilder.tsx`, a text view of the model that the
user reaches by clicking empty canvas space (add the flip interaction to MetricCanvas).
Render the model as indented readable rows in the Hazel/Kayako visual style, but the content
is algebraic composition, not boolean logic. For each parent: a header line ("X is defined
as" for identity parents, "X is influenced by" for modeled, "X is believed to be influenced
by" for hypothesized) followed by indented child rows with a kind badge and the relevant
detail (formula_role, elasticity + form, or direction). Identity rows are editable through
parseFormula (`src/lib/formula.ts`); editing rewrites identity edges and the canvas
rerenders. Modeled and hypothesized rows open the same edge panel the canvas uses. Do not
implement boolean segment conditions; leave a commented placeholder noting that is future
scope. Run npm run typecheck after.

--- END OF CURSOR PHASE 2 VERBAL BUILDER PROMPT ---

---

## 6. Phase 3a: Claude Code (data-test engine + workers + additional models)

### Purpose
Add the hero feature engine: bring-your-own-data relationship estimation. Add the Monte
Carlo Web Worker. Add illustrative model 2 (Subscription SaaS).

### Prerequisites
- Phase 2 deployed and Review Gate 1.5 passed (canvas renders, methodology note correct,
  bi-directional sync works, funnel and verbal builder functional).
- Phase 1 repo still intact with passing tests.

---

CLAUDE CODE PHASE 3a PROMPT:

Phase 3a of Metric Driver-Tree Studio. Add the data-test engine, the Monte Carlo worker,
and model 2. Do not touch any Next.js/React files.

TASK 1: Data-test engine
Create `src/engine/estimate.ts`.

Function signature:
estimateRelationship(
  data: Record<string, number[]>,  // column name -> values array, all same length
  parentId: string,
  childId: string,
  controlIds: string[],
  edge: MetricEdge
): EstimationResult

EstimationResult type:
{
  parentId: string;
  childId: string;
  n: number;
  correlation: number;
  correlation_ci: [number, number];
  regression: {
    coefficient: number;
    intercept: number;
    r_squared: number;
    r_squared_oos: number;     // out-of-sample r-squared (80/20 split)
    coefficient_se: number;
    t_stat: number;
    p_value: number;
    effect_size_note: string;  // e.g., "small (Cohen's f^2 < 0.02)"
  };
  verdict: {
    association_note: string;  // "X and Y move together" or "no consistent association"
    causal_note: string;       // always: "observational data. Does not establish causation."
    what_would_prove_this: string;  // describes the experiment needed
  };
  leakage_warning: string | null;  // non-null if the edge is an identity edge
  promoted_elasticity: number | null;  // the coefficient as a candidate elasticity, null if r_squared_oos < 0.05
}

Rules:
- Implement OLS regression manually (no external regression library in this step; write the
  normal equations; document the math). This keeps the computation transparent and auditable.
- 80/20 train/test split (first 80% train, last 20% test) for r_squared_oos.
- If edge.kind is "identity", set leakage_warning to a message explaining that this is a
  definitional relationship, not an empirical finding, and return early.
- The verdict.association_note must never use the word "causes". Use "associated with",
  "moves together with", or "no consistent association found".
- The verdict.causal_note is always the fixed string: "This is observational data. It does
  not establish causation. Spurious correlation and confounding are likely."
- The verdict.what_would_prove_this describes a randomized experiment appropriate to the
  relationship type (A/B test, geo holdout, switchback) in one to three sentences.
- If promoted_elasticity is non-null, it is a candidate to replace the edge's current
  elasticity, but the user must accept it explicitly.

Write Vitest tests for estimateRelationship covering:
- identity edge returns leakage_warning and does not return a coefficient.
- perfectly collinear data returns r_squared = 1.0.
- uncorrelated data returns |correlation| < 0.1.
- verdict.association_note never contains the word "causes" (enforce with a string check).
- OOS r_squared is lower than in-sample r_squared on noisy data.

TASK 2: Monte Carlo Web Worker
Create `src/workers/montecarlo.worker.ts` as a standard Web Worker (no extra framework).
It receives: { model: BusinessModel; runs: number; seed: number }.
It responds with progress messages every 10% of runs, then a final MonteCarloResult.
Cap: if runs > 10000, send a warning message first and cap at 10000.
Import monteCarlo from `src/engine/montecarlo.ts`.
Do not use any browser APIs other than the Worker postMessage/onmessage interface.

TASK 3: Subscription SaaS model
Create `src/content/subscription_saas.json` following the same schema as dtc_ecommerce.json.
North star: net_revenue_retention (NRR). Key identity tree:
  nrr = (starting_mrr + expansion_mrr - contraction_mrr - churned_mrr) / starting_mrr
  expansion_mrr = expansion_accounts * average_expansion_arr / 12
  churned_mrr = churned_accounts * average_account_arr / 12
Include: ltv (from retention curve, formula: average_account_arr / churn_rate), cac (fully
loaded), ltv_cac_ratio as a guardrail. Mark all modeled elasticities as evidence_grade:
"illustrative". At least two hypothesized edges. Run validate() and show reconciliation.

Run all tests after each task. All must pass before you stop.

--- END OF CLAUDE CODE PHASE 3a PROMPT ---

---

## 7. Phase 3b: Cursor IDE (data-test UI and Monte Carlo panel)

### Prerequisites
- Phase 3a Claude Code tasks complete and tests passing.
- Phase 2 deployed Next.js app running.

---

CURSOR COMPOSER PHASE 3b PROMPT:

Phase 3b: add the data-test hero panel and the Monte Carlo panel to the existing Next.js app.
The engine functions already exist in `src/engine/estimate.ts` and
`src/workers/montecarlo.worker.ts`. Do not modify them.

TASK 1: Data upload and column mapper
Create `src/components/DataTest/DataUpload.tsx`.
- A CSV file input using papaparse (already installed or add it).
- After parsing, show a column mapper: for each parsed column, a dropdown to map it to a
  metric id from the current model, or "ignore".
- On confirm, store the mapped data in state as Record<string, number[]>.

Create `src/components/DataTest/EdgeSelector.tsx`.
- Shows all modeled and hypothesized edges as selectable rows (parent -> child, kind badge).
- The user selects one edge to test.
- Also shows a multi-select for control variables (other metric ids in the data).

Create `src/components/DataTest/EstimationResult.tsx`.
- Displays an EstimationResult from the engine.
- Sections: Association Summary, Regression Details (collapsible), Verdict, What Would
  Prove This.
- The verdict.association_note is shown in large text, always present.
- The verdict.causal_note is shown in amber, always present, never hidden.
- If leakage_warning is non-null, show it as a blocking red banner before any result.
- If promoted_elasticity is non-null, show a "Promote to modeled edge?" button. On accept,
  update the edge in model state (kind becomes "modeled", elasticity set, evidence_grade set
  to "observational").

TASK 2: Monte Carlo panel
Create `src/components/MonteCarloPanel/MonteCarloPanel.tsx`.
- A "Run Monte Carlo" button with a run count selector (100, 1000, 5000, 10000).
- Spawns `montecarlo.worker.ts` using the Web Worker API. Show a progress bar from worker
  progress messages.
- On completion: a Recharts histogram of north star samples (30 bins), a P10/P50/P90 badge
  row, and a horizontal bar chart of variance contribution per leaf.
- A caveat box (always visible, not collapsible): "Monte Carlo propagates input uncertainty
  under the modeled assumptions. It does not validate those assumptions. Hypothesized edges
  are excluded from this simulation."

TASK 3: Add subscription_saas.json as the second model option
Update the model selector in the left sidebar to list both dtc_ecommerce and
subscription_saas. Switching models resets all lever state and clears any test results.

After each task, run npm run typecheck. Fix all errors.

--- END OF CURSOR PHASE 3b PROMPT ---

---

## 8. Cowork role

Cowork is the content and documentation manager for this project. It does not write code
or engine logic. Its role is to keep the non-code content clean and organized as the project
grows.

Assign Cowork these ongoing tasks:

1. MODEL FILE MANAGEMENT
When a new `src/content/[model].json` is ready (from Claude Code), use Cowork to:
- Copy it to a `models_archive/` backup folder with a timestamp.
- Update `src/content/index.ts` (a simple export list of all available models) to include
  the new model.
- Add a one-line entry to `CHANGELOG.md` with the date and model name.

2. DOCUMENTATION MAINTENANCE
After each phase completes:
- Update `README.md` with the current phase status and deploy URL.
- Archive the previous build spec version to `docs/specs/` (e.g., spec_v3.md, spec_v4.md).
- Ensure `docs/methodology.md` (the full methodology text from the spec) stays current.

3. SEED AUTHORING PREP (before public launch)
When the real DTC authoring pass begins:
- Create `src/content/dtc_ecommerce_real.json` as a copy of the illustrative seed.
- Update the evidence_grade fields as Rafael authors each edge.
- Track which edges still have evidence_grade: "illustrative" in a simple text checklist.
- When all edges are graded (none remaining as "illustrative"), flag for the launch gate.

---

## 9. Review Gate 2 (Claude Chat)

### When
After Phase 3b is deployed and testable.

### What to bring
- A live URL with data-test working (upload a sample CSV and run an estimation).
- The exact text of the first EstimationResult verdict shown by the tool.

### What I will check
- The verdict text contains none of these words: "causes", "causal relationship", "proves",
  "demonstrates causation". I will search for them literally.
- The causal_note is always visible and not hidden behind a click.
- The leakage guard fires correctly on identity edges.
- The Monte Carlo caveat is permanently visible.
- Promoting a tested edge correctly updates the evidence_grade to "observational", not
  "experimental".
- The loyalty_membership -> customer_ltv edge is still hypothesized (not promoted without
  experimental evidence).

---

## 10. Phase 4: Cursor IDE (SEO, shareability, BRAGA brand)

### Prerequisites
- Review Gate 2 passed.
- Real DTC authoring complete (Cowork checklist shows zero illustrative edges remaining).
- Domain decided and DNS pointed to Vercel.

### Hard gate on public launch
Do not merge Phase 4 to production until the DTC seed has no edges with evidence_grade:
"illustrative". The public tool carries Rafael's name. The honesty layer is the product.

---

CURSOR COMPOSER PHASE 4 PROMPT:

Phase 4: SEO, shareable URL state, iframe embed, and BRAGA brand. No engine changes.

TASK 1: URL state encoding
Encode the complete lever state and selected scenario into the URL query string on every
change. On page load, rehydrate lever state from the URL before rendering. Use a simple
base64-encoded JSON for the state object. Keep URL length reasonable (levers only, not the
full model). A shared link should reproduce exactly the scenario the user is looking at.

TASK 2: SEO pages
For each model in `src/content/index.ts`, create a static route at `/model/[model_id]`
with:
- A unique page title and meta description driven by the model's name and narrative fields.
- An OpenGraph image (can be a static screenshot or a generated SVG) showing the north star
  metric name and a simplified tree outline.
- Structured data (JSON-LD) marking the page as a SoftwareApplication or Tool.
- The full model narrative rendered as readable text above the interactive canvas (for
  search indexing, not just the app).

TASK 3: Embed
Add a `/embed/[model_id]` route that renders only the canvas and lever panel with no
sidebar, suitable for iframe embedding at 800x600. Add a "share embed" button that copies
the iframe snippet to clipboard.

TASK 4: BRAGA brand
- Add the BRAGA wordmark or logo to the top-left of the app.
- Footer: "Built by Rafael Braga-Kribitz. [LinkedIn] [Portfolio]". Link both.
- The methodology note footer should end with: "Methodology and limitations by BRAGA."
- Color palette, typography, and any editorial copy should match the BRAGA Swiss-style
  design system (cool grey, coral accent, DM Sans or equivalent sans-serif).

TASK 5: Analytics (privacy-respecting)
Add Vercel Analytics or a simple event counter (no personal data, no cookies) to track:
- Page views per model.
- Lever panel interactions (count only, not values).
- Data-test runs (count only).
Do not track anything that requires a cookie banner.

After all tasks, run npm run build and confirm a clean production build. Then deploy.

--- END OF CURSOR PHASE 4 PROMPT ---

---

## 11. Phase 5: Experimentation Flywheel

The flagship post-launch feature. Build only after Phases 0 through 4 are deployed and the
base product is earning traffic. Sequenced after launch so it never blocks shipping.

### Prerequisites
- Phase 4 deployed to production.
- All Phase 3b and Gate 2 checks still passing on the live URL.

### Step 11a: Engine (Claude Code)

---

CLAUDE CODE PHASE 5a PROMPT:

Phase 5a of Metric Driver-Tree Studio per spec v4. Pure TypeScript only; do not touch any
React files.

1. In `src/engine/compute.ts`, implement applyForm(form, childDeltaPct, edge) returning a
multiplier for the four functional forms in spec section 5 (linear, logarithmic, power,
s_curve). Update the modeled-edge composition to call applyForm. Add tests: each form
returns 1.0 at childDeltaPct 0; logarithmic and s_curve show diminishing marginal effect;
power with e=1 equals linear-at-small-deltas behavior within tolerance.

2. Update `src/engine/montecarlo.ts` so that when a modeled edge has an
elasticity_distribution, each run samples the elasticity from it (use the existing seeded
mulberry32 and the Distribution kinds). Test: point distribution equals deterministic
baseline.

3. Create `src/engine/valueOfInformation.ts`: voi(model, runs, seed) returning, per modeled
edge that has an elasticity_distribution, { edgeId, northStarSpread (p90 - p10 of the north
star attributable to that edge's uncertainty, computed by holding all other uncertain edges
at their central value), varianceShare }. Test that an edge with zero-width distribution
contributes zero spread.

4. Create `src/engine/prioritize.ts`: prioritizeTests(model) returning, per uncertain
modeled edge, { edgeId, voiScore (the northStarSpread), testCost (edge.test_cost, default
3), priorityScore (voiScore / testCost), reason (plain-English) }, sorted by priorityScore
descending. Test ordering and the divide-by-cost behavior.

Run all tests. Stop and show output before any UI work.

--- END OF CLAUDE CODE PHASE 5a PROMPT ---

### Step 11b: UI (Cursor)

---

CURSOR COMPOSER PHASE 5b PROMPT:

Phase 5b: build the Guesstimate panel and the prioritization view over the existing engine.
Do not modify the engine.

1. `src/components/Guesstimate/GuesstimatePanel.tsx`: for a selected modeled or hypothesized
edge, inputs for a triangular elasticity distribution (low/likely/high) and a functional-form
dropdown (the four forms). A "Run value of information" button that calls
`src/engine/valueOfInformation.ts` through the Monte Carlo worker. Output: a Recharts
histogram of north star outcomes, P10/P50/P90, and the verbatim VoI framing and red caveat
from spec section 10. Selecting a hypothesized edge here lets the user promote it to modeled
with the entered distribution and evidence_grade `estimated`.

2. `src/components/PrioritizationView/PrioritizationView.tsx`: a ranked table from
prioritizeTests(model). Columns: edge (parent <- child), current uncertainty (the guess
spread), north-star swing (VoI), test cost (editable 1 to 5, writes edge.test_cost),
priority score, reason. A header line: "Test the guesses that most change your view of the
north star and are cheapest to resolve. This is value-of-information prioritization, not gut
feel." Clicking a row with data available opens the DataTest panel for that edge, closing
the flywheel loop.

Run npm run typecheck after each component.

--- END OF CURSOR COMPOSER PHASE 5b PROMPT ---

---

## 12. Review Gate 3: Experimentation Flywheel (Claude Chat)

### When
After Phase 5b is deployed and testable.

### What to bring
- A live URL with Guesstimate and prioritization views working.
- A screenshot of the Guesstimate output with the red caveat visible.

### What I will check
- The Guesstimate output never states an impact estimate; it states value of information.
- The red caveat is present and never hidden.
- Functional forms are the named four, not a free-form expression field.
- Promoting a hypothesized edge through Guesstimate sets grade `estimated`, never higher.
- The prioritization reason text is plain-English and references uncertainty and cost, not
  authority.
- Clicking a prioritization row opens the DataTest panel for that edge (flywheel closes).

---

## 13. Prompt maintenance rule

Every time a phase produces an unexpected result that requires a change to the plan, bring
it back to Claude Chat (this conversation). Do not improvise architecture changes inside
Cursor or Claude Code. Update the build spec first, then re-derive the affected prompt in
this file, then continue. This keeps v4 as the single source of truth and prevents the spec
from drifting from the implementation.
