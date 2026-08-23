import "server-only";

import { createHash } from "node:crypto";
import { prisma } from "@/lib/db/prisma";

export interface LogAiGenerationInput {
  teacherId: string;
  submissionAttemptId?: string;
  kind: "VIVA_DEFENSE" | "CODE_FEEDBACK";
  modelUsed: string;
  sourceCode: string;
  promptTokenEstimate: number;
  cachedResult: boolean;
  durationMs: number;
  status: "SUCCESS" | "TIMEOUT" | "ERROR" | "BLOCKED_BY_POLICY";
}

export function computeSourceCodeHash(sourceCode: string): string {
  return createHash("sha256").update(sourceCode.trim()).digest("hex");
}

/**
 * Record an AI generation request in the audit log.
 */
export async function logAiGeneration(input: LogAiGenerationInput) {
  const sourceCodeHash = computeSourceCodeHash(input.sourceCode);
  try {
    return await prisma.aiGenerationAuditLog.create({
      data: {
        teacherId: input.teacherId,
        submissionAttemptId: input.submissionAttemptId ?? null,
        kind: input.kind,
        modelUsed: input.modelUsed,
        promptTokenEstimate: input.promptTokenEstimate,
        cachedResult: input.cachedResult,
        durationMs: input.durationMs,
        status: input.status,
        sourceCodeHash,
      },
    });
  } catch (error) {
    console.error("Failed to log AI generation audit:", error);
    return null;
  }
}
