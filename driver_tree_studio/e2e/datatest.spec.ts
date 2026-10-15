import { expect, test } from "@playwright/test";
import path from "node:path";

test("data test: synthetic example yields association (not effect) and can be accepted", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("tab", { name: "Test with your data" }).click();
  await page.getByRole("button", { name: /Load synthetic example/ }).click();
  await expect(page.getByText("The data shows an association in the direction you hypothesized.")).toBeVisible();
  await expect(page.getByText(/association, not effect/)).toBeVisible();
  await expect(page.getByText(/What would prove this/)).toBeVisible();
  await page.getByRole("button", { name: "Accept and update the edge" }).click();
  await expect(page.getByRole("status").filter({ hasText: "observational grade" })).toBeVisible();
  await page.getByRole("tab", { name: "Untested beliefs" }).click();
  await expect(page.getByText(/Belief: .*Loyalty Membership/)).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("data test: uploaded German CSV against an identity edge warns about leakage", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Test with your data" }).click();
  await page.getByLabel("Relationship to test").selectOption({ label: "Sessions → Orders (identity)" });
  await page.locator('input[type="file"]').setInputFiles(path.join(__dirname, "../tests/fixtures/anscombe_1_de.csv"));
  await expect(page.getByText(/delimiter “;”/)).toBeVisible();
  await expect(page.getByRole("alert").filter({ hasText: "identity" })).toContainText("circular");
  await expect(page.getByRole("button", { name: "Accept and update the edge" })).toHaveCount(0);
});
