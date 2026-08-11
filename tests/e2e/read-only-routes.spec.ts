import { expect, test } from "@playwright/test";
import {
  captureDatabaseFingerprint,
  disconnectReadOnlyDatabase,
  monitorApplicationMutations,
  requireReadOnlyFixtures,
} from "./read-only-safety";

let initialFingerprint: string;
let classroomId: string;
let classroomName: string;
let submissionId: string;

test.beforeAll(async () => {
  initialFingerprint = await captureDatabaseFingerprint();
  ({ classroomId, classroomName, submissionId } = await requireReadOnlyFixtures());
});

test.afterAll(async () => {
  const finalFingerprint = await captureDatabaseFingerprint();
  expect(finalFingerprint).toBe(initialFingerprint);
  await disconnectReadOnlyDatabase();
});

test("teacher core navigation remains read only", async ({ page }) => {
  const mutationRequests = monitorApplicationMutations(page);
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));

  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("Teacher workspace").first()).toBeVisible();

  await page.goto("/classes");
  await expect(page.getByRole("heading", { name: "Classes" })).toBeVisible();

  await page.goto(`/classes/${classroomId}`);
  await expect(page.getByRole("heading", { name: classroomName })).toBeVisible();

  await page.goto(`/classes/${classroomId}/students`);
  await expect(page.getByRole("heading", { name: classroomName })).toBeVisible();

  await page.goto("/practicals");
  await expect(page.getByRole("heading", { name: "Practicals" })).toBeVisible();

  await page.goto("/progress");
  await expect(page.getByRole("heading", { name: "Progress" })).toBeVisible();

  await page.goto("/submissions");
  await expect(page.getByRole("heading", { name: "Review queue" })).toBeVisible();

  await page.goto(`/submissions/${submissionId}`);
  await expect(page.getByText("Teacher review · Immutable attempt")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Stored result snapshot" })).toBeVisible();

  expect(mutationRequests).toEqual([]);
  expect(browserErrors).toEqual([]);
});
