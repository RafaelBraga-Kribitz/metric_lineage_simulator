import { describe, it, expect } from "vitest";
import { topoOrder } from "../../src/engine/graph.js";
import seed from "../../src/content/dtc_ecommerce.json";
import type { BusinessModel } from "../../src/schema/types.js";

const model = seed as unknown as BusinessModel;

describe("graph", () => {
  it("topoOrder lists children before parents", () => {
    const order = topoOrder(model);
    const idx = Object.fromEntries(order.map((id, i) => [id, i]));
    for (const e of model.edges) {
      expect((idx[e.child] as number) < (idx[e.parent] as number)).toBe(true);
    }
  });

  it("throws on cycle", () => {
    const m = JSON.parse(JSON.stringify(seed)) as BusinessModel;
    m.edges.push({ parent: "new_sessions", child: "contribution_profit", kind: "identity", formula_role: "factor" });
    expect(() => topoOrder(m)).toThrow();
  });
});
