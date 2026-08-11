import { randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  getOrCreateStudentWorkspace,
  runStudentDraft,
  submitStudentDraft,
} from "@/server/attempts/service";
import { getServerExecutionProvider } from "@/server/execution";
import { CppHttpExecutionProvider } from "@/server/execution/cpp-http-provider";
import { ServerMockExecutionProvider } from "@/server/execution/mock-provider";
import { createCppRunnerServer } from "../../runner/cpp/server";

const suffix = randomUUID().slice(0, 8);
const taskId = `cpp-workspace-acceptance-${suffix}`;
const classroomId = "dsa-2026";
const studentId = "demo-student-1";
const teacherId = "demo-teacher";
const originalProviderMode = process.env.LABRIX_EXECUTION_PROVIDER;
const originalRunnerUrl = process.env.LABRIX_CPP_RUNNER_URL;
const runnerServer = createCppRunnerServer();
let sessionId = "";

const successSource = `#include <iostream>
int main() {
  long long left = 0;
  long long right = 0;
  std::cin >> left >> right;
  std::cout << left + right << "\\n";
}`;

async function closeRunner() {
  if (!runnerServer.listening) return;
  await new Promise<void>((resolve, reject) => {
    runnerServer.close((error) => (error ? reject(error) : resolve()));
  });
}

async function cleanAcceptanceRows() {
  const sessions = await prisma.codingSession.findMany({
    where: { taskId },
    select: { id: true },
  });
  const sessionIds = sessions.map((session) => session.id);
  const runs = await prisma.runAttempt.findMany({
    where: { codingSessionId: { in: sessionIds } },
    select: { id: true },
  });
  await prisma.codeEvent.deleteMany({
    where: { codingSessionId: { in: sessionIds } },
  });
  await prisma.submissionAttempt.deleteMany({ where: { taskId } });
  await prisma.resultSnapshot.deleteMany({
    where: { runAttemptId: { in: runs.map((run) => run.id) } },
  });
  await prisma.runAttempt.deleteMany({
    where: { codingSessionId: { in: sessionIds } },
  });
  await prisma.draft.deleteMany({
    where: { codingSessionId: { in: sessionIds } },
  });
  await prisma.codingSession.deleteMany({ where: { id: { in: sessionIds } } });
  await prisma.testCase.deleteMany({ where: { taskId } });
  await prisma.task.deleteMany({ where: { id: taskId } });
}

beforeAll(async () => {
  await new Promise<void>((resolve, reject) => {
    runnerServer.once("error", reject);
    runnerServer.listen(0, "127.0.0.1", () => {
      runnerServer.removeListener("error", reject);
      const address = runnerServer.address() as AddressInfo;
      process.env.LABRIX_EXECUTION_PROVIDER = "cpp-http";
      process.env.LABRIX_CPP_RUNNER_URL =
        `http://127.0.0.1:${address.port}/v1/execute/cpp`;
      resolve();
    });
  });

  await prisma.task.create({
    data: {
      id: taskId,
      classroomId,
      authorTeacherId: teacherId,
      title: "C++ runner workspace acceptance",
      instructions: "Print the sum of two integers.",
      allowedLanguages: ["CPP"],
      cppStarterCode: successSource,
      status: "PUBLISHED",
      publishedAt: new Date(),
      testCases: {
        create: [
          { position: 1, input: "2 3\n", expectedOutput: "5", visible: true },
          {
            position: 2,
            input: "400000 500000\n",
            expectedOutput: "900000",
            visible: false,
          },
        ],
      },
    },
  });
  const workspace = await getOrCreateStudentWorkspace(studentId, taskId);
  sessionId = workspace.session.id;
});

afterAll(async () => {
  if (originalProviderMode === undefined) {
    delete process.env.LABRIX_EXECUTION_PROVIDER;
  } else {
    process.env.LABRIX_EXECUTION_PROVIDER = originalProviderMode;
  }
  if (originalRunnerUrl === undefined) {
    delete process.env.LABRIX_CPP_RUNNER_URL;
  } else {
    process.env.LABRIX_CPP_RUNNER_URL = originalRunnerUrl;
  }
  await closeRunner();
  await cleanAcceptanceRows();
  await prisma.$disconnect();
});

async function executeRun(sourceCode: string) {
  return runStudentDraft({
    studentId,
    sessionId,
    language: "CPP",
    sourceCode,
  });
}

async function expectPersistedRun(
  runId: string,
  resultSnapshotId: string,
  sourceCode: string,
  state:
    | "COMPLETED"
    | "COMPILATION_ERROR"
    | "RUNTIME_ERROR"
    | "TIME_LIMIT_EXCEEDED",
) {
  const stored = await prisma.runAttempt.findUniqueOrThrow({
    where: { id: runId },
    include: { resultSnapshot: true },
  });
  expect(stored).toMatchObject({
    codingSessionId: sessionId,
    language: "CPP",
    sourceCodeSnapshot: sourceCode,
    completedAt: expect.any(Date),
  });
  expect(stored.resultSnapshot).toMatchObject({
    id: resultSnapshotId,
    runAttemptId: runId,
    state,
    passedTests: state === "COMPLETED" ? 1 : 0,
    totalTests: 1,
    visibleTotalTests: 1,
    hiddenTotalTests: 0,
    suggestedScore: state === "COMPLETED" ? 10 : 0,
  });
  expect(stored.resultSnapshot?.testResults).toHaveLength(
    state === "COMPLETED" ? 1 : 0,
  );
  return stored.resultSnapshot;
}

describe.sequential("C++ runner through the Labrix workspace service boundary", () => {
  it("selects cpp-http and persists a successful visible-only Run", async () => {
    expect(getServerExecutionProvider()).toBeInstanceOf(
      CppHttpExecutionProvider,
    );

    const run = await executeRun(successSource);

    expect(run).toMatchObject({
      executionMode: "cpp-docker-local",
      state: "completed",
      passedTests: 1,
      totalTests: 1,
      visiblePassedTests: 1,
      visibleTotalTests: 1,
      hiddenPassedTests: 0,
      hiddenTotalTests: 0,
      suggestedScore: 10,
    });
    expect(run.testResults).toEqual([
      expect.objectContaining({ passed: true, actualOutput: "5" }),
    ]);
    const snapshot = await expectPersistedRun(
      run.id,
      run.resultSnapshotId,
      successSource,
      "COMPLETED",
    );
    expect(snapshot?.passedTests).toBe(1);
  });

  it("persists C++ compilation_error mapping", async () => {
    const sourceCode = `int main() {
  return missing_symbol;
}`;
    const run = await executeRun(sourceCode);

    expect(run).toMatchObject({
      state: "compilation_error",
      passedTests: 0,
      totalTests: 1,
      testResults: [],
    });
    expect(run.errorText).toContain("error:");
    const snapshot = await expectPersistedRun(
      run.id,
      run.resultSnapshotId,
      sourceCode,
      "COMPILATION_ERROR",
    );
    expect(snapshot?.errorText).toContain("error:");
  });

  it("persists C++ runtime_error mapping", async () => {
    const sourceCode = `int main() {
  return 7;
}`;
    const run = await executeRun(sourceCode);

    expect(run).toMatchObject({
      state: "runtime_error",
      passedTests: 0,
      totalTests: 1,
      testResults: [],
    });
    expect(run.errorText).toContain("non-zero status");
    await expectPersistedRun(
      run.id,
      run.resultSnapshotId,
      sourceCode,
      "RUNTIME_ERROR",
    );
  });

  it("persists C++ time_limit_exceeded mapping", async () => {
    const sourceCode = `int main() {
  volatile unsigned long long counter = 0;
  while (true) { ++counter; }
}`;
    const run = await executeRun(sourceCode);

    expect(run).toMatchObject({
      state: "time_limit_exceeded",
      passedTests: 0,
      totalTests: 1,
      testResults: [],
    });
    await expectPersistedRun(
      run.id,
      run.resultSnapshotId,
      sourceCode,
      "TIME_LIMIT_EXCEEDED",
    );
  });

  it("persists visible and hidden results for Submit while redacting hidden detail", async () => {
    const submission = await submitStudentDraft({
      studentId,
      sessionId,
      language: "CPP",
      sourceCode: successSource,
      idempotencyKey: randomUUID(),
    });

    expect(submission.result).toMatchObject({
      executionMode: "cpp-docker-local",
      state: "completed",
      passedTests: 2,
      totalTests: 2,
      visiblePassedTests: 1,
      visibleTotalTests: 1,
      hiddenPassedTests: 1,
      hiddenTotalTests: 1,
      suggestedScore: 10,
    });
    expect(submission.result.testResults).toHaveLength(1);
    expect(JSON.stringify(submission)).not.toContain("400000 500000");
    expect(JSON.stringify(submission)).not.toContain("900000");

    const stored = await prisma.submissionAttempt.findUniqueOrThrow({
      where: { id: submission.id },
      include: {
        resultSnapshot: { include: { runAttempt: true } },
      },
    });
    expect(stored.sourceCodeSnapshot).toBe(successSource);
    expect(stored.resultSnapshot).toMatchObject({
      state: "COMPLETED",
      passedTests: 2,
      totalTests: 2,
      visiblePassedTests: 1,
      visibleTotalTests: 1,
      hiddenPassedTests: 1,
      hiddenTotalTests: 1,
      suggestedScore: 10,
    });
    expect(stored.resultSnapshot.runAttempt).toMatchObject({
      codingSessionId: sessionId,
      language: "CPP",
      sourceCodeSnapshot: successSource,
      completedAt: expect.any(Date),
    });
    expect(stored.resultSnapshot.testResults).toEqual([
      expect.objectContaining({ visibility: "VISIBLE", actualOutput: "5" }),
      expect.objectContaining({
        visibility: "HIDDEN",
        actualOutput: "900000",
      }),
    ]);
  });

  it("keeps mock as the default when provider selection is unset", () => {
    delete process.env.LABRIX_EXECUTION_PROVIDER;
    delete process.env.LABRIX_CPP_RUNNER_URL;
    try {
      expect(getServerExecutionProvider()).toBeInstanceOf(
        ServerMockExecutionProvider,
      );
    } finally {
      process.env.LABRIX_EXECUTION_PROVIDER = "cpp-http";
      const address = runnerServer.address() as AddressInfo;
      process.env.LABRIX_CPP_RUNNER_URL =
        `http://127.0.0.1:${address.port}/v1/execute/cpp`;
    }
  });
});
