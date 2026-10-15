import { describe, expect, it } from "vitest";
import seed from "../../src/content/dtc_ecommerce.json";
import { computeBaseline } from "../../src/engine/compute.js";
import { parseCsv } from "../../src/lib/csv.js";
import { daxMeasures, germanLabel, kpiDefinitionsCsv, kpiRows, kpiSql } from "../../src/lib/exporters.js";
import type { BusinessModel } from "../../src/schema/types.js";

const dtc = seed as unknown as BusinessModel;

/**
 * Minimal evaluator for the generated kpi_tree view: runs each CTE's expressions over the
 * seed baselines (only + - * / NULLIF and identifiers are emitted), then compares with the engine.
 */
function evaluateSqlView(sql: string, inputs: Record<string, number>): Record<string, number> {
  const env: Record<string, number> = { ...inputs };
  const exprLines = [...sql.matchAll(/^ {4}(.+) AS ([a-z_]+),?$/gm)].filter((m) => !m[1]!.startsWith("MAX("));
  for (const m of exprLines) {
    const js = m[1]!.replace(/NULLIF\(([a-z_]+), 0\)/g, "$1").replace(/[a-z_]+/g, (id) => `env.${id}`);
    env[m[2]!] = Function("env", `return ${js};`)(env) as number;
  }
  return env;
}

describe("export bridge", () => {
  it("KPI CSV has one row per metric with formulas only for identities", () => {
    const t = parseCsv(kpiDefinitionsCsv(dtc));
    expect(t.rows).toHaveLength(dtc.nodes.length);
    const rows = kpiRows(dtc);
    const byId = Object.fromEntries(rows.map((r) => [r.metric_id, r]));
    expect(byId["contribution_profit"]?.formula).toBe("contribution_profit = net_revenue - variable_costs");
    expect(byId["contribution_profit"]?.name_de).toBe("Deckungsbeitrag");
    expect(byId["average_order_value"]?.formula).toBe("");
    expect(byId["product_view_rate"]?.assumptions).toContain("page_load_speed (modeled");
    expect(byId["customer_ltv"]?.assumptions).toContain("hypothesized");
  });

  it("SQL view recomputes every identity metric to the engine's baseline (rel err < 1e-6)", () => {
    const sql = kpiSql(dtc);
    expect(sql).toContain("CREATE VIEW kpi_tree AS");
    expect(sql).not.toMatch(/page_load_speed \*/);
    const inputs = Object.fromEntries(dtc.nodes.map((n) => [n.id, n.baseline]));
    const env = evaluateSqlView(sql, inputs);
    const engine = computeBaseline(dtc);
    for (const id of ["conversion_rate", "sessions", "orders", "net_revenue", "variable_costs", "contribution_profit"]) {
      expect(Math.abs((env[id] as number) - (engine[id] as number)) / Math.max(1, Math.abs(engine[id] as number))).toBeLessThan(1e-6);
    }
  });

  it("SQL escapes quotes and rejects unsafe identifiers", () => {
    const quoted = { ...dtc, nodes: dtc.nodes.map((n) => (n.id === "orders" ? { ...n, definition: "Rafael's orders" } : n)) };
    expect(kpiSql(quoted)).toContain("'Rafael''s orders'");
    const unsafe = { ...dtc, nodes: [...dtc.nodes, { ...dtc.nodes[0]!, id: "x; DROP TABLE y" }] };
    expect(() => kpiSql(unsafe)).toThrow(/safe SQL/);
  });

  it("DAX: SUM/AVERAGE inputs by unit, SUMX for additive identities, DIVIDE-free seed, no assumption measures", () => {
    const dax = daxMeasures(dtc);
    expect(dax).toContain(`New Sessions = CALCULATE(SUM('kpi_inputs'[value]), 'kpi_inputs'[metric_id] = "new_sessions")`);
    expect(dax).toContain(`Add to Cart Rate = CALCULATE(AVERAGE('kpi_inputs'[value]), 'kpi_inputs'[metric_id] = "add_to_cart_rate")`);
    expect(dax).toContain("Contribution Profit = SUMX(VALUES('kpi_inputs'[period]), [Net Revenue] - [Variable Costs])");
    expect(dax).toContain("Conversion Rate = [Product View Rate] * [Add to Cart Rate] * [Checkout Start Rate] * [Purchase Completion Rate]");
    expect(dax).toContain(`Average Order Value = CALCULATE(AVERAGE('kpi_inputs'[value]), 'kpi_inputs'[metric_id] = "average_order_value")`);
    expect(dax).toContain("Orders = SUMX(VALUES('kpi_inputs'[period]), [Sessions] * [Conversion Rate])");
    expect(dax).toContain("(Deckungsbeitrag)");
    expect(dax.match(/^[A-Z][^=\n]* = /gm)).toHaveLength(dtc.nodes.length);
  });

  it("divisor identities render as NULLIF / DIVIDE", () => {
    const m: BusinessModel = {
      ...dtc,
      edges: [
        ...dtc.edges.filter((e) => e.parent !== "average_order_value"),
        { parent: "average_order_value", child: "net_revenue", kind: "identity", formula_role: "factor" },
      ],
    };
    const ratio: BusinessModel = {
      ...m,
      edges: [...m.edges.filter((e) => !(e.parent === "average_order_value")), { parent: "average_order_value", child: "orders", kind: "identity", formula_role: "divisor" }],
    };
    expect(kpiSql({ ...ratio, edges: ratio.edges.filter((e) => e.parent !== "net_revenue") })).toContain("NULLIF(orders, 0)");
    expect(germanLabel("unknown")).toBeUndefined();
  });
});
