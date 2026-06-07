import { describe, expect, it } from "vitest";
import seed from "../../src/content/dtc_ecommerce.json";
import { monteCarlo } from "../../src/engine/montecarlo.js";
import type { BusinessModel, GovernanceMeta } from "../../src/schema/types.js";

const dtc = seed as unknown as BusinessModel;

const gov = (): GovernanceMeta => ({
  owner: "test",
  business_function: "test",
  data_source: "test",
  warehouse_table: "test",
  calculation_grain: "period",
  update_frequency: "daily",
  dimensions: [],
});

function syntheticModel(elasticityDistribution: boolean): BusinessModel {
  return {
    id: "elasticity_spread",
    name: "Elasticity spread",
    industry: "test",
    north_star_id: "y",
    narrative: "",
    scenarios: [],
    nodes: [
      {
        id: "x",
        name: "x",
        definition: "",
        unit: "count",
        layer: "input",
        baseline: 100,
        is_controllable: true,
        distribution: { kind: "triangular", params: { min: 80, mode: 100, max: 120 } },
        governance: gov(),
      },
      {
        id: "y",
        name: "y",
        definition: "",
        unit: "count",
        layer: "north_star",
        baseline: 100,
        is_controllable: false,
        governance: gov(),
      },
    ],
    edges: [
      {
        parent: "y",
        child: "x",
        kind: "modeled",
        functional_form: "linear",
        mechanism: "test",
        evidence_grade: "illustrative",
        ...(elasticityDistribution
          ? {
            elasticity_distribution: {
              kind: "triangular",
              params: { min: 0.2, mode: 0.5, max: 0.8 },
            },
          }
          : { elasticity: 0.5 }),
      },
    ],
  };
}

describe("monteCarlo", () => {
  it("DTC seed: p10 < p50 < p90 and variance shares sum to 1", () => {
    const r = monteCarlo(dtc, 2000, 42);
    expect(r.p10).toBeLessThan(r.p50);
    expect(r.p50).toBeLessThan(r.p90);
    const sum = Object.values(r.varianceContribution).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 2);
  });

  it("elasticity_distribution widens north-star spread vs point elasticity", () => {
    const runs = 2000;
    const seed = 99;
    const point = monteCarlo(syntheticModel(false), runs, seed);
    const distributed = monteCarlo(syntheticModel(true), runs, seed);
    const stdev = (samples: number[]) => {
      const n = samples.length;
      const mean = samples.reduce((a, b) => a + b, 0) / n;
      const v = samples.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
      return Math.sqrt(v);
    };
    expect(stdev(distributed.samples)).toBeGreaterThan(stdev(point.samples));
  });
});
