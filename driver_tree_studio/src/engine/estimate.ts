/**
 * Bring-your-own-data relationship test (ADR-0008 Phase 3a).
 *
 * Given paired observations of an edge's child (x, the driver) and parent (y, the metric),
 * report correlation with a 95% CI, a transparent OLS fit, an 80/20 out-of-sample r², and a
 * verdict that separates ASSOCIATION from EFFECT. Observational data never yields "causes".
 * Every result carries a fixed `causal_note` and a `what_would_prove_this` design.
 */

import type { BusinessModel, MetricEdge } from "../schema/types.js";
import { mulberry32 } from "../lib/rng.js";
import { mean, pearson } from "../lib/stats.js";

export type StudyDesign = "observational" | "randomized";

export type Verdict =
  | "insufficient_data"
  | "no_clear_association"
  | "association_found"
  | "association_matches_direction"
  | "association_contradicts_direction";

export const MIN_N = 10;

export const CAUSAL_NOTE_OBSERVATIONAL =
  "Observational data shows association, not effect. Confounding, reverse causation and " +
  "selection can all produce this pattern without the driver moving the metric.";

export const CAUSAL_NOTE_RANDOMIZED =
  "You declared that the driver was randomly assigned. The slope is an effect estimate only " +
  "if assignment, exposure and sample ratios were actually sound; this tool cannot check that.";

export interface OlsFit {
  slope: number;
  intercept: number;
  slopeSe: number;
  slopeCi95: [number, number];
  r2: number;
}

export interface EstimateResult {
  n: number;
  nDropped: number;
  design: StudyDesign;
  pearsonR: number | null;
  rCi95: [number, number] | null;
  ols: OlsFit | null;
  /** slope × mean(x) / mean(y): % change in metric per 1% change in driver, near the means. */
  elasticityAtMeans: number | null;
  elasticitySe: number | null;
  outOfSampleR2: number | null;
  verdict: Verdict;
  verdictText: string;
  causalNote: string;
  whatWouldProveThis: string;
  leakageWarning: string | null;
  warnings: string[];
}

export interface EstimateOptions {
  edge?: MetricEdge;
  design?: StudyDesign;
  seed?: number;
  /** Display names for wording; defaults to edge ids or "driver"/"metric". */
  childName?: string;
  parentName?: string;
}

/** Two-sided 97.5% Student-t quantile (Cornish-Fisher expansion; < 1e-3 error for df ≥ 3). */
export function tCritical95(df: number): number {
  const z = 1.959963984540054;
  if (!Number.isFinite(df) || df <= 0) return Number.NaN;
  const z3 = z ** 3;
  const z5 = z ** 5;
  const z7 = z ** 7;
  return (
    z +
    (z3 + z) / (4 * df) +
    (5 * z5 + 16 * z3 + 3 * z) / (96 * df ** 2) +
    (3 * z7 + 19 * z5 + 17 * z3 - 15 * z) / (384 * df ** 3)
  );
}

function dropNonFinite(x: number[], y: number[]): { xs: number[]; ys: number[]; dropped: number } {
  const xs: number[] = [];
  const ys: number[] = [];
  const n = Math.max(x.length, y.length);
  for (let i = 0; i < n; i++) {
    const a = x[i];
    const b = y[i];
    if (a !== undefined && b !== undefined && Number.isFinite(a) && Number.isFinite(b)) {
      xs.push(a);
      ys.push(b);
    }
  }
  return { xs, ys, dropped: n - xs.length };
}

/** Ordinary least squares y = a + b·x with textbook formulas (no hidden library). */
export function olsFit(xs: number[], ys: number[]): OlsFit | null {
  const n = xs.length;
  if (n < 3) return null;
  const mx = mean(xs);
  const my = mean(ys);
  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = (xs[i] as number) - mx;
    const dy = (ys[i] as number) - my;
    sxx += dx * dx;
    sxy += dx * dy;
    syy += dy * dy;
  }
  if (sxx < 1e-12 || syy < 1e-12) return null;
  const slope = sxy / sxx;
  const intercept = my - slope * mx;
  let sse = 0;
  for (let i = 0; i < n; i++) {
    const r = (ys[i] as number) - (intercept + slope * (xs[i] as number));
    sse += r * r;
  }
  const s2 = sse / (n - 2);
  const slopeSe = Math.sqrt(s2 / sxx);
  const t = tCritical95(n - 2);
  return {
    slope,
    intercept,
    slopeSe,
    slopeCi95: [slope - t * slopeSe, slope + t * slopeSe],
    r2: 1 - sse / syy,
  };
}

/** Fisher-z 95% CI for a Pearson correlation. */
export function correlationCi95(r: number, n: number): [number, number] | null {
  if (n < 4) return null;
  const clamped = Math.max(-0.999999, Math.min(0.999999, r));
  const z = Math.atanh(clamped);
  const se = 1 / Math.sqrt(n - 3);
  return [Math.tanh(z - 1.959963984540054 * se), Math.tanh(z + 1.959963984540054 * se)];
}

/** Deterministic 80/20 split (seeded shuffle); r² of the train fit on the held-out 20%. */
export function outOfSampleR2(xs: number[], ys: number[], seed: number): number | null {
  const n = xs.length;
  const idx = xs.map((_, i) => i);
  const rng = mulberry32(seed);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [idx[i], idx[j]] = [idx[j] as number, idx[i] as number];
  }
  const cut = Math.floor(n * 0.8);
  const train = idx.slice(0, cut);
  const test = idx.slice(cut);
  if (train.length < 5 || test.length < 3) return null;
  const fit = olsFit(
    train.map((i) => xs[i] as number),
    train.map((i) => ys[i] as number),
  );
  if (!fit) return null;
  const testY = test.map((i) => ys[i] as number);
  const my = mean(testY);
  let sse = 0;
  let sst = 0;
  for (const i of test) {
    const y = ys[i] as number;
    const r = y - (fit.intercept + fit.slope * (xs[i] as number));
    sse += r * r;
    sst += (y - my) * (y - my);
  }
  return sst < 1e-12 ? null : 1 - sse / sst;
}

function leakageWarningFor(edge: MetricEdge | undefined): string | null {
  if (edge?.kind !== "identity") return null;
  return (
    "This edge is an identity: the metric is computed from the driver by definition, so a " +
    "strong correlation is guaranteed and tells you nothing new. Testing it is circular."
  );
}

function proofDesign(childName: string, parentName: string, design: StudyDesign): string {
  if (design === "randomized") {
    return (
      `Replicate: re-run the randomized test of ${childName} with a pre-registered metric ` +
      `(${parentName}), a sample-ratio check and a fixed stopping rule.`
    );
  }
  return (
    `Randomize ${childName} (A/B test, holdout or staggered rollout) and compare ` +
    `${parentName} between arms. Only a randomized or quasi-experimental design can ` +
    `separate effect from association.`
  );
}

function classify(
  rCi: [number, number] | null,
  slope: number,
  direction: MetricEdge["direction"],
): Verdict {
  if (!rCi) return "insufficient_data";
  if (rCi[0] <= 0 && rCi[1] >= 0) return "no_clear_association";
  if (!direction || direction === "unclear") return "association_found";
  const expectedSign = direction === "increases" ? 1 : -1;
  return Math.sign(slope) === expectedSign
    ? "association_matches_direction"
    : "association_contradicts_direction";
}

function verdictWording(
  verdict: Verdict,
  design: StudyDesign,
  childName: string,
  parentName: string,
): string {
  const kind = design === "randomized" ? "an effect estimate (randomized, as declared)" : "an association";
  switch (verdict) {
    case "insufficient_data":
      return `Not enough usable data to say anything about ${childName} and ${parentName}.`;
    case "no_clear_association":
      return `No clear association: the 95% interval for the correlation includes zero.`;
    case "association_found":
      return `The data shows ${kind} between ${childName} and ${parentName}.`;
    case "association_matches_direction":
      return `The data shows ${kind} in the direction you hypothesized.`;
    case "association_contradicts_direction":
      return `The data shows ${kind} OPPOSITE to the direction you hypothesized.`;
  }
}

interface Fitted {
  r: number;
  rCi: [number, number] | null;
  ols: OlsFit;
  elasticityAtMeans: number | null;
  elasticitySe: number | null;
}

function fitAll(xs: number[], ys: number[]): Fitted | null {
  const ols = olsFit(xs, ys);
  if (!ols) return null;
  const r = pearson(xs, ys);
  const mx = mean(xs);
  const my = mean(ys);
  const scale = Math.abs(my) < 1e-12 ? null : mx / my;
  return {
    r,
    rCi: correlationCi95(r, xs.length),
    ols,
    elasticityAtMeans: scale === null ? null : ols.slope * scale,
    elasticitySe: scale === null ? null : Math.abs(ols.slopeSe * scale),
  };
}

function dataWarnings(xs: number[], ys: number[], dropped: number): string[] {
  const w: string[] = [];
  if (dropped > 0) w.push(`${dropped} row(s) dropped: empty or non-numeric values.`);
  if (xs.length > 0 && xs.length < MIN_N) w.push(`Only ${xs.length} usable rows; at least ${MIN_N} are required.`);
  if (xs.length >= 2 && fitAll(xs, ys) === null) w.push("A column is constant; correlation is undefined.");
  return w;
}

/** Test one relationship against the user's data. Pure and deterministic for a given seed. */
export function estimateRelationship(
  x: number[],
  y: number[],
  options: EstimateOptions = {},
): EstimateResult {
  const design = options.design ?? "observational";
  const edge = options.edge;
  const childName = options.childName ?? edge?.child ?? "driver";
  const parentName = options.parentName ?? edge?.parent ?? "metric";
  const { xs, ys, dropped } = dropNonFinite(x, y);
  const warnings = dataWarnings(xs, ys, dropped);
  const fitted = xs.length >= MIN_N ? fitAll(xs, ys) : null;
  const verdict = fitted ? classify(fitted.rCi, fitted.ols.slope, edge?.direction) : "insufficient_data";
  return {
    n: xs.length,
    nDropped: dropped,
    design,
    pearsonR: fitted?.r ?? null,
    rCi95: fitted?.rCi ?? null,
    ols: fitted?.ols ?? null,
    elasticityAtMeans: fitted?.elasticityAtMeans ?? null,
    elasticitySe: fitted?.elasticitySe ?? null,
    outOfSampleR2: fitted ? outOfSampleR2(xs, ys, options.seed ?? 42) : null,
    verdict,
    verdictText: verdictWording(verdict, design, childName, parentName),
    causalNote: design === "randomized" ? CAUSAL_NOTE_RANDOMIZED : CAUSAL_NOTE_OBSERVATIONAL,
    whatWouldProveThis: proofDesign(childName, parentName, design),
    leakageWarning: leakageWarningFor(edge),
    warnings,
  };
}

export interface AcceptOutcome {
  accepted: boolean;
  reason: string;
  model: BusinessModel;
}

const ACCEPTABLE: Verdict[] = ["association_found", "association_matches_direction"];

function sameEdge(a: MetricEdge, b: MetricEdge): boolean {
  return a.parent === b.parent && a.child === b.child && a.kind === b.kind;
}

function rejectReason(model: BusinessModel, edge: MetricEdge, result: EstimateResult): string | null {
  if (edge.kind === "identity") return "Identity edges are definitions; there is nothing to estimate.";
  if (!ACCEPTABLE.includes(result.verdict)) return `Verdict '${result.verdict}' cannot update the edge.`;
  if (result.elasticityAtMeans === null || result.elasticitySe === null)
    return "Elasticity is undefined (metric mean is zero).";
  const parentIsIdentity = model.edges.some((e) => e.parent === edge.parent && e.kind === "identity");
  if (parentIsIdentity)
    return `'${edge.parent}' is defined by an identity; a modeled edge into it would double-count. Model the effect on one of its identity inputs instead.`;
  return null;
}

/**
 * Promote an edge after the user accepts a data test.
 * hypothesized → modeled (linear, elasticity at means, normal(±se) distribution).
 * Grade becomes `observational`, or `experimental` only when the user declared randomization.
 */
export function acceptEstimate(
  model: BusinessModel,
  edge: MetricEdge,
  result: EstimateResult,
): AcceptOutcome {
  const reason = rejectReason(model, edge, result);
  if (reason) return { accepted: false, reason, model };
  const elasticity = result.elasticityAtMeans as number;
  const sd = result.elasticitySe as number;
  const grade = result.design === "randomized" ? "experimental" : "observational";
  const note =
    `${grade} test, n=${result.n}, r=${result.pearsonR?.toFixed(3)}, ` +
    `elasticity ${elasticity.toFixed(3)} ± ${sd.toFixed(3)} (1 s.e.). ${result.causalNote}`;
  const updated: MetricEdge = {
    parent: edge.parent,
    child: edge.child,
    kind: "modeled",
    functional_form: edge.functional_form ?? "linear",
    elasticity,
    elasticity_distribution: { kind: "normal", params: { mean: elasticity, sd } },
    mechanism: edge.mechanism ?? edge.rationale ?? `Estimated from user data (${grade}).`,
    evidence_grade: grade,
    evidence_note: note,
    ...(edge.test_cost !== undefined ? { test_cost: edge.test_cost } : {}),
  };
  return {
    accepted: true,
    reason: `Edge updated to modeled with ${grade} grade.`,
    model: { ...model, edges: model.edges.map((e) => (sameEdge(e, edge) ? updated : e)) },
  };
}
