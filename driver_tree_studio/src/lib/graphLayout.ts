/**
 * Hierarchical graph layout: north star at top, children below, siblings spread horizontally.
 * Guardrails sit in a left column band. Used when nodes lack saved positions.
 */
import type { BusinessModel, MetricNode } from "../schema/types";

const H_GAP = 170;
const ROW_HEIGHT = 100;
const TOP_PAD = 40;
const MAIN_X_OFFSET = 200;
const GUARDRAIL_X = 20;

const LAYER_FALLBACK_DEPTH: Record<MetricNode["layer"], number> = {
  north_star: 0,
  strategic_objective: 1,
  outcome: 2,
  driver: 3,
  operational: 4,
  input: 5,
  guardrail: 0,
  counter: 0,
};

export function layoutGraph(model: BusinessModel): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};
  const childrenOf = new Map<string, string[]>();

  for (const e of model.edges) {
    const list = childrenOf.get(e.parent) ?? [];
    list.push(e.child);
    childrenOf.set(e.parent, list);
  }

  const depth = new Map<string, number>();
  depth.set(model.north_star_id, 0);

  // Identity edges define the main tree ranks; modeled/hyp edges do not shift layout.
  const layoutEdges = model.edges.filter((e) => e.kind === "identity");
  for (let i = 0; i < model.nodes.length; i++) {
    for (const e of layoutEdges) {
      const parentDepth = depth.get(e.parent);
      if (parentDepth === undefined) continue;
      const want = parentDepth + 1;
      const childDepth = depth.get(e.child);
      if (childDepth === undefined || childDepth < want) {
        depth.set(e.child, want);
      }
    }
  }

  const mainNodes: MetricNode[] = [];
  const guardrails: MetricNode[] = [];

  for (const n of model.nodes) {
    if (n.layer === "guardrail") {
      guardrails.push(n);
    } else {
      mainNodes.push(n);
      if (!depth.has(n.id)) {
        depth.set(n.id, LAYER_FALLBACK_DEPTH[n.layer] ?? 4);
      }
    }
  }

  const byDepth = new Map<number, MetricNode[]>();
  for (const n of mainNodes) {
    const d = depth.get(n.id) ?? 4;
    const list = byDepth.get(d) ?? [];
    list.push(n);
    byDepth.set(d, list);
  }

  for (const [d, nodes] of byDepth) {
    nodes.sort(
      (a, b) =>
        a.layer.localeCompare(b.layer) || a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
    );
    const rowWidth = Math.max(0, (nodes.length - 1) * H_GAP);
    const startX = MAIN_X_OFFSET + (nodes.length === 1 ? H_GAP : 0);
    nodes.forEach((n, i) => {
      positions[n.id] = {
        x: startX + i * H_GAP - rowWidth / 2,
        y: TOP_PAD + d * ROW_HEIGHT,
      };
    });
  }

  guardrails
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((n, i) => {
      positions[n.id] = { x: GUARDRAIL_X, y: TOP_PAD + i * ROW_HEIGHT };
    });

  return positions;
}
