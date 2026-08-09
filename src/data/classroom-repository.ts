import { prisma } from "@/lib/db/prisma";

export function getClassrooms() {
  return prisma.classroom.findMany({
    where: { status: "ACTIVE" },
    include: { memberships: { where: { active: true } }, tasks: { orderBy: { createdAt: "desc" } } },
    orderBy: { createdAt: "desc" },
  });
}

export function getClassroomById(id: string) {
  return prisma.classroom.findUnique({
    where: { id },
    include: { memberships: { where: { active: true } }, tasks: { orderBy: { createdAt: "desc" } } },
  });
}
