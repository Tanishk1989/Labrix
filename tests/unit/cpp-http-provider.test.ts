import { describe, expect, it } from "vitest";
import { getServerExecutionProvider } from "@/server/execution";
import { CppHttpExecutionProvider } from "@/server/execution/cpp-http-provider";
import {
  CPP_RUNNER_OUTPUT_BYTES,
  CPP_RUNNER_SOURCE_BYTES,
  CPP_RUNNER_WALL_TIME_MS,
  cppRunnerRequestSchema,
} from "@/server/execution/cpp-runner-protocol";
import { ServerMockExecutionProvider } from "@/server/execution/mock-provider";

const request = {
  language: "CPP" as const,
  sourceCode: "#include <iostream>\nint main() { std::cout << 1; }",
  tests: [
    {
      id: "visible-one",
      input: "1\n",
      expectedOutput: "1",
      visibility: "VISIBLE" as const,
    },
  ],
};

function completedResponse() {
  return new Response(
    JSON.stringify({
      state: "completed",
      passedTests: 1,
      totalTests: 1,
      testResults: [
        {
          testId: "visible-one",
          passed: true,
          actualOutput: "1",
          visibility: "VISIBLE",
        },
      ],
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}

describe("C++ HTTP execution provider scaffold", () => {
  it("sends only the bounded C++ protocol shape", async () => {
    let capturedOptions: RequestInit | undefined;
    const provider = new CppHttpExecutionProvider({
      endpoint: "http://127.0.0.1:4020/v1/execute/cpp",
      fetchImplementation: async (_input, options) => {
        capturedOptions = options;
        return completedResponse();
      },
    });

    await expect(provider.execute(request)).resolves.toMatchObject({
      state: "completed",
    });
    expect(provider.executionMode).toBe("cpp-runner-scaffold");
    expect(JSON.parse(String(capturedOptions?.body))).toMatchObject({
      language: "CPP",
      limits: {
        wallTimeMs: CPP_RUNNER_WALL_TIME_MS,
        outputBytes: CPP_RUNNER_OUTPUT_BYTES,
        network: "none",
      },
    });
  });

  it("validates the C++ literal, fixed limits, and unique test IDs", () => {
    const payload = {
      ...request,
      tests: [request.tests[0], request.tests[0]],
      limits: {
        wallTimeMs: CPP_RUNNER_WALL_TIME_MS,
        outputBytes: CPP_RUNNER_OUTPUT_BYTES,
        network: "none",
      },
    };

    expect(cppRunnerRequestSchema.safeParse(payload).success).toBe(false);
    expect(
      cppRunnerRequestSchema.safeParse({ ...payload, tests: request.tests })
        .success,
    ).toBe(true);
    expect(
      cppRunnerRequestSchema.safeParse({
        ...payload,
        language: "JAVA",
        tests: request.tests,
      }).success,
    ).toBe(false);
  });

  it("rejects non-C++ and oversized requests without contacting HTTP", async () => {
    let contacted = false;
    const provider = new CppHttpExecutionProvider({
      endpoint: "http://127.0.0.1:4020/v1/execute/cpp",
      fetchImplementation: async () => {
        contacted = true;
        return completedResponse();
      },
    });

    await expect(
      provider.execute({ ...request, language: "JAVA" }),
    ).resolves.toMatchObject({ state: "internal_error" });
    await expect(
      provider.execute({
        ...request,
        sourceCode: "x".repeat(CPP_RUNNER_SOURCE_BYTES + 1),
      }),
    ).resolves.toMatchObject({ state: "internal_error" });
    expect(contacted).toBe(false);
  });

  it("fails closed on an inconsistent response", async () => {
    const provider = new CppHttpExecutionProvider({
      endpoint: "http://127.0.0.1:4020/v1/execute/cpp",
      fetchImplementation: async () =>
        new Response(
          JSON.stringify({
            state: "completed",
            passedTests: 0,
            totalTests: 0,
            testResults: [],
          }),
        ),
    });

    await expect(provider.execute(request)).resolves.toMatchObject({
      state: "internal_error",
      errorText: expect.stringContaining("inconsistent"),
    });
  });

  it("keeps mock as default and requires explicit loopback C++ selection", () => {
    expect(getServerExecutionProvider({})).toBeInstanceOf(
      ServerMockExecutionProvider,
    );
    expect(() =>
      getServerExecutionProvider({ LABRIX_EXECUTION_PROVIDER: "cpp-http" }),
    ).toThrow(/LABRIX_CPP_RUNNER_URL/);
    expect(() =>
      getServerExecutionProvider({
        LABRIX_EXECUTION_PROVIDER: "cpp-http",
        LABRIX_CPP_RUNNER_URL: "https://runner.example.com/execute",
      }),
    ).toThrow(/loopback/);

    const provider = getServerExecutionProvider({
      LABRIX_EXECUTION_PROVIDER: "cpp-http",
      LABRIX_CPP_RUNNER_URL: "http://127.0.0.1:4020/v1/execute/cpp",
    });
    expect(provider).toBeInstanceOf(CppHttpExecutionProvider);
    expect(provider.executionMode).toBe("cpp-runner-scaffold");
  });
});
