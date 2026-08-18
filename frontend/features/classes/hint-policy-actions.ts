"use server";

import {
  requireActorRole,
  resolveCurrentActor,
} from "@/server/actors/current-actor";
import {
  setClassroomHintPolicy,
  setStudentHintPermission,
} from "@/server/hints/permissions";

export type HintPolicyActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export async function toggleStudentHintPermissionAction(
  classroomId: string,
  studentId: string,
  enabled: boolean,
): Promise<HintPolicyActionResult> {
  try {
    const teacher = requireActorRole(
      await resolveCurrentActor({ demoActor: "teacher" }),
      "TEACHER",
    );

    await setStudentHintPermission(
      teacher.id,
      classroomId,
      studentId,
      enabled,
    );

    return {
      ok: true,
      message: enabled
        ? "AI hint assistance granted to student."
        : "AI hint assistance revoked for student.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to update student hint permission.",
    };
  }
}

export async function toggleClassroomHintPolicyAction(
  classroomId: string,
  enabledForAll: boolean,
): Promise<HintPolicyActionResult> {
  try {
    const teacher = requireActorRole(
      await resolveCurrentActor({ demoActor: "teacher" }),
      "TEACHER",
    );

    await setClassroomHintPolicy(
      teacher.id,
      classroomId,
      enabledForAll,
    );

    return {
      ok: true,
      message: enabledForAll
        ? "AI hint assistance enabled for the entire classroom."
        : "AI hint assistance locked by default for the classroom.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to update classroom hint policy.",
    };
  }
}
