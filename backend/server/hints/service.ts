import "server-only";

import type { AllowedLanguage } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requirePublishedTaskForStudent } from "@/server/authorization/classroom-access";
import { getEffectiveStudentHintPermission } from "./permissions";
import { buildHintContext } from "./context-builder";
import { generateSocraticHint, type SocraticHintOutput } from "./socratic-generator";

export interface StudentHintSessionState {
  allowed: boolean;
  permissionSource: "STUDENT_OVERRIDE" | "CLASSROOM_DEFAULT" | "SYSTEM_DEFAULT";
  currentLevel: number; // 0 if none yet, max 3
  canRequestNextLevel: boolean;
  hints: Array<{
    id: string;
    level: number;
    category: string;
    hintText: string;
    nextQuestion: string;
    focusLines: number[];
    createdAt: string;
  }>;
}

/**
 * Retrieves the current hint permission and interaction history for a student workspace.
 */
export async function getStudentHintWorkspaceState(
  studentId: string,
  taskId: string,
  codingSessionId: string,
): Promise<StudentHintSessionState> {
  // Validate student has access to the published task & classroom
  const task = await requirePublishedTaskForStudent(prisma, studentId, taskId);

  // Check effective permission
  const permission = await getEffectiveStudentHintPermission(
    prisma,
    task.classroomId,
    studentId,
  );

  // Load existing hint interactions for this coding session
  const interactions = await prisma.hintInteraction.findMany({
    where: { codingSessionId, studentId },
    orderBy: { hintLevel: "asc" },
  });

  const currentLevel = interactions.length > 0 ? interactions[interactions.length - 1].hintLevel : 0;
  const canRequestNextLevel = permission.allowed && currentLevel < 3;

  return {
    allowed: permission.allowed,
    permissionSource: permission.source,
    currentLevel,
    canRequestNextLevel,
    hints: interactions.map((i) => ({
      id: i.id,
      level: i.hintLevel,
      category: i.category,
      hintText: i.hintText,
      nextQuestion: i.nextQuestion,
      focusLines: i.focusLines,
      createdAt: i.createdAt.toISOString(),
    })),
  };
}

/**
 * Requests the next progressive Socratic hint for an active coding session.
 * Server strictly verifies:
 * 1. Student identity & published task membership.
 * 2. Teacher permission (Classroom default or student override).
 * 3. Strict progression (Level 1 -> Level 2 -> Level 3; no skipping).
 * 4. Anti-solution leakage guardrails.
 * 5. Persistence into immutable HintInteraction audit log.
 */
export async function requestSocraticHintForSession(input: {
  studentId: string;
  taskId: string;
  codingSessionId: string;
  sourceCode: string;
  language: AllowedLanguage;
}): Promise<StudentHintSessionState> {
  const { studentId, taskId, codingSessionId, sourceCode, language } = input;

  // 1. Verify task and membership
  const task = await requirePublishedTaskForStudent(prisma, studentId, taskId);

  // 2. Verify teacher permission server-side
  const permission = await getEffectiveStudentHintPermission(
    prisma,
    task.classroomId,
    studentId,
  );

  if (!permission.allowed) {
    throw new Error("AI Hint Assistance is currently locked by your instructor.");
  }

  // 3. Verify active coding session
  const session = await prisma.codingSession.findFirst({
    where: { id: codingSessionId, taskId, studentId },
    include: {
      runs: {
        orderBy: { sequence: "desc" },
        take: 1,
        include: { resultSnapshot: true },
      },
      _count: { select: { runs: true } },
    },
  });

  if (!session) {
    throw new Error("Active coding session not found.");
  }

  // 4. Verify progression level (cannot skip levels or exceed Level 3)
  const existingInteractions = await prisma.hintInteraction.findMany({
    where: { codingSessionId, studentId },
    orderBy: { hintLevel: "asc" },
  });

  const nextLevel = existingInteractions.length + 1;
  if (nextLevel > 3) {
    throw new Error("Maximum hint level (Level 3) already reached for this session.");
  }

  // 5. Build structured context (Visible tests only, no hidden evaluation leaks)
  const latestRun = session.runs[0]?.resultSnapshot;
  const hintContext = buildHintContext({
    task: {
      id: task.id,
      title: task.title,
      instructions: task.instructions,
      constraints: task.constraints,
    },
    language,
    currentSourceCode: sourceCode,
    latestRun: latestRun ? {
      state: latestRun.state,
      errorText: latestRun.errorText,
      passedTests: latestRun.passedTests,
      totalTests: latestRun.totalTests,
      testResults: latestRun.testResults,
    } : undefined,
    visibleTests: task.testCases,
    totalRuns: session._count.runs,
    requestedLevel: nextLevel,
  });

  // 6. Generate Socratic hint with leakage guard
  const generatedHint = await generateSocraticHint(hintContext);

  // 7. Persist HintInteraction audit record
  await prisma.hintInteraction.create({
    data: {
      studentId,
      classroomId: task.classroomId,
      taskId: task.id,
      codingSessionId: session.id,
      hintLevel: generatedHint.level,
      category: generatedHint.category,
      hintText: generatedHint.hintText,
      nextQuestion: generatedHint.nextQuestion,
      focusLines: generatedHint.focusLines,
      inputContextHash: hintContext.contextHash,
    },
  });

  // 8. Return updated workspace hint state
  return getStudentHintWorkspaceState(studentId, taskId, codingSessionId);
}
