export interface PracticalCompletion {
  submittedCount: number;
  pendingCount: number;
  completionPercentage: number;
}

/**
 * Counts active students who have at least one immutable submission for one
 * practical. Repeated attempts from the same student count once.
 */
export function summarizePracticalCompletion(
  activeStudentIds: readonly string[],
  submittedStudentIds: readonly string[],
): PracticalCompletion {
  const activeStudents = new Set(activeStudentIds);
  const submittedStudents = new Set(
    submittedStudentIds.filter((studentId) => activeStudents.has(studentId)),
  );
  const submittedCount = submittedStudents.size;
  const pendingCount = activeStudents.size - submittedCount;

  return {
    submittedCount,
    pendingCount,
    completionPercentage:
      activeStudents.size === 0
        ? 0
        : Math.round((submittedCount / activeStudents.size) * 100),
  };
}
