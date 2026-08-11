import { spawnSync } from "node:child_process";
import { getDemoDatabaseUrl } from "./demo-env";

if (process.env.NODE_ENV === "production") {
  console.error("Demo reset refused: this command is unavailable in production.");
  process.exit(1);
}

const databaseUrl = getDemoDatabaseUrl();
if (!databaseUrl) {
  console.error("Demo reset refused: DATABASE_URL is not configured.");
  process.exit(1);
}
const host = new URL(databaseUrl).hostname.toLowerCase();
if (/(^|[-.])(prod|production)([-.]|$)/.test(host)) {
  console.error("Demo reset refused: the configured database host appears to be production.");
  process.exit(1);
}
const result = spawnSync("cmd.exe", ["/d", "/s", "/c", "npm.cmd run db:seed"], { stdio: "inherit", env: { ...process.env, DATABASE_URL: databaseUrl } });
process.exit(result.status ?? 1);
