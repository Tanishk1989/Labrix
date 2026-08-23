import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve, sep } from "node:path";

const workspaceRoot = resolve(import.meta.dirname, "..");
const source = resolve(workspaceRoot, "node_modules/monaco-editor/min/vs");
const publicRoot = resolve(workspaceRoot, "frontend/public");
const target = resolve(publicRoot, "monaco/vs");

if (!existsSync(source)) {
  throw new Error("Monaco static assets are missing. Install dependencies before preparing assets.");
}
if (!target.startsWith(`${publicRoot}${sep}`)) {
  throw new Error("Refusing to prepare Monaco assets outside frontend/public.");
}

mkdirSync(publicRoot, { recursive: true });
rmSync(target, { recursive: true, force: true });
cpSync(source, target, { recursive: true });

console.log("Prepared self-hosted Monaco editor assets.");
