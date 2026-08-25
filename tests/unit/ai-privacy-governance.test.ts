import { describe, expect, it, vi } from "vitest";
import {
  generateVivaDefenseWithAI,
} from "@/server/evidence/ai-evidence-provider";
import { computeSourceCodeHash } from "@/server/evidence/ai-audit";

vi.mock("server-only", () => ({}));

describe("AI Privacy Governance & Fallback", () => {
  const sampleInput = {
    sourceCode: "#include <iostream>\nint main() { std::cout << 42; return 0; }",
    language: "CPP" as const,
    taskTitle: "Print 42",
  };

  it("computes consistent cryptographic hash for source code", () => {
    const hash1 = computeSourceCodeHash(sampleInput.sourceCode);
    const hash2 = computeSourceCodeHash("  #include <iostream>\nint main() { std::cout << 42; return 0; }  ");
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
  });

  it("returns deterministic source-heuristic viva output when AI assistance is disabled by policy", async () => {
    const result = await generateVivaDefenseWithAI(sampleInput, {
      allowAiAssistance: false,
    });

    expect(result).toBeDefined();
    expect(result.questions.length).toBeGreaterThanOrEqual(4);
    expect(result.provenance.groundedInAST).toBe(false);
  });

  it("returns deterministic AST viva output when no API keys are present (zero downtime)", async () => {
    const result = await generateVivaDefenseWithAI(sampleInput);

    expect(result).toBeDefined();
    expect(result.questions.length).toBeGreaterThanOrEqual(4);
    expect(result.codeInsights.language).toBe("CPP");
  });
});
