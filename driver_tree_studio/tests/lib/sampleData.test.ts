import { describe, expect, it } from "vitest";
import { estimateRelationship } from "../../src/engine/estimate.js";
import { pairedColumns, parseCsv } from "../../src/lib/csv.js";
import { syntheticLoyaltyCsv } from "../../src/lib/sampleData.js";

describe("synthetic loyalty sample", () => {
  it("is deterministic and well-formed", () => {
    expect(syntheticLoyaltyCsv()).toBe(syntheticLoyaltyCsv());
    const t = parseCsv(syntheticLoyaltyCsv());
    expect(t.headers).toEqual(["week", "loyalty_membership", "customer_ltv"]);
    expect(t.rows).toHaveLength(52);
  });

  it("shows a strong association that the tool still refuses to call an effect", () => {
    const { x, y } = pairedColumns(parseCsv(syntheticLoyaltyCsv()), "loyalty_membership", "customer_ltv");
    const r = estimateRelationship(x, y, { edge: { parent: "customer_ltv", child: "loyalty_membership", kind: "hypothesized", direction: "increases" } });
    expect(r.verdict).toBe("association_matches_direction");
    expect(r.pearsonR as number).toBeGreaterThan(0.8);
    expect(r.causalNote).toMatch(/association, not effect/);
  });
});
