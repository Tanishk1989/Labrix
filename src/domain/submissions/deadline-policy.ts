export const lateSubmissionPolicies = ["ALLOW_LATE", "BLOCK_LATE"] as const;

export type LateSubmissionPolicy = (typeof lateSubmissionPolicies)[number];
export type SubmissionTimingStatus = "ON_TIME" | "LATE";

export const defaultLateSubmissionPolicy: LateSubmissionPolicy = "ALLOW_LATE";

export type SubmissionDeadlineDecision = {
  allowed: boolean;
  timingStatus: SubmissionTimingStatus;
};

export function evaluateSubmissionDeadline({
  deadline,
  submittedAt,
  policy = defaultLateSubmissionPolicy,
}: {
  deadline: Date | null;
  submittedAt: Date;
  policy?: LateSubmissionPolicy;
}): SubmissionDeadlineDecision {
  const timingStatus =
    deadline && submittedAt.getTime() > deadline.getTime() ? "LATE" : "ON_TIME";

  return {
    timingStatus,
    allowed: timingStatus === "ON_TIME" || policy === "ALLOW_LATE",
  };
}

export function submissionTimingLabel(status: SubmissionTimingStatus | null) {
  if (status === "ON_TIME") return "On time";
  if (status === "LATE") return "Late";
  return "Timing unavailable";
}
