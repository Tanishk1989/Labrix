import { expect, test } from "@playwright/test";
import {
  captureDatabaseFingerprint,
  disconnectReadOnlyDatabase,
  hiddenTestValues,
  monitorApplicationMutations,
  requireReadOnlyFixtures,
} from "./read-only-safety";

let initialFingerprint: string;
let classroomId: string;
let classroomName: string;
let submissionId: string;
let taskId: string;
let taskTitle: string;

test.beforeAll(async () => {
  initialFingerprint = await captureDatabaseFingerprint();
  ({
    classroomId,
    classroomName,
    submissionId,
    taskId,
    taskTitle,
  } = await requireReadOnlyFixtures());
});

test.afterAll(async () => {
  const finalFingerprint = await captureDatabaseFingerprint();
  expect(finalFingerprint).toBe(initialFingerprint);
  await disconnectReadOnlyDatabase();
});

test("student core navigation and stored result remain read only", async ({ page }) => {
  const mutationRequests = monitorApplicationMutations(page);
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));

  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("Student workspace").first()).toBeVisible();

  await page.goto("/classes");
  await expect(page.getByRole("heading", { name: "Classes" })).toBeVisible();

  await page.goto(`/classes/${classroomId}`);
  await expect(page.getByRole("heading", { name: classroomName })).toBeVisible();

  await page.goto("/practicals");
  await expect(page.getByRole("heading", { name: "Practicals" })).toBeVisible();

  await page.goto(`/practicals/${taskId}`);
  await expect(page.getByRole("heading", { name: taskTitle })).toBeVisible();

  await page.goto(`/tasks/${taskId}`);
  await expect(page.getByRole("heading", { name: taskTitle })).toBeVisible();
  await expect(page.getByRole("button", { name: "Run code" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit solution" })).toBeVisible();

  await page.goto("/submissions");
  await expect(page.getByRole("heading", { name: "Submissions" })).toBeVisible();

  await page.goto(`/submissions/${submissionId}`);
  await expect(page.getByText("Submission result · Immutable attempt")).toBeVisible();
  await expect(page.getByText("Stored result").first()).toBeVisible();
  await expect(
    page.getByText("Visible and hidden details are teacher-only here."),
  ).toHaveCount(0);
  await expect(page.getByText(/^Hidden:/)).toHaveCount(0);
  await expect(
    page.getByText("Hidden test inputs, outputs, and identifiers remain private."),
  ).toBeVisible();

  for (const hiddenTest of await hiddenTestValues(taskId)) {
    await expect(page.getByText(hiddenTest.id, { exact: true })).toHaveCount(0);
  }

  expect(mutationRequests).toEqual([]);
  expect(browserErrors).toEqual([]);
});
