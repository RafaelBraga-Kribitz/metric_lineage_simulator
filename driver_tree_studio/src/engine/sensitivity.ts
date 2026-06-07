/**
 * Tornado sensitivity analysis.
 */

import type { BusinessModel } from "../schema/types.js";
import { whatIf } from "./whatif.js";

export interface TornadoEntry {
  leafId: string;
  northStarDelta: number;
}

/**
 * For each controllable leaf, perturb +/- deltaPct and keep the
 * larger-magnitude north-star delta (with its sign).
 * Returns entries sorted by |northStarDelta| desc.
 */
export function tornado(model: BusinessModel, deltaPct: number = 0.1): TornadoEntry[] {
  const entries: TornadoEntry[] = [];
  for (const n of model.nodes) {
    if (!n.is_controllable) continue;
    const pos = whatIf(model, n.id, deltaPct).northStarDelta;
    const neg = whatIf(model, n.id, -deltaPct).northStarDelta;
    const pick = Math.abs(pos) >= Math.abs(neg) ? pos : neg;
    entries.push({ leafId: n.id, northStarDelta: pick });
  }
  entries.sort((a, b) => Math.abs(b.northStarDelta) - Math.abs(a.northStarDelta));
  return entries;
}
