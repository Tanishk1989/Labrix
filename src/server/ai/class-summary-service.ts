import "server-only";

import { randomUUID } from "node:crypto";
import { getTeacherPracticalAnalytics } from "@/server/teacher/practical-analytics";
import {
  aiClassSummaryContentSchema,
  AIClassSummaryProviderError,
  type AIClassSummaryInputV1,
  type AIClassSummaryProvider,
  type AIClassSummaryV1,
} from "./class-summary-provider";
import { getAIClassSummaryProvider } from "./review-brief-provider-config";
import { withTeacherAIReviewBriefUsageGuard } from "./review-brief-usage-guard";

export const topVerifiedCriteria = [
  "latest immutable submission has a suggested score of at least 8.0/10",
  "teacher review is published",
  "deterministic integrity category is not HIGH_REVIEW_PRIORITY",
  "no failed hidden aggregate is stored; unavailable hidden aggregates do not exclude",
] as const;

export const needsAttentionCriteria = [
  "no immutable submission",
  "suggested score below 5.0/10",
  "one or more hidden aggregate tests did not pass",
  "deterministic integrity category is HIGH_REVIEW_PRIORITY",
  "teacher review is not published",
] as const;

type TeacherPracticalAnalytics = Awaited<
  ReturnType<typeof getTeacherPracticalAnalytics>
>;

type TeacherAnalyticsLoader = (
  teacherId: string,
  classroomId: string,
  taskId: string,
) => Promise<TeacherPracticalAnalytics>;

export type AIClassSummaryResultV1 = {
  summary: AIClassSummaryV1;
  deterministicGroups: {
    topVerifiedPerformers: Array<{
      name: string;
      submissionId: string;
      suggestedScore: number;
    }>;
    needsAttention: Array<{
      name: string;
      submissionId: string | null;
      reasons: string[];
    }>;
  };
};

export function buildAIClassSummaryInput(
  analytics: TeacherPracticalAnalytics,
): AIClassSummaryInputV1 {
  return {
    schemaVersion: 1,
    practical: {
      title: analytics.task.title,
      instructions: analytics.task.instructions,
    },
    classPerformance: {
      activeStudentCount: analytics.activeStudentCount,
      submittedCount: analytics.submittedStudentCount,
      pendingCount: analytics.pendingStudentCount,
      averageSuggestedScore: analytics.averageSuggestedScore,
      visibleTests: analytics.visibleTests,
      hiddenTests: analytics.hiddenTests,
      reviewStatusCounts: analytics.reviewStatusCounts,
      integritySignalCounts: analytics.integritySignalCounts,
      anonymizedAttemptStatistics: analytics.anonymizedAttemptStatistics,
    },
    deterministicGroups: {
      topVerifiedPerformerCount:
        analytics.groups.topVerifiedPerformers.totalCount,
      needsAttentionCount: analytics.groups.needsAttention.totalCount,
      topVerifiedCriteria,
      needsAttentionCriteria,
    },
  };
}

export async function generateTeacherAIClassSummary(options: {
  teacherId: string;
  classroomId: string;
  taskId: string;
  provider?: AIClassSummaryProvider;
  loadAnalytics?: TeacherAnalyticsLoader;
  now?: () => Date;
  generationId?: () => string;
}): Promise<AIClassSummaryResultV1> {
  return withTeacherAIReviewBriefUsageGuard(options.teacherId, async () => {
    const analytics = await (
      options.loadAnalytics ?? getTeacherPracticalAnalytics
    )(options.teacherId, options.classroomId, options.taskId);
    const provider = options.provider ?? getAIClassSummaryProvider();

    let content;
    try {
      content = aiClassSummaryContentSchema.parse(
        await provider.generateSummary(buildAIClassSummaryInput(analytics)),
      );
    } catch (error) {
      if (error instanceof AIClassSummaryProviderError) throw error;
      throw new AIClassSummaryProviderError();
    }

    return {
      summary: {
        ...content,
        provenance: {
          provider: provider.descriptor.provider,
          model: provider.descriptor.model,
          promptVersion: "ai-class-summary-v1",
          generatedAt: (options.now ?? (() => new Date()))().toISOString(),
          generationId: (options.generationId ?? randomUUID)(),
          persisted: false,
        },
      },
      deterministicGroups: {
        topVerifiedPerformers: analytics.groups.topVerifiedPerformers.items.map(
          (item) => ({
            name: item.student.name,
            submissionId: item.submissionId,
            suggestedScore: item.suggestedScore,
          }),
        ),
        needsAttention: analytics.groups.needsAttention.items.map((item) => ({
          name: item.student.name,
          submissionId: item.submissionId,
          reasons: [...item.reasons],
        })),
      },
    };
  });
}
