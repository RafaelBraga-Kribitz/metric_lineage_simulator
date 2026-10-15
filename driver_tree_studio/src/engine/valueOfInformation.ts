/**
 * Value of information (ADR-0008 Phase 5a).
 *
 * Question answered: "If I act on this driver, how much does NOT KNOWING the edge's
 * elasticity blur the predicted outcome?" For each modeled edge with an
 * elasticity_distribution, the edge's driver is moved by a planned change, only that edge's
 * elasticity is sampled (seeded), everything else is held at its point value, and the
 * spread (P90 − P10) of the target metric is the voiScore, in the target's units.
 *
 * This is VALUE OF INFORMATION, never impact. The interval is uncertainty in a guess.
 */

import type { BusinessModel, Distribution, MetricEdge } from "../schema/types.js";
import { computeForMonteCarlo } from "./compute.js";
import { buildGraph } from "./graph.js";
import { mulberry32, percentile, sampleDistribution } from "../lib/rng.js";

export const GUESS_CAVEAT =
  "This interval is the uncertainty in your GUESS, not evidence. A distribution looks like " +
  "data and is not. Its only purpose is to help you decide what to test, never to estimate " +
  "impact.";

export type VoiStatus =
  | "scored"
  | "needs_guesstimate"
  | "point_only"
  | "not_on_path"
  | "driver_not_leverable";

export interface VoiEntry {
  edge: MetricEdge;
  status: VoiStatus;
  /** P90 − P10 of the target under the planned change, in target units. null if unscored. */
  voiScore: number | null;
  p10: number | null;
  p50: number | null;
  p90: number | null;
  note: string;
}

export interface VoiOptions {
  targetId?: string;
  /** Planned relative change applied to each edge's driver, e.g. 0.1 = +10%. */
  plannedChangePct?: number;
  /** Per-driver override of the planned change, e.g. { page_load_speed: -0.1 } (faster). */
  plannedChanges?: Record<string, number>;
  runs?: number;
  seed?: number;
}

/** Mean of a declared distribution (used to hold non-sampled edges at a point). */
export function distributionMean(d: Distribution): number {
  const p = d.params;
  switch (d.kind) {
    case "point":
      return p.value ?? 0;
    case "triangular":
      return ((p.min ?? 0) + (p.mode ?? 0) + (p.max ?? 0)) / 3;
    case "normal":
      return p.mean ?? 0;
    case "lognormal":
      return Math.exp((p.mu ?? 0) + (p.sigma ?? 0) ** 2 / 2);
  }
}

function pointElasticity(e: MetricEdge): number {
  if (e.elasticity !== undefined) return e.elasticity;
  return e.elasticity_distribution ? distributionMean(e.elasticity_distribution) : 0;
}

/** True when value can flow from `fromId` to `targetId` through identity/modeled edges. */
function reaches(model: BusinessModel, fromId: string, targetId: string): boolean {
  const { outgoingOf } = buildGraph(model);
  const stack = [fromId];
  const seen = new Set<string>();
  while (stack.length) {
    const id = stack.pop() as string;
    if (id === targetId) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    for (const e of outgoingOf.get(id) ?? []) if (e.kind !== "hypothesized") stack.push(e.parent);
  }
  return false;
}

function unscored(edge: MetricEdge, status: VoiStatus, note: string): VoiEntry {
  const voiScore = status === "point_only" || status === "not_on_path" ? 0 : null;
  return { edge, status, voiScore, p10: null, p50: null, p90: null, note };
}

function precheck(model: BusinessModel, edge: MetricEdge, targetId: string): VoiEntry | null {
  if (edge.kind === "hypothesized")
    return unscored(edge, "needs_guesstimate", "Direction only. Add an elasticity range (Guesstimate) to rank it.");
  if (!edge.elasticity_distribution)
    return unscored(edge, "point_only", "Point elasticity: no declared uncertainty, so nothing to learn yet.");
  if (!reaches(model, edge.parent, targetId))
    return unscored(edge, "not_on_path", `Does not feed '${targetId}' through computed edges.`);
  const isIdentityParent = model.edges.some((e) => e.parent === edge.child && e.kind === "identity");
  if (isIdentityParent)
    return unscored(edge, "driver_not_leverable", `'${edge.child}' is defined by an identity; move its inputs instead.`);
  return null;
}

function scoreEdge(model: BusinessModel, edge: MetricEdge, index: number, opts: Required<VoiOptions>): VoiEntry {
  const pre = precheck(model, edge, opts.targetId);
  if (pre) return pre;
  const driver = model.nodes.find((n) => n.id === edge.child);
  const change = opts.plannedChanges[edge.child] ?? opts.plannedChangePct;
  const overrides = { [edge.child]: (driver?.baseline ?? 0) * (1 + change) };
  const fixed = new Map<MetricEdge, number>();
  for (const e of model.edges) if (e.kind === "modeled") fixed.set(e, pointElasticity(e));
  const rng = mulberry32((opts.seed + 7919 * (index + 1)) >>> 0);
  const samples: number[] = [];
  for (let r = 0; r < opts.runs; r++) {
    const elas = new Map(fixed);
    elas.set(edge, sampleDistribution(rng, edge.elasticity_distribution as Distribution));
    samples.push(computeForMonteCarlo(model, overrides, elas)[opts.targetId] ?? 0);
  }
  const p10 = percentile(samples, 0.1);
  const p90 = percentile(samples, 0.9);
  return {
    edge,
    status: "scored",
    voiScore: p90 - p10,
    p10,
    p50: percentile(samples, 0.5),
    p90,
    note: `Spread of '${opts.targetId}' if '${edge.child}' moves ${change >= 0 ? "+" : ""}${(change * 100).toFixed(0)}% and only this guess is uncertain.`,
  };
}

/** Score every non-identity edge. Deterministic for a given seed. */
export function valueOfInformation(model: BusinessModel, options: VoiOptions = {}): VoiEntry[] {
  const opts: Required<VoiOptions> = {
    targetId: options.targetId ?? model.north_star_id,
    plannedChangePct: options.plannedChangePct ?? 0.1,
    plannedChanges: options.plannedChanges ?? {},
    runs: options.runs ?? 2000,
    seed: options.seed ?? 42,
  };
  const out: VoiEntry[] = [];
  model.edges.forEach((edge, i) => {
    if (edge.kind !== "identity") out.push(scoreEdge(model, edge, i, opts));
  });
  return out;
}
