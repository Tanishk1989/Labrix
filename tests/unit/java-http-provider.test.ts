import { describe, expect, it } from "vitest";
import { getServerExecutionProvider } from "@/server/execution";
import { JavaHttpExecutionProvider } from "@/server/execution/java-http-provider";
import { ServerMockExecutionProvider } from "@/server/execution/mock-provider";
import {
  JAVA_RUNNER_OUTPUT_BYTES,
  JAVA_RUNNER_WALL_TIME_MS,
} from "@/server/execution/java-runner-protocol";

const request = {
  language: "JAVA" as const,
  sourceCode: "public class Main { public static void main(String[] args) {} }",
  tests: [
    {
      id: "visible-one",
      input: "1",
      expectedOutput: "1",
      visibility: "VISIBLE" as const,
    },
  ],
};

function runnerResponse(
  state:
    | "completed"
    | "compilation_error"
    | "runtime_error"
    | "time_limit_exceeded",
) {
  const completed = state === "completed";
  return new Response(
    JSON.stringify({
      state,
      passedTests: completed ? 1 : 0,
      totalTests: 1,
      errorText: completed ? undefined : `Mapped ${state}`,
      testResults: completed
        ? [
            {
              testId: "visible-one",
              passed: true,
              actualOutput: "1",
              visibility: "VISIBLE",
            },
          ]
        : [],
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}

describe("Java HTTP execution provider scaffold", () => {
  it.each([
    "completed",
    "compilation_error",
    "runtime_error",
    "time_limit_exceeded",
  ] as const)("maps the runner %s state", async (state) => {
    const provider = new JavaHttpExecutionProvider({
      endpoint: "http://127.0.0.1:4010/v1/execute/java",
      fetchImplementation: async () => runnerResponse(state),
    });

    expect(provider.executionMode).toBe("java-docker-local");
    await expect(provider.execute(request)).resolves.toMatchObject({ state });
  });

  it("sends explicit wall-time, output, and network limits", async () => {
    let capturedOptions: RequestInit | undefined;
    const fetchImplementation: typeof fetch = async (_input, options) => {
      capturedOptions = options;
      return runnerResponse("completed");
    };
    const provider = new JavaHttpExecutionProvider({
      endpoint: "http://127.0.0.1:4010/v1/execute/java",
      fetchImplementation,
    });

    await provider.execute(request);

    const payload = JSON.parse(String(capturedOptions?.body));
    expect(payload.limits).toEqual({
      wallTimeMs: JAVA_RUNNER_WALL_TIME_MS,
      outputBytes: JAVA_RUNNER_OUTPUT_BYTES,
      network: "none",
    });
  });

  it("maps an invalid or oversized runner response to a bounded internal error", async () => {
    const provider = new JavaHttpExecutionProvider({
      endpoint: "http://127.0.0.1:4010/v1/execute/java",
      fetchImplementation: async () =>
        new Response("x", {
          headers: { "content-length": "999999" },
        }),
    });

    const result = await provider.execute(request);
    expect(result).toMatchObject({
      state: "internal_error",
      passedTests: 0,
      totalTests: 1,
      testResults: [],
    });
  });

  it("fails safely when the runner exceeds the adapter timeout", async () => {
    const provider = new JavaHttpExecutionProvider({
      endpoint: "http://127.0.0.1:4010/v1/execute/java",
      requestTimeoutMs: 1,
      fetchImplementation: (_input, options) => {
        return new Promise((_resolve, reject) => {
          options?.signal?.addEventListener("abort", () =>
            reject(new Error("aborted")),
          );
        });
      },
    });

    await expect(provider.execute(request)).resolves.toMatchObject({
      state: "internal_error",
      errorText: expect.stringContaining("safe response in time"),
    });
  });

  it("rejects C++ without contacting the Java runner", async () => {
    let contacted = false;
    const fetchImplementation: typeof fetch = async () => {
      contacted = true;
      return runnerResponse("completed");
    };
    const provider = new JavaHttpExecutionProvider({
      endpoint: "http://127.0.0.1:4010/v1/execute/java",
      fetchImplementation,
    });

    const result = await provider.execute({ ...request, language: "CPP" });
    expect(result.state).toBe("internal_error");
    expect(contacted).toBe(false);
  });

  it("keeps mock as the default and requires an explicit loopback Java endpoint", () => {
    const defaultProvider = getServerExecutionProvider({});
    expect(defaultProvider).toBeInstanceOf(ServerMockExecutionProvider);
    expect(defaultProvider.executionMode).toBe("simulated");
    expect(() =>
      getServerExecutionProvider({ LABRIX_EXECUTION_PROVIDER: "java-http" }),
    ).toThrow(/LABRIX_JAVA_RUNNER_URL/);
    expect(() =>
      getServerExecutionProvider({
        LABRIX_EXECUTION_PROVIDER: "java-http",
        LABRIX_JAVA_RUNNER_URL: "https://runner.example.com/execute",
      }),
    ).toThrow(/loopback/);
    const javaProvider = getServerExecutionProvider({
      LABRIX_EXECUTION_PROVIDER: "java-http",
      LABRIX_JAVA_RUNNER_URL: "http://127.0.0.1:4010/v1/execute/java",
    });
    expect(javaProvider).toBeInstanceOf(JavaHttpExecutionProvider);
    expect(javaProvider.executionMode).toBe("java-docker-local");
  });
});
