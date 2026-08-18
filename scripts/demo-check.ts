import { PrismaClient } from "@prisma/client";
import { getDemoDatabaseUrl } from "./demo-env";

const databaseUrl = getDemoDatabaseUrl();
if (!databaseUrl) {
  console.error("Demo check failed: DATABASE_URL is not configured.");
  process.exit(1);
}
process.env.DATABASE_URL = databaseUrl;

const prisma = new PrismaClient();

async function main() {
  try {
    const classroom = await prisma.classroom.findFirst({
      where: { id: "dsa-2026", name: "DSA Practical Lab" },
      select: {
        id: true,
        _count: {
          select: {
            tasks: true,
            memberships: { where: { role: "STUDENT", active: true } },
          },
        },
      },
    });
    if (!classroom) throw new Error("Demo classroom is not seeded.");
    const [submissions, publishedReviews, draftReviews] = await Promise.all([
      prisma.submissionAttempt.count({ where: { task: { classroomId: classroom.id } } }),
      prisma.submissionReview.count({ where: { submissionAttempt: { task: { classroomId: classroom.id } }, status: "PUBLISHED" } }),
      prisma.submissionReview.count({ where: { submissionAttempt: { task: { classroomId: classroom.id } }, status: "DRAFT" } }),
    ]);
    if (classroom._count.tasks < 3 || classroom._count.memberships < 3 || submissions < 4 || publishedReviews < 2 || draftReviews < 1) {
      throw new Error("Demo scenario is incomplete.");
    }
    console.log("Demo check passed: the professor scenario and review fixtures are ready.");
  } catch {
    console.error("Demo check failed: TRACE could not reach the demo database or the seed is missing. Run npm.cmd run demo:reset after confirming the development database.");
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
