import { prisma } from "@/lib/db/prisma";

export interface ServerActor {
  id: string;
  name: string;
  role: "TEACHER" | "STUDENT";
  source: "seeded-demo-session";
}

/**
 * Non-production identity resolver for the seeded vertical slice.
 * Resolves the requested actor by exact ID, or falls back to any active user with that role.
 */
async function resolveSeededActor(
  id: "demo-teacher" | "demo-student-1",
  role: "TEACHER" | "STUDENT",
): Promise<ServerActor> {
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id, platformRole: role },
          { platformRole: role, accountStatus: "ACTIVE" },
        ],
      },
      select: { id: true, name: true, platformRole: true },
      orderBy: { createdAt: "asc" },
    });
    if (user) {
      return {
        id: user.id,
        name: user.name,
        role: user.platformRole,
        source: "seeded-demo-session",
      };
    }
  } catch (err) {
    console.warn("Could not query user for seeded actor:", err);
  }

  return {
    id,
    name: role === "TEACHER" ? "Demo Teacher" : "Demo Student",
    role,
    source: "seeded-demo-session",
  };
}

export function resolveDemoStudentActor() {
  return resolveSeededActor("demo-student-1", "STUDENT");
}

export function resolveDemoTeacherActor() {
  return resolveSeededActor("demo-teacher", "TEACHER");
}
