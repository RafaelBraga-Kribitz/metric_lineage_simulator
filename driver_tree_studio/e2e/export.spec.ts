import { expect, test } from "@playwright/test";

test("export tab downloads SQL generated from the current model", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Export (SQL / Power BI)" }).click();
  await expect(page.getByRole("cell", { name: "Deckungsbeitrag" })).toBeVisible();
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "SQL view (DDL)" }).click()]);
  expect(download.suggestedFilename()).toBe("kpi_tree.sql");
  const body = await (await download.createReadStream()).toArray();
  expect(Buffer.concat(body).toString()).toContain("CREATE VIEW kpi_tree AS");
});
