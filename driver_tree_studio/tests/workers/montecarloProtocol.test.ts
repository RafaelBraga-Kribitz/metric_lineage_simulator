import { describe, expect, it } from "vitest";
import seed from "../../src/content/dtc_ecommerce.json";
import type { BusinessModel } from "../../src/schema/types.js";
import { histogram, summarizeMonteCarlo } from "../../src/workers/montecarloProtocol.js";

const dtc = seed as unknown as BusinessModel;

describe("Monte Carlo worker protocol", () => {
  it("histogram counts every sample exactly once", () => {
    const h = histogram([1, 2, 2, 3, 10], 3);
    expect(h.reduce((s, b) => s + b.count, 0)).toBe(5);
    expect(h[2]?.count).toBe(1);
    expect(histogram([], 5)).toEqual([]);
    expect(histogram([4, 4, 4], 2).reduce((s, b) => s + b.count, 0)).toBe(3);
  });

  it("summary is deterministic, ordered and serialisable", () => {
    const a = summarizeMonteCarlo({ id: 1, model: dtc, runs: 2000, seed: 42 });
    const b = summarizeMonteCarlo({ id: 1, model: dtc, runs: 2000, seed: 42 });
    expect(a).toEqual(b);
    expect(a.p10).toBeLessThan(a.p50);
    expect(a.p50).toBeLessThan(a.p90);
    expect(a.min).toBeLessThanOrEqual(a.p10);
    expect(a.histogram.reduce((s, x) => s + x.count, 0)).toBe(2000);
    const share = a.varianceContribution.reduce((s, x) => s + x.share, 0);
    expect(share).toBeCloseTo(1, 9);
    expect(JSON.parse(JSON.stringify(a))).toEqual(a);
  });
});
