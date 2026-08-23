/**
 * TRACE Automated Database Restore Utility
 * Restores a SQL dump after verifying SHA256 checksum integrity.
 *
 * Usage:
 *   RESTORE_DATABASE_URL=... npx tsx scripts/db-restore.ts --file <path> --confirm-database <name>
 */

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

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
  const fileIndex = process.argv.indexOf("--file");
  if (fileIndex === -1 || !process.argv[fileIndex + 1]) {
    console.error("Error: Please provide --file <path-to-sql-file>");
    process.exit(1);
  }

  const filePath = process.argv[fileIndex + 1];
  if (!existsSync(filePath)) {
    console.error(`Error: Backup file not found: ${filePath}`);
    process.exit(1);
  }

  const dbUrl = process.env.RESTORE_DATABASE_URL ?? process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error("Error: RESTORE_DATABASE_URL or DATABASE_URL must be provided.");
    process.exit(1);
  }

  const dbConfig = parseDatabaseUrl(dbUrl);
  const confirmationIndex = process.argv.indexOf("--confirm-database");
  const confirmation = confirmationIndex === -1 ? undefined : process.argv[confirmationIndex + 1];
  if (confirmation !== dbConfig.database) {
    console.error(`Error: Refusing restore. Pass --confirm-database ${dbConfig.database} to confirm the exact destructive target.`);
    process.exit(1);
  }

  // A TRACE restore always requires its checksum sidecar.
  const metaPath = filePath.replace(/\.sql$/, ".meta.json");
  if (!existsSync(metaPath)) {
    console.error(`Error: Required backup metadata not found: ${metaPath}`);
    process.exit(1);
  }
  const fileBuffer = readFileSync(filePath);
  const actualChecksum = createHash("sha256").update(fileBuffer).digest("hex");

  let meta: { sha256?: unknown; database?: unknown };
  try {
    meta = JSON.parse(readFileSync(metaPath, "utf8")) as typeof meta;
  } catch {
    console.error(`Error: Backup metadata is not valid JSON: ${metaPath}`);
    process.exit(1);
  }
  if (typeof meta.sha256 !== "string" || meta.sha256 !== actualChecksum) {
    console.error("Error: Backup checksum is missing or does not match the SQL file.");
    process.exit(1);
  }
  console.log(`[Restore] Integrity verified against ${metaPath}`);
  console.log(`[Restore] Restoring backup to '${dbConfig.database}' on ${dbConfig.host}:${dbConfig.port}...`);

  try {
    const result = spawnSync("psql", [
      "-h", dbConfig.host,
      "-p", dbConfig.port,
      "-U", dbConfig.user,
      "-d", dbConfig.database,
      "--set", "ON_ERROR_STOP=on",
      "-f", filePath,
    ], {
      env: { ...process.env, PGPASSWORD: dbConfig.password },
      stdio: "pipe",
    });
    if (result.error) throw result.error;
    if (result.status !== 0) {
      throw new Error(result.stderr?.toString().trim() || `psql exited with status ${result.status}`);
    }
    console.log(`[Restore] Database restore completed successfully!`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Restore] Failed to restore database: ${message}`);
    process.exit(1);
  }
}

main();
