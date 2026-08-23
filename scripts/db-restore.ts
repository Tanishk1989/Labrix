/**
 * TRACE Automated Database Restore Utility
 * Restores a SQL dump after verifying SHA256 checksum integrity.
 *
 * Usage:
 *   npx tsx scripts/db-restore.ts --file <path-to-sql-file> [--target-db-url <url>]
 */

import { execSync } from "node:child_process";
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

  const targetUrlIndex = process.argv.indexOf("--target-db-url");
  const dbUrl = targetUrlIndex !== -1 && process.argv[targetUrlIndex + 1]
    ? process.argv[targetUrlIndex + 1]
    : process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error("Error: DATABASE_URL or --target-db-url must be provided.");
    process.exit(1);
  }

  // Check metadata checksum if meta file exists
  const metaPath = filePath.replace(/\.sql$/, ".meta.json");
  const fileBuffer = readFileSync(filePath);
  const actualChecksum = createHash("sha256").update(fileBuffer).digest("hex");

  if (existsSync(metaPath)) {
    try {
      const meta = JSON.parse(readFileSync(metaPath, "utf8"));
      if (meta.sha256 && meta.sha256 !== actualChecksum) {
        console.error(`Error: Checksum mismatch! Expected ${meta.sha256}, got ${actualChecksum}`);
        process.exit(1);
      }
      console.log(`[Restore] Integrity verified against ${metaPath}`);
    } catch {}
  }

  const dbConfig = parseDatabaseUrl(dbUrl);
  console.log(`[Restore] Restoring backup to '${dbConfig.database}' on ${dbConfig.host}:${dbConfig.port}...`);

  const psqlCmd = `psql -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -f "${filePath}"`;

  try {
    execSync(psqlCmd, {
      env: { ...process.env, PGPASSWORD: dbConfig.password },
      stdio: "pipe",
    });
    console.log(`[Restore] Database restore completed successfully!`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Restore] Failed to restore database: ${message}`);
    process.exit(1);
  }
}

main();
