import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { getConfiguredDatabaseUrl } from "./demo-env";

const databaseUrl = getConfiguredDatabaseUrl();
if (!databaseUrl) {
  console.error(
    "Development startup stopped: DATABASE_URL is not configured. Add it to .env.local, or use npm run dev:local for the bundled PostgreSQL container.",
  );
  process.exit(1);
}

const prismaCli = resolve(
  process.cwd(),
  "node_modules",
  "prisma",
  "build",
  "index.js",
);
const nextCli = resolve(
  process.cwd(),
  "node_modules",
  "next",
  "dist",
  "bin",
  "next",
);
const environment = {
  ...process.env,
  DATABASE_URL: databaseUrl,
  LABRIX_IDENTITY_MODE: process.env.LABRIX_IDENTITY_MODE || "clerk",
};

const databaseCheck = spawnSync(
  process.execPath,
  [prismaCli, "migrate", "status", "--schema=backend/prisma/schema.prisma"],
  { stdio: "inherit", env: environment },
);
if (databaseCheck.error || databaseCheck.status !== 0) {
  console.error(
    "Development startup stopped before opening TRACE because the configured database is unavailable or has pending migrations. Check DATABASE_URL and run npm run db:migrate, or use npm run dev:local.",
  );
  process.exit(databaseCheck.status ?? 1);
}

const developmentServer = spawnSync(
  process.execPath,
  [nextCli, "dev", "frontend"],
  { stdio: "inherit", env: environment },
);
if (developmentServer.error) {
  console.error(developmentServer.error.message);
  process.exit(1);
}
process.exit(developmentServer.status ?? 1);
