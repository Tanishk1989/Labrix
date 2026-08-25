import type { StudentOverview } from "@/server/student/overview";

type Submission = StudentOverview["submissions"][number];

function resultLabel(submission: Submission) {
  if (submission.state === "COMPILATION_ERROR") return "Compilation failed";
  if (submission.state === "RUNTIME_ERROR") return "Runtime error";
  if (submission.state === "TIME_LIMIT_EXCEEDED") return "Execution timed out";
  if (submission.state === "INTERNAL_ERROR") return "Result unavailable";
  if (submission.visibleTotalTests === 0) return "No visible tests configured";
  if (submission.visiblePassedTests === submission.visibleTotalTests) {
    return "All visible tests passed";
  }
  return `${submission.visiblePassedTests} / ${submission.visibleTotalTests} visible tests passed`;
}

export function createStudentSubmissionHistoryViewModel(overview: StudentOverview) {
  return [...overview.submissions]
    .sort((left, right) => {
      const submittedDifference = new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime();
      return submittedDifference || right.attemptNumber - left.attemptNumber || left.id.localeCompare(right.id);
    })
    .map((submission) => ({
      ...submission,
      resultLabel: resultLabel(submission),
      languageLabel: submission.language === "CPP" ? "C++" : "Java",
      reviewLabel: submission.feedbackAvailable ? "Feedback available" : "Teacher review pending",
      detailHref: `/submissions/${submission.id}?view=student`,
      practicalHref: `/practicals/${submission.practical.id}`,
    }));
}
