import { describe, it, expect } from "vitest";
import seed from "../../src/content/dtc_ecommerce.json";
import { tornado } from "../../src/engine/sensitivity.js";
import type { BusinessModel } from "../../src/schema/types.js";

const model = seed as unknown as BusinessModel;

describe("tornado", () => {
  it("sorted by absolute delta desc", () => {
    const t = tornado(model);
    for (let i = 1; i < t.length; i++) {
      const a = t[i - 1];
      const b = t[i];
      if (a && b) expect(Math.abs(a.northStarDelta)).toBeGreaterThanOrEqual(Math.abs(b.northStarDelta));
    }
  });

  it("includes every controllable leaf", () => {
    const t = tornado(model);
    const controllableIds = model.nodes.filter((n) => n.is_controllable).map((n) => n.id).sort();
    expect(t.map((e) => e.leafId).sort()).toEqual(controllableIds);
  });
});
