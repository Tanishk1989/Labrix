"use server";

import { prisma } from "@/lib/db/prisma";
import {
  requireActorRole,
  resolveCurrentActor,
} from "@/server/actors/current-actor";
import { generateVivaDefenseWithAI } from "@/server/evidence/ai-evidence-provider";
import { analyzeAttemptProcess } from "@/server/evidence/integrity-engine";
import type { VivaGenerationResult } from "@/server/evidence/viva-generator";
import { logEvent } from "@/server/observability/logger";

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
        resultSnapshot: true,
        codingSession: {
          include: {
            events: { orderBy: { sequence: "asc" } },
            _count: { select: { runs: true } },
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

    const submittedAt = submission.submittedAt.toISOString();
    const processAnalysis = analyzeAttemptProcess({
      events: submission.codingSession.events.map((event) => ({
        id: event.id,
        sequence: event.sequence,
        type: event.type,
        runAttemptId: event.runAttemptId,
        submissionAttemptId: event.submissionAttemptId,
        occurredAt: event.occurredAt.toISOString(),
      })),
      sourceCode: submission.sourceCodeSnapshot,
      runCount: submission.codingSession._count.runs,
      passedTests: submission.resultSnapshot.passedTests,
      totalTests: submission.resultSnapshot.totalTests,
      submittedAt,
    });
    const result = await generateVivaDefenseWithAI({
      sourceCode: submission.sourceCodeSnapshot,
      language: submission.language,
      taskTitle: submission.task.title,
      processAnalysis,
      testPassRatio: {
        passed: submission.resultSnapshot.passedTests,
        total: submission.resultSnapshot.totalTests,
      },
    }, {
      teacherId: teacher.id,
      submissionAttemptId: submission.id,
      allowAiAssistance: true,
    });

    return { ok: true, data: result };
  } catch (error: unknown) {
    logEvent("error", "ai_viva_action_failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return { ok: false, message: "The oral-defense assistant is unavailable. Try again later." };
  }
}
