"use server";

import { updateTag } from "next/cache";
import {
  requireActorRole,
  resolveCurrentActor,
} from "@/server/actors/current-actor";
import {
  configuredExecutionDispatchMode,
  enqueueStudentRun,
  enqueueStudentSubmission,
  ExecutionAlreadyQueuedError,
  getStudentExecutionJob,
  RateLimitExceededError,
  runStudentDraft,
  saveStudentDraft,
  submitStudentDraft,
  SubmissionDeadlineError,
} from "@/server/attempts/service";
import { ExecutionRequestGuardError } from "@/server/execution/request-guard";
import { CLASSROOM_MANAGEMENT_CACHE_TAG } from "@/server/teacher/cache-tags";
import { draftInputSchema, executionJobInputSchema, submissionInputSchema } from "./input-schema";

export async function saveDraftAction(input: unknown) {
  const parsed = draftInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, message: "The draft could not be saved." };
  }
  try {
    const actor = requireActorRole(
      await resolveCurrentActor({ demoActor: "student" }),
      "STUDENT",
    );
    const saved = await saveStudentDraft({ studentId: actor.id, ...parsed.data });
    return { ok: true as const, ...saved };
  } catch {
    return {
      ok: false as const,
      message: "Save failed. Your editor buffer is still available; try again.",
    };
  }
}

export async function runDraftAction(input: unknown) {
  const parsed = draftInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, message: "The run could not start." };
  }
  try {
    const actor = requireActorRole(
      await resolveCurrentActor({ demoActor: "student" }),
      "STUDENT",
    );
    if (configuredExecutionDispatchMode() === "queued") {
      const job = await enqueueStudentRun({ studentId: actor.id, ...parsed.data });
      return { ok: true as const, queued: true as const, job };
    }
    const run = await runStudentDraft({ studentId: actor.id, ...parsed.data });
    return { ok: true as const, queued: false as const, run };
  } catch (error) {
    if (
      error instanceof ExecutionRequestGuardError ||
      error instanceof ExecutionAlreadyQueuedError ||
      error instanceof RateLimitExceededError
    ) {
      return { ok: false as const, message: error.message };
    }
    return {
      ok: false as const,
      message: "The execution provider was unavailable. Try again.",
    };
  }
}

export async function submitDraftAction(input: unknown) {
  const parsed = submissionInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, message: "The submission could not be created." };
  }
  try {
    const actor = requireActorRole(
      await resolveCurrentActor({ demoActor: "student" }),
      "STUDENT",
    );
    if (configuredExecutionDispatchMode() === "queued") {
      const job = await enqueueStudentSubmission({ studentId: actor.id, ...parsed.data });
      return { ok: true as const, queued: true as const, job };
    }
    const submission = await submitStudentDraft({ studentId: actor.id, ...parsed.data });
    updateTag(CLASSROOM_MANAGEMENT_CACHE_TAG);
    return { ok: true as const, queued: false as const, submission };
  } catch (error) {
    if (error instanceof SubmissionDeadlineError) {
      return { ok: false as const, message: error.message };
    }
    if (
      error instanceof ExecutionRequestGuardError ||
      error instanceof ExecutionAlreadyQueuedError ||
      error instanceof RateLimitExceededError
    ) {
      return { ok: false as const, message: error.message };
    }
    return {
      ok: false as const,
      message: "The submission was not created. Your saved draft is unchanged.",
    };
  }
}

export async function executionJobStatusAction(input: unknown) {
  const parsed = executionJobInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, message: "Invalid execution job." };
  try {
    const actor = requireActorRole(
      await resolveCurrentActor({ demoActor: "student" }),
      "STUDENT",
    );
    const job = await getStudentExecutionJob(actor.id, parsed.data.jobId);
    if (job.status === "COMPLETED" && job.kind === "SUBMIT") {
      updateTag(CLASSROOM_MANAGEMENT_CACHE_TAG);
    }
    return { ok: true as const, job };
  } catch {
    return {
      ok: false as const,
      message: "Execution status is temporarily unavailable. The queued job is still stored; reload this workspace to resume tracking it.",
    };
  }
}
