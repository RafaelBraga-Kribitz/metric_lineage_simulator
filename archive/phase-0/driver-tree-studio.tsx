import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from "recharts";

/* ============================================================================
   METRIC DRIVER-TREE STUDIO  -  Phase 0 demo, single React file.
   Three edge kinds: identity (true by definition), modeled (declared
   assumption + elasticity), hypothesized (directional belief, no number).
   Data direction: edge = { parent (effect/aggregate), child (driver/part) }.
   Computation flows children -> parents. The tree renders child below parent
   (bottom-up toward the north star).
   ========================================================================== */

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
    { parent: "contribution_profit", child: "net_revenue", kind: "identity", formula_role: "addend" },
    { parent: "contribution_profit", child: "variable_costs", kind: "identity", formula_role: "subtrahend" },
    { parent: "net_revenue", child: "orders", kind: "identity", formula_role: "factor" },
    { parent: "net_revenue", child: "average_order_value", kind: "identity", formula_role: "factor" },
    { parent: "variable_costs", child: "orders", kind: "identity", formula_role: "factor" },
    { parent: "variable_costs", child: "cost_per_order", kind: "identity", formula_role: "factor" },
    { parent: "orders", child: "sessions", kind: "identity", formula_role: "factor" },
    { parent: "orders", child: "conversion_rate", kind: "identity", formula_role: "factor" },
    { parent: "sessions", child: "new_sessions", kind: "identity", formula_role: "addend" },
    { parent: "sessions", child: "returning_sessions", kind: "identity", formula_role: "addend" },
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

/* ----------------------------- layout (hand-tuned DAG) -------------------- */
const NODE_W = 152, NODE_H = 56, HALF_W = NODE_W / 2, HALF_H = NODE_H / 2;
const VB_W = 900, VB_H = 690;

const LAYOUT = {
  customer_cac:        { x: 95,  y: 60 },
  customer_ltv:        { x: 110, y: 175 },
  loyalty_membership:  { x: 95,  y: 300 },
  contribution_profit: { x: 560, y: 55 },
  net_revenue:         { x: 430, y: 165 },
  variable_costs:      { x: 690, y: 165 },
  average_order_value: { x: 300, y: 285 },
  orders:              { x: 530, y: 285 },
  cost_per_order:      { x: 720, y: 285 },
  sessions:            { x: 440, y: 400 },
  conversion_rate:     { x: 630, y: 400 },
  new_sessions:        { x: 370, y: 515 },
  returning_sessions:  { x: 550, y: 515 },
  page_load_speed:     { x: 740, y: 515 },
  email_capture_rate:  { x: 550, y: 625 },
};

const LAYER = {
  north_star: { fill: "#2563EB", text: "#FFFFFF", label: "North Star" },
  outcome:    { fill: "#0D9488", text: "#FFFFFF", label: "Outcome" },
  driver:     { fill: "#475569", text: "#E2E8F0", label: "Driver" },
  input:      { fill: "#F1F5F9", text: "#0F172A", label: "Input (lever)" },
  guardrail:  { fill: "#E11D48", text: "#FFFFFF", label: "Guardrail" },
};

const EDGE_STYLE = {
  identity:     { stroke: "#2563EB", width: 4, dash: "none",  label: "Identity (true by definition)" },
  modeled:      { stroke: "#D97706", width: 2, dash: "none",  label: "Modeled (declared elasticity)" },
  hypothesized: { stroke: "#9CA3AF", width: 2, dash: "6 5",   label: "Hypothesized (untested belief)" },
};

const GRADE = {
  none:          { bg: "#374151", text: "#9CA3AF", label: "evidence: none" },
  illustrative:  { bg: "#78350F", text: "#FCD34D", label: "evidence: illustrative" },
  anecdotal:     { bg: "#713F12", text: "#FDE68A", label: "evidence: anecdotal" },
  observational: { bg: "#164E63", text: "#67E8F9", label: "evidence: observational" },
  experimental:  { bg: "#064E3B", text: "#6EE7B7", label: "evidence: experimental" },
};

const METHODOLOGY = [
  "This tool separates three kinds of metric relationship:",
  "Identity: true by definition, computes exactly.",
  "Modeled: a declared behavioral assumption with an elasticity. Flagged and editable.",
  "Hypothesized: a directional belief with no quantification. Not included in computation.",
  "This distinction follows the practice of building a causal structure (DAG) before quantifying it. Real elasticities require data and a causal identification strategy. This tool is a thinking aid, not an econometric model.",
];

const LEDGER_DISCLAIMER =
  "Modeled edges use illustrative elasticities. Hypothesized edges have no quantification. Neither should be treated as empirical evidence.";

/* ----------------------------- formatting --------------------------------- */
function formatValue(v, unit) {
  if (v === null || v === undefined || Number.isNaN(v)) return "\u2014";
  switch (unit) {
    case "currency":
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);
    case "percent":
      return (v * 100).toFixed(2) + "%";
    case "count":
      return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(v));
    case "duration_s":
      return v.toFixed(1) + "s";
    default:
      return String(v);
  }
}
function signedValue(v, unit) {
  const s = formatValue(Math.abs(v), unit);
  return (v >= 0 ? "+" : "\u2212") + s;
}
function pct(curr, base) {
  if (!base) return "0.0%";
  const p = ((curr - base) / base) * 100;
  return (p >= 0 ? "+" : "\u2212") + Math.abs(p).toFixed(1) + "%";
}

/* ----------------------------- compute engine ----------------------------- */
/* Memoized topological recursion over the edge list.
   - identity parent  -> exact formula over identity children (by formula_role)
   - modeled parent   -> baseline * product(1 + e_i * childDeltaPct_i)  [declared assumption]
   - hypothesized     -> contributes nothing
   - leaf             -> lever value if controllable, else baseline               */
function computeValues(model, levers) {
  const nodeMap = {};
  model.nodes.forEach((n) => (nodeMap[n.id] = n));
  const cache = {};

  function combineIdentity(parts) {
    const factors = parts.filter((p) => p.role === "factor");
    const addends = parts.filter((p) => p.role === "addend");
    const subs = parts.filter((p) => p.role === "subtrahend");
    const divs = parts.filter((p) => p.role === "divisor");
    let r = factors.length ? factors.reduce((a, p) => a * p.value, 1)
                           : addends.reduce((a, p) => a + p.value, 0);
    r -= subs.reduce((a, p) => a + p.value, 0);
    divs.forEach((d) => (r /= d.value));
    return r;
  }

  function compute(id) {
    if (cache[id] !== undefined) return cache[id];
    const node = nodeMap[id];
    const incoming = model.edges.filter((e) => e.parent === id);
    const idEdges = incoming.filter((e) => e.kind === "identity");
    const mEdges = incoming.filter((e) => e.kind === "modeled");
    let value;
    if (idEdges.length) {
      value = combineIdentity(idEdges.map((e) => ({ value: compute(e.child), role: e.formula_role })));
    } else if (mEdges.length) {
      let f = 1;
      mEdges.forEach((e) => {
        const cv = compute(e.child);
        const cn = nodeMap[e.child];
        const d = cn.baseline ? (cv - cn.baseline) / cn.baseline : 0;
        f *= 1 + e.elasticity * d;
      });
      value = node.baseline * f;
    } else {
      value = node.is_controllable && levers[id] !== undefined ? levers[id] : node.baseline;
    }
    cache[id] = value;
    return value;
  }

  const out = {};
  model.nodes.forEach((n) => (out[n.id] = compute(n.id)));
  return out;
}

/* node has any computed (non-hypothesized) downstream effect? */
function hasComputedEffect(model, id) {
  return model.edges.some((e) => e.child === id && e.kind !== "hypothesized");
}

/* ----------------------------- small UI bits ------------------------------ */
function KindBadge({ kind }) {
  const s = EDGE_STYLE[kind];
  return (
    <span className="dts-chip" style={{ background: s.stroke + "22", color: s.stroke, border: `1px solid ${s.stroke}` }}>
      {kind}
    </span>
  );
}
function GradeBadge({ grade }) {
  if (!grade) return null;
  const g = GRADE[grade] || GRADE.none;
  return <span className="dts-chip" style={{ background: g.bg, color: g.text }}>{g.label}</span>;
}

function wrapName(name, maxLen = 16) {
  const words = name.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length <= maxLen) cur = (cur + " " + w).trim();
    else { if (cur) lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines.length > 2 ? [lines[0], lines.slice(1).join(" ")] : lines;
}

/* ----------------------------- tree (inline SVG) -------------------------- */
function geom(edge) {
  const c = LAYOUT[edge.child], p = LAYOUT[edge.parent];
  const start = { x: c.x, y: c.y - HALF_H };
  const end = { x: p.x, y: p.y + HALF_H };
  const midY = (start.y + end.y) / 2;
  return {
    path: `M ${start.x} ${start.y} C ${start.x} ${midY}, ${end.x} ${midY}, ${end.x} ${end.y}`,
    mid: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
  };
}

function Tree({ model, values, selectedId, onSelect }) {
  return (
    <div className="tree-scroll">
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="tree-svg" role="img" aria-label="Metric driver tree">
        <defs>
          {Object.entries(EDGE_STYLE).map(([k, s]) => (
            <marker key={k} id={`arrow-${k}`} markerWidth="10" markerHeight="10"
              refX="7" refY="5" orient="auto" markerUnits="userSpaceOnUse">
              <path d="M0,0 L10,5 L0,10 Z" fill={s.stroke} />
            </marker>
          ))}
        </defs>

        {/* guardrail region */}
        <rect x="20" y="30" width="178" height="183" rx="12"
          fill="rgba(225,29,72,0.06)" stroke="rgba(225,29,72,0.35)" strokeWidth="1" />
        <text x="30" y="48" fill="#FB7185" fontSize="11" fontWeight="700" letterSpacing="1">GUARDRAILS</text>

        {/* edges */}
        {model.edges.map((e, i) => {
          const s = EDGE_STYLE[e.kind];
          const g = geom(e);
          return (
            <g key={i}>
              <path d={g.path} fill="none" stroke={s.stroke} strokeWidth={s.width}
                strokeDasharray={s.dash === "none" ? undefined : s.dash}
                strokeLinecap="round" opacity={e.kind === "identity" ? 0.9 : 0.85}
                markerEnd={`url(#arrow-${e.kind})`} />
              {e.kind === "hypothesized" && (
                <g>
                  <circle cx={g.mid.x} cy={g.mid.y} r="9" fill="#1E293B" stroke="#9CA3AF" strokeWidth="1.5" />
                  <text x={g.mid.x} y={g.mid.y + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="#CBD5E1">?</text>
                </g>
              )}
            </g>
          );
        })}

        {/* nodes */}
        {model.nodes.map((n) => {
          const pos = LAYOUT[n.id];
          const c = LAYER[n.layer];
          const lines = wrapName(n.name);
          const selected = selectedId === n.id;
          const valText = formatValue(values[n.id], n.unit);
          const nameYs = lines.length === 2 ? [pos.y - 13, pos.y - 1] : [pos.y - 3];
          const valY = lines.length === 2 ? pos.y + 17 : pos.y + 15;
          return (
            <g key={n.id} onClick={() => onSelect(n.id)} style={{ cursor: "pointer" }} className="tree-node">
              <rect x={pos.x - HALF_W} y={pos.y - HALF_H} width={NODE_W} height={NODE_H} rx="10"
                fill={c.fill} stroke={selected ? "#FBBF24" : "rgba(255,255,255,0.16)"}
                strokeWidth={selected ? 3 : 1} />
              {lines.map((ln, idx) => (
                <text key={idx} x={pos.x} y={nameYs[idx]} textAnchor="middle"
                  fontSize="10.5" fontWeight="600" fill={c.text}>{ln}</text>
              ))}
              <text x={pos.x} y={valY} textAnchor="middle" fontSize="11.5" fontWeight="800"
                fill={c.text} opacity={n.layer === "input" ? 0.85 : 0.95}>{valText}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ----------------------------- lever panel -------------------------------- */
function LeverPanel({ model, values, levers, setLevers, onSelect }) {
  const controllable = model.nodes.filter((n) => n.is_controllable);
  const compRule =
    "Modeled composition (a declared assumption): effective_returning_sessions = baseline * (1 + 0.3 * emailCaptureDeltaPct). Modeled effects are assumed multiplicative and independent.";
  return (
    <div className="dts-panel">
      <div className="panel-head">
        <h3>Levers</h3>
        <span className="muted">{controllable.length} controllable inputs
          <span className="info" title={compRule}> &#9432;</span>
        </span>
      </div>
      <p className="muted small" style={{ marginTop: 0 }}>
        Range is 50% to 200% of baseline. Moving a lever recomputes the whole tree.
      </p>
      {controllable.map((n) => {
        const base = n.baseline;
        const min = base * 0.5, max = base * 2;
        const val = levers[n.id] !== undefined ? levers[n.id] : base;
        const effect = hasComputedEffect(model, n.id);
        const step = (max - min) / 200;
        return (
          <div key={n.id} className="lever">
            <div className="lever-row">
              <button className="lever-name" onClick={() => onSelect(n.id)} title="Open inspector">{n.name}</button>
              <span className="lever-val">{formatValue(values[n.id], n.unit)}
                <span className={`lever-delta ${val >= base ? "up" : "down"}`}> {pct(val, base)}</span>
              </span>
            </div>
            <input type="range" min={min} max={max} step={step} value={val}
              onChange={(e) => setLevers({ ...levers, [n.id]: parseFloat(e.target.value) })}
              style={{ accentColor: effect ? "#2563EB" : "#6B7280" }} />
            {!effect && (
              <span className="chip-line">
                <span className="dts-chip" style={{ background: "#37415133", color: "#9CA3AF", border: "1px solid #4B5563" }}>
                  no computed effect (hypothesized edge only)
                </span>
              </span>
            )}
          </div>
        );
      })}
      <button className="btn" onClick={() => setLevers({})}>Reset all levers</button>
    </div>
  );
}

/* ----------------------------- results panel ------------------------------ */
function ResultsPanel({ values, baseline }) {
  const np = DTC_MODEL.nodes.find((n) => n.id === "contribution_profit");
  const profit = values.contribution_profit, profitBase = baseline.contribution_profit;
  const dProfit = profit - profitBase;
  const rows = [
    { id: "net_revenue", name: "Net Revenue", higherBetter: true },
    { id: "variable_costs", name: "Variable Costs", higherBetter: false },
  ];
  const chartData = [
    { name: "Contrib. Profit", baseline: profitBase, current: profit },
    { name: "Net Revenue", baseline: baseline.net_revenue, current: values.net_revenue },
    { name: "Var. Costs", baseline: baseline.variable_costs, current: values.variable_costs },
  ];
  return (
    <div className="dts-panel">
      <div className="panel-head"><h3>Results</h3></div>
      <div className="headline">
        <div className="headline-label">Contribution Profit (north star)</div>
        <div className="headline-num">{formatValue(profit, "currency")}</div>
        <div className={`headline-delta ${dProfit >= 0 ? "up" : "down"}`}>
          {signedValue(dProfit, "currency")} &nbsp;({pct(profit, profitBase)}) vs baseline
        </div>
      </div>
      <div className="result-grid">
        {rows.map((r) => {
          const cur = values[r.id], b = baseline[r.id], d = cur - b;
          const good = r.higherBetter ? d >= 0 : d <= 0;
          return (
            <div key={r.id} className="result-cell">
              <div className="muted small">{r.name}</div>
              <div className="result-num">{formatValue(cur, "currency")}</div>
              <div className={`small ${good ? "up" : "down"}`}>{signedValue(d, "currency")} ({pct(cur, b)})</div>
            </div>
          );
        })}
      </div>
      <div className="chart-legend">
        <span><i style={{ background: "#64748B" }} />Baseline</span>
        <span><i style={{ background: "#2563EB" }} />Current</span>
      </div>
      <div style={{ width: "100%", height: 240 }}>
        <ResponsiveContainer>
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "#94A3B8", fontSize: 10 }} interval={0} />
            <YAxis tick={{ fill: "#94A3B8", fontSize: 10 }} width={48}
              tickFormatter={(v) => "\u20AC" + (v / 1000).toFixed(0) + "k"} />
            <Tooltip
              cursor={{ fill: "rgba(148,163,184,0.08)" }}
              contentStyle={{ background: "#0F172A", border: "1px solid #334155", borderRadius: 8, color: "#E2E8F0" }}
              formatter={(v, key) => [formatValue(v, "currency"), key === "baseline" ? "Baseline" : "Current"]} />
            <Bar dataKey="baseline" fill="#64748B" radius={[3, 3, 0, 0]} />
            <Bar dataKey="current" fill="#2563EB" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ----------------------------- assumptions ledger ------------------------- */
function AssumptionsLedger({ model, open, setOpen }) {
  const nameOf = (id) => model.nodes.find((n) => n.id === id).name;
  const edges = model.edges.filter((e) => e.kind !== "identity");
  return (
    <div className="dts-panel">
      <button className="collapse-head" onClick={() => setOpen(!open)}>
        <h3>Assumptions Ledger</h3>
        <span className="muted">{open ? "\u2212 hide" : "+ show"} ({edges.length} edges)</span>
      </button>
      {open && (
        <div>
          <p className="disclaimer">{LEDGER_DISCLAIMER}</p>
          {edges.map((e, i) => (
            <div key={i} className="ledger-row">
              <div className="ledger-top">
                <span className="ledger-rel">{nameOf(e.parent)} <span className="muted">&#8592;</span> {nameOf(e.child)}</span>
                <span className="badges"><KindBadge kind={e.kind} /><GradeBadge grade={e.evidence_grade} /></span>
              </div>
              <div className="small muted">
                {e.kind === "modeled" && <span>Elasticity {e.elasticity}. {e.mechanism}</span>}
                {e.kind === "hypothesized" && <span>Direction: {e.direction}. {e.rationale}</span>}
              </div>
              {e.evidence_note && <div className="small note">Note: {e.evidence_note}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ----------------------------- methodology note --------------------------- */
function MethodologyNote({ open, setOpen }) {
  return (
    <div className="dts-panel">
      <button className="collapse-head" onClick={() => setOpen(!open)}>
        <h3>Methodology</h3>
        <span className="muted">{open ? "\u2212 hide" : "+ show"}</span>
      </button>
      {open && (
        <div className="method-body">
          <p>{METHODOLOGY[0]}</p>
          <ul>
            <li><b style={{ color: "#60A5FA" }}>Identity:</b> true by definition, computes exactly.</li>
            <li><b style={{ color: "#FBBF24" }}>Modeled:</b> a declared behavioral assumption with an elasticity. Flagged and editable.</li>
            <li><b style={{ color: "#CBD5E1" }}>Hypothesized:</b> a directional belief with no quantification. Not included in computation.</li>
          </ul>
          <p>{METHODOLOGY[4]}</p>
        </div>
      )}
    </div>
  );
}

/* ----------------------------- metric inspector --------------------------- */
function MetricInspector({ node, values, baseline, model, onClose }) {
  if (!node) return null;
  const c = LAYER[node.layer];
  const cur = values[node.id], b = baseline[node.id], d = cur - b;
  const nameOf = (id) => model.nodes.find((n) => n.id === id).name;
  const drivers = model.edges.filter((e) => e.parent === node.id);   // components / drivers
  const feeds = model.edges.filter((e) => e.child === node.id);      // what it feeds

  const EdgeRow = ({ e, dir }) => (
    <div className="insp-edge">
      <div className="insp-edge-top">
        <KindBadge kind={e.kind} />
        <span className="insp-edge-name">
          {dir === "in" ? nameOf(e.child) : nameOf(e.parent)}
          {e.kind === "identity" && e.formula_role && <span className="muted"> ({e.formula_role})</span>}
        </span>
        <GradeBadge grade={e.evidence_grade} />
      </div>
      {e.kind === "modeled" && <div className="small muted">Elasticity {e.elasticity}. {e.mechanism}</div>}
      {e.kind === "hypothesized" && <div className="small muted">Direction: {e.direction}. {e.rationale}</div>}
      {e.evidence_note && <div className="small note">Note: {e.evidence_note}</div>}
    </div>
  );

  return (
    <div className="insp">
      <div className="insp-head">
        <span className="dts-chip" style={{ background: c.fill, color: c.text }}>{c.label}</span>
        <button className="x" onClick={onClose} aria-label="Close">&#10005;</button>
      </div>
      <h2 className="insp-title">{node.name}</h2>
      <p className="insp-def">{node.definition}</p>

      <div className="insp-stats">
        <div><span className="muted small">Current</span><div className="insp-stat">{formatValue(cur, node.unit)}</div></div>
        <div><span className="muted small">Baseline</span><div className="insp-stat">{formatValue(b, node.unit)}</div></div>
        <div><span className="muted small">Delta</span>
          <div className={`insp-stat ${d >= 0 ? "up" : "down"}`}>{signedValue(d, node.unit)} <span className="small">({pct(cur, b)})</span></div>
        </div>
      </div>

      {drivers.length > 0 && (
        <div className="insp-section">
          <div className="insp-section-h">Components / drivers</div>
          {drivers.map((e, i) => <EdgeRow key={i} e={e} dir="in" />)}
        </div>
      )}
      {feeds.length > 0 && (
        <div className="insp-section">
          <div className="insp-section-h">Feeds into</div>
          {feeds.map((e, i) => <EdgeRow key={i} e={e} dir="out" />)}
        </div>
      )}

      <div className="insp-legend">
        <div className="muted small" style={{ marginBottom: 4 }}>Edge kinds</div>
        {Object.entries(EDGE_STYLE).map(([k, s]) => (
          <div key={k} className="insp-legend-row">
            <svg width="34" height="12"><line x1="2" y1="6" x2="32" y2="6" stroke={s.stroke}
              strokeWidth={s.width} strokeDasharray={s.dash === "none" ? undefined : s.dash} strokeLinecap="round" /></svg>
            <span className="small">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------- value of information (prototype) -----------
   Purely additive. Reuses computeValues unchanged: each Monte Carlo sample
   builds a temporary model where the selected edge becomes a modeled edge
   with a sampled elasticity, applies a fixed +20% lever to the child, and
   reads contribution_profit back out. Seeded (mulberry32) for stable reruns.
   ------------------------------------------------------------------------- */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function sampleTriangular(u, low, likely, high) {
  const a = Math.min(low, high), b = Math.max(low, high);
  const c = Math.min(Math.max(likely, a), b);
  if (b - a < 1e-12) return a;
  const fc = (c - a) / (b - a);
  if (u < fc) return a + Math.sqrt(u * (b - a) * (c - a));
  return b - Math.sqrt((1 - u) * (b - a) * (b - c));
}
function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const i = Math.min(sorted.length - 1, Math.max(0, Math.floor(p * (sorted.length - 1))));
  return sorted[i];
}

const VOI_SEED = 0x5eed1234;   // fixed seed -> identical results across reruns
const VOI_RUNS = 2000;
const VOI_CHILD_DELTA = 0.20;  // fixed illustrative +20% change applied to the child
const VOI_BINS = 20;

function ValueOfInformationPanel({ model }) {
  const nodeMap = useMemo(() => Object.fromEntries(model.nodes.map((n) => [n.id, n])), [model]);
  const nameOf = (id) => (nodeMap[id] ? nodeMap[id].name : id);
  const candidateEdges = useMemo(
    () => model.edges.filter((e) => e.kind === "hypothesized" || e.kind === "modeled"),
    [model]
  );
  const keyOf = (e) => `${e.parent}__${e.child}`;

  const [open, setOpen] = useState(false);
  const [edgeKey, setEdgeKey] = useState("conversion_rate__page_load_speed");
  const [low, setLow] = useState(0.05);
  const [likely, setLikely] = useState(0.15);
  const [high, setHigh] = useState(0.40);
  const [form, setForm] = useState("linear");
  const [result, setResult] = useState(null);

  const selEdge = candidateEdges.find((e) => keyOf(e) === edgeKey) || candidateEdges[0];

  function runVoI() {
    const edge = selEdge;
    const childNode = nodeMap[edge.child];
    const childLever = childNode.baseline * (1 + VOI_CHILD_DELTA);
    const rng = mulberry32(VOI_SEED); // re-seed every run

    const samples = new Array(VOI_RUNS);
    for (let i = 0; i < VOI_RUNS; i++) {
      const e = sampleTriangular(rng(), low, likely, high);
      // computeValues applies the LINEAR engine rule (1 + eUsed * childDeltaPct).
      // For diminishing returns we want (1 + e * ln(1 + childDeltaPct)), so we
      // pass an equivalent eUsed and let the existing engine do the rest.
      const eUsed = form === "diminishing"
        ? e * Math.log(1 + VOI_CHILD_DELTA) / VOI_CHILD_DELTA
        : e;
      const tempEdges = model.edges.map((ed) =>
        ed.parent === edge.parent && ed.child === edge.child
          ? { parent: ed.parent, child: ed.child, kind: "modeled", elasticity: eUsed, mechanism: "voi_temp", evidence_grade: "illustrative" }
          : ed
      );
      const vals = computeValues({ ...model, edges: tempEdges }, { [edge.child]: childLever });
      samples[i] = vals.contribution_profit;
    }

    const sorted = [...samples].sort((x, y) => x - y);
    const min = sorted[0], max = sorted[sorted.length - 1];
    let hist;
    if (max - min < 1e-6) {
      hist = [{ label: formatValue(min, "currency"), count: VOI_RUNS }];
    } else {
      const w = (max - min) / VOI_BINS;
      const counts = new Array(VOI_BINS).fill(0);
      for (const v of samples) {
        let bi = Math.floor((v - min) / w);
        if (bi >= VOI_BINS) bi = VOI_BINS - 1;
        if (bi < 0) bi = 0;
        counts[bi]++;
      }
      hist = counts.map((c, i) => ({ label: formatValue(min + w * (i + 0.5), "currency"), count: c }));
    }

    setResult({
      p10: percentile(sorted, 0.10),
      p50: percentile(sorted, 0.50),
      p90: percentile(sorted, 0.90),
      hist,
      childName: nameOf(edge.child),
    });
  }

  return (
    <div className="dts-panel">
      <style>{VOI_CSS}</style>
      <button className="collapse-head" onClick={() => setOpen(!open)}>
        <h3>Value of Information (prototype)</h3>
        <span className="muted">{open ? "\u2212 hide" : "+ show"}</span>
      </button>

      {open && (
        <div className="voi-body">
          <label className="voi-field">
            <span className="voi-label">Edge to interrogate</span>
            <select className="voi-input" value={edgeKey}
              onChange={(e) => { setEdgeKey(e.target.value); setResult(null); }}>
              {candidateEdges.map((e) => (
                <option key={keyOf(e)} value={keyOf(e)}>
                  {nameOf(e.parent)} {"\u2190"} {nameOf(e.child)} ({e.kind})
                </option>
              ))}
            </select>
          </label>

          <span className="voi-label">Elasticity guess (triangular: low / likely / high)</span>
          <div className="voi-grid3">
            <input className="voi-input" type="number" step="0.01" value={low}
              onChange={(e) => setLow(parseFloat(e.target.value) || 0)} aria-label="low" />
            <input className="voi-input" type="number" step="0.01" value={likely}
              onChange={(e) => setLikely(parseFloat(e.target.value) || 0)} aria-label="likely" />
            <input className="voi-input" type="number" step="0.01" value={high}
              onChange={(e) => setHigh(parseFloat(e.target.value) || 0)} aria-label="high" />
          </div>

          <label className="voi-field" style={{ marginTop: 10 }}>
            <span className="voi-label">Functional form</span>
            <select className="voi-input" value={form} onChange={(e) => setForm(e.target.value)}>
              <option value="linear">linear</option>
              <option value="diminishing">diminishing returns (logarithmic)</option>
            </select>
          </label>

          <p className="voi-guess-note">You are quantifying a belief you have not tested. These numbers are a guess.</p>

          <button className="btn voi-run" onClick={runVoI}>Run value-of-information</button>

          <p className="muted small voi-fixed">
            The simulation applies a fixed illustrative +20% change to {selEdge ? nameOf(selEdge.child) : ""} (the child),
            then draws {VOI_RUNS.toLocaleString()} elasticity samples from your triangular guess and recomputes Contribution Profit each time.
          </p>

          <div className="voi-caveat">
            This interval is the uncertainty in your GUESS, not evidence. A distribution looks like data and is not.
            Its only purpose is to help you decide what to test, never to estimate impact.
          </div>

          {result && (
            <div className="voi-result">
              <div className="voi-chart">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={result.hist} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "#94A3B8", fontSize: 9 }} interval={3} />
                    <YAxis tick={{ fill: "#94A3B8", fontSize: 9 }} width={34} />
                    <Tooltip
                      cursor={{ fill: "rgba(139,92,246,0.12)" }}
                      contentStyle={{ background: "#0F172A", border: "1px solid #334155", borderRadius: 8, color: "#E2E8F0" }}
                      formatter={(v) => [v, "samples"]} />
                    <Bar dataKey="count" fill="#8B5CF6" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="voi-badges">
                <span className="voi-pbadge"><b>P10</b>{formatValue(result.p10, "currency")}</span>
                <span className="voi-pbadge"><b>P50</b>{formatValue(result.p50, "currency")}</span>
                <span className="voi-pbadge"><b>P90</b>{formatValue(result.p90, "currency")}</span>
              </div>

              <p className="voi-headline">
                If your guess is right, a +20% change in {result.childName} moves Contribution Profit across this range.
              </p>
              <p className="voi-voiline">
                The wider this range and the larger the swing, the more this guess is worth testing before you act on it.
              </p>
              <p className="voi-priority">
                Priority to test = size of this swing divided by how hard the test is. High swing plus cheap test means test it first.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const VOI_CSS = `
.voi-body{margin-top:12px;}
.voi-field{display:block;margin-bottom:10px;}
.voi-label{display:block;font-size:11px;color:#94A3B8;margin-bottom:5px;font-weight:600;}
.voi-input{width:100%;background:#0F172A;color:#E2E8F0;border:1px solid #334155;border-radius:8px;
  padding:8px 10px;font-size:13px;font-family:inherit;}
.voi-input:focus{outline:none;border-color:#8B5CF6;}
.voi-grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;}
.voi-guess-note{font-size:12px;color:#CBD5E1;font-style:italic;margin:10px 0 12px;}
.voi-run{margin-top:0;background:#7C3AED;border-color:#8B5CF6;}
.voi-run:hover{background:#8B5CF6;}
.voi-fixed{margin:10px 0 0;line-height:1.5;}
.voi-result{margin-top:14px;}
.voi-chart{background:#0F172A;border:1px solid #334155;border-radius:10px;padding:10px 8px 4px;}
.voi-badges{display:flex;gap:10px;margin:12px 0;flex-wrap:wrap;}
.voi-pbadge{background:#1E1B33;border:1px solid #6D28D9;color:#C4B5FD;border-radius:10px;
  padding:7px 13px;font-size:14px;font-weight:700;display:flex;flex-direction:column;line-height:1.25;}
.voi-pbadge b{font-size:10px;color:#A78BFA;letter-spacing:1px;font-weight:800;}
.voi-headline{font-size:14px;font-weight:700;color:#E2E8F0;margin:12px 0 6px;line-height:1.45;}
.voi-voiline{font-size:12.5px;color:#CBD5E1;margin:0 0 4px;line-height:1.5;}
.voi-caveat{background:#3f1d1d;border:1px solid #b91c1c;color:#FCA5A5;border-radius:10px;
  padding:12px 14px;font-size:12.5px;line-height:1.55;font-weight:600;margin:14px 0;}
.voi-priority{font-size:12px;color:#94A3B8;margin:12px 0 0;line-height:1.5;
  border-top:1px solid #2b3a52;padding-top:10px;}
@media(max-width:540px){.voi-grid3{grid-template-columns:1fr;}}
`;

/* ----------------------------- root --------------------------------------- */
export default function MetricDriverTreeStudio() {
  const model = DTC_MODEL;
  const [levers, setLevers] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [methodOpen, setMethodOpen] = useState(true);

  const nodeMap = useMemo(() => Object.fromEntries(model.nodes.map((n) => [n.id, n])), [model]);
  const baseline = useMemo(() => computeValues(model, {}), [model]);
  const values = useMemo(() => computeValues(model, levers), [model, levers]);

  // one-time identity reconciliation on load
  const [reconciled] = useState(() => {
    const base = computeValues(model, {});
    const target = model.nodes.find((n) => n.id === model.north_star_id).baseline;
    return { ok: Math.abs(base[model.north_star_id] - target) < 1e-6, value: base[model.north_star_id], target };
  });

  // useEffect: close inspector on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setSelectedId(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const selectedNode = selectedId ? nodeMap[selectedId] : null;

  return (
    <div className="dts-root">
      <style>{CSS}</style>

      <header className="dts-header">
        <div>
          <h1>Metric Driver-Tree Studio</h1>
          <p className="subtitle">
            Separating what is true by definition (identity), what is a declared assumption (modeled),
            and what is an untested belief (hypothesized). A thinking aid for metric design, not an econometric oracle.
          </p>
        </div>
        <div className={`recon ${reconciled.ok ? "ok" : "bad"}`}>
          {reconciled.ok ? "\u2713" : "\u2717"} Identity reconciled
          <span className="recon-sub">computed = {formatValue(reconciled.value, "currency")} = baseline</span>
        </div>
      </header>

      <div className="demo-note">
        Illustrative DTC e-commerce model. Numbers are placeholders, not estimated from data.
      </div>

      {/* TREE */}
      <div className="dts-panel">
        <div className="panel-head"><h3>Driver Tree</h3><span className="muted small">click any node to inspect</span></div>
        <div className="tree-legends">
          <div className="legend-block">
            {Object.entries(LAYER).map(([k, l]) => (
              <span key={k} className="legend-item">
                <i className="swatch" style={{ background: l.fill, border: k === "input" ? "1px solid #94A3B8" : "none" }} />
                {l.label}
              </span>
            ))}
          </div>
          <div className="legend-block">
            {Object.entries(EDGE_STYLE).map(([k, s]) => (
              <span key={k} className="legend-item">
                <svg width="30" height="10"><line x1="2" y1="5" x2="28" y2="5" stroke={s.stroke}
                  strokeWidth={s.width} strokeDasharray={s.dash === "none" ? undefined : s.dash} strokeLinecap="round" /></svg>
                {k}{k === "hypothesized" ? " (?)" : ""}
              </span>
            ))}
          </div>
        </div>
        <Tree model={model} values={values} selectedId={selectedId} onSelect={setSelectedId} />
        <p className="muted small caption">
          Edges flow child to parent, bottom-up toward the north star. Guardrails are monitored, not part of the profit identity.
        </p>
      </div>

      {/* LEVERS + RESULTS */}
      <div className="dts-grid">
        <LeverPanel model={model} values={values} levers={levers} setLevers={setLevers} onSelect={setSelectedId} />
        <ResultsPanel values={values} baseline={baseline} />
      </div>

      <AssumptionsLedger model={model} open={ledgerOpen} setOpen={setLedgerOpen} />
      <ValueOfInformationPanel model={model} />
      <MethodologyNote open={methodOpen} setOpen={setMethodOpen} />

      {/* inspector drawer */}
      <div className={`dts-backdrop ${selectedNode ? "open" : ""}`} onClick={() => setSelectedId(null)} />
      <div className={`dts-drawer ${selectedNode ? "open" : ""}`}>
        {selectedNode && (
          <MetricInspector node={selectedNode} values={values} baseline={baseline} model={model} onClose={() => setSelectedId(null)} />
        )}
      </div>
    </div>
  );
}

/* ----------------------------- styles ------------------------------------- */
const CSS = `
.dts-root{background:#0F172A;color:#E2E8F0;min-height:100vh;padding:20px;
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  max-width:1280px;margin:0 auto;box-sizing:border-box;}
.dts-root *{box-sizing:border-box;}
h1{font-size:22px;margin:0 0 6px;font-weight:800;letter-spacing:-0.3px;}
h3{font-size:14px;margin:0;font-weight:700;letter-spacing:0.2px;}
.subtitle{margin:0;color:#94A3B8;font-size:12.5px;max-width:640px;line-height:1.5;}
.dts-header{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;margin-bottom:12px;}
.recon{font-size:12px;font-weight:700;padding:8px 12px;border-radius:10px;display:flex;flex-direction:column;gap:2px;white-space:nowrap;}
.recon.ok{background:#052e1f;color:#6EE7B7;border:1px solid #065f46;}
.recon.bad{background:#3f1d1d;color:#FCA5A5;border:1px solid #7f1d1d;}
.recon-sub{font-weight:500;font-size:11px;opacity:0.85;}
.demo-note{font-size:11.5px;color:#FBBF24;background:#78350f33;border:1px solid #78350f;
  padding:7px 12px;border-radius:8px;margin-bottom:16px;}
.dts-panel{background:#1E293B;border:1px solid #334155;border-radius:12px;padding:16px;margin-bottom:16px;}
.panel-head{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px;gap:8px;}
.muted{color:#94A3B8;}
.small{font-size:11.5px;}
.caption{margin:8px 0 0;}
.info{cursor:help;color:#60A5FA;}
.dts-grid{display:grid;grid-template-columns:1.05fr 1fr;gap:16px;}
@media(max-width:880px){.dts-grid{grid-template-columns:1fr;}}

/* tree */
.tree-legends{display:flex;flex-wrap:wrap;gap:14px 22px;margin-bottom:10px;}
.legend-block{display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center;}
.legend-item{display:inline-flex;align-items:center;gap:6px;font-size:11px;color:#CBD5E1;}
.swatch{width:12px;height:12px;border-radius:3px;display:inline-block;}
.tree-scroll{overflow-x:auto;}
.tree-svg{width:100%;min-width:760px;height:auto;display:block;}
.tree-node rect{transition:stroke .15s ease;}
.tree-node:hover rect{stroke:#FBBF24;stroke-width:2;}

/* lever */
.lever{padding:9px 0;border-bottom:1px solid #2b3a52;}
.lever:last-of-type{border-bottom:none;}
.lever-row{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:5px;}
.lever-name{background:none;border:none;color:#E2E8F0;font-size:12.5px;font-weight:600;
  cursor:pointer;padding:0;text-align:left;}
.lever-name:hover{color:#60A5FA;text-decoration:underline;}
.lever-val{font-size:12.5px;font-weight:700;white-space:nowrap;}
.lever-delta{font-size:11px;font-weight:600;margin-left:4px;}
.up{color:#6EE7B7;} .down{color:#FCA5A5;}
input[type=range]{width:100%;height:5px;cursor:pointer;}
.chip-line{display:block;margin-top:6px;}
.dts-chip{display:inline-block;font-size:10px;font-weight:700;padding:2px 7px;border-radius:999px;
  text-transform:lowercase;letter-spacing:0.2px;}
.btn{margin-top:14px;background:#334155;color:#E2E8F0;border:1px solid #475569;border-radius:8px;
  padding:8px 14px;font-size:12px;font-weight:600;cursor:pointer;transition:background .15s ease;}
.btn:hover{background:#475569;}

/* results */
.headline{margin-bottom:14px;}
.headline-label{font-size:11.5px;color:#94A3B8;}
.headline-num{font-size:34px;font-weight:800;letter-spacing:-1px;line-height:1.1;}
.headline-delta{font-size:13px;font-weight:600;}
.result-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;}
.result-cell{background:#0F172A;border:1px solid #334155;border-radius:8px;padding:10px;}
.result-num{font-size:18px;font-weight:700;margin:2px 0;}
.chart-legend{display:flex;gap:16px;font-size:11px;color:#CBD5E1;margin-bottom:6px;}
.chart-legend span{display:inline-flex;align-items:center;gap:6px;}
.chart-legend i{width:11px;height:11px;border-radius:2px;display:inline-block;}

/* ledger + methodology */
.collapse-head{width:100%;background:none;border:none;color:#E2E8F0;cursor:pointer;
  display:flex;justify-content:space-between;align-items:center;padding:0;}
.disclaimer{font-size:12px;color:#FCD34D;background:#78350f22;border:1px solid #78350f;
  padding:8px 11px;border-radius:8px;margin:12px 0;line-height:1.45;}
.ledger-row{border-top:1px solid #2b3a52;padding:10px 0;}
.ledger-top{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px;}
.ledger-rel{font-size:13px;font-weight:600;}
.badges{display:inline-flex;gap:6px;flex-wrap:wrap;}
.note{color:#FCD34D;margin-top:3px;}
.method-body{margin-top:10px;font-size:12.5px;line-height:1.55;color:#CBD5E1;}
.method-body ul{margin:8px 0;padding-left:18px;}
.method-body li{margin:4px 0;}

/* inspector drawer */
.dts-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.55);opacity:0;pointer-events:none;
  transition:opacity .28s ease;z-index:40;}
.dts-backdrop.open{opacity:1;pointer-events:auto;}
.dts-drawer{position:fixed;top:0;right:0;height:100%;width:min(400px,92vw);background:#0F172A;
  border-left:1px solid #334155;transform:translateX(101%);transition:transform .28s ease;
  z-index:50;overflow-y:auto;padding:18px;}
.dts-drawer.open{transform:translateX(0);box-shadow:-12px 0 40px rgba(0,0,0,0.5);}
.insp-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;}
.x{background:none;border:none;color:#94A3B8;font-size:16px;cursor:pointer;}
.x:hover{color:#E2E8F0;}
.insp-title{font-size:18px;margin:0 0 8px;font-weight:800;}
.insp-def{font-size:12.5px;color:#CBD5E1;line-height:1.55;margin:0 0 14px;}
.insp-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px;}
.insp-stats>div{background:#1E293B;border:1px solid #334155;border-radius:8px;padding:8px;}
.insp-stat{font-size:15px;font-weight:700;}
.insp-section{margin-bottom:14px;}
.insp-section-h{font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;
  letter-spacing:0.6px;margin-bottom:6px;}
.insp-edge{background:#1E293B;border:1px solid #334155;border-radius:8px;padding:9px;margin-bottom:7px;}
.insp-edge-top{display:flex;align-items:center;gap:7px;margin-bottom:4px;flex-wrap:wrap;}
.insp-edge-name{font-size:12.5px;font-weight:600;}
.insp-legend{border-top:1px solid #2b3a52;padding-top:10px;}
.insp-legend-row{display:flex;align-items:center;gap:8px;margin:3px 0;color:#CBD5E1;}
`;
