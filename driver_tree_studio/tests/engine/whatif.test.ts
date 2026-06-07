import { describe, it, expect } from "vitest";
import seed from "../../src/content/dtc_ecommerce.json";
import { whatIf } from "../../src/engine/whatif.js";
import type { BusinessModel } from "../../src/schema/types.js";

const model = seed as unknown as BusinessModel;

describe("whatIf", () => {
  it("returns nonzero northStarDelta for an upstream leaf", () => {
    const r = whatIf(model, "new_sessions", 0.1);
    expect(r.northStarDelta).toBeGreaterThan(0);
  });

  it("touched modeled edges include the relevant one", () => {
    const r = whatIf(model, "email_capture_rate", 0.1);
    expect(r.touchedModeledEdges.length).toBeGreaterThan(0);
    expect(
      r.touchedModeledEdges.some((e) => e.child === "email_capture_rate" && e.parent === "returning_sessions"),
    ).toBe(true);
  });

  it("touched modeled edges empty when none on path", () => {
    const r = whatIf(model, "new_sessions", 0.1);
    expect(r.touchedModeledEdges).toEqual([]);
  });
});
