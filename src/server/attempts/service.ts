import {
  AllowedLanguage,
  Prisma,
  RunResultState,
  type CodeEventType,
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  AccessDeniedError,
  requireOwnedClassroom,
  requirePublishedTaskForStudent,
} from "@/server/authorization/classroom-access";
import { getServerExecutionProvider } from "@/server/execution";
import type {
  ServerExecutionProvider,
  ServerExecutionResult,
  ServerExecutionTestResult,
} from "@/server/execution/provider";

const workspaceSessionInclude = {
  draft: true,
  _count: { select: { runs: true } },
} satisfies Prisma.CodingSessionInclude;

const transactionOptions = { maxWait: 10_000, timeout: 20_000 } as const;

type WorkspaceSession = Prisma.CodingSessionGetPayload<{
  include: typeof workspaceSessionInclude;
}>;

export interface StudentWorkspace {
  classroom: { id: string; name: string };
  task: {
    id: string;
    title: string;
    instructions: string;
    constraints: string | null;
    deadline: string | null;
    allowedLanguages: AllowedLanguage[];
    tests: Array<{
      id: string;
      position: number;
      input: string;
      expectedOutput: string;
    }>;
  };
  session: {
    id: string;
    attemptNumber: number;
    language: AllowedLanguage;
    runCount: number;
  };
  draft: {
    sourceCode: string;
    revision: number;
    updatedAt: string;
  };
}

export interface PersistedRun {
  id: string;
  resultSnapshotId: string;
  state: ServerExecutionResult["state"];
  passedTests: number;
  totalTests: number;
  errorText?: string;
  testResults: ServerExecutionTestResult[];
  completedAt: string;
}

export interface PersistedSubmission {
  id: string;
  attemptNumber: number;
  submittedAt: string;
  result: PersistedRun;
}

function starterCode(language: AllowedLanguage) {
  if (language === AllowedLanguage.JAVA) {
    return "public class Main {\n  public static void main(String[] args) {\n    // Write your solution here\n  }\n}";
  }
  return "#include <iostream>\nusing namespace std;\n\nint main() {\n  // fail_test — replace this comment with your solution\n  return 0;\n}";
}

function toWorkspace(
  task: Awaited<ReturnType<typeof requirePublishedTaskForStudent>>,
  session: WorkspaceSession,
): StudentWorkspace {
  if (!session.draft) throw new Error("Active coding session has no draft.");
  return {
    classroom: task.classroom,
    task: {
      id: task.id,
      title: task.title,
      instructions: task.instructions,
      constraints: task.constraints,
      deadline: task.deadline?.toISOString() ?? null,
      allowedLanguages: task.allowedLanguages,
      tests: task.testCases.map((test) => ({
        id: test.id,
        position: test.position,
        input: test.input,
        expectedOutput: test.expectedOutput,
      })),
    },
    session: {
      id: session.id,
      attemptNumber: session.attemptNumber,
      language: session.language,
      runCount: session._count.runs,
    },
    draft: {
      sourceCode: session.draft.sourceCode,
      revision: session.draft.revision,
      updatedAt: session.draft.updatedAt.toISOString(),
    },
  };
}

async function findActiveSession(studentId: string, taskId: string) {
  return prisma.codingSession.findFirst({
    where: { studentId, taskId, status: "ACTIVE" },
    include: workspaceSessionInclude,
  });
}

export async function getOrCreateStudentWorkspace(
  studentId: string,
  taskId: string,
): Promise<StudentWorkspace> {
  const task = await requirePublishedTaskForStudent(prisma, studentId, taskId);
  const existing = await findActiveSession(studentId, taskId);
  if (existing) return toWorkspace(task, existing);

  try {
    const created = await prisma.$transaction(
      async (tx) => {
        await requirePublishedTaskForStudent(tx, studentId, taskId);
        const active = await tx.codingSession.findFirst({
          where: { studentId, taskId, status: "ACTIVE" },
          include: workspaceSessionInclude,
        });
        if (active) return active;

        const latest = await tx.codingSession.aggregate({
          where: { studentId, taskId },
          _max: { attemptNumber: true },
        });
        const language = task.allowedLanguages[0] ?? AllowedLanguage.CPP;
        return tx.codingSession.create({
          data: {
            studentId,
            taskId,
            attemptNumber: (latest._max.attemptNumber ?? 0) + 1,
            language,
            draft: { create: { sourceCode: starterCode(language) } },
            events: { create: { sequence: 1, type: "SESSION_STARTED" } },
          },
          include: workspaceSessionInclude,
        });
      },
      {
        ...transactionOptions,
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
    return toWorkspace(task, created);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const concurrent = await findActiveSession(studentId, taskId);
      if (concurrent) return toWorkspace(task, concurrent);
    }
    throw error;
  }
}

async function requireActiveStudentSession(
  tx: Prisma.TransactionClient,
  studentId: string,
  sessionId: string,
) {
  const session = await tx.codingSession.findFirst({
    where: {
      id: sessionId,
      studentId,
      status: "ACTIVE",
      task: {
        status: "PUBLISHED",
        classroom: {
          memberships: {
            some: { userId: studentId, role: "STUDENT", active: true },
          },
        },
      },
    },
    include: {
      draft: true,
      task: {
        include: {
          testCases: {
            where: { visible: true },
            orderBy: { position: "asc" },
          },
        },
      },
    },
  });
  if (!session?.draft) throw new AccessDeniedError();
  return session;
}

async function nextEventSequence(
  tx: Prisma.TransactionClient,
  codingSessionId: string,
) {
  const latest = await tx.codeEvent.aggregate({
    where: { codingSessionId },
    _max: { sequence: true },
  });
  return (latest._max.sequence ?? 0) + 1;
}

async function createEvent(
  tx: Prisma.TransactionClient,
  input: {
    codingSessionId: string;
    type: CodeEventType;
    runAttemptId?: string;
    submissionAttemptId?: string;
  },
) {
  return tx.codeEvent.create({
    data: {
      ...input,
      sequence: await nextEventSequence(tx, input.codingSessionId),
    },
  });
}

function assertAllowedLanguage(
  language: AllowedLanguage,
  allowedLanguages: AllowedLanguage[],
) {
  if (!allowedLanguages.includes(language)) {
    throw new AccessDeniedError("This language is not allowed for the practical.");
  }
}

export async function saveStudentDraft(input: {
  studentId: string;
  sessionId: string;
  language: AllowedLanguage;
  sourceCode: string;
}) {
  return prisma.$transaction(async (tx) => {
    const session = await requireActiveStudentSession(
      tx,
      input.studentId,
      input.sessionId,
    );
    assertAllowedLanguage(input.language, session.task.allowedLanguages);
    const draft = await tx.draft.update({
      where: { codingSessionId: session.id },
      data: { sourceCode: input.sourceCode, revision: { increment: 1 } },
    });
    await tx.codingSession.update({
      where: { id: session.id },
      data: { language: input.language },
    });
    await createEvent(tx, {
      codingSessionId: session.id,
      type: "DRAFT_SAVED",
    });
    return {
      revision: draft.revision,
      savedAt: draft.updatedAt.toISOString(),
    };
  }, transactionOptions);
}

function toRunResultState(state: ServerExecutionResult["state"]): RunResultState {
  const values: Record<ServerExecutionResult["state"], RunResultState> = {
    completed: RunResultState.COMPLETED,
    compilation_error: RunResultState.COMPILATION_ERROR,
    runtime_error: RunResultState.RUNTIME_ERROR,
    time_limit_exceeded: RunResultState.TIME_LIMIT_EXCEEDED,
    internal_error: RunResultState.INTERNAL_ERROR,
  };
  return values[state];
}

function fromRunResultState(state: RunResultState): ServerExecutionResult["state"] {
  return state.toLowerCase() as ServerExecutionResult["state"];
}

export async function runStudentDraft(
  input: {
    studentId: string;
    sessionId: string;
    language: AllowedLanguage;
    sourceCode: string;
  },
  provider: ServerExecutionProvider = getServerExecutionProvider(),
): Promise<PersistedRun> {
  const prepared = await prisma.$transaction(async (tx) => {
    const session = await requireActiveStudentSession(
      tx,
      input.studentId,
      input.sessionId,
    );
    assertAllowedLanguage(input.language, session.task.allowedLanguages);

    await tx.draft.update({
      where: { codingSessionId: session.id },
      data: { sourceCode: input.sourceCode, revision: { increment: 1 } },
    });
    await tx.codingSession.update({
      where: { id: session.id },
      data: { language: input.language },
    });
    await createEvent(tx, {
      codingSessionId: session.id,
      type: "DRAFT_SAVED",
    });

    const latestRun = await tx.runAttempt.aggregate({
      where: { codingSessionId: session.id },
      _max: { sequence: true },
    });
    const run = await tx.runAttempt.create({
      data: {
        codingSessionId: session.id,
        sequence: (latestRun._max.sequence ?? 0) + 1,
        language: input.language,
        sourceCodeSnapshot: input.sourceCode,
      },
    });
    await createEvent(tx, {
      codingSessionId: session.id,
      runAttemptId: run.id,
      type: "RUN_REQUESTED",
    });
    return {
      run,
      tests: session.task.testCases.map((test) => ({
        id: test.id,
        input: test.input,
        expectedOutput: test.expectedOutput,
      })),
    };
  }, transactionOptions);

  let result: ServerExecutionResult;
  try {
    result = await provider.execute({
      language: input.language,
      sourceCode: input.sourceCode,
      tests: prepared.tests,
    });
  } catch {
    result = {
      state: "internal_error",
      passedTests: 0,
      totalTests: prepared.tests.length,
      errorText: "The simulated execution provider was unavailable.",
      testResults: [],
    };
  }

  return prisma.$transaction(async (tx) => {
    const completedAt = new Date();
    const snapshot = await tx.resultSnapshot.create({
      data: {
        runAttemptId: prepared.run.id,
        state: toRunResultState(result.state),
        passedTests: result.passedTests,
        totalTests: result.totalTests,
        errorText: result.errorText,
        testResults: result.testResults as unknown as Prisma.InputJsonValue,
      },
    });
    await tx.runAttempt.update({
      where: { id: prepared.run.id },
      data: { completedAt },
    });
    await createEvent(tx, {
      codingSessionId: prepared.run.codingSessionId,
      runAttemptId: prepared.run.id,
      type: "RUN_COMPLETED",
    });
    return {
      id: prepared.run.id,
      resultSnapshotId: snapshot.id,
      ...result,
      completedAt: completedAt.toISOString(),
    };
  }, transactionOptions);
}

function persistedSubmissionResult(
  submission: Prisma.SubmissionAttemptGetPayload<{
    include: { resultSnapshot: true };
  }>,
): PersistedSubmission {
  const snapshot = submission.resultSnapshot;
  return {
    id: submission.id,
    attemptNumber: submission.attemptNumber,
    submittedAt: submission.submittedAt.toISOString(),
    result: {
      id: snapshot.runAttemptId,
      resultSnapshotId: snapshot.id,
      state: fromRunResultState(snapshot.state),
      passedTests: snapshot.passedTests,
      totalTests: snapshot.totalTests,
      errorText: snapshot.errorText ?? undefined,
      testResults: snapshot.testResults as unknown as ServerExecutionTestResult[],
      completedAt: snapshot.createdAt.toISOString(),
    },
  };
}

async function findIdempotentSubmission(
  studentId: string,
  idempotencyKey: string,
) {
  return prisma.submissionAttempt.findUnique({
    where: { studentId_idempotencyKey: { studentId, idempotencyKey } },
    include: { resultSnapshot: true },
  });
}

export async function submitStudentDraft(
  input: {
    studentId: string;
    sessionId: string;
    language: AllowedLanguage;
    sourceCode: string;
    idempotencyKey: string;
  },
  provider: ServerExecutionProvider = getServerExecutionProvider(),
): Promise<PersistedSubmission> {
  const existing = await findIdempotentSubmission(
    input.studentId,
    input.idempotencyKey,
  );
  if (existing) return persistedSubmissionResult(existing);

  const run = await runStudentDraft(input, provider);
  try {
    const submission = await prisma.$transaction(
      async (tx) => {
        const repeated = await tx.submissionAttempt.findUnique({
          where: {
            studentId_idempotencyKey: {
              studentId: input.studentId,
              idempotencyKey: input.idempotencyKey,
            },
          },
          include: { resultSnapshot: true },
        });
        if (repeated) return repeated;

        const session = await requireActiveStudentSession(
          tx,
          input.studentId,
          input.sessionId,
        );
        const snapshot = await tx.resultSnapshot.findFirst({
          where: {
            id: run.resultSnapshotId,
            runAttempt: { codingSessionId: session.id },
          },
        });
        if (!snapshot) throw new AccessDeniedError();

        const submittedAt = new Date();
        const created = await tx.submissionAttempt.create({
          data: {
            taskId: session.taskId,
            studentId: input.studentId,
            codingSessionId: session.id,
            resultSnapshotId: snapshot.id,
            attemptNumber: session.attemptNumber,
            idempotencyKey: input.idempotencyKey,
            language: input.language,
            sourceCodeSnapshot: input.sourceCode,
            submittedAt,
          },
          include: { resultSnapshot: true },
        });
        await tx.codingSession.update({
          where: { id: session.id },
          data: { status: "SUBMITTED", submittedAt },
        });
        await createEvent(tx, {
          codingSessionId: session.id,
          submissionAttemptId: created.id,
          type: "SUBMISSION_CREATED",
        });
        return created;
      },
      {
        ...transactionOptions,
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
    return persistedSubmissionResult(submission);
  } catch (error) {
    const repeated = await findIdempotentSubmission(
      input.studentId,
      input.idempotencyKey,
    );
    if (repeated) return persistedSubmissionResult(repeated);

    const submittedSession = await prisma.submissionAttempt.findUnique({
      where: { codingSessionId: input.sessionId },
      include: { resultSnapshot: true },
    });
    if (submittedSession && submittedSession.studentId === input.studentId) {
      return persistedSubmissionResult(submittedSession);
    }
    throw error;
  }
}

export async function getSubmissionForTeacher(
  teacherId: string,
  submissionId: string,
) {
  const submission = await prisma.submissionAttempt.findFirst({
    where: {
      id: submissionId,
      task: { classroom: { ownerTeacherId: teacherId } },
    },
    include: {
      student: { select: { id: true, name: true, email: true } },
      task: {
        select: {
          id: true,
          title: true,
          classroom: { select: { id: true, name: true } },
        },
      },
      resultSnapshot: true,
      codingSession: {
        include: {
          events: { orderBy: { sequence: "asc" } },
          _count: { select: { runs: true } },
        },
      },
    },
  });
  if (!submission) throw new AccessDeniedError();
  return {
    id: submission.id,
    attemptNumber: submission.attemptNumber,
    language: submission.language,
    sourceCode: submission.sourceCodeSnapshot,
    submittedAt: submission.submittedAt.toISOString(),
    student: submission.student,
    task: submission.task,
    result: {
      state: fromRunResultState(submission.resultSnapshot.state),
      passedTests: submission.resultSnapshot.passedTests,
      totalTests: submission.resultSnapshot.totalTests,
      errorText: submission.resultSnapshot.errorText,
      testResults:
        submission.resultSnapshot.testResults as unknown as ServerExecutionTestResult[],
    },
    runCount: submission.codingSession._count.runs,
    events: submission.codingSession.events.map((event) => ({
      id: event.id,
      sequence: event.sequence,
      type: event.type,
      runAttemptId: event.runAttemptId,
      submissionAttemptId: event.submissionAttemptId,
      occurredAt: event.occurredAt.toISOString(),
    })),
  };
}

export async function getTeacherClassroomProgress(
  teacherId: string,
  classroomId: string,
) {
  await requireOwnedClassroom(prisma, teacherId, classroomId);
  const classroom = await prisma.classroom.findUniqueOrThrow({
    where: { id: classroomId },
    include: {
      memberships: {
        where: { role: "STUDENT", active: true },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { joinedAt: "asc" },
      },
      tasks: {
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, title: true },
      },
    },
  });
  const task = classroom.tasks[0] ?? null;
  const students = await Promise.all(
    classroom.memberships.map(async ({ user }) => ({
      ...user,
      latestSubmission: task
        ? await prisma.submissionAttempt.findFirst({
            where: { taskId: task.id, studentId: user.id },
            orderBy: { attemptNumber: "desc" },
            select: {
              id: true,
              attemptNumber: true,
              submittedAt: true,
              language: true,
              resultSnapshot: {
                select: { passedTests: true, totalTests: true },
              },
            },
          })
        : null,
    })),
  );
  return {
    classroom: { id: classroom.id, name: classroom.name },
    task,
    students: students.map((student) => ({
      ...student,
      latestSubmission: student.latestSubmission
        ? {
            ...student.latestSubmission,
            submittedAt: student.latestSubmission.submittedAt.toISOString(),
          }
        : null,
    })),
  };
}
