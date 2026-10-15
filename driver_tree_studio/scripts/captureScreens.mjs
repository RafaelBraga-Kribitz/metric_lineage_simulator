/**
 * Regenerate README images from the REAL built UI (no mock-ups).
 *   npm run build && npm run screenshots
 * Writes docs/assets/{hero.png, what-to-test-first.png, data-test.png} and GIF frames to
 * a temp dir, then scripts/make_gif.py assembles docs/assets/demo.gif (Pillow).
 */
import { chromium } from "@playwright/test";
import { spawn, execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const assets = resolve(here, "../../docs/assets");
const frames = mkdtempSync(join(tmpdir(), "dts-frames-"));
mkdirSync(assets, { recursive: true });

const server = spawn("npx", ["serve", "out", "-l", "4199", "--no-clipboard"], { cwd: resolve(here, ".."), stdio: "ignore" });
await new Promise((r) => setTimeout(r, 2500));
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:4199/");
  await page.waitForTimeout(1500);
  let n = 0;
  const frame = async () => page.screenshot({ path: join(frames, `f${String(n++).padStart(2, "0")}.png`) });

  // Hero: header + driver tree, 1600×640 like the previous banner slot.
  const hero = await browser.newPage({ viewport: { width: 1600, height: 640 } });
  await hero.goto("http://localhost:4199/");
  await hero.waitForTimeout(1500);
  await hero.screenshot({ path: join(assets, "hero.png") });

  await frame();
  const analysis = page.locator("section[aria-labelledby='analysis-heading']");
  await analysis.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await analysis.screenshot({ path: join(assets, "what-to-test-first.png") });
  await frame();

  await page.getByRole("tab", { name: "Sensitivity" }).click();
  await page.waitForTimeout(500);
  await frame();
  await page.getByRole("tab", { name: "Forecast range" }).click();
  await page.waitForTimeout(1200);
  await frame();
  await page.getByRole("tab", { name: "Test with your data" }).click();
  await page.getByRole("button", { name: /Load synthetic example/ }).click();
  await page.waitForTimeout(500);
  await page.getByText("What would prove this").scrollIntoViewIfNeeded();
  await frame();
  await analysis.screenshot({ path: join(assets, "data-test.png") });
  await page.getByRole("tab", { name: "Export (SQL / Power BI)" }).click();
  await page.waitForTimeout(400);
  await analysis.scrollIntoViewIfNeeded();
  await frame();
} finally {
  await browser.close();
  server.kill();
}
execFileSync("python3", [resolve(here, "make_gif.py"), frames, join(assets, "demo.gif")], { stdio: "inherit" });
console.log(`wrote hero.png, what-to-test-first.png, data-test.png, demo.gif to ${assets}`);
