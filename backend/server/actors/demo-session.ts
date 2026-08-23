import { prisma } from "@/lib/db/prisma";

export interface ServerActor {
  id: string;
  name: string;
  role: "TEACHER" | "STUDENT";
  source: "seeded-demo-session";
}

/**
 * Non-production identity resolver for the seeded vertical slice.
 * No user or role identifier is accepted from the browser. Real auth replaces
 * this module without changing the service authorization contracts.
 */
async function resolveSeededActor(
  id: "demo-teacher" | "demo-student-1",
  role: "TEACHER" | "STUDENT",
): Promise<ServerActor> {
  const user = await prisma.user.findFirst({
    where: { id, platformRole: role },
    select: { id: true, name: true },
  });
  if (!user) {
    throw new Error(`Seeded ${role.toLowerCase()} actor is unavailable.`);
  }
  return { ...user, role, source: "seeded-demo-session" };
}

export function resolveDemoStudentActor() {
  return resolveSeededActor("demo-student-1", "STUDENT");
}

export function resolveDemoTeacherActor() {
  return resolveSeededActor("demo-teacher", "TEACHER");
}
