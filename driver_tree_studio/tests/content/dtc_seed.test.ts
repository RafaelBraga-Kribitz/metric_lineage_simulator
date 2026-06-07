import { describe, it, expect } from "vitest";
import seed from "../../src/content/dtc_ecommerce.json";
import { validate } from "../../src/schema/validate.js";
import { computeBaseline } from "../../src/engine/compute.js";
import type { BusinessModel } from "../../src/schema/types.js";

const model = seed as unknown as BusinessModel;

describe("DTC seed", () => {
  it("validates clean", () => {
    const r = validate(model);
    if (!r.valid) console.log(r.errors);
    expect(r.valid).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it("reconciles north star to baseline", () => {
    const v = computeBaseline(model);
    expect(v["contribution_profit"]).toBeCloseTo(48000, 6);
    expect(v["net_revenue"]).toBeCloseTo(240000, 6);
    expect(v["variable_costs"]).toBeCloseTo(192000, 6);
    expect(v["orders"]).toBeCloseTo(3000, 6);
    expect(v["sessions"]).toBeCloseTo(150000, 6);
  });
});
