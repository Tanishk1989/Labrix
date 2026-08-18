import type { TeacherOverview } from "@/server/teacher/overview";
import { describeSubmissionOutcome } from "@/domain/submissions/academic-progress";

export type TeacherProgressViewModel = ReturnType<typeof buildTeacherProgressViewModel>;

function percentage(completed: number, total: number) {
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}

export function buildTeacherProgressViewModel(
  overview: TeacherOverview,
  classroomId?: string,
) {
  const selectedClassroom = classroomId
    ? overview.classrooms.find((classroom) => classroom.id === classroomId) ?? null
    : null;
  const publishedPracticals = overview.practicals.filter(
    (practical) => practical.status === "PUBLISHED"
      && (!classroomId || practical.classroomId === classroomId),
  );
  const publishedPracticalIds = new Set(publishedPracticals.map((practical) => practical.id));
  const latestSubmissionByPair = new Map<string, TeacherOverview["submissions"][number]>();
  for (const submission of overview.submissions) {
    if (!publishedPracticalIds.has(submission.taskId)) continue;
    const key = `${submission.studentId}:${submission.taskId}`;
    const current = latestSubmissionByPair.get(key);
    if (!current || submission.attemptNumber > current.attemptNumber) {
      latestSubmissionByPair.set(key, submission);
    }
  }
  const latestSubmissions = [...latestSubmissionByPair.values()];
  const passedAllProvidedTestsPairs = latestSubmissions.filter((submission) =>
    describeSubmissionOutcome(submission).passedAllProvidedTests
  ).length;
  const publishedReviewPairs = latestSubmissions.filter(
    (submission) => submission.reviewStatus === "PUBLISHED_FEEDBACK",
  ).length;
  const practicalRows = publishedPracticals.map((practical) => {
    const submissions = latestSubmissions.filter((submission) => submission.taskId === practical.id);
    return {
      ...practical,
      passedAllProvidedTestsCount: submissions.filter((submission) =>
        describeSubmissionOutcome(submission).passedAllProvidedTests
      ).length,
      publishedReviewCount: submissions.filter(
        (submission) => submission.reviewStatus === "PUBLISHED_FEEDBACK",
      ).length,
      needsReviewCount: submissions.filter(
        (submission) => submission.reviewStatus !== "PUBLISHED_FEEDBACK",
      ).length,
    };
  });
  const scopedStudents = overview.progress.students.filter(
    (student) => !classroomId || student.classroomIds.includes(classroomId),
  );
  const studentRows = scopedStudents.map((student) => {
    const submissions = latestSubmissions.filter((submission) => submission.studentId === student.id);
    const submittedPracticalCount = classroomId
      ? new Set(submissions.map((submission) => submission.taskId)).size
      : student.submittedPracticalCount;
    const availablePracticalCount = classroomId
      ? publishedPracticals.length
      : student.availablePracticalCount;
    const latestActivityAt = classroomId
      ? submissions.reduce<string | null>((latest, submission) => (
          !latest || new Date(submission.submittedAt) > new Date(latest)
            ? submission.submittedAt
            : latest
        ), null)
      : student.latestActivityAt;
    return {
      ...student,
      submittedPracticalCount,
      availablePracticalCount,
      completionPercentage: percentage(
        submittedPracticalCount,
        availablePracticalCount,
      ),
      latestActivityAt,
      passedAllProvidedTestsCount: submissions.filter((submission) =>
        describeSubmissionOutcome(submission).passedAllProvidedTests
      ).length,
      publishedReviewCount: submissions.filter(
        (submission) => submission.reviewStatus === "PUBLISHED_FEEDBACK",
      ).length,
    };
  });
  const lowestSubmissionCoverage = [...practicalRows]
    .filter((practical) => practical.studentCount > 0)
    .sort((left, right) =>
      left.completionPercentage - right.completionPercentage
      || left.title.localeCompare(right.title),
    )[0] ?? null;
  const completedPairs = classroomId
    ? studentRows.reduce((total, student) => total + student.submittedPracticalCount, 0)
    : overview.progress.completedStudentPracticalPairs;
  const totalPairs = classroomId
    ? studentRows.reduce((total, student) => total + student.availablePracticalCount, 0)
    : overview.progress.totalStudentPracticalPairs;
  const incompletePairs = Math.max(0, totalPairs - completedPairs);

  return {
    hasClassrooms: overview.classrooms.length > 0,
    selectedClassroom,
    requestedClassroomId: classroomId ?? null,
    classroomSelectionAvailable: !classroomId || Boolean(selectedClassroom),
    hasPublishedPracticals: publishedPracticals.length > 0,
    hasStudents: studentRows.length > 0,
    hasCompletionScope: totalPairs > 0,
    overallCompletionPercentage: classroomId
      ? percentage(completedPairs, totalPairs)
      : overview.progress.overallCompletionPercentage,
    eligibleStudentCount: studentRows.length,
    publishedPracticalCount: publishedPracticals.length,
    completedPairs,
    totalPairs,
    incompletePairs,
    submissionCoveragePercentage: classroomId
      ? percentage(completedPairs, totalPairs)
      : overview.progress.overallCompletionPercentage,
    passedAllProvidedTestsPairs,
    publishedReviewPairs,
    publishedPracticals: practicalRows,
    lowestSubmissionCoverage,
    students: studentRows,
  };
}
