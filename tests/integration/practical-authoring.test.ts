import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  PracticalAuthoringError,
  saveTeacherPractical,
} from "@/server/practicals/authoring";

const suffix = randomUUID().slice(0, 8);
const teacherId = `authoring-teacher-${suffix}`;
const otherTeacherId = `authoring-other-${suffix}`;
const studentId = `authoring-student-${suffix}`;
const classroomId = `authoring-classroom-${suffix}`;
const draftTaskId = `authoring-draft-${suffix}`;
const freshPublishedTaskId = `authoring-fresh-${suffix}`;
const lockedTaskId = `authoring-locked-${suffix}`;
const sessionId = `authoring-session-${suffix}`;
const runId = `authoring-run-${suffix}`;
const resultId = `authoring-result-${suffix}`;
const submissionId = `authoring-submission-${suffix}`;

function practicalInput(
  taskId: string,
  overrides: Partial<{
    publish: boolean;
    title: string;
    instructions: string;
    starterCodes: { CPP: string; JAVA: string };
    testCases: Array<{
      input: string;
      expectedOutput: string;
      visible: boolean;
    }>;
  }> = {},
) {
  return {
    teacherId,
    classroomId,
    taskId,
    publish: overrides.publish ?? false,
    title: overrides.title ?? "Updated practical",
    instructions: overrides.instructions ?? "Updated instructions",
    constraints: null,
    allowedLanguages: ["JAVA" as const],
    starterCodes: overrides.starterCodes ?? {
      CPP: "// C++ authoring starter",
      JAVA: "// Java authoring starter",
    },
    deadline: null,
    testCases: overrides.testCases ?? [
      { input: "2", expectedOutput: "2", visible: true },
    ],
  };
}

describe.sequential("teacher practical authoring lifecycle", () => {
  beforeAll(async () => {
    await prisma.user.createMany({
      data: [
        {
          id: teacherId,
          name: "Authoring Teacher",
          email: `${teacherId}@demo.labrix.local`,
          platformRole: "TEACHER",
        },
        {
          id: otherTeacherId,
          name: "Other Authoring Teacher",
          email: `${otherTeacherId}@demo.labrix.local`,
          platformRole: "TEACHER",
        },
        {
          id: studentId,
          name: "Authoring Student",
          email: `${studentId}@demo.labrix.local`,
          platformRole: "STUDENT",
        },
      ],
    });
    await prisma.classroom.create({
      data: {
        id: classroomId,
        name: "Authoring Lifecycle",
        subject: "Software Safety",
        section: "Test",
        joinCode: `AUTHOR-${suffix}`,
        ownerTeacherId: teacherId,
      },
    });
    await prisma.task.createMany({
      data: [
        {
          id: draftTaskId,
          classroomId,
          authorTeacherId: teacherId,
          title: "Draft practical",
          instructions: "Draft instructions",
          allowedLanguages: ["JAVA"],
          status: "DRAFT",
        },
        {
          id: freshPublishedTaskId,
          classroomId,
          authorTeacherId: teacherId,
          title: "Fresh published practical",
          instructions: "Published instructions",
          allowedLanguages: ["JAVA"],
          status: "PUBLISHED",
          publishedAt: new Date(),
        },
        {
          id: lockedTaskId,
          classroomId,
          authorTeacherId: teacherId,
          title: "Attempted practical",
          instructions: "Original instructions",
          allowedLanguages: ["JAVA"],
          status: "PUBLISHED",
          publishedAt: new Date(),
        },
      ],
    });
    await prisma.testCase.createMany({
      data: [draftTaskId, freshPublishedTaskId, lockedTaskId].map((taskId) => ({
        taskId,
        position: 1,
        input: "1",
        expectedOutput: "1",
        visible: true,
      })),
    });
    await prisma.codingSession.create({
      data: {
        id: sessionId,
        taskId: lockedTaskId,
        studentId,
        attemptNumber: 1,
        status: "SUBMITTED",
        language: "JAVA",
        submittedAt: new Date(),
      },
    });
    await prisma.runAttempt.create({
      data: {
        id: runId,
        codingSessionId: sessionId,
        sequence: 1,
        language: "JAVA",
        sourceCodeSnapshot: "class Main {}",
        completedAt: new Date(),
      },
    });
    await prisma.resultSnapshot.create({
      data: {
        id: resultId,
        runAttemptId: runId,
        state: "COMPLETED",
        passedTests: 1,
        totalTests: 1,
        testResults: [{ testId: "original", passed: true, actualOutput: "1" }],
      },
    });
    await prisma.submissionAttempt.create({
      data: {
        id: submissionId,
        taskId: lockedTaskId,
        studentId,
        codingSessionId: sessionId,
        resultSnapshotId: resultId,
        attemptNumber: 1,
        idempotencyKey: `authoring-${suffix}`,
        language: "JAVA",
        sourceCodeSnapshot: "class Main {}",
      },
    });
    await prisma.codeEvent.createMany({
      data: [
        {
          codingSessionId: sessionId,
          sequence: 1,
          type: "RUN_REQUESTED",
          runAttemptId: runId,
        },
        {
          codingSessionId: sessionId,
          sequence: 2,
          type: "RUN_COMPLETED",
          runAttemptId: runId,
        },
        {
          codingSessionId: sessionId,
          sequence: 3,
          type: "SUBMISSION_CREATED",
          submissionAttemptId: submissionId,
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.codeEvent.deleteMany({ where: { codingSessionId: sessionId } });
    await prisma.submissionAttempt.deleteMany({ where: { id: submissionId } });
    await prisma.resultSnapshot.deleteMany({ where: { id: resultId } });
    await prisma.runAttempt.deleteMany({ where: { id: runId } });
    await prisma.codingSession.deleteMany({ where: { id: sessionId } });
    await prisma.testCase.deleteMany({
      where: { taskId: { in: [draftTaskId, freshPublishedTaskId, lockedTaskId] } },
    });
    await prisma.task.deleteMany({
      where: { id: { in: [draftTaskId, freshPublishedTaskId, lockedTaskId] } },
    });
    await prisma.classroom.deleteMany({ where: { id: classroomId } });
    await prisma.user.deleteMany({
      where: { id: { in: [teacherId, otherTeacherId, studentId] } },
    });
    await prisma.$disconnect();
  });

  it("allows a teacher to edit a draft and replace its visible tests", async () => {
    const result = await saveTeacherPractical(practicalInput(draftTaskId));
    const task = await prisma.task.findUniqueOrThrow({
      where: { id: draftTaskId },
      include: { testCases: true },
    });

    expect(result).toMatchObject({ status: "DRAFT", testsChanged: true });
    expect(task.title).toBe("Updated practical");
    expect(task.cppStarterCode).toBe("// C++ authoring starter");
    expect(task.javaStarterCode).toBe("// Java authoring starter");
    expect(task.testCases).toHaveLength(1);
    expect(task.testCases[0]).toMatchObject({
      input: "2",
      expectedOutput: "2",
      visible: true,
    });
  });

  it("allows test replacement on a published practical before student activity", async () => {
    const result = await saveTeacherPractical(
      practicalInput(freshPublishedTaskId, {
        testCases: [
          { input: "3", expectedOutput: "3", visible: true },
          { input: "secret", expectedOutput: "hidden", visible: false },
        ],
      }),
    );
    const task = await prisma.task.findUniqueOrThrow({
      where: { id: freshPublishedTaskId },
      include: { testCases: true },
    });

    expect(result).toMatchObject({ status: "PUBLISHED", testsChanged: true });
    expect(task.status).toBe("PUBLISHED");
    expect(task.testCases[0]).toMatchObject({
      input: "3",
      expectedOutput: "3",
      visible: true,
    });
    expect(task.testCases[1]).toMatchObject({
      input: "secret",
      expectedOutput: "hidden",
      visible: false,
    });
  });

  it("blocks destructive test replacement after persisted student activity", async () => {
    const before = await prisma.task.findUniqueOrThrow({
      where: { id: lockedTaskId },
      include: {
        testCases: { orderBy: { position: "asc" } },
        codingSessions: {
          include: {
            runs: { include: { resultSnapshot: true } },
            submission: true,
            events: { orderBy: { sequence: "asc" } },
          },
        },
      },
    });

    const error = await saveTeacherPractical(
      practicalInput(lockedTaskId, {
        title: "Should not be saved",
        testCases: [{ input: "99", expectedOutput: "99", visible: true }],
      }),
    ).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(PracticalAuthoringError);
    expect(error).toMatchObject({
      code: "TESTS_LOCKED",
      message:
        "Test cases cannot be changed because student work already exists. You can still update the practical details without changing its tests.",
    });

    const after = await prisma.task.findUniqueOrThrow({
      where: { id: lockedTaskId },
      include: {
        testCases: { orderBy: { position: "asc" } },
        codingSessions: {
          include: {
            runs: { include: { resultSnapshot: true } },
            submission: true,
            events: { orderBy: { sequence: "asc" } },
          },
        },
      },
    });
    expect(after).toEqual(before);
  });

  it("preserves test rows while allowing non-test details after activity", async () => {
    const testsBefore = await prisma.testCase.findMany({
      where: { taskId: lockedTaskId },
      orderBy: { position: "asc" },
    });
    const result = await saveTeacherPractical(
      practicalInput(lockedTaskId, {
        title: "Clarified practical",
        testCases: testsBefore.map((testCase) => ({
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          visible: testCase.visible,
        })),
      }),
    );
    const testsAfter = await prisma.testCase.findMany({
      where: { taskId: lockedTaskId },
      orderBy: { position: "asc" },
    });

    expect(result.testsChanged).toBe(false);
    expect(testsAfter).toEqual(testsBefore);
    await expect(
      prisma.task.findUniqueOrThrow({ where: { id: lockedTaskId } }),
    ).resolves.toMatchObject({ title: "Clarified practical" });
  });

  it("enforces teacher ownership inside the mutation service", async () => {
    const error = await saveTeacherPractical({
        ...practicalInput(draftTaskId),
        teacherId: otherTeacherId,
      }).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(PracticalAuthoringError);
    expect(error).toMatchObject({
      code: "CLASSROOM_UNAVAILABLE",
    });
  });

  it("treats a visibility change as destructive after student activity", async () => {
    const testCase = await prisma.testCase.findFirstOrThrow({
      where: { taskId: lockedTaskId },
    });
    await expect(
      saveTeacherPractical(
        practicalInput(lockedTaskId, {
          testCases: [
            {
              input: testCase.input,
              expectedOutput: testCase.expectedOutput,
              visible: false,
            },
          ],
        }),
      ),
    ).rejects.toMatchObject({ code: "TESTS_LOCKED" });
  });
});
