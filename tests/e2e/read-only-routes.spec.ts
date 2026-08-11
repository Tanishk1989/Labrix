import { expect, test } from "@playwright/test";

test("read-only professor route smoke check", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  await page.goto("/classes");
  await expect(page.getByRole("heading", { name: "Classes" })).toBeVisible();

  await page.goto("/classes/dsa-2026");
  await expect(page.getByRole("heading", { name: "DSA Practical Lab" })).toBeVisible();

  await page.goto("/classes/dsa-2026/students");
  await expect(page.getByRole("heading", { name: "DSA Practical Lab" })).toBeVisible();

  await page.goto("/submissions");
  await expect(page.getByRole("heading", { name: "Review queue" })).toBeVisible();
});
