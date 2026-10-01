import { describe, expect, it, vi } from "vitest";
import { WandboxExecutionProvider } from "@/server/execution/wandbox-provider";

const request = {
  language: "CPP" as const,
  sourceCode: "#include <iostream>\nint main(){ int n; std::cin >> n; std::cout << n * 2; }",
  tests: [{ id: "visible-1", input: "4", expectedOutput: "8\n", visibility: "VISIBLE" as const }],
};

describe("Wandbox execution provider", () => {
  it("maps successful output to a passing test", async () => {
    const fetchImplementation = vi.fn(async (..._args: Parameters<typeof fetch>) => new Response(JSON.stringify({
      status: "0", program_output: "8\n", compiler_error: "", program_error: "",
    }), { status: 200 }));
    const provider = new WandboxExecutionProvider({ fetchImplementation }, "CPP");
    await expect(provider.execute(request)).resolves.toMatchObject({ state: "completed", passedTests: 1, totalTests: 1 });
  });

  it("returns compiler diagnostics", async () => {
    const provider = new WandboxExecutionProvider({
      fetchImplementation: vi.fn(async () => new Response(JSON.stringify({
        status: "1", compiler_error: "Main.cpp: error: expected ;",
      }), { status: 200 })),
    }, "CPP");
    await expect(provider.execute(request)).resolves.toMatchObject({
      state: "compilation_error", passedTests: 0, errorText: "Main.cpp: error: expected ;",
    });
  });

  it("fails safely when the public service is busy", async () => {
    const provider = new WandboxExecutionProvider({
      fetchImplementation: vi.fn(async () => { throw new Error("offline"); }),
    }, "JAVA");
    await expect(provider.execute({ ...request, language: "JAVA" })).resolves.toMatchObject({
      state: "internal_error", errorText: expect.stringContaining("temporarily busy"),
    });
  });

  it("adapts Java public Main to Wandbox's prog.java filename", async () => {
    const fetchImplementation = vi.fn(async (..._args: Parameters<typeof fetch>) => new Response(JSON.stringify({
      status: "0", program_output: "ok\n",
    }), { status: 200 }));
    const provider = new WandboxExecutionProvider({ fetchImplementation }, "JAVA");
    await provider.execute({
      language: "JAVA",
      sourceCode: "public class Main { public static void main(String[] args) { System.out.println(\"ok\"); } }",
      tests: [{ id: "java-1", input: "", expectedOutput: "ok", visibility: "VISIBLE" }],
    });
    const requestInit = fetchImplementation.mock.calls[0][1];
    expect(requestInit).toBeDefined();
    expect(JSON.parse(String(requestInit?.body)).code).toContain("class Main");
    expect(JSON.parse(String(requestInit?.body)).code).not.toContain("public class Main");
  });
});
