import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import seed from "../../src/content/dtc_ecommerce.json";
import { buildWorkedExample, renderWorkedExampleMarkdown } from "../../src/engine/workedExample.js";
import type { BusinessModel } from "../../src/schema/types.js";
import { validate } from "../../src/schema/validate.js";

const dtc = seed as unknown as BusinessModel;
const committed = (name: string) => readFileSync(new URL(`../../../docs/results/${name}`, import.meta.url), "utf8");

describe("headline worked example", () => {
  it("is reproducible: committed docs/results match a fresh run", () => {
    const ex = buildWorkedExample(dtc);
    expect(JSON.parse(committed("worked_example.json"))).toEqual(JSON.parse(JSON.stringify(ex)));
    expect(committed("worked_example.md")).toBe(renderWorkedExampleMarkdown(ex));
  });

  it("ranks the sourced page-speed guess first and never ranks a hypothesized edge", () => {
    const ex = buildWorkedExample(dtc);
    expect(ex.rows[0]?.edge).toBe("page_load_speed → product_view_rate");
    expect(ex.rows[0]?.sources.length).toBeGreaterThan(0);
    const loyalty = ex.rows.find((r) => r.edge.startsWith("loyalty_membership"));
    expect(loyalty?.rank).toBeNull();
    expect(ex.decision).toContain("not what to do");
  });

  it("seed stays valid and every modeled edge is sourced or visibly illustrative", () => {
    expect(validate(dtc).errors).toEqual([]);
    for (const e of dtc.edges.filter((x) => x.kind === "modeled")) {
      const sourced = (e.evidence_source ?? []).every((s) => s.url.startsWith("https://") && s.year > 1990 && s.measures.length > 10);
      if (e.evidence_grade === "illustrative") continue;
      expect(e.evidence_source?.length ?? 0).toBeGreaterThan(0);
      expect(sourced).toBe(true);
    }
  });
});
