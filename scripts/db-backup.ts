/**
 * TRACE Automated Database Backup Utility
 * Creates timestamped SQL dumps with SHA256 integrity checksums.
 *
 * Usage:
 *   npx tsx scripts/db-backup.ts [--output <dir>]
 */

import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function parseDatabaseUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parsed.port || "5432",
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
  };
}

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("Error: DATABASE_URL environment variable is not set.");
    process.exit(1);
  }

  const outDir = process.argv.includes("--output")
    ? process.argv[process.argv.indexOf("--output") + 1]
    : join(process.cwd(), "backups");

  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `trace-backup-${timestamp}.sql`;
  const filePath = join(outDir, filename);

  const dbConfig = parseDatabaseUrl(dbUrl);
  console.log(`[Backup] Starting backup for database '${dbConfig.database}' on ${dbConfig.host}:${dbConfig.port}...`);

  const pgDumpCmd = `pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} --clean --if-exists --no-owner --no-privileges -f "${filePath}"`;

  try {
    execSync(pgDumpCmd, {
      env: { ...process.env, PGPASSWORD: dbConfig.password },
      stdio: "pipe",
    });

    const fileBuffer = readFileSync(filePath);
    const checksum = createHash("sha256").update(fileBuffer).digest("hex");
    const metaPath = join(outDir, `trace-backup-${timestamp}.meta.json`);

    const metadata = {
      filename,
      timestamp: new Date().toISOString(),
      database: dbConfig.database,
      sizeBytes: fileBuffer.length,
      sha256: checksum,
    };

    writeFileSync(metaPath, JSON.stringify(metadata, null, 2), "utf8");

    console.log(`[Backup] Success! Backup created at: ${filePath}`);
    console.log(`[Backup] SHA256 Checksum: ${checksum}`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Backup] Failed to create backup: ${message}`);
    process.exit(1);
  }
}

main();
