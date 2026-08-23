import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  getOrCreateStudentWorkspace,
  getSubmissionForStudent,
  getSubmissionForTeacher,
  runStudentDraft,
  saveStudentDraft,
  submitStudentDraft,
} from "@/server/attempts/service";
import { onboardStudent } from "@/server/onboarding/student-onboarding";
import { saveTeacherPractical } from "@/server/practicals/authoring";
import { saveSubmissionReview } from "@/server/reviews/submission-review";
import type {
  ServerExecutionProvider,
  ServerExecutionRequest,
} from "@/server/execution/provider";

vi.mock("server-only", () => ({}));

const suffix = randomUUID().slice(0, 8);
const teacherId = `e2e-teacher-${suffix}`;
const teacherEmail = `e2e-teacher-${suffix}@example.com`;
const studentId = `e2e-student-${suffix}`;
const studentEmail = `e2e-student-${suffix}@example.com`;
const classroomId = `e2e-classroom-${suffix}`;
const joinCode = `E2E-${suffix}`.toUpperCase();

const passingProvider: ServerExecutionProvider = {
  executionMode: "simulated",
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

let createdTaskId = "";
let studentUserId = "";
let createdSubmissionId = "";

describe.sequential("complete classroom lifecycle end-to-end", () => {
  beforeAll(async () => {
    // 1. Create Teacher account
    await prisma.user.create({
      data: {
        id: teacherId,
        name: "Professor Turing",
        email: teacherEmail,
        platformRole: "TEACHER",
        accountStatus: "ACTIVE",
      },
    });
  });

  afterAll(async () => {
    // Delete in child-to-parent order to respect relational foreign keys
    await prisma.submissionReviewRevision.deleteMany({
      where: { review: { submissionAttempt: { task: { classroomId } } } },
    });
    await prisma.submissionReviewCriterionScore.deleteMany({
      where: { review: { submissionAttempt: { task: { classroomId } } } },
    });
    await prisma.submissionReview.deleteMany({
      where: { submissionAttempt: { task: { classroomId } } },
    });
    await prisma.codeEvent.deleteMany({
      where: { codingSession: { task: { classroomId } } },
    });
    await prisma.draft.deleteMany({
      where: { codingSession: { task: { classroomId } } },
    });
    await prisma.submissionAttempt.deleteMany({
      where: { task: { classroomId } },
    });
    await prisma.resultSnapshot.deleteMany({
      where: { runAttempt: { codingSession: { task: { classroomId } } } },
    });
    await prisma.runAttempt.deleteMany({
      where: { codingSession: { task: { classroomId } } },
    });
    await prisma.codingSession.deleteMany({
      where: { task: { classroomId } },
    });
    await prisma.testCase.deleteMany({
      where: { task: { classroomId } },
    });
    await prisma.rubricCriterion.deleteMany({
      where: { task: { classroomId } },
    });
    await prisma.task.deleteMany({ where: { classroomId } });
    await prisma.classMembership.deleteMany({ where: { classroomId } });
    await prisma.classroom.deleteMany({ where: { id: classroomId } });
    if (studentUserId) {
      await prisma.externalIdentity.deleteMany({
        where: { userId: studentUserId },
      });
      await prisma.user.deleteMany({
        where: { id: studentUserId },
      });
    }
    await prisma.externalIdentity.deleteMany({
      where: { userId: teacherId },
    });
    await prisma.user.deleteMany({
      where: { id: teacherId },
    });
  });

  it("Step 1: Teacher creates classroom and gets valid join code", async () => {
    const classroom = await prisma.classroom.create({
      data: {
        id: classroomId,
        name: "Data Structures & Algorithms",
        subject: "CS301",
        section: "A",
        joinCode,
        status: "ACTIVE",
        ownerTeacherId: teacherId,
        memberships: {
          create: {
            userId: teacherId,
            role: "TEACHER",
          },
        },
      },
      include: {
        memberships: true,
      },
    });

    expect(classroom.id).toBe(classroomId);
    expect(classroom.joinCode).toBe(joinCode);
    expect(classroom.ownerTeacherId).toBe(teacherId);
    expect(classroom.memberships).toHaveLength(1);
    expect(classroom.memberships[0].role).toBe("TEACHER");
  });

  it("Step 2: Teacher authors and publishes a practical", async () => {
    const practical = await saveTeacherPractical({
      teacherId,
      classroomId,
      taskId: undefined,
      publish: true,
      title: "Binary Search Tree Implementation",
      instructions: "Implement insert, search, and in-order traversal in Java.",
      constraints: "O(log n) average time complexity per operation.",
      allowedLanguages: ["JAVA"],
      maximumMarks: 10,
      starterCodes: {
        JAVA: "public class Main {\n  public static void main(String[] args) {\n    System.out.println(5);\n  }\n}",
        CPP: "// Not allowed for this task",
      },
      deadline: null,
      testCases: [
        { input: "5\n", expectedOutput: "5", visible: true },
        { input: "10\n", expectedOutput: "10", visible: false },
      ],
    });

    createdTaskId = practical.taskId;
    expect(practical.taskId).toBeDefined();
    expect(practical.status).toBe("PUBLISHED");
  });

  it("Step 3: Student joins classroom using join code", async () => {
    const onboardingResult = await onboardStudent(prisma, {
      joinCode,
      identity: {
        provider: "clerk",
        providerSubject: `clerk-sub-${studentId}`,
      },
      profile: {
        name: "Alice Student",
        email: studentEmail,
      },
    });

    if (!onboardingResult.ok) {
      throw new Error(`Onboarding failed: ${JSON.stringify(onboardingResult)}`);
    }
    expect(onboardingResult.ok).toBe(true);
    expect(onboardingResult.status).toBe("CREATED");
    expect(onboardingResult.classroomId).toBe(classroomId);
    studentUserId = onboardingResult.userId;

    const studentUser = await prisma.user.findUniqueOrThrow({
      where: { id: studentUserId },
    });
    expect(studentUser.email).toBe(studentEmail);
    expect(studentUser.platformRole).toBe("STUDENT");

    const membership = await prisma.classMembership.findUniqueOrThrow({
      where: {
        classroomId_userId: {
          classroomId,
          userId: studentUserId,
        },
      },
    });
    expect(membership.role).toBe("STUDENT");
    expect(membership.active).toBe(true);
  });

  it("Step 4: Student opens workspace, runs draft, and submits solution", async () => {
    // 4a. Initialize workspace
    const workspace = await getOrCreateStudentWorkspace(
      studentUserId,
      createdTaskId,
    );

    expect(workspace.task.id).toBe(createdTaskId);
    expect(workspace.session.language).toBe("JAVA");
    expect(workspace.draft.sourceCode).toContain("public class Main");
    const sessionId = workspace.session.id;

    // 4b. Student edits and saves draft
    const studentSolution = `public class Main {
  public static void main(String[] args) {
    java.util.Scanner scanner = new java.util.Scanner(System.in);
    if (scanner.hasNextInt()) {
      System.out.println(scanner.nextInt());
    }
  }
}`;

    const savedDraft = await saveStudentDraft({
      studentId: studentUserId,
      sessionId,
      language: "JAVA",
      sourceCode: studentSolution,
    });

    expect(savedDraft.changed).toBe(true);
    expect(savedDraft.revision).toBe(1);

    // 4c. Student runs code against tests
    const runResult = await runStudentDraft(
      {
        studentId: studentUserId,
        sessionId,
        language: "JAVA",
        sourceCode: studentSolution,
      },
      passingProvider,
    );

    expect(runResult.state).toBe("completed");
    expect(runResult.passedTests).toBe(1); // 1 visible test
    expect(runResult.totalTests).toBe(1);

    // 4d. Student submits their solution
    const submissionResult = await submitStudentDraft(
      {
        studentId: studentUserId,
        sessionId,
        language: "JAVA",
        sourceCode: studentSolution,
        idempotencyKey: `idempotency-${randomUUID()}`,
      },
      passingProvider,
    );

    createdSubmissionId = submissionResult.id;
    expect(submissionResult.id).toBeDefined();
    expect(submissionResult.attemptNumber).toBe(1);
    expect(submissionResult.result.state).toBe("completed");
    expect(submissionResult.result.passedTests).toBe(2); // all 2 tests (visible + hidden)
    expect(submissionResult.result.totalTests).toBe(2);
  });

  it("Step 5: Teacher reviews submission and publishes marks with feedback", async () => {
    const teacherReviewItem = await getSubmissionForTeacher(
      teacherId,
      createdSubmissionId,
    );

    expect(teacherReviewItem).not.toBeNull();
    expect(teacherReviewItem?.attemptNumber).toBe(1);
    expect(teacherReviewItem?.review).toBeNull();

    // Teacher grades and publishes feedback
    const reviewResult = await saveSubmissionReview(prisma, {
      actor: { id: teacherId, role: "TEACHER" },
      submissionAttemptId: createdSubmissionId,
      intent: "PUBLISHED",
      marksAwarded: 9,
      feedback: "Excellent BST implementation with clean formatting and correct boundary handling.",
    });

    expect(reviewResult.status).toBe("PUBLISHED");
    expect(reviewResult.marksAwarded).toBe(9);
    expect(reviewResult.feedback).toContain("Excellent BST implementation");
  });

  it("Step 6: Student views published score, teacher feedback, and review", async () => {
    const studentSubmission = await getSubmissionForStudent(
      studentUserId,
      createdSubmissionId,
    );

    expect(studentSubmission).not.toBeNull();
    expect(studentSubmission?.review).not.toBeNull();
    expect(studentSubmission?.review?.status).toBe("PUBLISHED");
    expect(studentSubmission?.review?.marksAwarded).toBe(9);
    expect(studentSubmission?.review?.marksOutOf).toBe(10);
    expect(studentSubmission?.review?.feedback).toContain("Excellent BST implementation");
  });
});
