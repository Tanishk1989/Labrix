export type ActiveExecutionStatus = "QUEUED" | "RUNNING";

export function executionPollDelay(
  status: ActiveExecutionStatus,
  completedPolls: number,
) {
  if (completedPolls <= 0) return status === "RUNNING" ? 250 : 350;
  if (status === "RUNNING") return Math.min(500 + completedPolls * 150, 1_250);
  return Math.min(750 + completedPolls * 250, 2_000);
}
