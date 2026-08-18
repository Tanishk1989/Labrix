import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function readDatabaseUrl(fileName: string) {
  try {
    const line = readFileSync(resolve(process.cwd(), fileName), "utf8")
      .split(/\r?\n/)
      .find((entry) => entry.startsWith("DATABASE_URL="));
    if (!line) return undefined;
    const value = line.slice("DATABASE_URL=".length).trim();
    return value.replace(/^("|')|("|')$/g, "");
  } catch {
    return undefined;
  }
}

export function resolveConfiguredDatabaseUrl(input: {
  demoDatabaseUrl?: string;
  processDatabaseUrl?: string;
  localFileDatabaseUrl?: string;
  envFileDatabaseUrl?: string;
}) {
  return (
    input.demoDatabaseUrl ??
    input.processDatabaseUrl ??
    input.localFileDatabaseUrl ??
    input.envFileDatabaseUrl
  );
}

export function getDemoDatabaseUrl() {
  return resolveConfiguredDatabaseUrl({
    demoDatabaseUrl: process.env.LABRIX_DEMO_DATABASE_URL,
    processDatabaseUrl: process.env.DATABASE_URL,
    localFileDatabaseUrl: readDatabaseUrl(".env.local"),
    envFileDatabaseUrl: readDatabaseUrl(".env"),
  });
}
