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

export const localDemoDatabaseUrl =
  "postgresql://labrix:labrix-local-only@127.0.0.1:54329/labrix?schema=public&connection_limit=5";

export function resolveDemoDatabaseUrl(input: {
  demoDatabaseUrl?: string;
  localDatabaseUrl?: string;
}) {
  return input.demoDatabaseUrl ?? input.localDatabaseUrl ?? localDemoDatabaseUrl;
}

export function getConfiguredDatabaseUrl() {
  return resolveConfiguredDatabaseUrl({
    demoDatabaseUrl: process.env.LABRIX_DEMO_DATABASE_URL,
    processDatabaseUrl: process.env.DATABASE_URL,
    localFileDatabaseUrl: readDatabaseUrl(".env.local"),
    envFileDatabaseUrl: readDatabaseUrl(".env"),
  });
}

export function getDemoDatabaseUrl() {
  // Demo commands are deliberately isolated from DATABASE_URL so an ordinary
  // development or production connection can never be checked or reset by a
  // demo helper. LABRIX_DEMO_DATABASE_URL remains an explicit operator escape
  // hatch for a separately provisioned demo database.
  return resolveDemoDatabaseUrl({
    demoDatabaseUrl: process.env.LABRIX_DEMO_DATABASE_URL,
    localDatabaseUrl: localDemoDatabaseUrl,
  });
}
