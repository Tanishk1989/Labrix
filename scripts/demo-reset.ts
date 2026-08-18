import { spawnSync } from "node:child_process";
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
const result = spawnSync("cmd.exe", ["/d", "/s", "/c", "npm.cmd run db:seed"], { stdio: "inherit", env: { ...process.env, DATABASE_URL: databaseUrl } });
process.exit(result.status ?? 1);
