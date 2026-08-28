import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { localDemoDatabaseUrl } from "./demo-env";

export const localDatabaseUrl = localDemoDatabaseUrl;
export const localTestDatabaseUrl =
  "postgresql://labrix:labrix-local-only@127.0.0.1:54329/labrix_test?schema=public&connection_limit=5";

const command = process.argv[2] ?? "up";
const executable = process.platform === "win32" ? "docker.exe" : "docker";
const prismaCli = resolve(process.cwd(), "node_modules", "prisma", "build", "index.js");
const nextCli = resolve(process.cwd(), "node_modules", "next", "dist", "bin", "next");
const tsxCli = resolve(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs");
const nativeDatabaseRoot = resolve(process.cwd(), ".labrix", "postgres-data");
const nativeDatabaseLog = resolve(process.cwd(), ".labrix", "postgres.log");

function findNativePostgresBin() {
  const configured = process.env.LABRIX_POSTGRES_BIN;
  if (configured && existsSync(resolve(configured, "pg_ctl.exe"))) return configured;
  if (process.platform !== "win32") return null;
  const base = resolve(process.env.ProgramFiles ?? "C:\\Program Files", "PostgreSQL");
  if (!existsSync(base)) return null;
  const versions = readdirSync(base, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\d+$/.test(entry.name))
    .map((entry) => Number(entry.name))
    .sort((a, b) => b - a);
  for (const version of versions) {
    const candidate = resolve(base, String(version), "bin");
    if (existsSync(resolve(candidate, "pg_ctl.exe"))) return candidate;
  }
  return null;
}

function dockerEngineAvailable() {
  const result = spawnSync(executable, ["info", "--format", "{{.ServerVersion}}"], {
    stdio: "ignore",
    timeout: 5_000,
  });
  return result.status === 0 && !result.error;
}

function run(
  program: string,
  args: string[],
  database = false,
  exitOnFailure = true,
  environmentOverrides: Record<string, string | undefined> = {},
) {
  const result = spawnSync(program, args, {
    stdio: "inherit",
    env: database
      ? { ...process.env, DATABASE_URL: localDatabaseUrl, ...environmentOverrides }
      : { ...process.env, ...environmentOverrides },
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

function startNativeDatabase(postgresBin: string) {
  mkdirSync(resolve(process.cwd(), ".labrix"), { recursive: true });
  const pgVersion = resolve(nativeDatabaseRoot, "PG_VERSION");
  if (!existsSync(pgVersion)) {
    const ready = spawnSync(resolve(postgresBin, "pg_isready.exe"), [
      "-h", "127.0.0.1", "-p", "54329",
    ], { stdio: "ignore" });
    if (ready.status === 0) {
      console.error("Port 54329 is already serving a database that is not owned by this TRACE workspace.");
      process.exit(1);
    }
    run(resolve(postgresBin, "initdb.exe"), [
      "-D", nativeDatabaseRoot,
      "--username=labrix",
      "--auth=trust",
      "--encoding=UTF8",
    ]);
  }
  const status = spawnSync(resolve(postgresBin, "pg_ctl.exe"), [
    "status", "-D", nativeDatabaseRoot,
  ], { stdio: "ignore" });
  if (status.status !== 0) {
    run(resolve(postgresBin, "pg_ctl.exe"), [
      "start",
      "-D", nativeDatabaseRoot,
      "-l", nativeDatabaseLog,
      "-o", "-h 127.0.0.1 -p 54329",
      "-w",
    ]);
  }
  ensureNativeDatabase(postgresBin, "labrix");
  ensureNativeDatabase(postgresBin, "labrix_test");
  console.log("Using the isolated Windows PostgreSQL cluster at 127.0.0.1:54329.");
}

function ensureNativeDatabase(postgresBin: string, databaseName: string) {
  const databaseExists = spawnSync(resolve(postgresBin, "psql.exe"), [
    "-h", "127.0.0.1", "-p", "54329", "-U", "labrix", "-d", databaseName, "-c", "SELECT 1",
  ], { stdio: "ignore" });
  if (databaseExists.status !== 0) {
    run(resolve(postgresBin, "createdb.exe"), [
      "-h", "127.0.0.1", "-p", "54329", "-U", "labrix", databaseName,
    ]);
  }
}

function ensureDockerTestDatabase() {
  const databaseExists = spawnSync(executable, [
    "exec", "labrix-postgres-local", "psql", "-U", "labrix", "-d", "labrix_test", "-c", "SELECT 1",
  ], { stdio: "ignore" });
  if (databaseExists.status !== 0) {
    run(executable, [
      "exec", "labrix-postgres-local", "createdb", "-U", "labrix", "labrix_test",
    ]);
  }
}

function startDatabase() {
  if (dockerEngineAvailable()) {
    run(executable, [
      "compose",
      "-f",
      "backend/docker-compose.local.yml",
      "up",
      "-d",
      "--wait",
    ]);
    ensureDockerTestDatabase();
    return;
  }
  const postgresBin = findNativePostgresBin();
  if (!postgresBin) {
    console.error(
      "Local database startup failed: start Docker Desktop or install PostgreSQL and set LABRIX_POSTGRES_BIN to its bin directory.",
    );
    process.exit(1);
  }
  startNativeDatabase(postgresBin);
}

function stopDatabase() {
  if (dockerEngineAvailable()) {
    run(executable, ["compose", "-f", "backend/docker-compose.local.yml", "down"]);
  }
  const postgresBin = findNativePostgresBin();
  if (postgresBin && existsSync(resolve(nativeDatabaseRoot, "PG_VERSION"))) {
    const status = spawnSync(resolve(postgresBin, "pg_ctl.exe"), [
      "status", "-D", nativeDatabaseRoot,
    ], { stdio: "ignore" });
    if (status.status === 0) {
      run(resolve(postgresBin, "pg_ctl.exe"), ["stop", "-D", nativeDatabaseRoot, "-m", "fast", "-w"]);
    }
  }
}

function prepareSchema() {
  run(process.execPath, [prismaCli, "migrate", "deploy", "--schema=backend/prisma/schema.prisma"], true);
  run(process.execPath, [prismaCli, "generate", "--schema=backend/prisma/schema.prisma"], true);
}

function seedDemoFixtures() {
  run(process.execPath, [tsxCli, resolve(process.cwd(), "backend/prisma/seed.ts")], true);
}

function verifyDemoFixtures() {
  run(process.execPath, [tsxCli, resolve(process.cwd(), "scripts/demo-check.ts")], true);
}

function ensureDemoFixtures() {
  const readiness = run(
    process.execPath,
    [tsxCli, resolve(process.cwd(), "scripts/local-database-readiness.ts")],
    true,
    false,
  );
  if (readiness === 2) {
    seedDemoFixtures();
  } else if (readiness !== 0) {
    console.error(
      "Local demo startup stopped because the fixture set is incomplete. Run npm run db:local:prepare to reset only the deterministic demo scenario.",
    );
    process.exit(readiness);
  }
  verifyDemoFixtures();
}

function startDemoDevelopmentServer() {
  run(process.execPath, [nextCli, "dev", "frontend"], true, true, {
    LABRIX_IDENTITY_MODE: "demo",
    LABRIX_EXECUTION_PROVIDER: "mock",
    LABRIX_EXECUTION_DISPATCH: "inline",
  });
}

if (command === "up") {
  startDatabase();
} else if (command === "down") {
  stopDatabase();
} else if (command === "prepare") {
  startDatabase();
  prepareSchema();
  seedDemoFixtures();
  verifyDemoFixtures();
  console.log("Local TRACE database is migrated and the deterministic demo scenario is ready.");
} else if (command === "dev") {
  startDatabase();
  prepareSchema();
  ensureDemoFixtures();
  startDemoDevelopmentServer();
} else {
  console.error("Use up, down, prepare, or dev.");
  process.exit(1);
}
