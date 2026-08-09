import { describe, expect, it } from "vitest";
import { MockExecutionProvider } from "@/lib/execution/mock-provider";

const request = {
  language: "cpp" as const,
  sourceCode: "int main() {}",
  tests: [{ id: "one", input: "1", expectedOutput: "1" }],
};
describe("MockExecutionProvider", () => {
  it("returns completed results without executing code", async () => {
    const result = await new MockExecutionProvider().execute(request);
    expect(result.state).toBe("completed");
    expect(result.passedTests).toBe(1);
  });
  it("returns compilation feedback for its mock marker", async () => {
    const result = await new MockExecutionProvider().execute({
      ...request,
      sourceCode: "compile_error",
    });
    expect(result.state).toBe("compilation_error");
    expect(result.errorText).toContain("Mock compiler");
  });
});
