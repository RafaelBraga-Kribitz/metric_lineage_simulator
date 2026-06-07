/**
 * Shared chip/badge styling for edge kinds and evidence grades.
 */
import { cn } from "@/lib/utils";
import type { EdgeKind, EvidenceGrade } from "@/schema/types";

const EDGE_KIND_STYLES: Record<
  EdgeKind,
  { bg: string; text: string; border: string; label: string }
> = {
  identity: {
    bg: "var(--color-edge-identity)",
    text: "#ffffff",
    border: "var(--color-edge-identity)",
    label: "identity",
  },
  modeled: {
    bg: "var(--color-edge-modeled)",
    text: "#ffffff",
    border: "var(--color-edge-modeled)",
    label: "modeled",
  },
  hypothesized: {
    bg: "var(--color-grade-none-bg)",
    text: "var(--color-grade-none-text)",
    border: "var(--color-edge-hypothesized)",
    label: "hypothesized",
  },
};

const GRADE_STYLES: Record<
  EvidenceGrade,
  { bg: string; text: string }
> = {
  none: {
    bg: "var(--color-grade-none-bg)",
    text: "var(--color-grade-none-text)",
  },
  illustrative: {
    bg: "var(--color-grade-illustrative-bg)",
    text: "var(--color-grade-illustrative-text)",
  },
  estimated: {
    bg: "var(--color-grade-estimated-bg)",
    text: "var(--color-grade-estimated-text)",
  },
  anecdotal: {
    bg: "var(--color-grade-anecdotal-bg)",
    text: "var(--color-grade-anecdotal-text)",
  },
  observational: {
    bg: "var(--color-grade-observational-bg)",
    text: "var(--color-grade-observational-text)",
  },
  experimental: {
    bg: "var(--color-grade-experimental-bg)",
    text: "var(--color-grade-experimental-text)",
  },
};

export function EdgeKindChip({
  kind,
  className,
}: {
  kind: EdgeKind;
  className?: string;
}) {
  const s = EDGE_KIND_STYLES[kind];
  return (
    <span
      className={cn(
        "inline-block rounded-full px-1.5 py-0.5 text-[10px] font-bold lowercase tracking-wide",
        className,
      )}
      style={{
        background: s.bg,
        color: s.text,
        border: `1px solid ${s.border}`,
      }}
    >
      {s.label}
    </span>
  );
}

export function EvidenceGradeChip({
  grade,
  className,
}: {
  grade: EvidenceGrade;
  className?: string;
}) {
  const s = GRADE_STYLES[grade];
  return (
    <span
      className={cn(
        "inline-block rounded-full px-1.5 py-0.5 text-[10px] font-bold lowercase tracking-wide",
        className,
      )}
      style={{ background: s.bg, color: s.text }}
    >
      {grade}
    </span>
  );
}

export function getLayerStyles(layer: string): {
  badgeBg: string;
  badgeText: string;
  fill: string;
  text: string;
  hoverBorder: string;
} {
  switch (layer) {
    case "north_star":
      return {
        badgeBg: "var(--color-layer-north-star)",
        badgeText: "#ffffff",
        fill: "var(--color-node-north-star-fill)",
        text: "var(--color-node-north-star-text)",
        hoverBorder: "var(--color-layer-north-star)",
      };
    case "outcome":
    case "strategic_objective":
      return {
        badgeBg: "var(--color-layer-outcome)",
        badgeText: "#ffffff",
        fill: "var(--color-node-outcome-fill)",
        text: "var(--color-node-outcome-text)",
        hoverBorder: "var(--color-layer-outcome)",
      };
    case "guardrail":
      return {
        badgeBg: "var(--color-layer-guardrail)",
        badgeText: "#ffffff",
        fill: "var(--color-node-guardrail-fill)",
        text: "var(--color-node-guardrail-text)",
        hoverBorder: "var(--color-layer-guardrail)",
      };
    case "counter":
      return {
        badgeBg: "var(--color-layer-counter)",
        badgeText: "#ffffff",
        fill: "var(--color-node-driver-fill)",
        text: "var(--color-node-driver-text)",
        hoverBorder: "var(--color-layer-counter)",
      };
    case "input":
      return {
        badgeBg: "var(--color-layer-input)",
        badgeText: "#ffffff",
        fill: "var(--color-node-input-fill)",
        text: "var(--color-node-input-text)",
        hoverBorder: "var(--color-text-muted)",
      };
    default:
      return {
        badgeBg: "var(--color-layer-driver)",
        badgeText: "#e2e8f0",
        fill: "var(--color-node-driver-fill)",
        text: "var(--color-node-driver-text)",
        hoverBorder: "var(--color-layer-driver)",
      };
  }
}

export function layerLabel(layer: string): string {
  return layer.replace(/_/g, " ");
}
