import { describe, expect, it } from "vitest";
import seed from "../../src/content/dtc_ecommerce.json";
import { prioritize } from "../../src/engine/prioritize.js";
import { GUESS_CAVEAT, distributionMean, valueOfInformation } from "../../src/engine/valueOfInformation.js";
import type { BusinessModel, Distribution, GovernanceMeta, MetricEdge } from "../../src/schema/types.js";

const dtc = seed as unknown as BusinessModel;
const gov = (): GovernanceMeta => ({
  owner: "t", business_function: "t", data_source: "t", warehouse_table: "t",
  calculation_grain: "period", update_frequency: "daily", dimensions: [],
});

function twoDrivers(sdA: number, sdB: number, costA?: number, costB?: number): BusinessModel {
  const node = (id: string, layer: "north_star" | "input", ctrl: boolean, baseline: number) => ({
    id, name: id, definition: "", unit: "count" as const, layer, baseline, is_controllable: ctrl,
    ...(ctrl ? { distribution: { kind: "point" as const, params: { value: baseline } } } : {}),
    governance: gov(),
  });
  const edge = (child: string, sd: number, cost?: number): MetricEdge => ({
    parent: "y", child, kind: "modeled", functional_form: "linear", elasticity: 0.5,
    elasticity_distribution: { kind: "normal", params: { mean: 0.5, sd } },
    mechanism: "test", evidence_grade: "illustrative", ...(cost !== undefined ? { test_cost: cost } : {}),
  });
  return {
    id: "voi", name: "voi", industry: "t", north_star_id: "y", narrative: "", scenarios: [],
    nodes: [node("y", "north_star", false, 1000), node("a", "input", true, 10), node("b", "input", true, 10)],
    edges: [edge("a", sdA, costA), edge("b", sdB, costB)],
  };
}

describe("valueOfInformation", () => {
  it("scores wider guesses higher and is deterministic", () => {
    const m = twoDrivers(0.4, 0.1);
    const a = valueOfInformation(m, { runs: 1000 });
    const b = valueOfInformation(m, { runs: 1000 });
    expect(a).toEqual(b);
    const [ea, eb] = a;
    expect(ea?.status).toBe("scored");
    expect(ea?.voiScore as number).toBeGreaterThan((eb?.voiScore as number) * 2);
    // linear: y = 1000·(1 + e·0.1); sd(y) = 100·sd(e); P90−P10 ≈ 2·1.2816·sd(y)
    expect(ea?.voiScore as number).toBeCloseTo(2 * 1.2816 * 100 * 0.4, -1);
    expect(ea?.p10 as number).toBeLessThan(ea?.p50 as number);
  });

  it("is zero when the driver is not moved and scales with the planned change", () => {
    const m = twoDrivers(0.4, 0.4);
    const none = valueOfInformation(m, { plannedChangePct: 0 })[0];
    expect(none?.voiScore).toBeCloseTo(0, 9);
    const small = valueOfInformation(m, { plannedChangePct: 0.05 })[0]?.voiScore as number;
    const big = valueOfInformation(m, { plannedChangePct: 0.2 })[0]?.voiScore as number;
    expect(big / small).toBeCloseTo(4, 1);
  });

  it("classifies the DTC seed edges honestly", () => {
    const byChild = Object.fromEntries(valueOfInformation(dtc).map((e) => [e.edge.child, e]));
    expect(byChild["page_load_speed"]?.status).toBe("scored");
    expect(byChild["page_load_speed"]?.voiScore as number).toBeGreaterThan(0);
    expect(byChild["loyalty_membership"]?.status).toBe("needs_guesstimate");
    expect(byChild["loyalty_membership"]?.voiScore).toBeNull();
    expect(byChild["email_capture_rate"]?.status).toBe("scored");
    expect(byChild["average_order_value"]?.status).toBe("not_on_path");
  });

  it("flags edges that do not feed the target and leverability", () => {
    const withDist: BusinessModel = {
      ...dtc,
      edges: dtc.edges.map((e) =>
        e.child === "average_order_value" && e.parent === "customer_ltv"
          ? { ...e, elasticity_distribution: { kind: "triangular", params: { min: 0.3, mode: 0.6, max: 0.9 } } }
          : e,
      ),
    };
    const ns = valueOfInformation(withDist).find((e) => e.edge.parent === "customer_ltv" && e.edge.kind === "modeled");
    expect(ns?.status).toBe("not_on_path");
    const ltv = valueOfInformation(withDist, { targetId: "customer_ltv" }).find(
      (e) => e.edge.parent === "customer_ltv" && e.edge.kind === "modeled",
    );
    expect(ltv?.status).toBe("scored");
    expect(ltv?.voiScore as number).toBeGreaterThan(0);
  });

  it("computes distribution means", () => {
    const cases: Array<[Distribution, number]> = [
      [{ kind: "point", params: { value: 3 } }, 3],
      [{ kind: "triangular", params: { min: 0, mode: 3, max: 6 } }, 3],
      [{ kind: "normal", params: { mean: 2, sd: 1 } }, 2],
      [{ kind: "lognormal", params: { mu: 0, sigma: 0 } }, 1],
    ];
    for (const [d, m] of cases) expect(distributionMean(d)).toBeCloseTo(m, 12);
  });

  it("carries the verbatim guess caveat", () => {
    expect(GUESS_CAVEAT).toMatch(/^This interval is the uncertainty in your GUESS, not evidence\./);
    expect(GUESS_CAVEAT).toContain("never to estimate impact");
  });
});

describe("prioritize", () => {
  it("divides by test cost and ranks scored edges first", () => {
    const m = twoDrivers(0.4, 0.3, 10, 1);
    const ranked = prioritize(valueOfInformation(m));
    expect(ranked[0]?.edge.child).toBe("b");
    expect(ranked[0]?.rank).toBe(1);
    expect(ranked[1]?.priorityScore as number).toBeCloseTo((ranked[1]?.voiScore as number) / 10, 9);
  });

  it("assumes cost 1 when missing and sinks unscored edges", () => {
    const m = twoDrivers(0.4, 0.3);
    const ranked = prioritize([...valueOfInformation(m), { ...valueOfInformation(dtc).find((e) => e.voiScore === null)! }]);
    expect(ranked.filter((e) => e.testCostAssumed)).toHaveLength(2);
    expect(ranked[ranked.length - 1]?.priorityScore).toBeNull();
    expect(ranked[ranked.length - 1]?.rank).toBeNull();
    expect(ranked.filter((e) => e.rank !== null)).toHaveLength(2);
  });
});
