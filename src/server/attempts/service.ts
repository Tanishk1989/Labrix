import {
  AllowedLanguage,
  Prisma,
  RunResultState,
  type CodeEventType,
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { resolveStarterCodes } from "@/domain/tasks/starter-code";
import {
  executionModeFromPersistedSnapshot,
  type ExecutionModeDisclosure,
} from "@/domain/execution/execution-mode";
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
  TestVisibility,
} from "@/server/execution/provider";
import {
  buildResultBreakdown,
  calculateSuggestedScore,
  type ResultBreakdown,
} from "@/server/execution/result-grading";

const workspaceSessionInclude = {
  draft: true,
  _count: { select: { runs: true } },
} satisfies Prisma.CodingSessionInclude;

const transactionOptions = { maxWait: 10_000, timeout: 20_000 } as const;

type WorkspaceSession = Prisma.CodingSessionGetPayload<{
  include: typeof workspaceSessionInclude;
}>;

export interface StudentWorkspace {
  executionMode: ExecutionModeDisclosure;
  classroom: { id: string; name: string };
  task: {
    id: string;
    title: string;
    instructions: string;
    constraints: string | null;
    deadline: string | null;
    allowedLanguages: AllowedLanguage[];
    starterCodes: { CPP: string; JAVA: string };
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
  executionMode: ExecutionModeDisclosure;
  id: string;
  resultSnapshotId: string;
  state: ServerExecutionResult["state"];
  passedTests: number;
  totalTests: number;
  errorText?: string;
  testResults: Array<{
    testId: string;
    passed: boolean;
    actualOutput: string;
  }>;
  visiblePassedTests: number;
  visibleTotalTests: number;
  hiddenPassedTests: number;
  hiddenTotalTests: number;
  suggestedScore: number;
  completedAt: string;
}

export interface PersistedSubmission {
  id: string;
  attemptNumber: number;
  submittedAt: string;
  result: PersistedRun;
}

function toWorkspace(
  task: Awaited<ReturnType<typeof requirePublishedTaskForStudent>>,
  session: WorkspaceSession,
  executionMode: ExecutionModeDisclosure,
): StudentWorkspace {
  if (!session.draft) throw new Error("Active coding session has no draft.");
  return {
    executionMode,
    classroom: task.classroom,
    task: {
      id: task.id,
      title: task.title,
      instructions: task.instructions,
      constraints: task.constraints,
      deadline: task.deadline?.toISOString() ?? null,
      allowedLanguages: task.allowedLanguages,
      starterCodes: resolveStarterCodes(task),
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
  const executionMode = getServerExecutionProvider().executionMode;
  const existing = await findActiveSession(studentId, taskId);
  if (existing) return toWorkspace(task, existing, executionMode);

  try {
    const created = await prisma.$transaction(
      async (tx) => {
        const authorizedTask = await requirePublishedTaskForStudent(
          tx,
          studentId,
          taskId,
        );
        const active = await tx.codingSession.findFirst({
          where: { studentId, taskId, status: "ACTIVE" },
          include: workspaceSessionInclude,
        });
        if (active) return active;

        const latest = await tx.codingSession.aggregate({
          where: { studentId, taskId },
          _max: { attemptNumber: true },
        });
        const language =
          authorizedTask.allowedLanguages[0] ?? AllowedLanguage.CPP;
        const starterCodes = resolveStarterCodes(authorizedTask);
        return tx.codingSession.create({
          data: {
            studentId,
            taskId,
            attemptNumber: (latest._max.attemptNumber ?? 0) + 1,
            language,
            draft: { create: { sourceCode: starterCodes[language] } },
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
    return toWorkspace(task, created, executionMode);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const concurrent = await findActiveSession(studentId, taskId);
      if (concurrent) return toWorkspace(task, concurrent, executionMode);
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
    const currentDraft = session.draft;
    if (!currentDraft) throw new AccessDeniedError();
    assertAllowedLanguage(input.language, session.task.allowedLanguages);
    if (
      currentDraft.sourceCode === input.sourceCode &&
      session.language === input.language
    ) {
      return {
        revision: currentDraft.revision,
        savedAt: currentDraft.updatedAt.toISOString(),
        changed: false,
      };
    }

    const draft = await tx.draft.update({
      where: { codingSessionId: session.id },
      data: { sourceCode: input.sourceCode, revision: { increment: 1 } },
    });
    if (session.language !== input.language) {
      await tx.codingSession.update({
        where: { id: session.id },
        data: { language: input.language },
      });
    }
    await createEvent(tx, {
      codingSessionId: session.id,
      type: "DRAFT_SAVED",
    });
    return {
      revision: draft.revision,
      savedAt: draft.updatedAt.toISOString(),
      changed: true,
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

type StoredTestResult = Omit<ServerExecutionTestResult, "visibility"> & {
  visibility?: TestVisibility;
};

type SnapshotBreakdownSource = {
  state: RunResultState;
  passedTests: number;
  totalTests: number;
  visiblePassedTests: number | null;
  visibleTotalTests: number | null;
  hiddenPassedTests: number | null;
  hiddenTotalTests: number | null;
  suggestedScore: number | null;
};

export function snapshotBreakdown(
  snapshot: SnapshotBreakdownSource,
): ResultBreakdown {
  if (
    snapshot.visiblePassedTests !== null &&
    snapshot.visibleTotalTests !== null &&
    snapshot.hiddenPassedTests !== null &&
    snapshot.hiddenTotalTests !== null &&
    snapshot.suggestedScore !== null
  ) {
    return {
      visiblePassedTests: snapshot.visiblePassedTests,
      visibleTotalTests: snapshot.visibleTotalTests,
      hiddenPassedTests: snapshot.hiddenPassedTests,
      hiddenTotalTests: snapshot.hiddenTotalTests,
      suggestedScore: snapshot.suggestedScore,
    };
  }

  return {
    visiblePassedTests: snapshot.passedTests,
    visibleTotalTests: snapshot.totalTests,
    hiddenPassedTests: 0,
    hiddenTotalTests: 0,
    suggestedScore: calculateSuggestedScore(
      fromRunResultState(snapshot.state),
      snapshot.passedTests,
      snapshot.totalTests,
    ),
  };
}

function publicTestResults(testResults: StoredTestResult[]) {
  return testResults
    .filter((test) => !test.visibility || test.visibility === "VISIBLE")
    .map(({ testId, passed, actualOutput }) => ({
      testId,
      passed,
      actualOutput,
    }));
}

type ExecutionScope = "VISIBLE" | "ALL";

async function executeStudentDraft(
  input: {
    studentId: string;
    sessionId: string;
    language: AllowedLanguage;
    sourceCode: string;
  },
  provider: ServerExecutionProvider,
  scope: ExecutionScope,
): Promise<PersistedRun> {
  const prepared = await prisma.$transaction(async (tx) => {
    const session = await requireActiveStudentSession(
      tx,
      input.studentId,
      input.sessionId,
    );
    const currentDraft = session.draft;
    if (!currentDraft) throw new AccessDeniedError();
    assertAllowedLanguage(input.language, session.task.allowedLanguages);

    const draftChanged = currentDraft.sourceCode !== input.sourceCode;
    const languageChanged = session.language !== input.language;
    if (draftChanged) {
      await tx.draft.update({
        where: { codingSessionId: session.id },
        data: { sourceCode: input.sourceCode, revision: { increment: 1 } },
      });
    }
    if (languageChanged) {
      await tx.codingSession.update({
        where: { id: session.id },
        data: { language: input.language },
      });
    }
    if (draftChanged || languageChanged) {
      await createEvent(tx, {
        codingSessionId: session.id,
        type: "DRAFT_SAVED",
      });
    }

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
      tests: session.task.testCases
        .map((test) => ({
          id: test.id,
          input: test.input,
          expectedOutput: test.expectedOutput,
          visibility: test.visible
            ? ("VISIBLE" as const)
            : ("HIDDEN" as const),
        }))
        .filter((test) => scope === "ALL" || test.visibility === "VISIBLE"),
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
      errorText: "The configured execution provider was unavailable.",
      testResults: [],
    };
  }

  const visibilityById = new Map(
    prepared.tests.map((test) => [test.id, test.visibility]),
  );
  const normalizedResult: ServerExecutionResult = {
    ...result,
    testResults: result.testResults.flatMap((test) => {
      const visibility = visibilityById.get(test.testId);
      return visibility ? [{ ...test, visibility }] : [];
    }),
  };
  const breakdown = buildResultBreakdown(normalizedResult, prepared.tests);

  return prisma.$transaction(async (tx) => {
    const completedAt = new Date();
    const snapshot = await tx.resultSnapshot.create({
      data: {
        runAttemptId: prepared.run.id,
        state: toRunResultState(normalizedResult.state),
        passedTests: normalizedResult.passedTests,
        totalTests: normalizedResult.totalTests,
        ...breakdown,
        errorText: normalizedResult.errorText,
        testResults:
          normalizedResult.testResults as unknown as Prisma.InputJsonValue,
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
      executionMode: provider.executionMode,
      id: prepared.run.id,
      resultSnapshotId: snapshot.id,
      state: normalizedResult.state,
      passedTests: normalizedResult.passedTests,
      totalTests: normalizedResult.totalTests,
      errorText: normalizedResult.errorText,
      testResults: publicTestResults(normalizedResult.testResults),
      ...breakdown,
      completedAt: completedAt.toISOString(),
    };
  }, transactionOptions);
}

export async function runStudentDraft(
  input: {
    studentId: string;
    sessionId: string;
    language: AllowedLanguage;
    sourceCode: string;
  },
  provider: ServerExecutionProvider = getServerExecutionProvider(),
) {
  return executeStudentDraft(input, provider, "VISIBLE");
}

function persistedSubmissionResult(
  submission: Prisma.SubmissionAttemptGetPayload<{
    include: { resultSnapshot: true };
  }>,
  executionMode: ExecutionModeDisclosure = executionModeFromPersistedSnapshot(),
): PersistedSubmission {
  const snapshot = submission.resultSnapshot;
  const breakdown = snapshotBreakdown(snapshot);
  return {
    id: submission.id,
    attemptNumber: submission.attemptNumber,
    submittedAt: submission.submittedAt.toISOString(),
    result: {
      executionMode,
      id: snapshot.runAttemptId,
      resultSnapshotId: snapshot.id,
      state: fromRunResultState(snapshot.state),
      passedTests: snapshot.passedTests,
      totalTests: snapshot.totalTests,
      errorText: snapshot.errorText ?? undefined,
      testResults: publicTestResults(
        snapshot.testResults as unknown as StoredTestResult[],
      ),
      ...breakdown,
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

  const run = await executeStudentDraft(input, provider, "ALL");
  try {
    const outcome = await prisma.$transaction(
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
        if (repeated) return { submission: repeated, created: false };

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
        return { submission: created, created: true };
      },
      {
        ...transactionOptions,
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
    return persistedSubmissionResult(
      outcome.submission,
      outcome.created
        ? run.executionMode
        : executionModeFromPersistedSnapshot(),
    );
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
          testCases: {
            orderBy: { position: "asc" },
            select: {
              id: true,
              position: true,
              input: true,
              expectedOutput: true,
              visible: true,
            },
          },
        },
      },
      resultSnapshot: true,
      review: true,
      codingSession: {
        include: {
          events: { orderBy: { sequence: "asc" } },
          _count: { select: { runs: true } },
        },
      },
    },
  });
  if (!submission) throw new AccessDeniedError();
  const storedTestResults =
    submission.resultSnapshot.testResults as unknown as StoredTestResult[];
  const testCaseById = new Map(
    submission.task.testCases.map((testCase) => [testCase.id, testCase]),
  );
  const breakdown = snapshotBreakdown(submission.resultSnapshot);
  return {
    id: submission.id,
    attemptNumber: submission.attemptNumber,
    language: submission.language,
    sourceCode: submission.sourceCodeSnapshot,
    submittedAt: submission.submittedAt.toISOString(),
    student: submission.student,
    task: {
      id: submission.task.id,
      title: submission.task.title,
      classroom: submission.task.classroom,
    },
    result: {
      executionMode: executionModeFromPersistedSnapshot(),
      state: fromRunResultState(submission.resultSnapshot.state),
      passedTests: submission.resultSnapshot.passedTests,
      totalTests: submission.resultSnapshot.totalTests,
      errorText: submission.resultSnapshot.errorText,
      ...breakdown,
      testResults: storedTestResults.map((result) => {
        const testCase = testCaseById.get(result.testId);
        return {
          testId: result.testId,
          position: testCase?.position ?? null,
          visibility:
            result.visibility ??
            (testCase?.visible === false ? "HIDDEN" : "VISIBLE"),
          input: testCase?.input ?? null,
          expectedOutput: testCase?.expectedOutput ?? null,
          actualOutput: result.actualOutput,
          passed: result.passed,
        };
      }),
    },
    runCount: submission.codingSession._count.runs,
    review: submission.review
      ? {
          feedback: submission.review.feedback,
          marksAwarded: submission.review.marksAwarded,
          marksOutOf: submission.review.marksOutOf,
          status: submission.review.status,
          publishedAt: submission.review.publishedAt?.toISOString() ?? null,
          updatedAt: submission.review.updatedAt.toISOString(),
        }
      : null,
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

export async function getSubmissionForStudent(
  studentId: string,
  submissionId: string,
) {
  const submission = await prisma.submissionAttempt.findFirst({
    where: { id: submissionId, studentId },
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
      review: true,
      codingSession: {
        include: {
          events: { orderBy: { sequence: "asc" } },
          _count: { select: { runs: true } },
        },
      },
    },
  });
  if (!submission) throw new AccessDeniedError();
  const breakdown = snapshotBreakdown(submission.resultSnapshot);
  return {
    id: submission.id,
    attemptNumber: submission.attemptNumber,
    language: submission.language,
    sourceCode: submission.sourceCodeSnapshot,
    submittedAt: submission.submittedAt.toISOString(),
    student: submission.student,
    task: submission.task,
    result: {
      executionMode: executionModeFromPersistedSnapshot(),
      state: fromRunResultState(submission.resultSnapshot.state),
      passedTests: submission.resultSnapshot.passedTests,
      totalTests: submission.resultSnapshot.totalTests,
      errorText: submission.resultSnapshot.errorText,
      ...breakdown,
      testResults: publicTestResults(
        submission.resultSnapshot.testResults as unknown as StoredTestResult[],
      ),
    },
    runCount: submission.codingSession._count.runs,
    review:
      submission.review?.status === "PUBLISHED"
        ? {
            feedback: submission.review.feedback,
            marksAwarded: submission.review.marksAwarded,
            marksOutOf: submission.review.marksOutOf,
            status: submission.review.status,
            publishedAt: submission.review.publishedAt?.toISOString() ?? null,
          }
        : null,
    events: submission.codingSession.events.map((event) => ({
      id: event.id,
      sequence: event.sequence,
      type: event.type,
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
