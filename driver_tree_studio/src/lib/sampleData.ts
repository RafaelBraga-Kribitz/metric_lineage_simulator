/**
 * SYNTHETIC example data for the data-test panel. Generated deterministically in the
 * browser; not real customers, not real companies. It is built WITH a selection effect
 * (heavier buyers are likelier to enroll), so a positive association appears even though
 * the generator gives enrollment no effect on spend: the trap the tool warns about.
 */
import { mulberry32, sampleNormal } from "./rng";

export const SAMPLE_NOTE =
  "SYNTHETIC example: 52 weekly cohorts generated with seed 7. Spend drives enrollment in the generator; enrollment has no effect on LTV.";

export function syntheticLoyaltyCsv(seed = 7, weeks = 52): string {
  const rng = mulberry32(seed);
  const rows = ["week,loyalty_membership,customer_ltv"];
  for (let w = 1; w <= weeks; w++) {
    const appetite = sampleNormal(rng, 0, 1); // latent cohort spending appetite
    const ltv = 200 * Math.exp(0.15 * appetite + sampleNormal(rng, 0, 0.05));
    const membership = Math.min(0.95, Math.max(0.05, 0.4 + 0.08 * appetite + sampleNormal(rng, 0, 0.02)));
    rows.push(`${w},${membership.toFixed(4)},${ltv.toFixed(2)}`);
  }
  return rows.join("\n");
}
