"use server";

import type { AllowedLanguage } from "@prisma/client";
import {
  requireActorRole,
  resolveCurrentActor,
} from "@/server/actors/current-actor";
import {
  getStudentHintWorkspaceState,
  requestSocraticHintForSession,
  type StudentHintSessionState,
} from "@/server/hints/service";

export type HintActionResult =
  | { ok: true; state: StudentHintSessionState }
  | { ok: false; message: string };

export async function fetchWorkspaceHintStateAction(
  taskId: string,
  codingSessionId: string,
): Promise<HintActionResult> {
  try {
    const actor = requireActorRole(
      await resolveCurrentActor({ demoActor: "student" }),
      "STUDENT",
    );

    const state = await getStudentHintWorkspaceState(
      actor.id,
      taskId,
      codingSessionId,
    );

    return { ok: true, state };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to load hint state.",
    };
  }
}

export async function requestWorkspaceHintAction(
  taskId: string,
  codingSessionId: string,
  sourceCode: string,
  language: AllowedLanguage,
): Promise<HintActionResult> {
  try {
    const actor = requireActorRole(
      await resolveCurrentActor({ demoActor: "student" }),
      "STUDENT",
    );

    const state = await requestSocraticHintForSession({
      studentId: actor.id,
      taskId,
      codingSessionId,
      sourceCode,
      language,
    });

    return { ok: true, state };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to generate hint.",
    };
  }
}
