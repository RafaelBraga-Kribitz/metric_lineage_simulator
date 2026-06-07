import { describe, it, expect } from "vitest";
import seed from "../../src/content/dtc_ecommerce.json";
import { validate } from "../../src/schema/validate.js";
import type { BusinessModel, MetricEdge } from "../../src/schema/types.js";

function clone(): BusinessModel {
  return JSON.parse(JSON.stringify(seed)) as BusinessModel;
}

describe("validate", () => {
  it("passes on the DTC seed", () => {
    expect(validate(clone()).valid).toBe(true);
  });

  it("catches missing edge endpoint", () => {
    const m = clone();
    m.edges.push({ parent: "ghost", child: "orders", kind: "identity", formula_role: "addend" });
    const r = validate(m);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes("[edge-ref]"))).toBe(true);
  });

  it("catches cycles", () => {
    const m = clone();
    m.edges.push({ parent: "new_sessions", child: "contribution_profit", kind: "identity", formula_role: "factor" });
    const r = validate(m);
    expect(r.errors.some((e) => e.includes("[dag]"))).toBe(true);
  });

  it("requires exactly one north_star", () => {
    const m = clone();
    const nr = m.nodes.find((n) => n.id === "net_revenue");
    if (nr) nr.layer = "north_star";
    const r = validate(m);
    expect(r.errors.some((e) => e.includes("[north-star]"))).toBe(true);
  });

  it("flags controllable node without distribution", () => {
    const m = clone();
    const n = m.nodes.find((x) => x.id === "new_sessions");
    if (n) delete n.distribution;
    expect(validate(m).errors.some((e) => e.includes("[controllable-leaf]"))).toBe(true);
  });

  it("flags controllable node that is not a leaf", () => {
    const m = clone();
    const orders = m.nodes.find((n) => n.id === "orders");
    if (orders) {
      orders.is_controllable = true;
      orders.distribution = { kind: "point", params: { value: 3000 } };
    }
    expect(validate(m).errors.some((e) => e.includes("[controllable-leaf]"))).toBe(true);
  });

  it("flags identity edge missing formula_role", () => {
    const m = clone();
    const e = m.edges.find((x) => x.kind === "identity");
    if (e) delete e.formula_role;
    expect(validate(m).errors.some((er) => er.includes("[edge-identity]"))).toBe(true);
  });

  it("flags modeled edge missing functional_form", () => {
    const m = clone();
    const e = m.edges.find((x) => x.kind === "modeled");
    if (e) delete e.functional_form;
    expect(validate(m).errors.some((er) => er.includes("[edge-modeled]"))).toBe(true);
  });

  it("flags hypothesized edge with non-none evidence_grade", () => {
    const m = clone();
    const e = m.edges.find((x) => x.kind === "hypothesized");
    if (e) e.evidence_grade = "illustrative";
    expect(validate(m).errors.some((er) => er.includes("[edge-hypothesized]"))).toBe(true);
  });

  it("flags double-counting (identity parent + modeled parent on same node)", () => {
    const m = clone();
    const dup: MetricEdge = {
      parent: "net_revenue",
      child: "email_capture_rate",
      kind: "modeled",
      functional_form: "linear",
      elasticity: 0.1,
      mechanism: "test",
      evidence_grade: "illustrative",
    };
    m.edges.push(dup);
    expect(validate(m).errors.some((e) => e.includes("[double-count]"))).toBe(true);
  });

  it("flags identity reconciliation failure", () => {
    const m = clone();
    const np = m.nodes.find((n) => n.id === "net_revenue");
    if (np) np.baseline = 999999;
    expect(validate(m).errors.some((e) => e.includes("[reconciliation]"))).toBe(true);
  });
});
