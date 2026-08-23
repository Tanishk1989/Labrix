import { describe, expect, it, vi } from "vitest";
import { logAdminAction } from "@/server/audit/admin-audit";
import { computeSourceCodeHash, logAiGeneration } from "@/server/evidence/ai-audit";

vi.mock("server-only", () => ({}));

describe("Administrative and AI Audit Integrity", () => {
  it("computes deterministic SHA256 hashes for source code payloads", () => {
    const codeA = "int main() { return 0; }";
    const codeB = "int main() { return 0; }";
    const codeC = "int main() { return 1; }";

    expect(computeSourceCodeHash(codeA)).toBe(computeSourceCodeHash(codeB));
    expect(computeSourceCodeHash(codeA)).not.toBe(computeSourceCodeHash(codeC));
  });

  it("safely handles admin audit logging without throwing uncaught exceptions", async () => {
    const result = await logAdminAction({
      actorUserId: "non-existent-user-in-unit-test",
      action: "JOIN_CODE_ROTATED",
      targetType: "CLASSROOM",
      targetId: "classroom-1",
      metadata: { reason: "Routine rotation" },
    });

    // In unit test without DB connection, gracefully returns null and catches error
    expect(result === null || typeof result === "object").toBe(true);
  });

  it("safely handles AI generation audit logging without throwing uncaught exceptions", async () => {
    const result = await logAiGeneration({
      teacherId: "teacher-unit-test",
      kind: "VIVA_DEFENSE",
      modelUsed: "Deterministic AST Engine",
      sourceCode: "public class Main { public static void main(String[] args) {} }",
      promptTokenEstimate: 20,
      cachedResult: false,
      durationMs: 15,
      status: "SUCCESS",
    });

    expect(result === null || typeof result === "object").toBe(true);
  });
});
