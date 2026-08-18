import "server-only";

import { prisma } from "@/lib/db/prisma";
import {
  auditCohortPlagiarism,
  type PairwiseStructuralSimilarity,
} from "@/server/evidence/structural-ast-comparator";

export interface CohortPlagiarismReport {
  classrooms: Array<{ id: string; name: string }>;
  tasks: Array<{ id: string; title: string; classroomId: string; classroomName: string }>;
  selectedTaskId: string | null;
  selectedClassroomId: string | null;
  totalSubmissionsAnalyzed: number;
  flaggedPairsCount: number;
  suspiciousPairsCount: number;
  authenticPairsCount: number;
  pairs: Array<
    PairwiseStructuralSimilarity & {
      taskId: string;
      taskTitle: string;
      classroomId: string;
      classroomName: string;
      submittedAtA: string;
      submittedAtB: string;
    }
  >;
}

export async function getCohortPlagiarismReport(
  teacherId: string,
  options?: {
    taskId?: string;
    classroomId?: string;
  },
): Promise<CohortPlagiarismReport> {
  const classrooms = await prisma.classroom.findMany({
    where: { ownerTeacherId: teacherId, status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      tasks: {
        where: { status: "PUBLISHED" },
        select: { id: true, title: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const classroomOptions = classrooms.map((c) => ({ id: c.id, name: c.name }));
  const taskOptions = classrooms.flatMap((c) =>
    c.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      classroomId: c.id,
      classroomName: c.name,
    })),
  );

  const selectedClassroomId = options?.classroomId || null;
  const selectedTaskId = options?.taskId || null;

  // Build where clause for submissions
  const whereClause: {
    task: {
      classroom: { ownerTeacherId: string; status: "ACTIVE" };
      classroomId?: string;
      id?: string;
      status: "PUBLISHED";
    };
  } = {
    task: {
      classroom: { ownerTeacherId: teacherId, status: "ACTIVE" },
      status: "PUBLISHED",
    },
  };

  if (selectedTaskId) {
    whereClause.task.id = selectedTaskId;
  } else if (selectedClassroomId) {
    whereClause.task.classroomId = selectedClassroomId;
  }

  const submissions = await prisma.submissionAttempt.findMany({
    where: whereClause,
    include: {
      student: { select: { id: true, name: true } },
      task: {
        select: {
          id: true,
          title: true,
          classroom: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { submittedAt: "desc" },
  });

  // Group submissions by taskId to compare peers within the same practical
  const submissionsByTask = new Map<
    string,
    Array<{
      id: string;
      studentId: string;
      studentName: string;
      sourceCode: string;
      language: "CPP" | "JAVA";
      taskId: string;
      taskTitle: string;
      classroomId: string;
      classroomName: string;
      submittedAt: string;
    }>
  >();

  for (const sub of submissions) {
    const list = submissionsByTask.get(sub.taskId) ?? [];
    list.push({
      id: sub.id,
      studentId: sub.student.id,
      studentName: sub.student.name,
      sourceCode: sub.sourceCodeSnapshot,
      language: sub.language,
      taskId: sub.task.id,
      taskTitle: sub.task.title,
      classroomId: sub.task.classroom.id,
      classroomName: sub.task.classroom.name,
      submittedAt: sub.submittedAt.toISOString(),
    });
    submissionsByTask.set(sub.taskId, list);
  }

  const allPairs: CohortPlagiarismReport["pairs"] = [];

  for (const [, taskSubmissions] of submissionsByTask) {
    if (taskSubmissions.length < 2) continue;

    const audited = auditCohortPlagiarism(taskSubmissions);
    const subMap = new Map(taskSubmissions.map((s) => [s.id, s]));

    for (const pair of audited) {
      const subA = subMap.get(pair.submissionAId);
      const subB = subMap.get(pair.submissionBId);
      if (!subA || !subB) continue;

      allPairs.push({
        ...pair,
        taskId: subA.taskId,
        taskTitle: subA.taskTitle,
        classroomId: subA.classroomId,
        classroomName: subA.classroomName,
        submittedAtA: subA.submittedAt,
        submittedAtB: subB.submittedAt,
      });
    }
  }

  allPairs.sort(
    (a, b) => b.structuralSimilarityPercentage - a.structuralSimilarityPercentage,
  );

  const flaggedPairsCount = allPairs.filter(
    (p) => p.verdict === "STRUCTURAL_COLLUSION_FLAG",
  ).length;
  const suspiciousPairsCount = allPairs.filter(
    (p) => p.verdict === "SUSPICIOUS_SIMILARITY",
  ).length;
  const authenticPairsCount = allPairs.filter(
    (p) => p.verdict === "AUTHENTIC",
  ).length;

  return {
    classrooms: classroomOptions,
    tasks: taskOptions,
    selectedTaskId,
    selectedClassroomId,
    totalSubmissionsAnalyzed: submissions.length,
    flaggedPairsCount,
    suspiciousPairsCount,
    authenticPairsCount,
    pairs: allPairs,
  };
}
