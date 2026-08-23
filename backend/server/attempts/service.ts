import {
  AllowedLanguage,
  ExecutionMode as StoredExecutionMode,
  Prisma,
  RunResultState,
  type CodeEventType,
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { resolveStarterCodes } from "@/domain/tasks/starter-code";
import {
  executionModeFromPersistedSnapshot,
  type ExecutionMode,
  type ExecutionModeDisclosure,
} from "@/domain/execution/execution-mode";
import {
  AccessDeniedError,
  requireOwnedClassroom,
  requirePublishedTaskForStudent,
} from "@/server/authorization/classroom-access";
import { getServerExecutionProvider } from "@/server/execution";
import { globalExecutionQueue } from "@/server/execution/concurrency-queue";
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
import { executionRequestGuard } from "@/server/execution/request-guard";
import {
  computeStructuralSimilarity,
  type PairwiseStructuralSimilarity,
} from "@/server/evidence/structural-ast-comparator";
import { globalRateLimiter } from "@/server/security/rate-limiter";
import { RATE_LIMIT_CONFIGS } from "@/server/security/rate-limit-configs";

export class RateLimitExceededError extends Error {
  readonly retryAfterSeconds: number;
  constructor(message = "Rate limit exceeded. Please wait before retrying.", retryAfterSeconds = 1) {
    super(message);
    this.name = "RateLimitExceededError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class SubmissionDeadlineError extends Error {
  constructor(message = "The deadline for this practical has passed. New submissions are no longer accepted.") {
    super(message);
    this.name = "SubmissionDeadlineError";
  }
}

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
  const existing = await findActiveSession(studentId, taskId);
  if (existing) {
    const executionMode = getServerExecutionProvider(
      process.env,
      existing.language,
    ).executionMode;
    return toWorkspace(task, existing, executionMode);
  }

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
    const executionMode = getServerExecutionProvider(
      process.env,
      created.language,
    ).executionMode;
    return toWorkspace(task, created, executionMode);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const concurrent = await findActiveSession(studentId, taskId);
      if (concurrent) {
        const executionMode = getServerExecutionProvider(
          process.env,
          concurrent.language,
        ).executionMode;
        return toWorkspace(task, concurrent, executionMode);
      }
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
  const rl = await globalRateLimiter.check(input.sessionId, RATE_LIMIT_CONFIGS.AUTOSAVE);
  if (!rl.success) {
    throw new RateLimitExceededError("Autosave rate limit exceeded. Please wait.", rl.retryAfterSeconds);
  }
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

const storedExecutionModeByRuntime: Record<ExecutionMode, StoredExecutionMode> = {
  simulated: StoredExecutionMode.SIMULATED,
  "java-docker-local": StoredExecutionMode.JAVA_DOCKER_LOCAL,
  "cpp-docker-local": StoredExecutionMode.CPP_DOCKER_LOCAL,
};

const runtimeExecutionModeByStored: Record<StoredExecutionMode, ExecutionMode> = {
  SIMULATED: "simulated",
  JAVA_DOCKER_LOCAL: "java-docker-local",
  CPP_DOCKER_LOCAL: "cpp-docker-local",
};

function storedExecutionMode(mode: ExecutionMode) {
  return storedExecutionModeByRuntime[mode];
}

function disclosedSnapshotExecutionMode(mode: StoredExecutionMode | null) {
  return executionModeFromPersistedSnapshot(
    mode === null ? null : runtimeExecutionModeByStored[mode],
  );
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
    if (
      scope === "ALL" &&
      session.task.deadline &&
      session.task.deadline < new Date()
    ) {
      throw new SubmissionDeadlineError(
        "The deadline for this practical has passed. New submissions are no longer accepted.",
      );
    }

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
    result = await globalExecutionQueue.run(() =>
      provider.execute({
        language: input.language,
        sourceCode: input.sourceCode,
        tests: prepared.tests,
      }),
    );
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
        executionMode: storedExecutionMode(provider.executionMode),
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
  provider?: ServerExecutionProvider,
) {
  const executionProvider =
    provider ?? getServerExecutionProvider(process.env, input.language);
  const rl = await globalRateLimiter.check(input.sessionId, RATE_LIMIT_CONFIGS.CODE_RUN);
  if (!rl.success) {
    throw new RateLimitExceededError(
      "Code run rate limit exceeded. Please wait before executing again.",
      rl.retryAfterSeconds,
    );
  }
  return executionRequestGuard.execute(
    {
      studentId: input.studentId,
      sessionId: input.sessionId,
      kind: "run",
    },
    () => executeStudentDraft(input, executionProvider, "VISIBLE"),
  );
}

function persistedSubmissionResult(
  submission: Prisma.SubmissionAttemptGetPayload<{
    include: { resultSnapshot: true };
  }>,
): PersistedSubmission {
  const snapshot = submission.resultSnapshot;
  const breakdown = snapshotBreakdown(snapshot);
  return {
    id: submission.id,
    attemptNumber: submission.attemptNumber,
    submittedAt: submission.submittedAt.toISOString(),
    result: {
      executionMode: disclosedSnapshotExecutionMode(snapshot.executionMode),
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

async function submitStudentDraftWithoutGuard(
  input: {
    studentId: string;
    sessionId: string;
    language: AllowedLanguage;
    sourceCode: string;
    idempotencyKey: string;
  },
  provider: ServerExecutionProvider,
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
        if (session.task.deadline && session.task.deadline < new Date()) {
          throw new SubmissionDeadlineError(
            "The deadline for this practical has passed. New submissions are no longer accepted.",
          );
        }
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
    return persistedSubmissionResult(outcome.submission);
  } catch (error) {
    if (error instanceof SubmissionDeadlineError) throw error;
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

export async function submitStudentDraft(
  input: {
    studentId: string;
    sessionId: string;
    language: AllowedLanguage;
    sourceCode: string;
    idempotencyKey: string;
  },
  provider?: ServerExecutionProvider,
): Promise<PersistedSubmission> {
  const executionProvider =
    provider ?? getServerExecutionProvider(process.env, input.language);
  const rl = await globalRateLimiter.check(input.sessionId, RATE_LIMIT_CONFIGS.SUBMISSION);
  if (!rl.success) {
    throw new RateLimitExceededError(
      "Submission rate limit exceeded. Please wait before submitting again.",
      rl.retryAfterSeconds,
    );
  }
  return executionRequestGuard.execute(
    {
      studentId: input.studentId,
      sessionId: input.sessionId,
      kind: "submit",
    },
    () => submitStudentDraftWithoutGuard(input, executionProvider),
  );
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
          maximumMarks: true,
          rubricCriteria: { orderBy: { position: "asc" } },
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
      review: {
        include: {
          criterionScores: true,
          revisions: { orderBy: { version: "desc" } },
        },
      },
      codingSession: {
        include: {
          events: { orderBy: { sequence: "asc" } },
          _count: { select: { runs: true } },
        },
      },
    },
  });
  if (!submission) throw new AccessDeniedError();

  const peerSubmissions = await prisma.submissionAttempt.findMany({
    where: {
      taskId: submission.taskId,
      task: { classroom: { ownerTeacherId: teacherId } },
      id: { not: submission.id },
      studentId: { not: submission.studentId },
    },
    select: {
      id: true,
      studentId: true,
      student: { select: { name: true } },
      sourceCodeSnapshot: true,
      language: true,
    },
  });

  const peerComparisons: PairwiseStructuralSimilarity[] = peerSubmissions
    .filter((peer) => peer.language === submission.language)
    .map((peer) =>
      computeStructuralSimilarity(
        {
          id: submission.id,
          studentName: submission.student.name,
          sourceCode: submission.sourceCodeSnapshot,
          language: submission.language,
        },
        {
          id: peer.id,
          studentName: peer.student.name,
          sourceCode: peer.sourceCodeSnapshot,
          language: peer.language,
        },
      ),
    )
    .sort(
      (a, b) =>
        b.structuralSimilarityPercentage - a.structuralSimilarityPercentage,
    );

  const topPeerMatch = peerComparisons[0] ?? null;

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
      maximumMarks: submission.task.maximumMarks,
      rubricCriteria: submission.task.rubricCriteria.map((criterion) => ({
        id: criterion.id,
        title: criterion.title,
        maximumMarks: criterion.maximumMarks,
      })),
      classroom: submission.task.classroom,
    },
    cohortSimilarity: topPeerMatch,
    peerComparisons: peerComparisons.slice(0, 5),
    result: {
      executionMode: disclosedSnapshotExecutionMode(
        submission.resultSnapshot.executionMode,
      ),
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
          criterionScores: submission.task.rubricCriteria.map((criterion) => ({
            id: criterion.id,
            title: criterion.title,
            maximumMarks: criterion.maximumMarks,
            marksAwarded:
              submission.review!.criterionScores.find(
                (score) => score.criterionId === criterion.id,
              )?.marksAwarded ?? 0,
          })),
          revisions: submission.review.revisions.map((revision) => ({
            id: revision.id,
            version: revision.version,
            status: revision.status,
            marksAwarded: revision.marksAwarded,
            marksOutOf: revision.marksOutOf,
            createdAt: revision.createdAt.toISOString(),
          })),
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
          maximumMarks: true,
          classroom: { select: { id: true, name: true } },
          testCases: {
            where: { visible: true },
            orderBy: { position: "asc" },
            select: {
              id: true,
              position: true,
              input: true,
              expectedOutput: true,
            },
          },
        },
      },
      resultSnapshot: true,
      review: {
        include: {
          criterionScores: {
            include: { criterion: true },
          },
        },
      },
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
  const visibleTestById = new Map(
    submission.task.testCases.map((testCase) => [testCase.id, testCase]),
  );
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
      maximumMarks: submission.task.maximumMarks,
      classroom: submission.task.classroom,
    },
    result: {
      executionMode: disclosedSnapshotExecutionMode(
        submission.resultSnapshot.executionMode,
      ),
      state: fromRunResultState(submission.resultSnapshot.state),
      passedTests: submission.resultSnapshot.passedTests,
      totalTests: submission.resultSnapshot.totalTests,
      errorText: submission.resultSnapshot.errorText,
      ...breakdown,
      testResults: publicTestResults(
        submission.resultSnapshot.testResults as unknown as StoredTestResult[],
      ).map((result) => {
        const testCase = visibleTestById.get(result.testId);
        return {
          ...result,
          position: testCase?.position ?? null,
          input: testCase?.input ?? null,
          expectedOutput: testCase?.expectedOutput ?? null,
        };
      }),
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
            criterionScores: submission.review.criterionScores
              .sort((a, b) => a.criterion.position - b.criterion.position)
              .map((score) => ({
                title: score.criterion.title,
                marksAwarded: score.marksAwarded,
                maximumMarks: score.criterion.maximumMarks,
              })),
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
        select: { id: true, title: true, maximumMarks: true },
      },
    },
  });

  const tasks = classroom.tasks;
  const primaryTask = tasks[0] ?? null;

  const students = await Promise.all(
    classroom.memberships.map(async ({ user }) => {
      const submissions = await prisma.submissionAttempt.findMany({
        where: {
          taskId: { in: tasks.map((t) => t.id) },
          studentId: user.id,
        },
        orderBy: { attemptNumber: "desc" },
        select: {
          id: true,
          taskId: true,
          attemptNumber: true,
          submittedAt: true,
          language: true,
          resultSnapshot: {
            select: { passedTests: true, totalTests: true },
          },
        },
      });

      const submissionByTask = new Map(submissions.map((s) => [s.taskId, s]));
      const primarySubmission = primaryTask
        ? submissionByTask.get(primaryTask.id) ?? null
        : null;

      const practicalsProgress = tasks.map((t) => {
        const sub = submissionByTask.get(t.id);
        return {
          taskId: t.id,
          taskTitle: t.title,
          submission: sub
            ? {
                id: sub.id,
                attemptNumber: sub.attemptNumber,
                submittedAt: sub.submittedAt.toISOString(),
                language: sub.language,
                passedTests: sub.resultSnapshot.passedTests,
                totalTests: sub.resultSnapshot.totalTests,
              }
            : null,
        };
      });

      return {
        ...user,
        latestSubmission: primarySubmission
          ? {
              id: primarySubmission.id,
              attemptNumber: primarySubmission.attemptNumber,
              submittedAt: primarySubmission.submittedAt.toISOString(),
              language: primarySubmission.language,
              resultSnapshot: primarySubmission.resultSnapshot,
            }
          : null,
        practicals: practicalsProgress,
        submittedCount: practicalsProgress.filter((p) => p.submission !== null).length,
        totalPracticalsCount: tasks.length,
      };
    }),
  );

  return {
    classroom: { id: classroom.id, name: classroom.name },
    task: primaryTask,
    tasks,
    students,
  };
}
