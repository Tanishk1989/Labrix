import { PrismaClient } from "@prisma/client";
import { classifyDemoFixturePresence } from "./local-database-state";

const prisma = new PrismaClient();

async function main() {
  try {
    const [teacher, student, classroom] = await Promise.all([
      prisma.user.findUnique({ where: { id: "demo-teacher" }, select: { id: true } }),
      prisma.user.findUnique({ where: { id: "demo-student-1" }, select: { id: true } }),
      prisma.classroom.findUnique({ where: { id: "dsa-2026" }, select: { id: true } }),
    ]);
    const state = classifyDemoFixturePresence({
      teacher: Boolean(teacher),
      student: Boolean(student),
      classroom: Boolean(classroom),
    });
    if (state === "fresh") {
      console.log("Local database is migrated but has no demo fixtures.");
      process.exitCode = 2;
      return;
    }
    if (state === "incomplete") {
      console.error(
        "Local database contains an incomplete demo seed. Run npm run db:local:prepare to restore only the seeded demo scenario.",
      );
      process.exitCode = 3;
      return;
    }
    console.log("Local database and core demo fixtures are ready.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error.";
    console.error(`Local database readiness check failed: ${message}`);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
