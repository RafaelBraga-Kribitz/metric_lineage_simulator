import { expect, test } from "@playwright/test";

test("analysis tabs: tornado, Monte Carlo worker result, untested beliefs; keyboard navigable", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/");

  await expect(page.getByRole("note").filter({ hasText: "Illustrative DTC e-commerce model" })).toBeVisible();
  const sensitivity = page.getByRole("tab", { name: "Sensitivity" });
  await expect(sensitivity).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("figure", { name: /Tornado/ })).toBeVisible();

  await sensitivity.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Forecast range" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText("P50", { exact: true })).toBeVisible();
  await expect(page.getByText(/^€[\d,]+$/).first()).toBeVisible();
  await expect(page.getByText(/uncertainty in your GUESS, not evidence/)).toBeVisible();

  await page.keyboard.press("ArrowRight");
  await expect(page.getByText(/Belief: .*Page Load Speed/)).toBeVisible();
  expect(errors).toEqual([]);
});
