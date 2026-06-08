import { describe, expect, it } from "vitest";
import seed from "../../src/content/dtc_ecommerce.json";
import { layoutGraph } from "../../src/lib/graphLayout.js";
import type { BusinessModel } from "../../src/schema/types.js";

const model = seed as BusinessModel;

describe("layoutGraph", () => {
  it("places north star at the topmost row", () => {
    const positions = layoutGraph(model);
    const nsmY = positions[model.north_star_id]!.y;
    for (const [id, pos] of Object.entries(positions)) {
      if (id === model.north_star_id) continue;
      expect(pos.y).toBeGreaterThanOrEqual(nsmY);
    }
  });

  it("places every identity child below its parent", () => {
    const positions = layoutGraph(model);
    const identityEdges = model.edges.filter((e) => e.kind === "identity");
    for (const e of identityEdges) {
      const parentY = positions[e.parent]!.y;
      const childY = positions[e.child]!.y;
      expect(childY).toBeGreaterThan(parentY);
    }
  });

  it("aligns identity siblings on the same row", () => {
    const positions = layoutGraph(model);
    const childrenOf = new Map<string, string[]>();
    for (const e of model.edges.filter((ed) => ed.kind === "identity")) {
      const list = childrenOf.get(e.parent) ?? [];
      list.push(e.child);
      childrenOf.set(e.parent, list);
    }
    for (const children of childrenOf.values()) {
      if (children.length < 2) continue;
      const ys = children.map((id) => positions[id]!.y);
      expect(Math.max(...ys) - Math.min(...ys)).toBeLessThan(1);
    }
  });
});
