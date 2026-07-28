import { expect, test } from "@playwright/test";

test.describe("cold API error states", () => {
  test("scoreboard shows Alert when API is unreachable", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("scoreboard-error")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("Could not load the scoreboard")).toBeVisible();
    await expect(page.getByTestId("scoreboard")).toHaveCount(0);
  });

  test("experiment detail shows Alert when API is unreachable", async ({
    page,
  }) => {
    await page.goto("/experiments/exp1");
    await expect(page.getByTestId("experiment-error")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/Could not load/)).toBeVisible();
    await expect(page.getByTestId("experiment-detail")).toHaveCount(0);
  });
});
