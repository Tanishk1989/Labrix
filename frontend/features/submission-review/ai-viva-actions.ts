"use server";

import { prisma } from "@/lib/db/prisma";
import {
  requireActorRole,
  resolveCurrentActor,
} from "@/server/actors/current-actor";
import { generateVivaDefenseWithAI } from "@/server/evidence/ai-evidence-provider";
import type { GenerateVivaInput, VivaGenerationResult } from "@/server/evidence/viva-generator";

export interface RequestAiVivaResult {
  ok: boolean;
  message?: string;
  data?: VivaGenerationResult;
}

/**
 * Explicit teacher action to request AI-augmented viva defense questions.
 * Validates teacher authorization and classroom AI policy before making external LLM calls.
 */
export async function requestAiVivaDefense(
  submissionAttemptId: string,
  input: GenerateVivaInput,
): Promise<RequestAiVivaResult> {
  try {
    const teacher = requireActorRole(
      await resolveCurrentActor({ demoActor: "teacher" }),
      "TEACHER",
    );

    // Verify submission belongs to a classroom taught by this teacher
    const submission = await prisma.submissionAttempt.findUnique({
      where: { id: submissionAttemptId },
      include: {
        task: {
          include: {
            classroom: true,
          },
        },
      },
    });

    if (!submission || submission.task.classroom.ownerTeacherId !== teacher.id) {
      return { ok: false, message: "Unauthorized or submission not found." };
    }

    if (!submission.task.classroom.aiAssistanceEnabled) {
      return {
        ok: false,
        message: "AI assistance is disabled for this classroom by teacher/institutional policy.",
      };
    }

    const result = await generateVivaDefenseWithAI(input, {
      teacherId: teacher.id,
      submissionAttemptId: submission.id,
      allowAiAssistance: true,
    });

    return { ok: true, data: result };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate AI viva questions.";
    return { ok: false, message };
  }
}
