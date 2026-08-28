import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { getDemoDatabaseUrl } from "./demo-env";

const databaseUrl = getDemoDatabaseUrl();
if (!databaseUrl) {
  console.error("Demo reset refused: DATABASE_URL is not configured.");
  process.exit(1);
}
const host = new URL(databaseUrl).hostname.toLowerCase();
if (!["127.0.0.1", "localhost", "::1", "[::1]"].includes(host)) {
  console.error("Demo reset refused: only a loopback development database may be reset.");
  process.exit(1);
}

const prismaCli = resolve(process.cwd(), "node_modules", "prisma", "build", "index.js");
const tsxCli = resolve(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs");
const environment = { ...process.env, DATABASE_URL: databaseUrl };

const reset = spawnSync(process.execPath, [
  prismaCli,
  "migrate",
  "reset",
  "--force",
  "--skip-generate",
  "--schema=backend/prisma/schema.prisma",
], { stdio: "inherit", env: environment });
if (reset.status !== 0) process.exit(reset.status ?? 1);

const check = spawnSync(process.execPath, [
  tsxCli,
  resolve(process.cwd(), "scripts/demo-check.ts"),
], { stdio: "inherit", env: environment });
process.exit(check.status ?? 1);
