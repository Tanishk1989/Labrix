import { describe, expect, it, vi } from "vitest";
import { Judge0ExecutionProvider } from "@/server/execution/judge0-provider";

const request = {
  language: "JAVA" as const,
  sourceCode: "public class Main { public static void main(String[] args) { System.out.println(\"ok\"); } }",
  tests: [{ id: "visible-1", input: "", expectedOutput: "ok", visibility: "VISIBLE" as const }],
};

describe("Judge0 execution provider", () => {
  it("submits, polls, and maps an accepted result", async () => {
    const fetchImplementation = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ token: "submission-1" }), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        stdout: "ok\n",
        status: { id: 3, description: "Accepted" },
      }), { status: 200 }));
    const provider = new Judge0ExecutionProvider({
      baseUrl: "https://judge0.example.test",
      apiKey: "test-key",
      fetchImplementation,
      pollIntervalMs: 0,
    }, "JAVA");

    const result = await provider.execute(request);

    expect(result.state).toBe("completed");
    expect(result.passedTests).toBe(1);
    expect(result.testResults[0]).toMatchObject({ passed: true, actualOutput: "ok" });
    expect(fetchImplementation).toHaveBeenCalledTimes(2);
    expect(fetchImplementation.mock.calls[0][1]?.headers).toMatchObject({
      "x-rapidapi-key": "test-key",
      "x-rapidapi-host": "judge0.example.test",
    });
  });

  it("maps compiler errors without exposing hidden expected output", async () => {
    const fetchImplementation = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ token: "submission-2" }), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        compile_output: "Main.java:1: error",
        status: { id: 6, description: "Compilation Error" },
      }), { status: 200 }));
    const provider = new Judge0ExecutionProvider({
      baseUrl: "https://judge0.example.test",
      authToken: "token",
      fetchImplementation,
      pollIntervalMs: 0,
    }, "JAVA");

    const result = await provider.execute({
      ...request,
      tests: [{ ...request.tests[0], visibility: "HIDDEN" as const, expectedOutput: "secret" }],
    });

    expect(result.state).toBe("compilation_error");
    expect(result.errorText).toContain("Main.java");
    expect(result.testResults[0].actualOutput).toBe("");
  });
});
