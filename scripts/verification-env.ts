import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function valueFromFile(filename: string, name: string) {
  try {
    const line = readFileSync(resolve(process.cwd(), filename), "utf8")
      .split(/\r?\n/)
      .find((entry) => entry.trimStart().startsWith(`${name}=`));
    if (!line) return undefined;
    const value = line.slice(line.indexOf("=") + 1).trim();
    return value.replace(/^("|')|("|')$/g, "");
  } catch {
    return undefined;
  }
}

export function verificationValue(name: string) {
  return process.env[name]
    ?? valueFromFile(".env.test.local", name)
    ?? valueFromFile(".env.local", name)
    ?? valueFromFile(".env", name);
}

export function configuredDevelopmentDatabaseUrl() {
  return process.env.DATABASE_URL
    ?? valueFromFile(".env.local", "DATABASE_URL")
    ?? valueFromFile(".env", "DATABASE_URL");
}
