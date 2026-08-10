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
    const classroom = await prisma.classroom.findFirst({ where: { id: "dsa-2026", name: "DSA Practical Lab" }, select: { id: true } });
    if (!classroom) throw new Error("Demo classroom is not seeded.");
    console.log("Demo check passed: database is reachable and DSA Practical Lab is ready.");
  } catch {
    console.error("Demo check failed: Labrix could not reach the demo database or the seed is missing. Run npm.cmd run demo:reset after confirming the development database.");
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
