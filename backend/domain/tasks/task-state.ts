import type { TaskState } from "./models";

export function deriveTaskState(input: {
  hasDraft: boolean;
  submittedAt?: string;
  deadline?: string | null;
  now: Date;
}): TaskState {
  const { hasDraft, submittedAt, deadline, now } = input;
  if (submittedAt)
    return deadline && new Date(submittedAt) > new Date(deadline)
      ? "submitted_late"
      : "submitted";
  if (deadline && now > new Date(deadline)) return "expired";
  return hasDraft ? "in_progress" : "not_started";
}

export const taskStateLabel: Record<TaskState, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  submitted: "Submitted",
  submitted_late: "Submitted late",
  expired: "Expired",
};
