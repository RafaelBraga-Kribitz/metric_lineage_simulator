/**
 * Derives DTC session-to-order funnel stages from funnel_stage_order nodes and computed values.
 */
import type { BusinessModel } from "../schema/types";

export interface FunnelStage {
  label: string;
  count: number;
  /** Conversion rate to the next stage (0–1); null when there is no next stage. */
  conversionToNext: number | null;
}

const STAGE_LABELS = [
  "Sessions",
  "Product Views",
  "Carts",
  "Checkouts",
  "Orders",
] as const;

export function buildFunnelStages(
  model: BusinessModel,
  values: Record<string, number>,
): FunnelStage[] | null {
  const funnelNodes = model.nodes
    .filter((n) => n.funnel_stage_order != null)
    .sort(
      (a, b) => (a.funnel_stage_order ?? 0) - (b.funnel_stage_order ?? 0),
    );

  if (funnelNodes.length === 0) return null;

  const sessions = values.sessions ?? 0;
  const stages: FunnelStage[] = [
    {
      label: STAGE_LABELS[0],
      count: sessions,
      conversionToNext: values[funnelNodes[0]!.id] ?? funnelNodes[0]!.baseline,
    },
  ];

  let cumulative = sessions;
  for (let i = 0; i < funnelNodes.length; i++) {
    const node = funnelNodes[i]!;
    const rate = values[node.id] ?? node.baseline;
    cumulative *= rate;

    const label = STAGE_LABELS[i + 1]!;
    const isLast = i === funnelNodes.length - 1;
    const count = isLast ? (values.orders ?? cumulative) : cumulative;
    const nextRate = isLast
      ? null
      : (values[funnelNodes[i + 1]!.id] ?? funnelNodes[i + 1]!.baseline);

    stages.push({
      label,
      count,
      conversionToNext: nextRate,
    });
  }

  return stages;
}

export function hasFunnelStages(model: BusinessModel): boolean {
  return model.nodes.some((n) => n.funnel_stage_order != null);
}
