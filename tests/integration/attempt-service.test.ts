import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { getClassroomOverviewViewModel } from "@/features/classes/classroom-overview-view-model";
import {
  getOrCreateStudentWorkspace,
  getSubmissionForStudent,
  getSubmissionForTeacher,
  runStudentDraft,
  saveStudentDraft,
  submitStudentDraft,
} from "@/server/attempts/service";
import type {
  ServerExecutionProvider,
  ServerExecutionRequest,
} from "@/server/execution/provider";

const suffix = randomUUID().slice(0, 8);
const taskId = `integration-task-${suffix}`;
const outsiderId = `integration-outsider-${suffix}`;
const otherTeacherId = `integration-teacher-${suffix}`;
const classroomId = "dsa-2026";
const studentId = "demo-student-1";
const secondStudentId = "demo-student-2";
const teacherId = "demo-teacher";

const passingProvider: ServerExecutionProvider = {
  execute: vi.fn(async (request: ServerExecutionRequest) => ({
    state: "completed" as const,
    passedTests: request.tests.length,
    totalTests: request.tests.length,
    testResults: request.tests.map((test) => ({
      testId: test.id,
      passed: true,
      actualOutput: test.expectedOutput,
      visibility: test.visibility,
    })),
  })),
};

describe.sequential("persisted student-attempt service", () => {
  beforeAll(async () => {
    await prisma.user.createMany({
      data: [
        {
          id: outsiderId,
          name: "Outside Student",
          email: `${outsiderId}@demo.labrix.local`,
          platformRole: "STUDENT",
        },
        {
          id: otherTeacherId,
          name: "Other Teacher",
          email: `${otherTeacherId}@demo.labrix.local`,
          platformRole: "TEACHER",
        },
      ],
    });
    await prisma.task.create({
      data: {
        id: taskId,
        classroomId,
        authorTeacherId: teacherId,
        title: "Integration practical",
        instructions: "Return the provided value.",
        allowedLanguages: ["CPP", "JAVA"],
        status: "PUBLISHED",
        publishedAt: new Date(),
        testCases: {
          create: [
            { position: 1, input: "1", expectedOutput: "1", visible: true },
            {
              position: 2,
              input: "hidden-input",
              expectedOutput: "hidden-output",
              visible: false,
            },
          ],
        },
      },
    });
  });

  afterAll(async () => {
    const sessions = await prisma.codingSession.findMany({
      where: { taskId },
      select: { id: true },
    });
    const sessionIds = sessions.map((session) => session.id);
    await prisma.codeEvent.deleteMany({ where: { codingSessionId: { in: sessionIds } } });
    await prisma.submissionAttempt.deleteMany({ where: { taskId } });
    const runs = await prisma.runAttempt.findMany({
      where: { codingSessionId: { in: sessionIds } },
      select: { id: true },
    });
    await prisma.resultSnapshot.deleteMany({
      where: { runAttemptId: { in: runs.map((run) => run.id) } },
    });
    await prisma.runAttempt.deleteMany({ where: { codingSessionId: { in: sessionIds } } });
    await prisma.draft.deleteMany({ where: { codingSessionId: { in: sessionIds } } });
    await prisma.codingSession.deleteMany({ where: { id: { in: sessionIds } } });
    await prisma.testCase.deleteMany({ where: { taskId } });
    await prisma.task.deleteMany({ where: { id: taskId } });
    await prisma.user.deleteMany({ where: { id: { in: [outsiderId, otherTeacherId] } } });
    await prisma.$disconnect();
  });

  it("reports zero submitted students from persisted data", async () => {
    const overview = await getClassroomOverviewViewModel(teacherId, classroomId);
    expect(overview?.task?.id).toBe(taskId);
    expect(overview?.submittedCount).toBe(0);
    expect(overview?.pendingCount).toBe(3);
    await expect(
      getClassroomOverviewViewModel(otherTeacherId, classroomId),
    ).resolves.toBeNull();
  });

  it("skips unchanged saves and persists later edits exactly once each", async () => {
    const workspace = await getOrCreateStudentWorkspace(studentId, taskId);
    expect(workspace.session.attemptNumber).toBe(1);
    expect(workspace.draft.sourceCode).toContain("fail_test");

    const initialDraft = await prisma.draft.findUniqueOrThrow({
      where: { codingSessionId: workspace.session.id },
    });
    const initialEvents = await prisma.codeEvent.count({
      where: { codingSessionId: workspace.session.id },
    });
    const resumedUnchanged = await getOrCreateStudentWorkspace(studentId, taskId);
    expect(resumedUnchanged.session.id).toBe(workspace.session.id);
    expect(
      await prisma.codeEvent.count({ where: { codingSessionId: workspace.session.id } }),
    ).toBe(initialEvents);

    const hydrationNoOp = await saveStudentDraft({
      studentId,
      sessionId: workspace.session.id,
      language: workspace.session.language,
      sourceCode: workspace.draft.sourceCode,
    });
    expect(hydrationNoOp.changed).toBe(false);
    expect(hydrationNoOp.revision).toBe(initialDraft.revision);
    const afterNoOp = await prisma.draft.findUniqueOrThrow({
      where: { codingSessionId: workspace.session.id },
    });
    expect(afterNoOp.updatedAt).toEqual(initialDraft.updatedAt);
    expect(
      await prisma.codeEvent.count({ where: { codingSessionId: workspace.session.id } }),
    ).toBe(initialEvents);

    const saved = await saveStudentDraft({
      studentId,
      sessionId: workspace.session.id,
      language: "CPP",
      sourceCode: "int main() { return 0; }",
    });
    expect(saved.changed).toBe(true);
    expect(saved.revision).toBe(1);
    expect(
      await prisma.codeEvent.count({
        where: { codingSessionId: workspace.session.id, type: "DRAFT_SAVED" },
      }),
    ).toBe(1);

    const identical = await saveStudentDraft({
      studentId,
      sessionId: workspace.session.id,
      language: "CPP",
      sourceCode: "int main() { return 0; }",
    });
    expect(identical.changed).toBe(false);
    expect(identical.savedAt).toBe(saved.savedAt);
    expect(
      await prisma.codeEvent.count({
        where: { codingSessionId: workspace.session.id, type: "DRAFT_SAVED" },
      }),
    ).toBe(1);

    const later = await saveStudentDraft({
      studentId,
      sessionId: workspace.session.id,
      language: "CPP",
      sourceCode: "int main() { return 1; }",
    });
    expect(later.changed).toBe(true);
    expect(later.revision).toBe(2);
    expect(
      await prisma.codeEvent.count({
        where: { codingSessionId: workspace.session.id, type: "DRAFT_SAVED" },
      }),
    ).toBe(2);

    const resumed = await getOrCreateStudentWorkspace(studentId, taskId);
    expect(resumed.session.id).toBe(workspace.session.id);
    expect(resumed.draft.sourceCode).toBe("int main() { return 1; }");
  });

  it("enforces active classroom membership", async () => {
    await expect(getOrCreateStudentWorkspace(outsiderId, taskId)).rejects.toMatchObject({
      name: "AccessDeniedError",
    });
  });

  it("persists a mock run through the provider boundary", async () => {
    const workspace = await getOrCreateStudentWorkspace(studentId, taskId);
    const run = await runStudentDraft(
      {
        studentId,
        sessionId: workspace.session.id,
        language: "CPP",
        sourceCode: "int main() { return 0; }",
      },
      passingProvider,
    );
    expect(run.passedTests).toBe(1);
    expect(run.visibleTotalTests).toBe(1);
    expect(run.hiddenTotalTests).toBe(0);
    expect(run.testResults).toHaveLength(1);
    expect(passingProvider.execute).toHaveBeenLastCalledWith(
      expect.objectContaining({
        tests: [expect.objectContaining({ visibility: "VISIBLE" })],
      }),
    );
    expect(await prisma.resultSnapshot.count({ where: { id: run.resultSnapshotId } })).toBe(1);
  });

  it("creates an immutable submission with an exact result snapshot", async () => {
    const workspace = await getOrCreateStudentWorkspace(studentId, taskId);
    const submission = await submitStudentDraft(
      {
        studentId,
        sessionId: workspace.session.id,
        language: "CPP",
        sourceCode: "// exact source\nint main() { return 0; }",
        idempotencyKey: randomUUID(),
      },
      passingProvider,
    );
    const stored = await prisma.submissionAttempt.findUniqueOrThrow({
      where: { id: submission.id },
      include: { resultSnapshot: true },
    });
    expect(stored.sourceCodeSnapshot).toBe("// exact source\nint main() { return 0; }");
    expect(stored.resultSnapshot.passedTests).toBe(2);
    expect(stored.resultSnapshot.visiblePassedTests).toBe(1);
    expect(stored.resultSnapshot.hiddenPassedTests).toBe(1);
    expect(stored.resultSnapshot.hiddenTotalTests).toBe(1);
    expect(stored.resultSnapshot.suggestedScore).toBe(10);
    expect(passingProvider.execute).toHaveBeenLastCalledWith(
      expect.objectContaining({
        tests: expect.arrayContaining([
          expect.objectContaining({ visibility: "VISIBLE" }),
          expect.objectContaining({ visibility: "HIDDEN" }),
        ]),
      }),
    );

    const studentView = await getSubmissionForStudent(studentId, submission.id);
    const hiddenTest = await prisma.testCase.findFirstOrThrow({
      where: { taskId, visible: false },
      select: { id: true },
    });
    expect(studentView.result.testResults).toHaveLength(1);
    expect(studentView.result.hiddenPassedTests).toBe(1);
    expect(studentView.result.hiddenTotalTests).toBe(1);
    expect(JSON.stringify(studentView)).not.toContain("hidden-input");
    expect(JSON.stringify(studentView)).not.toContain("hidden-output");
    expect(JSON.stringify(studentView)).not.toContain(hiddenTest.id);
    await expect(
      prisma.submissionAttempt.update({
        where: { id: stored.id },
        data: { sourceCodeSnapshot: "changed" },
      }),
    ).rejects.toThrow(/immutable Labrix record/);
  });

  it("counts one student with one persisted submission", async () => {
    const overview = await getClassroomOverviewViewModel(teacherId, classroomId);
    expect(overview?.submittedCount).toBe(1);
    expect(overview?.pendingCount).toBe(2);
  });

  it("returns the same submission for a repeated idempotency key", async () => {
    const workspace = await getOrCreateStudentWorkspace(studentId, taskId);
    const key = randomUUID();
    const first = await submitStudentDraft(
      {
        studentId,
        sessionId: workspace.session.id,
        language: "CPP",
        sourceCode: "int main() { return 0; }",
        idempotencyKey: key,
      },
      passingProvider,
    );
    const second = await submitStudentDraft(
      {
        studentId,
        sessionId: workspace.session.id,
        language: "CPP",
        sourceCode: "different retry payload",
        idempotencyKey: key,
      },
      passingProvider,
    );
    expect(second.id).toBe(first.id);
    expect(
      await prisma.submissionAttempt.count({
        where: { studentId, idempotencyKey: key },
      }),
    ).toBe(1);
  });

  it("does not inflate completion for one student's multiple attempts", async () => {
    const attempts = await prisma.submissionAttempt.count({
      where: { taskId, studentId },
    });
    expect(attempts).toBeGreaterThan(1);
    const overview = await getClassroomOverviewViewModel(teacherId, classroomId);
    expect(overview?.submittedCount).toBe(1);
    expect(overview?.pendingCount).toBe(2);
  });

  it("creates a new numbered session and attempt for resubmission", async () => {
    const workspace = await getOrCreateStudentWorkspace(studentId, taskId);
    expect(workspace.session.attemptNumber).toBeGreaterThan(1);
    const submission = await submitStudentDraft(
      {
        studentId,
        sessionId: workspace.session.id,
        language: "JAVA",
        sourceCode: "public class Main {}",
        idempotencyKey: randomUUID(),
      },
      passingProvider,
    );
    expect(submission.attemptNumber).toBe(workspace.session.attemptNumber);
    const attempts = await prisma.submissionAttempt.findMany({
      where: { taskId, studentId },
      orderBy: { attemptNumber: "asc" },
      select: { attemptNumber: true },
    });
    expect(attempts.map((attempt) => attempt.attemptNumber)).toEqual(
      Array.from({ length: attempts.length }, (_, index) => index + 1),
    );
  });

  it("counts multiple students with persisted submissions", async () => {
    const workspace = await getOrCreateStudentWorkspace(secondStudentId, taskId);
    await submitStudentDraft(
      {
        studentId: secondStudentId,
        sessionId: workspace.session.id,
        language: "CPP",
        sourceCode: "int main() { return 0; }",
        idempotencyKey: randomUUID(),
      },
      passingProvider,
    );
    const overview = await getClassroomOverviewViewModel(teacherId, classroomId);
    expect(overview?.submittedCount).toBe(2);
    expect(overview?.pendingCount).toBe(1);
  });

  it("stores events in deterministic chronological sequence", async () => {
    const latest = await prisma.submissionAttempt.findFirstOrThrow({
      where: { taskId, studentId },
      orderBy: { attemptNumber: "desc" },
    });
    const events = await prisma.codeEvent.findMany({
      where: { codingSessionId: latest.codingSessionId },
      orderBy: { sequence: "asc" },
    });
    expect(events.map((event) => event.sequence)).toEqual(
      Array.from({ length: events.length }, (_, index) => index + 1),
    );
    expect(events.map((event) => event.type)).toEqual([
      "SESSION_STARTED",
      "DRAFT_SAVED",
      "RUN_REQUESTED",
      "RUN_COMPLETED",
      "SUBMISSION_CREATED",
    ]);
  });

  it("enforces teacher ownership and returns persisted teacher review", async () => {
    const latest = await prisma.submissionAttempt.findFirstOrThrow({
      where: { taskId, studentId },
      orderBy: { attemptNumber: "desc" },
    });
    await expect(getSubmissionForTeacher(otherTeacherId, latest.id)).rejects.toMatchObject({
      name: "AccessDeniedError",
    });
    const review = await getSubmissionForTeacher(teacherId, latest.id);
    expect(review.student.id).toBe(studentId);
    expect(review.sourceCode).toBe("public class Main {}");
    expect(review.runCount).toBe(1);
    expect(review.events.at(-1)?.type).toBe("SUBMISSION_CREATED");
    expect(review.result.testResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          visibility: "HIDDEN",
          input: "hidden-input",
          expectedOutput: "hidden-output",
          actualOutput: "hidden-output",
        }),
      ]),
    );
  });

});
