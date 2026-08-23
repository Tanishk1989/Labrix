import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

export const localDatabaseUrl =
  "postgresql://labrix:labrix-local-only@127.0.0.1:54329/labrix?schema=public&connection_limit=5";

const command = process.argv[2] ?? "up";
const executable = process.platform === "win32" ? "docker.exe" : "docker";
const prismaCli = resolve(process.cwd(), "node_modules", "prisma", "build", "index.js");
const nextCli = resolve(process.cwd(), "node_modules", "next", "dist", "bin", "next");

function run(
  program: string,
  args: string[],
  database = false,
  exitOnFailure = true,
) {
  const result = spawnSync(program, args, {
    stdio: "inherit",
    env: database
      ? { ...process.env, DATABASE_URL: localDatabaseUrl }
      : process.env,
  });
  if (result.error) {
    console.error(
      program === executable
        ? `Local database startup failed: Docker is unavailable. ${result.error.message}`
        : result.error.message,
    );
    process.exit(1);
  }
  const status = result.status ?? 1;
  if (status !== 0 && program === executable) {
    console.error(
      "Local database startup failed: start Docker Desktop, wait until its engine is ready, and retry npm run dev:local.",
    );
  }
  if (status !== 0 && exitOnFailure) process.exit(status);
  return status;
}

function startDatabase() {
  run(executable, [
    "compose",
    "-f",
    "backend/docker-compose.local.yml",
    "up",
    "-d",
    "--wait",
  ]);
}

function prepareSchema() {
  run(process.execPath, [prismaCli, "migrate", "deploy", "--schema=backend/prisma/schema.prisma"], true);
  run(process.execPath, [prismaCli, "generate", "--schema=backend/prisma/schema.prisma"], true);
}

if (command === "up") {
  startDatabase();
} else if (command === "down") {
  run(executable, [
    "compose",
    "-f",
    "backend/docker-compose.local.yml",
    "down",
  ]);
} else if (command === "prepare") {
  startDatabase();
  prepareSchema();
  console.log("Local TRACE database is migrated and ready for real classroom data.");
} else if (command === "dev") {
  startDatabase();
  prepareSchema();
  run(process.execPath, [nextCli, "dev", "frontend"], true);
} else {
  console.error("Use up, down, prepare, or dev.");
  process.exit(1);
}
