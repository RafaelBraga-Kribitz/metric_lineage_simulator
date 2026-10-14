/**
 * Headline worked example: "What should we test first?" on the DTC seed.
 * Reproduce: `cd driver_tree_studio && npm run example` (writes docs/results/).
 * Deterministic: fixed seed and run count.
 */
import { buildWorkedExample, renderWorkedExampleMarkdown } from "../src/engine/workedExample";
import seed from "../src/content/dtc_ecommerce.json";
import type { BusinessModel } from "../src/schema/types";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, "../../docs/results");
const example = buildWorkedExample(seed as unknown as BusinessModel);
mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, "worked_example.json"), JSON.stringify(example, null, 2) + "\n");
writeFileSync(resolve(outDir, "worked_example.md"), renderWorkedExampleMarkdown(example));
console.log(renderWorkedExampleMarkdown(example));
