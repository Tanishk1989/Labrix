import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export function getDemoDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    const line = readFileSync(resolve(process.cwd(), ".env"), "utf8")
      .split(/\r?\n/)
      .find((entry) => entry.startsWith("DATABASE_URL="));
    if (!line) return undefined;
    const value = line.slice("DATABASE_URL=".length).trim();
    return value.replace(/^("|')|("|')$/g, "");
  } catch {
    return undefined;
  }
}
