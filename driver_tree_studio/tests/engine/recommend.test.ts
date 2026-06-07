import { describe, expect, it } from "vitest";
import seed from "../../src/content/dtc_ecommerce.json";
import { recommend } from "../../src/engine/recommend.js";
import type { BusinessModel } from "../../src/schema/types.js";

const model = seed as unknown as BusinessModel;

describe("recommend", () => {
  it("surfaces hypothesized edges in untestedBeliefs", () => {
    const r = recommend(model, {});
    expect(r.untestedBeliefs).toHaveLength(2);
    expect(r.untestedBeliefs.every((e) => e.kind === "hypothesized")).toBe(true);
    const childIds = r.untestedBeliefs.map((e) => e.child).sort();
    expect(childIds).toEqual(["loyalty_membership", "page_load_speed"]);
  });

  it("returns up to five top levers from tornado", () => {
    const r = recommend(model, {});
    expect(r.topLevers.length).toBeGreaterThan(0);
    expect(r.topLevers.length).toBeLessThanOrEqual(5);
  });
});
