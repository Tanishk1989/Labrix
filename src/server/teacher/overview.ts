import "server-only";

import { type RunResultState, type TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { toTeacherReviewQueueStatus, type TeacherReviewQueueStatus } from "@/features/submission-review/review-queue";
import { calculateSuggestedScore } from "@/server/execution/result-grading";

export type TeacherSubmissionRecord = {
  id: string;
  studentId: string;
  studentName: string;
  classroomId: string;
  classroomName: string;
  classroomSubject: string;
  taskId: string;
  taskTitle: string;
  attemptNumber: number;
  language: "CPP" | "JAVA";
  submittedAt: string;
  state: RunResultState;
  passedTests: number;
  totalTests: number;
  suggestedScore: number;
  teacherMarks: { awarded: number; outOf: number } | null;
  reviewStatus: TeacherReviewQueueStatus;
};

export type TeacherPracticalSummary = {
  id: string;
  classroomId: string;
  classroomName: string;
  classroomSubject: string;
  title: string;
  status: TaskStatus;
  deadline: string | null;
  testCount: number;
  studentCount: number;
  submittedCount: number;
  completionPercentage: number;
  createdAt: string;
};

export type TeacherAttentionItem = {
  id: string;
  tone: "warning" | "danger" | "neutral";
  title: string;
  detail: string;
  href: string;
  action: string;
};

export type TeacherOverview = {
  summary: {
    classroomCount: number;
    distinctStudentCount: number;
    publishedPracticalCount: number;
    submissionAttemptCount: number;
    needsReviewCount: number;
  };
  classrooms: Array<{
    id: string;
    name: string;
    subject: string;
    section: string;
    studentCount: number;
    publishedPracticalCount: number;
    completionPercentage: number;
    activePracticalTitle: string | null;
    outstandingStudentCount: number;
  }>;
  practicals: TeacherPracticalSummary[];
  submissions: TeacherSubmissionRecord[];
  attention: TeacherAttentionItem[];
  progress: {
    eligibleStudentCount: number;
    overallCompletionPercentage: number;
    completedStudentPracticalPairs: number;
    totalStudentPracticalPairs: number;
    students: Array<{
      id: string;
      name: string;
      email: string;
      submittedPracticalCount: number;
      availablePracticalCount: number;
      completionPercentage: number;
      latestActivityAt: string | null;
    }>;
  };
};

function percent(completed: number, total: number) {
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}

export async function getTeacherOverview(teacherId: string): Promise<TeacherOverview> {
  const classrooms = await prisma.classroom.findMany({
    where: { ownerTeacherId: teacherId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    include: {
      memberships: {
        where: { role: "STUDENT", active: true },
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      tasks: {
        orderBy: { createdAt: "desc" },
        include: {
          testCases: { select: { id: true } },
          submissionAttempts: {
            orderBy: { submittedAt: "desc" },
            include: {
              student: { select: { id: true, name: true } },
              resultSnapshot: {
                select: {
                  state: true,
                  passedTests: true,
                  totalTests: true,
                  suggestedScore: true,
                },
              },
              review: {
                select: {
                  status: true,
                  marksAwarded: true,
                  marksOutOf: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const practicals: TeacherPracticalSummary[] = [];
  const submissions: TeacherSubmissionRecord[] = [];
  const attention: TeacherAttentionItem[] = [];
  const distinctStudentIds = new Set<string>();
  const availableTaskIdsByStudent = new Map<string, Set<string>>();
  const submittedTaskIdsByStudent = new Map<string, Set<string>>();
  const studentDetails = new Map<string, { name: string; email: string; latestActivityAt: string | null }>();

  for (const classroom of classrooms) {
    const studentIds = classroom.memberships.map((membership) => membership.userId);
    for (const membership of classroom.memberships) {
      distinctStudentIds.add(membership.userId);
      studentDetails.set(membership.userId, {
        name: membership.user.name,
        email: membership.user.email,
        latestActivityAt: studentDetails.get(membership.userId)?.latestActivityAt ?? null,
      });
    }

    for (const task of classroom.tasks) {
      const submittedStudentIds = new Set(task.submissionAttempts.map((attempt) => attempt.studentId));
      if (task.status === "PUBLISHED") {
        for (const studentId of studentIds) {
          const available = availableTaskIdsByStudent.get(studentId) ?? new Set<string>();
          available.add(task.id);
          availableTaskIdsByStudent.set(studentId, available);
        }
      }

      practicals.push({
        id: task.id,
        classroomId: classroom.id,
        classroomName: classroom.name,
        classroomSubject: classroom.subject,
        title: task.title,
        status: task.status,
        deadline: task.deadline?.toISOString() ?? null,
        testCount: task.testCases.length,
        studentCount: studentIds.length,
        submittedCount: submittedStudentIds.size,
        completionPercentage: percent(submittedStudentIds.size, studentIds.length),
        createdAt: task.createdAt.toISOString(),
      });

      for (const attempt of task.submissionAttempts) {
        if (task.status === "PUBLISHED") {
          const submitted = submittedTaskIdsByStudent.get(attempt.studentId) ?? new Set<string>();
          submitted.add(task.id);
          submittedTaskIdsByStudent.set(attempt.studentId, submitted);
        }
        const previous = studentDetails.get(attempt.studentId);
        if (previous && (!previous.latestActivityAt || new Date(attempt.submittedAt) > new Date(previous.latestActivityAt))) {
          studentDetails.set(attempt.studentId, {
            ...previous,
            latestActivityAt: attempt.submittedAt.toISOString(),
          });
        }
        submissions.push({
          id: attempt.id,
          studentId: attempt.studentId,
          studentName: attempt.student.name,
          classroomId: classroom.id,
          classroomName: classroom.name,
          classroomSubject: classroom.subject,
          taskId: task.id,
          taskTitle: task.title,
          attemptNumber: attempt.attemptNumber,
          language: attempt.language,
          submittedAt: attempt.submittedAt.toISOString(),
          state: attempt.resultSnapshot.state,
          passedTests: attempt.resultSnapshot.passedTests,
          totalTests: attempt.resultSnapshot.totalTests,
          suggestedScore:
            attempt.resultSnapshot.suggestedScore ??
            calculateSuggestedScore(
              attempt.resultSnapshot.state === "COMPLETED"
                ? "completed"
                : "internal_error",
              attempt.resultSnapshot.passedTests,
              attempt.resultSnapshot.totalTests,
            ),
          teacherMarks: attempt.review
            ? {
                awarded: attempt.review.marksAwarded,
                outOf: attempt.review.marksOutOf,
              }
            : null,
          reviewStatus: toTeacherReviewQueueStatus(
            attempt.review?.status ?? null,
          ),
        });
      }
    }

    const latestPublished = classroom.tasks.find((task) => task.status === "PUBLISHED");
    if (latestPublished) {
      const submitted = new Set(latestPublished.submissionAttempts.map((attempt) => attempt.studentId));
      const missingCount = studentIds.filter((studentId) => !submitted.has(studentId)).length;
      if (missingCount > 0) {
        attention.push({
          id: `missing-${latestPublished.id}`,
          tone: "warning",
          title: `${missingCount} ${missingCount === 1 ? "student has" : "students have"} not submitted`,
          detail: `${classroom.name} · ${latestPublished.title}`,
          href: `/classes/${classroom.id}/students`,
          action: "View progress",
        });
      }
      if (latestPublished.deadline) {
        const remainingDays = Math.ceil((latestPublished.deadline.getTime() - Date.now()) / 86_400_000);
        if (remainingDays >= 0 && remainingDays <= 7) {
          attention.push({
            id: `deadline-${latestPublished.id}`,
            tone: remainingDays <= 1 ? "danger" : "warning",
            title: remainingDays === 0 ? "Practical is due today" : `Practical is due in ${remainingDays} days`,
            detail: `${classroom.name} · ${latestPublished.title}`,
            href: `/classes/${classroom.id}`,
            action: "Open practical",
          });
        }
      }
    }

    const draftCount = classroom.tasks.filter((task) => task.status === "DRAFT").length;
    if (draftCount > 0) {
      attention.push({
        id: `draft-${classroom.id}`,
        tone: "neutral",
        title: `${draftCount} unpublished ${draftCount === 1 ? "draft" : "drafts"}`,
        detail: classroom.name,
        href: `/practicals?classroom=${encodeURIComponent(classroom.id)}&status=DRAFT`,
        action: "Review drafts",
      });
    }
  }

  submissions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  practicals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const classroomRows = classrooms.map((classroom) => {
    const published = practicals.filter(
      (practical) => practical.classroomId === classroom.id && practical.status === "PUBLISHED",
    );
    const active = published[0] ?? null;
    return {
      id: classroom.id,
      name: classroom.name,
      subject: classroom.subject,
      section: classroom.section,
      studentCount: classroom.memberships.length,
      publishedPracticalCount: published.length,
      completionPercentage: active?.completionPercentage ?? 0,
      activePracticalTitle: active?.title ?? null,
      outstandingStudentCount: active ? active.studentCount - active.submittedCount : 0,
    };
  });

  const students = [...studentDetails.entries()]
    .map(([id, details]) => {
      const available = availableTaskIdsByStudent.get(id)?.size ?? 0;
      const submitted = submittedTaskIdsByStudent.get(id)?.size ?? 0;
      return {
        id,
        ...details,
        submittedPracticalCount: submitted,
        availablePracticalCount: available,
        completionPercentage: percent(submitted, available),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const totalStudentPracticalPairs = students.reduce((sum, student) => sum + student.availablePracticalCount, 0);
  const completedStudentPracticalPairs = students.reduce((sum, student) => sum + student.submittedPracticalCount, 0);

  return {
    summary: {
      classroomCount: classrooms.length,
      distinctStudentCount: distinctStudentIds.size,
      publishedPracticalCount: practicals.filter((practical) => practical.status === "PUBLISHED").length,
      submissionAttemptCount: submissions.length,
      needsReviewCount: submissions.filter(
        (submission) => submission.reviewStatus !== "PUBLISHED_FEEDBACK",
      ).length,
    },
    classrooms: classroomRows,
    practicals,
    submissions,
    attention: attention.slice(0, 4),
    progress: {
      eligibleStudentCount: students.length,
      overallCompletionPercentage: percent(completedStudentPracticalPairs, totalStudentPracticalPairs),
      completedStudentPracticalPairs,
      totalStudentPracticalPairs,
      students,
    },
  };
}
