import { expect, test } from "@playwright/test";

test("demo teacher creates a class and the demo student joins it by code", async ({ page }) => {
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));

  await page.goto("/classes");
  await page.getByLabel("Preview as").selectOption("teacher");
  await page.getByRole("button", { name: "Create class" }).click();

  const createDialog = page.getByRole("dialog", { name: "Create classroom" });
  await createDialog.getByLabel("Classroom name").fill("Join flow verification");
  await createDialog.getByLabel("Subject").fill("Programming lab");
  await createDialog.getByLabel("Section").fill("Demo section");
  await createDialog.getByRole("button", { name: "Create classroom" }).click();

  await expect(page.getByRole("heading", { name: "Join flow verification" })).toBeVisible();
  const copyCode = page.getByRole("button", { name: /^Copy join code / });
  const copyLabel = await copyCode.getAttribute("aria-label");
  expect(copyLabel).toBeTruthy();
  const joinCode = copyLabel!.replace("Copy join code ", "");

  await page.getByLabel("Preview as").selectOption("student");
  await page.goto("/classes");
  await page.getByRole("button", { name: "Join class" }).click();

  const joinDialog = page.getByRole("dialog", { name: "Join classroom" });
  await joinDialog.getByLabel("Class code").fill(joinCode);
  await joinDialog.getByRole("button", { name: "Join classroom" }).click();

  await expect(page.getByRole("heading", { name: "Join flow verification" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "No practicals published yet" })).toBeVisible();
  expect(browserErrors).toEqual([]);
});
