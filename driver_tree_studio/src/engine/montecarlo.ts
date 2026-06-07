/**
 * Monte Carlo propagation through identity + modeled edges.
 */

import type { BusinessModel, MetricEdge } from "../schema/types.js";
import { computeForMonteCarlo } from "./compute.js";
import { mulberry32, percentile, sampleDistribution } from "../lib/rng.js";

export interface MonteCarloResult {
  samples: number[];
  p10: number;
  p50: number;
  p90: number;
  /** Normalized squared Pearson correlation per controllable leaf id. Sums to 1. */
  varianceContribution: Record<string, number>;
}

function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n === 0) return 0;
  let sx = 0;
  let sy = 0;
  for (let i = 0; i < n; i++) {
    sx += xs[i] as number;
    sy += ys[i] as number;
  }
  const mx = sx / n;
  const my = sy / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const a = (xs[i] as number) - mx;
    const b = (ys[i] as number) - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  const den = Math.sqrt(dx * dy);
  return den < 1e-12 ? 0 : num / den;
}

/** Run Monte Carlo. Samples controllable-leaf distributions and edge elasticity distributions. */
export function monteCarlo(
  model: BusinessModel,
  runs: number,
  seed: number,
): MonteCarloResult {
  const leafRng = mulberry32(seed);
  const edgeRng = mulberry32(seed ^ 0x9e3779b9);
  const leafIds: string[] = [];
  for (const n of model.nodes) {
    if (n.is_controllable && n.distribution) leafIds.push(n.id);
  }
  const leafSamples: Record<string, number[]> = {};
  for (const id of leafIds) leafSamples[id] = [];

  const edgesWithDist: MetricEdge[] = model.edges.filter(
    (e) => e.kind === "modeled" && e.elasticity_distribution,
  );

  const nsSamples: number[] = [];

  for (let r = 0; r < runs; r++) {
    const overrides: Record<string, number> = {};
    for (const id of leafIds) {
      const node = model.nodes.find((n) => n.id === id);
      if (!node?.distribution) continue;
      const v = sampleDistribution(leafRng, node.distribution);
      overrides[id] = v;
      leafSamples[id]?.push(v);
    }
    const elasMap = new Map<MetricEdge, number>();
    for (const e of edgesWithDist) {
      if (e.elasticity_distribution) {
        elasMap.set(e, sampleDistribution(edgeRng, e.elasticity_distribution));
      }
    }
    const values = computeForMonteCarlo(model, overrides, elasMap);
    nsSamples.push(values[model.north_star_id] ?? 0);
  }

  // Variance contribution: normalized r^2
  const rawContrib: Record<string, number> = {};
  let total = 0;
  for (const id of leafIds) {
    const r2 = pearson(leafSamples[id] ?? [], nsSamples) ** 2;
    rawContrib[id] = r2;
    total += r2;
  }
  const varianceContribution: Record<string, number> = {};
  for (const id of leafIds) {
    varianceContribution[id] = total < 1e-12 ? 0 : (rawContrib[id] as number) / total;
  }

  return {
    samples: nsSamples,
    p10: percentile(nsSamples, 0.1),
    p50: percentile(nsSamples, 0.5),
    p90: percentile(nsSamples, 0.9),
    varianceContribution,
  };
}
