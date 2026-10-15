/**
 * Analyst-stack export bridge (ADR-0010 P4): turn a validated BusinessModel into
 *  - a KPI definition table (CSV),
 *  - SQL: a kpi_definitions table + a kpi_tree view that recomputes every identity metric
 *    from a long-format kpi_inputs(period, metric_id, value) table,
 *  - Power BI DAX measures for the same identities.
 *
 * Only IDENTITY edges become SQL/DAX formulas: they are definitions. Modeled and hypothesized
 * edges are assumptions and are exported as documentation columns, never as calculations.
 */
import labelsDe from "../content/labels_de.json";
import { buildGraph, topoOrder } from "../engine/graph.js";
import { identityEdgesToFormula } from "./formulaDisplay.js";
import type { BusinessModel, MetricEdge, MetricNode } from "../schema/types.js";

const DE: Record<string, string> = labelsDe.labels;

export function germanLabel(id: string): string | undefined {
  return DE[id];
}

function csvCell(v: string | number | boolean): string {
  const s = String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function assumptionText(e: MetricEdge): string {
  const grade = e.evidence_grade ?? "none";
  if (e.kind === "modeled") return `${e.child} (modeled, elasticity ${e.elasticity ?? "range"}, grade ${grade})`;
  return `${e.child} (hypothesized ${e.direction ?? "unclear"}, grade ${grade})`;
}

const KPI_COLUMNS = [
  "metric_id", "name", "name_de", "definition", "unit", "layer", "formula", "assumptions",
  "baseline", "is_controllable", "owner", "business_function", "data_source",
  "warehouse_table", "calculation_grain", "update_frequency", "dimensions",
] as const;

export function kpiRows(model: BusinessModel): Array<Record<(typeof KPI_COLUMNS)[number], string | number | boolean>> {
  const { incomingOf } = buildGraph(model);
  return model.nodes.map((n) => {
    const incoming = incomingOf.get(n.id) ?? [];
    const identity = incoming.filter((e) => e.kind === "identity");
    const assumptions = incoming.filter((e) => e.kind !== "identity");
    return {
      metric_id: n.id,
      name: n.name,
      name_de: DE[n.id] ?? "",
      definition: n.definition,
      unit: n.unit,
      layer: n.layer,
      formula: identity.length ? identityEdgesToFormula(n.id, model.edges) : "",
      assumptions: assumptions.map(assumptionText).join("; "),
      baseline: n.baseline,
      is_controllable: n.is_controllable,
      owner: n.governance.owner,
      business_function: n.governance.business_function,
      data_source: n.governance.data_source,
      warehouse_table: n.governance.warehouse_table,
      calculation_grain: n.governance.calculation_grain,
      update_frequency: n.governance.update_frequency,
      dimensions: n.governance.dimensions.join("|"),
    };
  });
}

export function kpiDefinitionsCsv(model: BusinessModel): string {
  const rows = kpiRows(model);
  return [KPI_COLUMNS.join(","), ...rows.map((r) => KPI_COLUMNS.map((c) => csvCell(r[c])).join(","))].join("\n") + "\n";
}

const sqlStr = (s: string) => `'${s.replace(/'/g, "''")}'`;
const isId = (s: string) => /^[a-z_][a-z0-9_]*$/.test(s);

function assertSqlSafe(model: BusinessModel): void {
  const bad = model.nodes.find((n) => !isId(n.id));
  if (bad) throw new Error(`metric id '${bad.id}' is not a safe SQL/DAX identifier (use snake_case)`);
}

/**
 * Render an identity parent with the engine's formula_role semantics (compute.ts):
 * product of factors, plus addends minus subtrahends, then divided by each divisor.
 */
function composeIdentity(
  parent: string,
  edges: MetricEdge[],
  ref: (id: string) => string,
  divide: (num: string, den: string) => string,
): string {
  const ids = edges.filter((e) => e.parent === parent && e.kind === "identity");
  const by = (role: string) => ids.filter((e) => e.formula_role === role).map((e) => ref(e.child));
  let expr = by("factor").join(" * ");
  const add = by("addend");
  const sub = by("subtrahend");
  if (add.length || sub.length) {
    const sum = [add.join(" + "), ...sub.map((x) => `- ${x}`)].filter(Boolean).join(" ");
    expr = expr ? `${expr} + ${sum}` : sum;
  }
  for (const d of by("divisor")) expr = divide(expr || "1", d);
  return expr;
}

const sqlIdentity = (parent: string, edges: MetricEdge[]) =>
  composeIdentity(parent, edges, (id) => id, (num, den) => `(${num}) / NULLIF(${den}, 0)`);

/** Group identity parents into dependency levels so each CTE only uses earlier columns. */
function identityLevels(model: BusinessModel): string[][] {
  const order = topoOrder(model);
  const isParent = new Set(model.edges.filter((e) => e.kind === "identity").map((e) => e.parent));
  const level = new Map<string, number>();
  for (const id of order) {
    const kids = model.edges.filter((e) => e.parent === id && e.kind === "identity").map((e) => level.get(e.child) ?? 0);
    level.set(id, isParent.has(id) ? Math.max(0, ...kids) + 1 : 0);
  }
  const levels: string[][] = [];
  for (const id of order) {
    const l = level.get(id) ?? 0;
    if (l > 0) (levels[l - 1] ??= []).push(id);
  }
  return levels;
}

function inputIds(model: BusinessModel): string[] {
  const isParent = new Set(model.edges.filter((e) => e.kind === "identity").map((e) => e.parent));
  return topoOrder(model).filter((id) => !isParent.has(id));
}

export function kpiSql(model: BusinessModel): string {
  assertSqlSafe(model);
  const rows = kpiRows(model);
  const lines: string[] = [
    `-- Generated by Metric Driver-Tree Studio from model '${model.id}'. ANSI SQL (tested shape: PostgreSQL / DuckDB).`,
    "-- Identity edges become formulas. Modeled and hypothesized edges are ASSUMPTIONS and are",
    "-- documented in kpi_definitions.assumptions, never computed here.",
    "",
    "CREATE TABLE kpi_definitions (",
    "  metric_id VARCHAR PRIMARY KEY, name VARCHAR, name_de VARCHAR, definition VARCHAR, unit VARCHAR,",
    "  layer VARCHAR, formula VARCHAR, assumptions VARCHAR, baseline DOUBLE PRECISION, is_controllable BOOLEAN,",
    "  owner VARCHAR, business_function VARCHAR, data_source VARCHAR, warehouse_table VARCHAR,",
    "  calculation_grain VARCHAR, update_frequency VARCHAR, dimensions VARCHAR",
    ");",
    "",
    "INSERT INTO kpi_definitions VALUES",
    rows
      .map(
        (r) =>
          "  (" +
          KPI_COLUMNS.map((c) => (typeof r[c] === "number" ? String(r[c]) : typeof r[c] === "boolean" ? (r[c] ? "TRUE" : "FALSE") : sqlStr(String(r[c])))).join(", ") +
          ")",
      )
      .join(",\n") + ";",
    "",
    "-- Long-format inputs, one row per period and input metric (load from your warehouse).",
    "CREATE TABLE kpi_inputs (period DATE NOT NULL, metric_id VARCHAR NOT NULL, value DOUBLE PRECISION, PRIMARY KEY (period, metric_id));",
    "",
    "CREATE VIEW kpi_tree AS",
    "WITH inputs AS (",
    "  SELECT period,",
    inputIds(model).map((id) => `    MAX(CASE WHEN metric_id = ${sqlStr(id)} THEN value END) AS ${id}`).join(",\n"),
    "  FROM kpi_inputs",
    "  GROUP BY period",
    ")",
  ];
  const levels = identityLevels(model);
  levels.forEach((ids, i) => {
    const prev = i === 0 ? "inputs" : `level_${i}`;
    lines.push(`, level_${i + 1} AS (`, `  SELECT ${prev}.*,`);
    lines.push(ids.map((id) => `    ${sqlIdentity(id, model.edges)} AS ${id}`).join(",\n"));
    lines.push(`  FROM ${prev}`, ")");
  });
  lines.push(`SELECT * FROM level_${levels.length};`, "");
  return lines.join("\n");
}

function measureName(n: MetricNode): string {
  return n.name.replace(/[[\]]/g, "");
}

/** Leaves: counts sum, everything else (rates, per-order €, durations) averages, unless overridden. */
function leafAggregation(n: MetricNode): "SUM" | "AVERAGE" {
  if (n.aggregation) return n.aggregation === "sum" ? "SUM" : "AVERAGE";
  return n.unit === "count" ? "SUM" : "AVERAGE";
}

/** Identity parents that are totals (count/€ without a divisor) are summed period by period. */
function isAdditiveParent(n: MetricNode, edges: MetricEdge[]): boolean {
  if (n.aggregation) return n.aggregation === "sum";
  const hasDivisor = edges.some((e) => e.parent === n.id && e.kind === "identity" && e.formula_role === "divisor");
  return (n.unit === "count" || n.unit === "currency") && !hasDivisor;
}

function daxIdentity(parent: string, model: BusinessModel): string {
  const ref = (id: string) => `[${measureName(model.nodes.find((n) => n.id === id) as MetricNode)}]`;
  return composeIdentity(parent, model.edges, ref, (num, den) => `DIVIDE(${num}, ${den})`);
}

export function daxMeasures(model: BusinessModel): string {
  assertSqlSafe(model);
  const isParent = new Set(model.edges.filter((e) => e.kind === "identity").map((e) => e.parent));
  const out: string[] = [
    `// Generated by Metric Driver-Tree Studio from model '${model.id}'.`,
    "// Table: kpi_inputs[period, metric_id, value] (long format, one row per period and input).",
    "// Inputs: counts SUM; rates and per-unit values AVERAGE (unweighted: read them per period).",
    "// Total-type identity parents (count/EUR, no divisor) iterate periods (SUMX) so multi-period totals stay exact.",
    "// Modeled / hypothesized edges are assumptions: they are NOT measures.",
    "",
  ];
  for (const id of topoOrder(model)) {
    const n = model.nodes.find((x) => x.id === id) as MetricNode;
    const de = DE[id] ? ` (${DE[id]})` : "";
    out.push(`// ${n.definition}${de}`);
    if (!isParent.has(id)) {
      out.push(`${measureName(n)} = CALCULATE(${leafAggregation(n)}('kpi_inputs'[value]), 'kpi_inputs'[metric_id] = "${id}")`);
    } else if (isAdditiveParent(n, model.edges)) {
      out.push(`${measureName(n)} = SUMX(VALUES('kpi_inputs'[period]), ${daxIdentity(id, model)})`);
    } else {
      out.push(`${measureName(n)} = ${daxIdentity(id, model)}`);
    }
    out.push("");
  }
  return out.join("\n");
}
