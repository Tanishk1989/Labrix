import {
  AllowedLanguage,
  MembershipRole,
  PlatformRole,
  PrismaClient,
  TaskStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const teacher = await prisma.user.upsert({
    where: { id: "demo-teacher" },
    update: { name: "Dr. Sharma", email: "dr.sharma@demo.labrix.local", platformRole: PlatformRole.TEACHER },
    create: { id: "demo-teacher", name: "Dr. Sharma", email: "dr.sharma@demo.labrix.local", platformRole: PlatformRole.TEACHER },
  });
  const classroom = await prisma.classroom.upsert({
    where: { id: "dsa-2026" },
    update: { name: "DSA Practical Lab", subject: "Data Structures & Algorithms", section: "BTech CSE · Section A", ownerTeacherId: teacher.id, joinCode: "ARRAY-42" },
    create: { id: "dsa-2026", name: "DSA Practical Lab", subject: "Data Structures & Algorithms", section: "BTech CSE · Section A", ownerTeacherId: teacher.id, joinCode: "ARRAY-42" },
  });
  await prisma.classMembership.upsert({ where: { classroomId_userId: { classroomId: classroom.id, userId: teacher.id } }, update: { role: MembershipRole.TEACHER, active: true }, create: { classroomId: classroom.id, userId: teacher.id, role: MembershipRole.TEACHER } });

  for (const [id, name] of [["demo-student-1", "Aarav Mehta"], ["demo-student-2", "Diya Sharma"], ["demo-student-3", "Kabir Singh"]]) {
    const student = await prisma.user.upsert({ where: { id }, update: { name, email: `${id}@demo.labrix.local`, platformRole: PlatformRole.STUDENT }, create: { id, name, email: `${id}@demo.labrix.local`, platformRole: PlatformRole.STUDENT } });
    await prisma.classMembership.upsert({ where: { classroomId_userId: { classroomId: classroom.id, userId: student.id } }, update: { role: MembershipRole.STUDENT, active: true }, create: { classroomId: classroom.id, userId: student.id, role: MembershipRole.STUDENT } });
  }

  const task = await prisma.task.upsert({
    where: { id: "two-sum" },
    update: { classroomId: classroom.id, authorTeacherId: teacher.id, title: "Array Sum", instructions: "Given an array of integers and a target, print the indices of two values whose sum equals the target.", constraints: "2 ≤ n ≤ 100000\nUse an efficient approach.", allowedLanguages: [AllowedLanguage.CPP, AllowedLanguage.JAVA], status: TaskStatus.PUBLISHED, publishedAt: new Date("2026-08-01T09:00:00Z"), deadline: new Date("2099-08-12T11:30:00Z") },
    create: { id: "two-sum", classroomId: classroom.id, authorTeacherId: teacher.id, title: "Array Sum", instructions: "Given an array of integers and a target, print the indices of two values whose sum equals the target.", constraints: "2 ≤ n ≤ 100000\nUse an efficient approach.", allowedLanguages: [AllowedLanguage.CPP, AllowedLanguage.JAVA], status: TaskStatus.PUBLISHED, publishedAt: new Date("2026-08-01T09:00:00Z"), deadline: new Date("2099-08-12T11:30:00Z") },
  });
  const sessions = await prisma.codingSession.findMany({
    where: { taskId: task.id },
    select: { id: true },
  });
  const sessionIds = sessions.map((session) => session.id);
  const runs = await prisma.runAttempt.findMany({
    where: { codingSessionId: { in: sessionIds } },
    select: { id: true },
  });
  await prisma.$transaction([
    prisma.codeEvent.deleteMany({ where: { codingSessionId: { in: sessionIds } } }),
    prisma.submissionAttempt.deleteMany({ where: { taskId: task.id } }),
    prisma.resultSnapshot.deleteMany({ where: { runAttemptId: { in: runs.map((run) => run.id) } } }),
    prisma.runAttempt.deleteMany({ where: { codingSessionId: { in: sessionIds } } }),
    prisma.draft.deleteMany({ where: { codingSessionId: { in: sessionIds } } }),
    prisma.codingSession.deleteMany({ where: { id: { in: sessionIds } } }),
  ]);
  await prisma.testCase.deleteMany({ where: { taskId: task.id } });
  await prisma.testCase.createMany({ data: [
    { taskId: task.id, position: 1, input: "4\n2 7 11 15\n9", expectedOutput: "0 1" },
    { taskId: task.id, position: 2, input: "3\n3 2 4\n6", expectedOutput: "1 2" },
  ] });
}

main().finally(() => prisma.$disconnect());
