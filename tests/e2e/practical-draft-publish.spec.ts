import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
let classroomId: string | undefined;

test.afterEach(async () => {
  if (classroomId) {
    await prisma.classroom.delete({ where: { id: classroomId } });
    classroomId = undefined;
  }
});

test.afterAll(async () => { await prisma.$disconnect(); });

test("repeated draft saves and publication reuse the same practical", async ({ page }) => {
  const classroom = await prisma.classroom.create({
    data: {
      name: `Draft publish regression ${Date.now()}`,
      subject: "QA",
      section: "Test only",
      joinCode: `QA-${Date.now()}`,
      ownerTeacherId: "demo-teacher",
    },
  });
  classroomId = classroom.id;
  await page.goto(`/classes/${classroom.id}/tasks/new`);
  await page.getByRole("button", { name: /^Two Sum Target Lookup/ }).click();
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByText(/^Saved at /)).toBeVisible();
  const original = await prisma.task.findFirstOrThrow({ where: { classroomId } });

  await page.locator('input[name="title"]').fill("Updated QA practical");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByRole("button", { name: "Save draft", exact: true })).toBeEnabled();
  expect(await prisma.task.count({ where: { classroomId } })).toBe(1);
  expect((await prisma.task.findUniqueOrThrow({ where: { id: original.id } })).title).toBe("Updated QA practical");

  await page.getByRole("button", { name: "Continue to Automated tests" }).click();
  await page.getByRole("button", { name: "Continue to Availability & marking" }).click();
  await page.getByRole("button", { name: "Continue to Review" }).click();
  await page.getByRole("button", { name: "Publish practical", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/classes/${classroom.id}$`));
  await expect(page.getByRole("heading", { name: "No students enrolled yet" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Everyone has submitted" })).toHaveCount(0);
  const tasks = await prisma.task.findMany({ where: { classroomId } });
  expect(tasks).toHaveLength(1);
  expect(tasks[0]).toMatchObject({ id: original.id, title: "Updated QA practical", status: "PUBLISHED" });
});
