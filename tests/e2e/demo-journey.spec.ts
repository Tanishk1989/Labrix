import { expect, test } from "@playwright/test";

test("professor demo: teacher, student, and teacher progress journey", async ({ page }) => {
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));

  await page.goto("/classes");
  await expect(page.getByRole("heading", { name: "Classes" })).toBeVisible();
  await page.getByRole("link", { name: "View class work for DSA Practical Lab" }).click();
  await expect(page.getByRole("heading", { name: "DSA Practical Lab" })).toBeVisible();
  await expect(page.getByText("Array Sum", { exact: true })).toBeVisible();

  await page.getByLabel("Preview as").selectOption("student");
  await expect(page.getByRole("heading", { name: "DSA Practical Lab" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Practicals" })).toHaveAttribute("href", "/practicals?classroom=dsa-2026");
  await expect(page.getByRole("link", { name: "Submissions" })).toHaveAttribute("href", "/submissions?classroom=dsa-2026");
  await expect(page.getByRole("link", { name: "Progress" })).toHaveAttribute("href", "/progress?classroom=dsa-2026");
  await page.goto("/practicals/two-sum");
  await page.getByRole("link", { name: "Start coding" }).click();
  await expect(page.getByRole("heading", { name: "Array Sum" })).toBeVisible();
  await expect(page.getByText(/Simulated execution only/)).toBeVisible();

  await page.getByRole("button", { name: "Run visible tests" }).click();
  await expect(page.getByText("1/3 provided tests passed")).toBeVisible();
  const editor = page.locator(".monaco-editor .view-lines");
  await editor.click();
  await page.keyboard.press("Control+A");
  await page.keyboard.type("#include <iostream>\nusing namespace std;\nint main() { return 0; }");
  await expect(page.getByText("All changes saved")).toBeVisible();
  await page.getByRole("button", { name: "Run visible tests" }).click();
  await expect(page.getByText("Passed all provided tests")).toBeVisible();
  await page.getByRole("button", { name: "Submit attempt" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Submit attempt" }).click();
  await expect(page.getByText("Your submission was recorded")).toBeVisible();
  await expect(page.getByRole("link", { name: "View submission" })).toBeVisible();

  await page.goto("/classes");
  await page.getByLabel("Preview as").selectOption("teacher");
  await page.goto("/classes/dsa-2026/students");
  await expect(page.getByRole("heading", { name: "DSA Practical Lab students" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Active student roster" })).toBeVisible();
  await expect(page.locator("table").getByText("Aarav Mehta")).toBeVisible();
  await page.getByRole("link", { name: "Reviews" }).first().click();
  await expect(page.getByRole("heading", { name: "Submitted source" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Process timeline" })).toBeVisible();
  await expect(page.getByText("Submission recorded")).toBeVisible();
  expect(browserErrors).toEqual([]);
});
