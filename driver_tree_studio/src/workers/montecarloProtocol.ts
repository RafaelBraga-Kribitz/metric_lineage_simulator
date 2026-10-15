/**
 * Pure Monte Carlo summary shared by the Web Worker and the main-thread fallback.
 * Only small, serialisable data crosses the worker boundary (no raw samples).
 */

import { monteCarlo } from "../engine/montecarlo.js";
import type { BusinessModel } from "../schema/types.js";

export interface MonteCarloRequest {
  id: number;
  model: BusinessModel;
  runs: number;
  seed: number;
  bins?: number;
}

export interface HistogramBin {
  from: number;
  to: number;
  count: number;
}

export interface MonteCarloSummary {
  id: number;
  runs: number;
  seed: number;
  p10: number;
  p50: number;
  p90: number;
  min: number;
  max: number;
  histogram: HistogramBin[];
  varianceContribution: Array<{ leafId: string; share: number }>;
}

export function histogram(samples: number[], bins: number): HistogramBin[] {
  if (samples.length === 0 || bins < 1) return [];
  let min = Infinity;
  let max = -Infinity;
  for (const s of samples) {
    if (s < min) min = s;
    if (s > max) max = s;
  }
  const width = max > min ? (max - min) / bins : 1;
  const out: HistogramBin[] = Array.from({ length: bins }, (_, i) => ({
    from: min + i * width,
    to: min + (i + 1) * width,
    count: 0,
  }));
  for (const s of samples) {
    const i = Math.min(bins - 1, Math.floor((s - min) / width));
    (out[i] as HistogramBin).count++;
  }
  return out;
}

export function summarizeMonteCarlo(req: MonteCarloRequest): MonteCarloSummary {
  const r = monteCarlo(req.model, req.runs, req.seed);
  const sorted = [...r.samples].sort((a, b) => a - b);
  return {
    id: req.id,
    runs: req.runs,
    seed: req.seed,
    p10: r.p10,
    p50: r.p50,
    p90: r.p90,
    min: sorted[0] ?? 0,
    max: sorted[sorted.length - 1] ?? 0,
    histogram: histogram(r.samples, req.bins ?? 30),
    varianceContribution: Object.entries(r.varianceContribution)
      .map(([leafId, share]) => ({ leafId, share }))
      .sort((a, b) => b.share - a.share),
  };
}
