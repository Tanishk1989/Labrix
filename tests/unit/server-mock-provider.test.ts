import { describe, expect, it } from "vitest";
import { ServerMockExecutionProvider } from "@/server/execution/mock-provider";
import type { ServerExecutionProvider } from "@/server/execution/provider";

const request = {
  language: "CPP" as const,
  sourceCode: "int main() {}",
  tests: [{ id: "one", input: "1", expectedOutput: "1", visibility: "VISIBLE" as const }],
};

describe("server-owned execution provider boundary", () => {
  it("accepts the deterministic mock through the typed provider interface", async () => {
    const provider: ServerExecutionProvider = new ServerMockExecutionProvider(0);
    const result = await provider.execute(request);
    expect(result.state).toBe("completed");
    expect(result.passedTests).toBe(1);
    expect(result.testResults[0]?.visibility).toBe("VISIBLE");
  });

  it("simulates feedback without claiming compilation", async () => {
    const provider = new ServerMockExecutionProvider(0);
    const result = await provider.execute({ ...request, sourceCode: "compile_error" });
    expect(result.state).toBe("compilation_error");
    expect(result.errorText).toContain("Simulated compiler feedback");
  });
});
