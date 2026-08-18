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
import { JavaHttpExecutionProvider } from "@/server/execution/java-http-provider";
import { ServerMockExecutionProvider } from "@/server/execution/mock-provider";
import { createJavaRunnerServer } from "../../backend/runner/java/server";

const suffix = randomUUID().slice(0, 8);
const taskId = `java-workspace-acceptance-${suffix}`;
const classroomId = "dsa-2026";
const studentId = "demo-student-1";
const teacherId = "demo-teacher";
const originalProviderMode = process.env.LABRIX_EXECUTION_PROVIDER;
const originalRunnerUrl = process.env.LABRIX_JAVA_RUNNER_URL;
const runnerServer = createJavaRunnerServer();
let sessionId = "";

const successSource = `import java.util.Scanner;
public class Main {
  public static void main(String[] args) {
    Scanner input = new Scanner(System.in);
    System.out.println(input.nextInt() + input.nextInt());
  }
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
      process.env.LABRIX_EXECUTION_PROVIDER = "java-http";
      process.env.LABRIX_JAVA_RUNNER_URL =
        `http://127.0.0.1:${address.port}/v1/execute/java`;
      resolve();
    });
  });

  await prisma.task.create({
    data: {
      id: taskId,
      classroomId,
      authorTeacherId: teacherId,
      title: "Java runner workspace acceptance",
      instructions: "Print the sum of two integers.",
      allowedLanguages: ["JAVA"],
      javaStarterCode: successSource,
      status: "PUBLISHED",
      publishedAt: new Date(),
      testCases: {
        create: [
          { position: 1, input: "2 3\n", expectedOutput: "5", visible: true },
          {
            position: 2,
            input: "999999 999999\n",
            expectedOutput: "1999998",
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
    delete process.env.LABRIX_JAVA_RUNNER_URL;
  } else {
    process.env.LABRIX_JAVA_RUNNER_URL = originalRunnerUrl;
  }
  await closeRunner();
  await cleanAcceptanceRows();
  await prisma.$disconnect();
});

async function executeRun(sourceCode: string) {
  return runStudentDraft({
    studentId,
    sessionId,
    language: "JAVA",
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
    language: "JAVA",
    sourceCodeSnapshot: sourceCode,
    completedAt: expect.any(Date),
  });
  expect(stored.resultSnapshot).toMatchObject({
    id: resultSnapshotId,
    runAttemptId: runId,
    state,
    executionMode: "JAVA_DOCKER_LOCAL",
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

describe.sequential("Java runner through the Labrix workspace service boundary", () => {
  it("selects java-http and persists a successful visible-only Run", async () => {
    expect(getServerExecutionProvider()).toBeInstanceOf(
      JavaHttpExecutionProvider,
    );

    const run = await executeRun(successSource);

    expect(run).toMatchObject({
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

  it("persists Java compilation_error mapping", async () => {
    const sourceCode = `public class Main {
  public static void main(String[] args) {
    System.out.println("missing semicolon")
  }
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

  it("persists Java runtime_error mapping", async () => {
    const sourceCode = `public class Main {
  public static void main(String[] args) {
    throw new IllegalStateException("workspace runtime failure");
  }
}`;
    const run = await executeRun(sourceCode);

    expect(run).toMatchObject({
      state: "runtime_error",
      passedTests: 0,
      totalTests: 1,
      testResults: [],
    });
    expect(run.errorText).toContain("workspace runtime failure");
    await expectPersistedRun(
      run.id,
      run.resultSnapshotId,
      sourceCode,
      "RUNTIME_ERROR",
    );
  });

  it("persists Java time_limit_exceeded mapping", async () => {
    const sourceCode = `public class Main {
  public static void main(String[] args) {
    while (true) { }
  }
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
      language: "JAVA",
      sourceCode: successSource,
      idempotencyKey: randomUUID(),
    });

    expect(submission.result).toMatchObject({
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
    expect(JSON.stringify(submission)).not.toContain("999999 999999");
    expect(JSON.stringify(submission)).not.toContain("1999998");

    const stored = await prisma.submissionAttempt.findUniqueOrThrow({
      where: { id: submission.id },
      include: {
        resultSnapshot: { include: { runAttempt: true } },
      },
    });
    expect(stored.sourceCodeSnapshot).toBe(successSource);
    expect(stored.resultSnapshot).toMatchObject({
      state: "COMPLETED",
      executionMode: "JAVA_DOCKER_LOCAL",
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
      language: "JAVA",
      sourceCodeSnapshot: successSource,
      completedAt: expect.any(Date),
    });
    expect(stored.resultSnapshot.testResults).toEqual([
      expect.objectContaining({ visibility: "VISIBLE", actualOutput: "5" }),
      expect.objectContaining({
        visibility: "HIDDEN",
        actualOutput: "1999998",
      }),
    ]);
  });

  it("keeps mock as the default when provider selection is unset", () => {
    delete process.env.LABRIX_EXECUTION_PROVIDER;
    delete process.env.LABRIX_JAVA_RUNNER_URL;
    try {
      expect(getServerExecutionProvider()).toBeInstanceOf(
        ServerMockExecutionProvider,
      );
    } finally {
      process.env.LABRIX_EXECUTION_PROVIDER = "java-http";
      const address = runnerServer.address() as AddressInfo;
      process.env.LABRIX_JAVA_RUNNER_URL =
        `http://127.0.0.1:${address.port}/v1/execute/java`;
    }
  });
});
