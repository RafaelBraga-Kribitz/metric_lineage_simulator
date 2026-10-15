import { expect, test } from "@playwright/test";

const northStar = (page: import("@playwright/test").Page) =>
  page.getByText("Contribution Profit (north star)").locator("xpath=following-sibling::div[1]");

test("share link reproduces model + levers; embed renders it without console errors", async ({ page, context }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/");
  const aov = page.getByRole("slider", { name: "Average Order Value lever" });
  await aov.focus();
  for (let i = 0; i < 10; i++) await page.keyboard.press("ArrowRight");
  const changed = await northStar(page).innerText();
  expect(changed).not.toBe("€48,000");

  await page.getByRole("button", { name: "Share link" }).click();
  await expect(page).toHaveURL(/#s=v1\./);
  const url = page.url();

  const fresh = await context.newPage();
  await fresh.goto(url);
  await expect(northStar(fresh)).toHaveText(changed);
  await expect(fresh.getByText(/loaded from a shared link/)).toBeVisible();

  const embed = await context.newPage();
  const embedErrors: string[] = [];
  embed.on("pageerror", (e) => embedErrors.push(e.message));
  embed.on("console", (m) => m.type() === "error" && embedErrors.push(m.text()));
  await embed.goto(url.replace(/\/(#|$)/, "/embed$1"));
  await expect(embed.locator(".react-flow__node").first()).toBeVisible();
  await expect(embed.getByRole("strong").filter({ hasText: changed })).toBeVisible();
  expect(errors).toEqual([]);
  expect(embedErrors).toEqual([]);
});

test("a corrupted share link shows an error instead of crashing", async ({ page }) => {
  await page.goto("/#s=v1.not-really-deflate");
  await expect(page.getByRole("status").filter({ hasText: "corrupted" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Metric Driver-Tree Studio/ })).toBeVisible();
});
