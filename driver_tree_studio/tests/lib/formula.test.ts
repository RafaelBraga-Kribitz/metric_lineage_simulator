import { describe, it, expect } from "vitest";
import { parseFormula } from "../../src/lib/formula.js";
import type { MetricNode } from "../../src/schema/types.js";

describe("parseFormula", () => {
  it("produces factor edges for multiplication", () => {
    const { newEdges } = parseFormula("net_revenue = orders * average_order_value", []);
    expect(newEdges).toHaveLength(2);
    expect(newEdges.every((e) => e.kind === "identity")).toBe(true);
    expect(newEdges.map((e) => e.formula_role)).toEqual(["factor", "factor"]);
    expect(newEdges.map((e) => e.child).sort()).toEqual(["average_order_value", "orders"]);
    expect(new Set(newEdges.map((e) => e.parent))).toEqual(new Set(["net_revenue"]));
  });

  it("maps + and - to addend and subtrahend", () => {
    const { newEdges } = parseFormula("profit = revenue - cost", []);
    const byChild = Object.fromEntries(newEdges.map((e) => [e.child, e.formula_role]));
    expect(byChild["revenue"]).toBe("addend");
    expect(byChild["cost"]).toBe("subtrahend");
  });

  it("maps / to divisor", () => {
    const { newEdges } = parseFormula("rate = numerator / denominator", []);
    const roles = Object.fromEntries(newEdges.map((e) => [e.child, e.formula_role]));
    expect(roles["denominator"]).toBe("divisor");
  });

  it("creates stub nodes for unknown ids", () => {
    const existing: MetricNode[] = [];
    const { newNodes } = parseFormula("y = a * b", existing);
    const ids = newNodes.map((n) => n.id).sort();
    expect(ids).toEqual(["a", "b", "y"]);
  });

  it("does not create stubs for known ids", () => {
    const existing: MetricNode[] = [
      {
        id: "a",
        name: "a",
        definition: "",
        unit: "count",
        layer: "input",
        baseline: 0,
        is_controllable: false,
        governance: {
          owner: "",
          business_function: "",
          data_source: "",
          warehouse_table: "",
          calculation_grain: "",
          update_frequency: "",
          dimensions: [],
        },
      },
    ];
    const { newNodes } = parseFormula("y = a * b", existing);
    expect(newNodes.map((n) => n.id).sort()).toEqual(["b", "y"]);
  });

  it("respects parens for grouping", () => {
    const { newEdges } = parseFormula("z = (a + b) * c", []);
    // parenthesized group becomes a factor with both a and b under that role
    const roles = newEdges.map((e) => ({ child: e.child, role: e.formula_role }));
    expect(roles).toContainEqual({ child: "a", role: "factor" });
    expect(roles).toContainEqual({ child: "b", role: "factor" });
    expect(roles).toContainEqual({ child: "c", role: "factor" });
  });
});
