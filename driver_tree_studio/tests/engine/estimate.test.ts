import { readFileSync } from "node:fs";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import seed from "../../src/content/dtc_ecommerce.json";
import {
  CAUSAL_NOTE_OBSERVATIONAL,
  CAUSAL_NOTE_RANDOMIZED,
  MIN_N,
  acceptEstimate,
  correlationCi95,
  estimateRelationship,
  olsFit,
  outOfSampleR2,
  tCritical95,
} from "../../src/engine/estimate.js";
import { pairedColumns, parseCsv } from "../../src/lib/csv.js";
import { mulberry32, sampleNormal } from "../../src/lib/rng.js";
import type { BusinessModel, MetricEdge } from "../../src/schema/types.js";
import { validate } from "../../src/schema/validate.js";

const dtc = seed as unknown as BusinessModel;
const anscombe = pairedColumns(
  parseCsv(readFileSync(new URL("../fixtures/anscombe_1.csv", import.meta.url), "utf8")),
  "x",
  "y",
);

function linearData(n: number, slope: number, noise: number, s = 7): { x: number[]; y: number[] } {
  const rng = mulberry32(s);
  const x: number[] = [];
  const y: number[] = [];
  for (let i = 0; i < n; i++) {
    const xi = 10 + 5 * rng();
    x.push(xi);
    y.push(50 + slope * xi + sampleNormal(rng, 0, noise));
  }
  return { x, y };
}

const edgeById = (child: string, parent: string): MetricEdge => {
  const e = dtc.edges.find((d) => d.child === child && d.parent === parent);
  if (!e) throw new Error(`missing edge ${child}->${parent}`);
  return e;
};

describe("statistics primitives", () => {
  it("t critical values match tables within 0.01", () => {
    expect(tCritical95(3)).toBeCloseTo(3.182, 1);
    expect(Math.abs(tCritical95(10) - 2.228)).toBeLessThan(0.01);
    expect(Math.abs(tCritical95(30) - 2.042)).toBeLessThan(0.005);
    expect(Math.abs(tCritical95(1000) - 1.962)).toBeLessThan(0.002);
    expect(tCritical95(0)).toBeNaN();
  });

  it("OLS reproduces Anscombe I reference values (numpy.polyfit)", () => {
    const fit = olsFit(anscombe.x, anscombe.y);
    expect(fit?.slope).toBeCloseTo(0.5000909, 6);
    expect(fit?.intercept).toBeCloseTo(3.0000909, 6);
    expect(fit?.slopeSe).toBeCloseTo(0.1179055, 6);
    expect(fit?.r2).toBeCloseTo(0.81642051634484 ** 2, 8);
  });

  it("OLS on an exact line recovers it; degenerate inputs return null", () => {
    const fit = olsFit([1, 2, 3, 4], [3, 5, 7, 9]);
    expect(fit?.slope).toBeCloseTo(2, 12);
    expect(fit?.intercept).toBeCloseTo(1, 12);
    expect(olsFit([1, 2], [1, 2])).toBeNull();
    expect(olsFit([1, 1, 1], [1, 2, 3])).toBeNull();
  });

  it("correlation CI brackets r and narrows with n", () => {
    const small = correlationCi95(0.5, 20) as [number, number];
    const big = correlationCi95(0.5, 2000) as [number, number];
    expect(small[0]).toBeLessThan(0.5);
    expect(small[1]).toBeGreaterThan(0.5);
    expect(big[1] - big[0]).toBeLessThan(small[1] - small[0]);
    expect(correlationCi95(0.5, 3)).toBeNull();
  });

  it("out-of-sample r² is deterministic per seed and null when too small", () => {
    const d = linearData(100, 2, 1);
    expect(outOfSampleR2(d.x, d.y, 1)).toBe(outOfSampleR2(d.x, d.y, 1));
    expect(outOfSampleR2(d.x, d.y, 1) as number).toBeGreaterThan(0.5);
    expect(outOfSampleR2([1, 2, 3, 4, 5], [1, 2, 3, 4, 5], 1)).toBeNull();
  });
});

describe("estimateRelationship", () => {
  it("reports the Anscombe I relationship as an association, never an effect", () => {
    const r = estimateRelationship(anscombe.x, anscombe.y);
    expect(r.n).toBe(11);
    expect(r.pearsonR).toBeCloseTo(0.8164205, 6);
    expect(r.elasticityAtMeans).toBeCloseTo(0.6000364, 6);
    expect(r.verdict).toBe("association_found");
    expect(r.verdictText).toContain("association");
    expect(r.causalNote).toBe(CAUSAL_NOTE_OBSERVATIONAL);
    expect(r.whatWouldProveThis).toMatch(/Randomize/);
    expect(r.leakageWarning).toBeNull();
  });

  it("separates direction match from contradiction", () => {
    const up = linearData(200, 2, 1);
    const hypUp: MetricEdge = { parent: "y", child: "x", kind: "hypothesized", direction: "increases" };
    const hypDown: MetricEdge = { ...hypUp, direction: "decreases" };
    expect(estimateRelationship(up.x, up.y, { edge: hypUp }).verdict).toBe("association_matches_direction");
    const contra = estimateRelationship(up.x, up.y, { edge: hypDown });
    expect(contra.verdict).toBe("association_contradicts_direction");
    expect(contra.verdictText).toContain("OPPOSITE");
  });

  it("finds no clear association in pure noise", () => {
    const noise = linearData(60, 0, 5, 3);
    expect(estimateRelationship(noise.x, noise.y).verdict).toBe("no_clear_association");
  });

  it("handles empty, NaN, constant and tiny inputs without throwing", () => {
    expect(estimateRelationship([], []).verdict).toBe("insufficient_data");
    const tiny = estimateRelationship([1, 2, 3], [2, 4, 6]);
    expect(tiny.verdict).toBe("insufficient_data");
    expect(tiny.warnings.join(" ")).toContain(`at least ${MIN_N}`);
    const constant = estimateRelationship(Array(20).fill(1), Array.from({ length: 20 }, (_, i) => i));
    expect(constant.verdict).toBe("insufficient_data");
    expect(constant.warnings.join(" ")).toContain("constant");
    const withNaN = estimateRelationship([...anscombe.x, Number.NaN, 3], [...anscombe.y, 4, Number.POSITIVE_INFINITY]);
    expect(withNaN.n).toBe(11);
    expect(withNaN.nDropped).toBe(2);
    expect(withNaN.warnings[0]).toContain("2 row(s) dropped");
  });

  it("warns about leakage when the edge is an identity", () => {
    const r = estimateRelationship(anscombe.x, anscombe.y, { edge: edgeById("sessions", "orders") });
    expect(r.leakageWarning).toMatch(/circular/);
  });

  it("uses the randomized note only when the user declares randomization", () => {
    const r = estimateRelationship(anscombe.x, anscombe.y, { design: "randomized" });
    expect(r.causalNote).toBe(CAUSAL_NOTE_RANDOMIZED);
    expect(r.verdictText).toContain("effect estimate");
  });

  it("never uses the word 'cause' in observational verdicts", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10_000 }), fc.double({ min: -5, max: 5, noNaN: true }), (s, slope) => {
        const d = linearData(40, slope, 1, s);
        const r = estimateRelationship(d.x, d.y, { seed: s });
        return !/caus/i.test(r.verdictText) && r.causalNote === CAUSAL_NOTE_OBSERVATIONAL;
      }),
      { numRuns: 50 },
    );
  });

  it("property: r in [-1,1], CI ordered, invariant to positive rescaling of x", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000 }),
        fc.double({ min: -3, max: 3, noNaN: true }),
        fc.double({ min: 0.01, max: 1000, noNaN: true }),
        (s, slope, k) => {
          const d = linearData(30, slope, 2, s);
          const a = estimateRelationship(d.x, d.y);
          const b = estimateRelationship(d.x.map((v) => v * k), d.y);
          if (a.pearsonR === null || b.pearsonR === null || !a.rCi95) return false;
          return (
            Math.abs(a.pearsonR) <= 1 &&
            a.rCi95[0] <= a.rCi95[1] &&
            Math.abs(a.pearsonR - b.pearsonR) < 1e-9 &&
            Math.abs((a.elasticityAtMeans as number) - (b.elasticityAtMeans as number)) < 1e-6
          );
        },
      ),
      { numRuns: 60 },
    );
  });
});

describe("acceptEstimate", () => {
  const loyalty = edgeById("loyalty_membership", "customer_ltv");
  // Synthetic hypothesized edge into an identity parent (the seed no longer has one).
  const pageSpeed: MetricEdge = {
    parent: "conversion_rate",
    child: "page_load_speed",
    kind: "hypothesized",
    direction: "decreases",
    evidence_grade: "none",
    rationale: "test",
  };

  it("promotes a hypothesized edge to modeled/observational and keeps the model valid", () => {
    const d = linearData(80, 3, 1);
    const res = estimateRelationship(d.x, d.y, { edge: loyalty });
    const out = acceptEstimate(dtc, loyalty, res);
    expect(out.accepted).toBe(true);
    const e = out.model.edges.find((x) => x.child === "loyalty_membership");
    expect(e?.kind).toBe("modeled");
    expect(e?.evidence_grade).toBe("observational");
    expect(e?.elasticity_distribution?.kind).toBe("normal");
    expect(e?.evidence_note).toContain("association, not effect");
    const remaining = validate(out.model).errors.filter((m) => !m.startsWith("[controllable-leaf]"));
    expect(remaining).toEqual([]);
  });

  it("grades experimental only for a declared randomized design", () => {
    const d = linearData(80, 3, 1);
    const res = estimateRelationship(d.x, d.y, { edge: loyalty, design: "randomized" });
    const e = acceptEstimate(dtc, loyalty, res).model.edges.find((x) => x.child === "loyalty_membership");
    expect(e?.evidence_grade).toBe("experimental");
  });

  it("refuses identity edges, contradicting verdicts and double-counting targets", () => {
    const d = linearData(80, 3, 1);
    const idEdge = edgeById("sessions", "orders");
    expect(acceptEstimate(dtc, idEdge, estimateRelationship(d.x, d.y, { edge: idEdge })).accepted).toBe(false);
    const contra = estimateRelationship(d.x, d.y, { edge: pageSpeed });
    expect(contra.verdict).toBe("association_contradicts_direction");
    expect(acceptEstimate(dtc, pageSpeed, contra).accepted).toBe(false);
    const down = linearData(80, -3, 1);
    const ok = estimateRelationship(down.x, down.y, { edge: pageSpeed });
    const out = acceptEstimate(dtc, pageSpeed, ok);
    expect(out.accepted).toBe(false);
    expect(out.reason).toContain("double-count");
    expect(out.model).toBe(dtc);
  });
});
