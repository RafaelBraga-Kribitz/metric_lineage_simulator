import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import seed from "../../src/content/dtc_ecommerce.json";
import { daxMeasures, kpiDefinitionsCsv, kpiSql } from "../../src/lib/exporters.js";
import { parseCssTokens, powerBiTheme, syntheticInputsCsv } from "../../src/lib/powerbiKit.js";
import type { BusinessModel } from "../../src/schema/types.js";

const dtc = seed as unknown as BusinessModel;
const kit = (name: string) => readFileSync(new URL(`../../../docs/powerbi/${name}`, import.meta.url), "utf8");
const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

describe("Power BI kit is reproducible from the seed and the design tokens", () => {
  it("committed files equal a fresh export", () => {
    expect(kit("kpi_definitions.csv")).toBe(kpiDefinitionsCsv(dtc));
    expect(kit("kpi_tree.sql")).toBe(kpiSql(dtc));
    expect(kit("measures.dax")).toBe(daxMeasures(dtc));
    expect(kit("kpi_inputs_SYNTHETIC.csv")).toBe(syntheticInputsCsv(dtc));
    expect(JSON.parse(kit("theme.json"))).toEqual(powerBiTheme(parseCssTokens(css)));
  });

  it("theme colours come from the edge-kind tokens", () => {
    const tokens = parseCssTokens(css);
    const theme = powerBiTheme(tokens) as { dataColors: string[] };
    expect(theme.dataColors.slice(0, 3)).toEqual([tokens["edge-identity"], tokens["edge-modeled"], tokens["edge-hypothesized"]]);
    expect(() => powerBiTheme({})).toThrow(/token/);
  });
});
