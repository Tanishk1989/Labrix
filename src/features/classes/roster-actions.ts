"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import {
  requireActorRole,
  resolveCurrentActor,
} from "@/server/actors/current-actor";
import {
  deactivateStudentMembership,
  reactivateStudentMembership,
  regenerateClassroomJoinCode,
} from "@/server/classrooms/roster";

export type RosterActionState = {
  ok?: boolean;
  message?: string;
};

function refreshClassroom(classroomId: string) {
  revalidatePath("/classes");
  revalidatePath(`/classes/${classroomId}`);
  revalidatePath(`/classes/${classroomId}/students`);
}

export async function deactivateStudentMembershipAction(
  classroomId: string,
  membershipId: string,
  _previousState: RosterActionState,
  _formData: FormData,
): Promise<RosterActionState> {
  void _previousState;
  void _formData;
  try {
    const actor = requireActorRole(
      await resolveCurrentActor({ demoActor: "teacher" }),
      "TEACHER",
    );
    await deactivateStudentMembership(prisma, {
      actor,
      classroomId,
      membershipId,
    });
    refreshClassroom(classroomId);
    return { ok: true, message: "Student access deactivated." };
  } catch {
    return {
      ok: false,
      message: "Labrix could not deactivate this membership.",
    };
  }
}

export async function reactivateStudentMembershipAction(
  classroomId: string,
  membershipId: string,
  _previousState: RosterActionState,
  _formData: FormData,
): Promise<RosterActionState> {
  void _previousState;
  void _formData;
  try {
    const actor = requireActorRole(
      await resolveCurrentActor({ demoActor: "teacher" }),
      "TEACHER",
    );
    await reactivateStudentMembership(prisma, {
      actor,
      classroomId,
      membershipId,
    });
    refreshClassroom(classroomId);
    return { ok: true, message: "Student access reactivated." };
  } catch {
    return {
      ok: false,
      message: "Labrix could not reactivate this membership.",
    };
  }
}

export async function regenerateClassroomJoinCodeAction(
  classroomId: string,
  _previousState: RosterActionState,
  _formData: FormData,
): Promise<RosterActionState> {
  void _previousState;
  void _formData;
  try {
    const actor = requireActorRole(
      await resolveCurrentActor({ demoActor: "teacher" }),
      "TEACHER",
    );
    await regenerateClassroomJoinCode(prisma, { actor, classroomId });
    refreshClassroom(classroomId);
    return {
      ok: true,
      message: "Join code regenerated. The previous code no longer works.",
    };
  } catch {
    return {
      ok: false,
      message: "Labrix could not regenerate the join code.",
    };
  }
}
