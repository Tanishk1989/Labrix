import "server-only";

const activeTeacherGenerations = new Set<string>();

export class AIReviewBriefUsageLimitError extends Error {
  constructor() {
    super("An AI review brief is already being generated for this teacher.");
    this.name = "AIReviewBriefUsageLimitError";
  }
}

export async function withTeacherAIReviewBriefUsageGuard<T>(
  teacherId: string,
  operation: () => Promise<T>,
): Promise<T> {
  if (activeTeacherGenerations.has(teacherId)) {
    throw new AIReviewBriefUsageLimitError();
  }

  activeTeacherGenerations.add(teacherId);
  try {
    return await operation();
  } finally {
    activeTeacherGenerations.delete(teacherId);
  }
}
