/**
 * Power BI build-kit artifacts derived from a model and the CSS design tokens.
 * A .pbix cannot be produced here; docs/powerbi/README.md is the human build guide.
 */
import { topoOrder } from "../engine/graph.js";
import type { BusinessModel } from "../schema/types.js";
import { mulberry32, sampleNormal } from "./rng.js";

/** Parse `--color-*: #hex;` declarations from globals.css. */
export function parseCssTokens(css: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of css.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6,8})\s*;/g)) out[m[1] as string] = (m[2] as string).toLowerCase();
  return out;
}

export function powerBiTheme(tokens: Record<string, string>): Record<string, unknown> {
  const t = (k: string) => {
    const v = tokens[k];
    if (!v) throw new Error(`design token --color-${k} missing`);
    return v.slice(0, 7);
  };
  return {
    name: "Metric Driver-Tree Studio (dark, from CLAUDE_DESIGN_SYSTEM.md tokens)",
    dataColors: [t("edge-identity"), t("edge-modeled"), t("edge-hypothesized"), t("layer-outcome"), t("layer-north-star"), t("delta-positive"), t("delta-negative"), t("braga-coral")],
    background: t("bg-app"),
    foreground: t("text-primary"),
    tableAccent: t("edge-identity"),
    good: t("delta-positive"),
    bad: t("delta-negative"),
    neutral: t("text-muted"),
    textClasses: {
      title: { fontFace: "DM Sans", fontSize: 14, color: t("text-primary") },
      label: { fontFace: "DM Sans", fontSize: 10, color: t("text-muted") },
      callout: { fontFace: "DM Sans", fontSize: 28, color: t("text-primary") },
    },
    visualStyles: {
      "*": {
        "*": {
          background: [{ color: { solid: { color: t("bg-panel") } }, transparency: 0 }],
          border: [{ color: { solid: { color: t("border-default") } }, show: true }],
        },
      },
    },
  };
}

/**
 * SYNTHETIC long-format inputs: 12 monthly periods, each input = baseline × (1 + N(0, 5%)).
 * For exercising the SQL view and DAX measures only; not data about any business.
 */
export function syntheticInputsCsv(model: BusinessModel, seed = 11): string {
  const isParent = new Set(model.edges.filter((e) => e.kind === "identity").map((e) => e.parent));
  const inputs = topoOrder(model).filter((id) => !isParent.has(id));
  const rng = mulberry32(seed);
  const rows = ["period,metric_id,value"];
  for (let m = 1; m <= 12; m++) {
    const period = `2026-${String(m).padStart(2, "0")}-01`;
    for (const id of inputs) {
      const base = model.nodes.find((n) => n.id === id)?.baseline ?? 0;
      const v = base * (1 + sampleNormal(rng, 0, 0.05));
      rows.push(`${period},${id},${Number(v.toPrecision(8))}`);
    }
  }
  return rows.join("\n") + "\n";
}
