import { describe, it, expect } from "vitest";
import seed from "../../src/content/dtc_ecommerce.json";
import { applyForm, applyLevers, computeBaseline } from "../../src/engine/compute.js";
import type { BusinessModel } from "../../src/schema/types.js";

const model = seed as unknown as BusinessModel;

describe("compute", () => {
  it("baseline matches stored north star", () => {
    const v = computeBaseline(model);
    expect(v["contribution_profit"]).toBeCloseTo(48000, 6);
  });

  it("applyLevers with empty equals baseline", () => {
    const v = applyLevers(model, {});
    const b = computeBaseline(model);
    for (const id of Object.keys(b)) expect(v[id]).toBeCloseTo(b[id] as number, 6);
  });

  it("lever on a leaf propagates through identity", () => {
    const v = applyLevers(model, { new_sessions: { mode: "multiplier", value: 1.1 } });
    // new_sessions x1.1 → sessions, then orders, then revenue and costs both x by orders factor
    // sessions = 110000 + 50000 = 160000; orders = 160000 * 0.02 = 3200
    expect(v["sessions"]).toBeCloseTo(160000, 6);
    expect(v["orders"]).toBeCloseTo(3200, 6);
    expect(v["net_revenue"]).toBeCloseTo(3200 * 80, 6);
    expect(v["variable_costs"]).toBeCloseTo(3200 * 64, 6);
    expect(v["contribution_profit"]).toBeCloseTo(3200 * (80 - 64), 6);
  });

  it("modeled edge applies elasticity on child %change", () => {
    // email_capture_rate has elasticity 0.3, linear. +20% on it → returning_sessions x1.06
    const v = applyLevers(model, { email_capture_rate: { mode: "multiplier", value: 1.2 } });
    expect(v["returning_sessions"]).toBeCloseTo(50000 * (1 + 0.3 * 0.2), 6);
  });

  it("functional_form variants", () => {
    const edge = { kind: "modeled" as const, parent: "p", child: "c" };
    expect(applyForm("linear", 0.1, edge, 0.5)).toBeCloseTo(1.05, 9);
    expect(applyForm("logarithmic", 0.1, edge, 0.5)).toBeCloseTo(1 + 0.5 * Math.log(1.1), 9);
    expect(applyForm("power", 0.1, edge, 0.5)).toBeCloseTo(Math.pow(1.1, 0.5), 9);
    // s_curve at d=0 → 1
    expect(applyForm("s_curve", 0, edge, 0.5)).toBeCloseTo(1, 9);
  });
});
