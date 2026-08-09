import { expect, test } from "@playwright/test";

test("professor demo: teacher, student, and teacher progress journey", async ({ page }) => {
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));

  await page.goto("/classes");
  await expect(page.getByRole("heading", { name: "My Classes" })).toBeVisible();
  await page.getByRole("link", { name: /Open class/i }).click();
  await expect(page.getByRole("heading", { name: "DSA Practical Lab" })).toBeVisible();
  await expect(page.getByText("Array Sum", { exact: true })).toBeVisible();

  await page.getByLabel("Demo role").selectOption("student");
  await expect(page.getByRole("heading", { name: "Your practicals" })).toBeVisible();
  await page.getByRole("link", { name: "Start practical" }).click();
  await expect(page.getByRole("heading", { name: "Array Sum" })).toBeVisible();

  await page.getByRole("button", { name: "Run" }).click();
  await expect(page.getByText("1/2 provided tests passed")).toBeVisible();
  const editor = page.locator(".monaco-editor .view-lines");
  await editor.click();
  await page.keyboard.press("Control+A");
  await page.keyboard.type("#include <iostream>\nusing namespace std;\nint main() { return 0; }");
  await page.getByRole("button", { name: "Run" }).click();
  await expect(page.getByText("Passed all provided tests")).toBeVisible();
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText("Submitted successfully")).toBeVisible();

  await page.getByLabel("Demo role").selectOption("teacher");
  await page.goto("/classes/dsa-2026/students");
  await expect(page.getByRole("heading", { name: "Practical progress" })).toBeVisible();
  await expect(page.getByText("Aarav Mehta")).toBeVisible();
  await expect(page.getByText("Submitted").first()).toBeVisible();
  await page.getByRole("link", { name: "Review" }).first().click();
  await expect(page.getByRole("heading", { name: /submission/ })).toBeVisible();
  expect(browserErrors).toEqual([]);
});
