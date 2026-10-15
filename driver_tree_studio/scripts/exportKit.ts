/**
 * Regenerate the analyst-stack exports for the DTC seed into docs/powerbi/.
 * Reproduce: `cd driver_tree_studio && npm run export`. Do not edit the outputs by hand.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import seed from "../src/content/dtc_ecommerce.json";
import { daxMeasures, kpiDefinitionsCsv, kpiSql } from "../src/lib/exporters";
import { parseCssTokens, powerBiTheme, syntheticInputsCsv } from "../src/lib/powerbiKit";
import type { BusinessModel } from "../src/schema/types";

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, "../../docs/powerbi");
const model = seed as unknown as BusinessModel;
const tokens = parseCssTokens(readFileSync(resolve(here, "../app/globals.css"), "utf8"));
mkdirSync(out, { recursive: true });
const files: Record<string, string> = {
  "kpi_definitions.csv": kpiDefinitionsCsv(model),
  "kpi_tree.sql": kpiSql(model),
  "measures.dax": daxMeasures(model),
  "kpi_inputs_SYNTHETIC.csv": syntheticInputsCsv(model),
  "theme.json": JSON.stringify(powerBiTheme(tokens), null, 2) + "\n",
};
for (const [name, body] of Object.entries(files)) writeFileSync(resolve(out, name), body);
console.log(`wrote ${Object.keys(files).length} files to docs/powerbi/`);
