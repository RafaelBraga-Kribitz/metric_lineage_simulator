import { describe, expect, it } from "vitest";
import seed from "../../src/content/dtc_ecommerce.json";
import {
  buildFunnelStages,
  hasFunnelStages,
} from "../../src/lib/funnelStages.js";
import { computeBaseline } from "../../src/engine/compute.js";
import type { BusinessModel } from "../../src/schema/types.js";

const model = seed as BusinessModel;

describe("hasFunnelStages", () => {
  it("is true for DTC seed", () => {
    expect(hasFunnelStages(model)).toBe(true);
  });

  it("is false when no funnel_stage_order nodes", () => {
    const empty: BusinessModel = {
      ...model,
      nodes: model.nodes.map((n) => ({ ...n, funnel_stage_order: undefined })),
    };
    expect(hasFunnelStages(empty)).toBe(false);
  });
});

describe("buildFunnelStages", () => {
  it("returns null without funnel nodes", () => {
    const empty: BusinessModel = {
      ...model,
      nodes: model.nodes.map((n) => ({ ...n, funnel_stage_order: undefined })),
    };
    expect(buildFunnelStages(empty, {})).toBeNull();
  });

  it("returns five stages with decreasing counts for DTC baselines", () => {
    const values = computeBaseline(model);
    const stages = buildFunnelStages(model, values);
    expect(stages).not.toBeNull();
    expect(stages).toHaveLength(5);
    expect(stages![0]!.label).toBe("Sessions");
    expect(stages![4]!.label).toBe("Orders");

    for (let i = 1; i < stages!.length; i++) {
      expect(stages![i]!.count).toBeLessThanOrEqual(stages![i - 1]!.count);
    }
  });

  it("uses orders value on the final stage when present", () => {
    const values = computeBaseline(model);
    const stages = buildFunnelStages(model, values)!;
    expect(stages[4]!.count).toBe(values.orders);
  });
});
