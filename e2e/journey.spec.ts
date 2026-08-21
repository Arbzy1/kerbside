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

test("I4 provision and lane detection open their distinct evidence pages", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByTestId("scoreboard")).toBeVisible({ timeout: 30_000 });

  const provisionCard = page
    .getByTestId("verdict-card")
    .filter({ hasText: "Cycle provision as routing impedance" });
  await expect(provisionCard.getByText("157× Manchester's noise floor")).toBeVisible();
  await expect(provisionCard).toContainText("Bristol -0.0071");
  await provisionCard.getByTestId("verdict-card-link").click();
  await expect(page).toHaveURL(
    /\/experiments\/cycle_provision#k133_i4_direct_osm$/,
  );
  await expect(
    page.getByRole("heading", {
      name: "Cycle provision as routing impedance",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator("#k133_i4_direct_osm")).toBeVisible();

  await page.goto("/");
  const detectionCard = page
    .getByTestId("verdict-card")
    .filter({ hasText: "detection failure was geometric" });
  await detectionCard.getByTestId("verdict-card-link").click();
  await expect(page).toHaveURL(
    /\/experiments\/cycle_detection#k139b_geometry$/,
  );
  await expect(
    page.getByRole("heading", {
      name: "Street View cycle-lane detection",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator("#k139b_geometry")).toBeVisible();
});

test("scoreboard to cities transfer view", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("scoreboard")).toBeVisible({ timeout: 30_000 });

  await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Cities", exact: true }).click();
  await expect(page.getByTestId("cities-page")).toBeVisible({ timeout: 30_000 });

  const tableRows = page.getByTestId("city-transfer-table").locator("tbody tr");
  await expect(tableRows).toHaveCount(12);
  await expect(page.getByTestId("cardiff-best")).toBeVisible();
  await expect(page.getByTestId("cardiff-best")).toContainText("Cardiff");
  await expect(page.getByTestId("city-transfer-table")).toContainText("Cardiff");
});

test("controls page shows null charts", async ({ page }) => {
  await page.goto("/controls");
  await expect(page.getByTestId("controls-page")).toBeVisible({
    timeout: 30_000,
  });
  const charts = page.getByTestId("control-null-chart");
  await expect(charts.first()).toBeVisible();
  expect(await charts.count()).toBeGreaterThanOrEqual(5);
});
