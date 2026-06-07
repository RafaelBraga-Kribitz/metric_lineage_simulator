/**
 * Seeded RNG and distribution sampling helpers.
 */

import type { Distribution } from "../schema/types.js";

export type Rng = () => number;

/** mulberry32 PRNG. Returns a function that emits values in [0, 1). */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return function (): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Inverse-CDF triangular sample. */
export function sampleTriangular(
  rng: Rng,
  params: { min: number; mode: number; max: number },
): number {
  const { min, mode, max } = params;
  const u = rng();
  const c = (mode - min) / (max - min);
  if (u < c) return min + Math.sqrt(u * (max - min) * (mode - min));
  return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
}

/** Box-Muller normal. */
export function sampleNormal(rng: Rng, mean: number, sd: number): number {
  const u1 = Math.max(rng(), 1e-12);
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + sd * z;
}

export function sampleDistribution(rng: Rng, d: Distribution): number {
  switch (d.kind) {
    case "point":
      return d.params.value ?? 0;
    case "triangular":
      return sampleTriangular(rng, {
        min: d.params.min ?? 0,
        mode: d.params.mode ?? 0,
        max: d.params.max ?? 0,
      });
    case "normal":
      return sampleNormal(rng, d.params.mean ?? 0, d.params.sd ?? 0);
    case "lognormal": {
      const z = sampleNormal(rng, 0, 1);
      return Math.exp((d.params.mu ?? 0) + (d.params.sigma ?? 0) * z);
    }
  }
}

/** Linear-interpolated percentile on an UNSORTED array (will sort internally). */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = p * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo] as number;
  const w = idx - lo;
  return (sorted[lo] as number) * (1 - w) + (sorted[hi] as number) * w;
}
