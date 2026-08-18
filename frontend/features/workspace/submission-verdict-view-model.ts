import type { PersistedSubmission, StudentWorkspace } from "@/server/attempts/service";
import {
  createStudentRunResultViewModel,
  type StudentRunResultViewModel,
} from "./run-result-view-model";

type VisibleWorkspaceTest = StudentWorkspace["task"]["tests"][number];

export interface StudentSubmissionVerdictViewModel {
  result: StudentRunResultViewModel;
  visibleSummary: string;
  privateSummary?: string;
  automatedScore?: string;
  reviewStatus: "Teacher review pending";
}

export function createStudentSubmissionVerdictViewModel(
  submission: PersistedSubmission,
  visibleTests: VisibleWorkspaceTest[],
): StudentSubmissionVerdictViewModel {
  const result = createStudentRunResultViewModel(submission.result, visibleTests);
  if (submission.result.state === "internal_error") {
    result.title = "Result unavailable";
    result.detail = "Your submission was recorded, but TRACE could not complete its test result.";
  }

  return {
    result,
    visibleSummary: submission.result.visibleTotalTests > 0
      ? `${submission.result.visiblePassedTests} / ${submission.result.visibleTotalTests} passed`
      : "Not configured",
    privateSummary: submission.result.hiddenTotalTests > 0
      ? `${submission.result.hiddenPassedTests} / ${submission.result.hiddenTotalTests} passed`
      : undefined,
    automatedScore: submission.result.totalTests > 0
      ? `${submission.result.suggestedScore.toFixed(1)} / 10`
      : undefined,
    reviewStatus: "Teacher review pending",
  };
}
