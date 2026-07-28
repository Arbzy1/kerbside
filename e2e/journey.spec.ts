import { expect, test } from "@playwright/test";

test("scoreboard to experiment detail journey", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByTestId("scoreboard")).toBeVisible({ timeout: 30_000 });
  const cards = page.getByTestId("verdict-card");
  await expect(cards.first()).toBeVisible();

  const linkedCard = page.getByTestId("verdict-card-link").first();
  await expect(linkedCard).toBeVisible();
  await linkedCard.click();

  await expect(page.getByTestId("experiment-detail")).toBeVisible({
    timeout: 30_000,
  });
  const rows = page.getByTestId("model-ladder-table").locator("tbody tr");
  await expect(rows.first()).toBeVisible();
  expect(await rows.count()).toBeGreaterThan(1);
});

test("scoreboard to cities transfer view", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("scoreboard")).toBeVisible({ timeout: 30_000 });

  await page.getByRole("navigation").getByRole("link", { name: "Cities", exact: true }).click();
  await expect(page.getByTestId("cities-page")).toBeVisible({ timeout: 30_000 });

  const tableRows = page.getByTestId("city-transfer-table").locator("tbody tr");
  await expect(tableRows).toHaveCount(15);
  await expect(page.getByTestId("cardiff-contrast")).toBeVisible();
  await expect(page.getByTestId("cardiff-contrast")).toContainText("Cardiff");
  await expect(page.getByTestId("city-transfer-table")).not.toContainText(
    "Cardiff",
  );
});
