import { expect, test, type ConsoleMessage } from "@playwright/test";

test("studio loads with the three edge kinds and no console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m: ConsoleMessage) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Metric Driver-Tree Studio/i })).toBeVisible();
  await expect(page.getByText(/Identity reconciled/i).first()).toBeVisible();
  await expect(page.locator(".react-flow__node").first()).toBeVisible();
  for (const kind of ["identity", "modeled", "hypothesized"]) {
    await expect(page.locator(`.react-flow__edge-${kind}`).first()).toBeAttached();
  }
  expect(errors).toEqual([]);
});
