import type { Prisma } from "@prisma/client";

type AccessDb = Pick<Prisma.TransactionClient, "classroom" | "task">;

export class AccessDeniedError extends Error {
  constructor(message = "You do not have access to this resource.") {
    super(message);
    this.name = "AccessDeniedError";
  }
}

export async function requirePublishedTaskForStudent(
  db: AccessDb,
  studentId: string,
  taskId: string,
) {
  const task = await db.task.findFirst({
    where: {
      id: taskId,
      status: "PUBLISHED",
      classroom: {
        memberships: {
          some: {
            userId: studentId,
            role: "STUDENT",
            active: true,
          },
        },
      },
    },
    include: {
      classroom: { select: { id: true, name: true } },
      testCases: { where: { visible: true }, orderBy: { position: "asc" } },
    },
  });
  if (!task) throw new AccessDeniedError();
  return task;
}

export async function requireOwnedClassroom(
  db: AccessDb,
  teacherId: string,
  classroomId: string,
) {
  const classroom = await db.classroom.findFirst({
    where: { id: classroomId, ownerTeacherId: teacherId },
    select: { id: true, name: true },
  });
  if (!classroom) throw new AccessDeniedError();
  return classroom;
}
