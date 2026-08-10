import {
  Prisma,
  type AllowedLanguage,
  type TaskStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type PracticalAuthoringErrorCode =
  | "CLASSROOM_UNAVAILABLE"
  | "PRACTICAL_UNAVAILABLE"
  | "TESTS_LOCKED";

export class PracticalAuthoringError extends Error {
  constructor(
    public readonly code: PracticalAuthoringErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "PracticalAuthoringError";
  }
}

export interface TeacherPracticalInput {
  teacherId: string;
  classroomId: string;
  taskId?: string;
  publish: boolean;
  title: string;
  instructions: string;
  constraints: string | null;
  allowedLanguages: AllowedLanguage[];
  deadline: Date | null;
  testCases: Array<{
    input: string;
    expectedOutput: string;
    visible: boolean;
  }>;
}

function testCasesChanged(
  existing: Array<{
    position: number;
    input: string;
    expectedOutput: string;
    visible: boolean;
  }>,
  requested: TeacherPracticalInput["testCases"],
) {
  if (existing.length !== requested.length) return true;

  return existing.some((testCase, index) => {
    const next = requested[index];
    return (
      !next ||
      testCase.position !== index + 1 ||
      testCase.visible !== next.visible ||
      testCase.input !== next.input ||
      testCase.expectedOutput !== next.expectedOutput
    );
  });
}

export async function saveTeacherPractical(input: TeacherPracticalInput) {
  return prisma.$transaction(
    async (tx) => {
      const classroom = await tx.classroom.findFirst({
        where: {
          id: input.classroomId,
          ownerTeacherId: input.teacherId,
        },
        select: { id: true },
      });
      if (!classroom) {
        throw new PracticalAuthoringError(
          "CLASSROOM_UNAVAILABLE",
          "This classroom is unavailable.",
        );
      }

      const current = input.taskId
        ? await tx.task.findFirst({
            where: {
              id: input.taskId,
              classroomId: input.classroomId,
              authorTeacherId: input.teacherId,
            },
            select: {
              id: true,
              status: true,
              publishedAt: true,
              testCases: {
                orderBy: { position: "asc" },
                select: {
                  position: true,
                  input: true,
                  expectedOutput: true,
                  visible: true,
                },
              },
              _count: {
                select: {
                  codingSessions: true,
                  submissionAttempts: true,
                },
              },
            },
          })
        : null;

      if (input.taskId && !current) {
        throw new PracticalAuthoringError(
          "PRACTICAL_UNAVAILABLE",
          "This practical is unavailable.",
        );
      }

      const testsChanged = current
        ? testCasesChanged(current.testCases, input.testCases)
        : input.testCases.length > 0;
      // Every run, result snapshot, and submission belongs to a coding session.
      // The submission count is retained as an explicit defense for lifecycle intent.
      const hasStudentActivity = Boolean(
        current &&
          (current._count.codingSessions > 0 ||
            current._count.submissionAttempts > 0),
      );

      if (current?.status === "PUBLISHED" && hasStudentActivity && testsChanged) {
        throw new PracticalAuthoringError(
          "TESTS_LOCKED",
          "Test cases cannot be changed because student work already exists. You can still update the practical details without changing its tests.",
        );
      }

      const status: TaskStatus =
        current?.status === "PUBLISHED" || input.publish
          ? "PUBLISHED"
          : "DRAFT";
      const publishedAt =
        status === "PUBLISHED"
          ? current?.publishedAt ?? new Date()
          : null;
      const taskData = {
        title: input.title.trim(),
        instructions: input.instructions.trim(),
        constraints: input.constraints?.trim() || null,
        allowedLanguages: input.allowedLanguages,
        deadline: input.deadline,
        status,
        publishedAt,
      };

      const task = current
        ? await tx.task.update({
            where: { id: current.id },
            data: taskData,
          })
        : await tx.task.create({
            data: {
              ...taskData,
              classroomId: input.classroomId,
              authorTeacherId: input.teacherId,
            },
          });

      if (testsChanged) {
        await tx.testCase.deleteMany({ where: { taskId: task.id } });
        if (input.testCases.length > 0) {
          await tx.testCase.createMany({
            data: input.testCases.map((testCase, index) => ({
              taskId: task.id,
              position: index + 1,
              input: testCase.input,
              expectedOutput: testCase.expectedOutput,
              visible: testCase.visible,
            })),
          });
        }
      }

      return { taskId: task.id, status: task.status, testsChanged };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5_000,
      timeout: 10_000,
    },
  );
}
