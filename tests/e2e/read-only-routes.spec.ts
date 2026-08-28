import { expect, test } from "@playwright/test";

test("read-only professor route smoke check", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Prepare. Challenge. Elevate." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Dashboard", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("link", { name: "Reviews", exact: true })).toHaveAttribute("href", "/submissions");

  await page.goto("/classes");
  await expect(page.getByRole("heading", { name: "Classes" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Owned classes" })).toBeVisible();

  await page.goto("/practicals");
  await expect(page.getByRole("heading", { name: "Practicals" })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Published \d+$/ })).toHaveAttribute(
    "href",
    "/practicals?status=PUBLISHED",
  );
  await expect(page.getByRole("link", { name: /^(View and manage|Continue editing) / }).first()).toHaveAttribute(
    "href",
    /\/classes\/[^/]+\/tasks\/[^/]+\/edit$/,
  );

  await page.goto("/classes/dsa-2026");
  await expect(page.getByRole("heading", { name: "DSA Practical Lab" })).toBeVisible();

  await page.goto("/classes/dsa-2026/students");
  await expect(page.getByRole("heading", { name: "DSA Practical Lab students" })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Active students \d+$/ })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("heading", { name: "Active student roster" })).toBeVisible();

  await page.goto("/progress?classroom=dsa-2026");
  await expect(page.getByRole("heading", { name: "DSA Practical Lab progress" })).toBeVisible();

  await page.goto("/submissions?review=NEW");
  await expect(page.getByRole("heading", { name: "Review" })).toBeVisible();
  await expect(page.getByRole("link", { name: /^New \d+$/ })).toHaveAttribute(
    "aria-current",
    "page",
  );

  await page.getByRole("link", { name: /^Review attempt / }).first().click();
  await expect(page.getByRole("link", { name: "Reviews Queue" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Code Inspection Suite" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Marks and feedback" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save draft" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Publish feedback" })).toBeVisible();

  await page.goto("/progress");
  await expect(page.getByRole("heading", { name: "Progress", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Practical submissions and outcomes" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Needs attention" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Student progress" })).toBeVisible();
});
