import path from "node:path";
import { defineConfig } from "vitest/config";

const alias = [
  { find: /^@\/server\/(.*)/, replacement: path.resolve(import.meta.dirname, "../backend/server/$1") },
  { find: /^@\/data\/(.*)/, replacement: path.resolve(import.meta.dirname, "../backend/data/$1") },
  { find: /^@\/domain\/(.*)/, replacement: path.resolve(import.meta.dirname, "../backend/domain/$1") },
  { find: /^@\/lib\/(.*)/, replacement: path.resolve(import.meta.dirname, "../backend/lib/$1") },
  { find: /^@\/runner\/(.*)/, replacement: path.resolve(import.meta.dirname, "../backend/runner/$1") },
  { find: /^@\/prisma\/(.*)/, replacement: path.resolve(import.meta.dirname, "../backend/prisma/$1") },
  { find: /^@\/app\/(.*)/, replacement: path.resolve(import.meta.dirname, "../frontend/app/$1") },
  { find: /^@\/components\/(.*)/, replacement: path.resolve(import.meta.dirname, "../frontend/components/$1") },
  { find: /^@\/features\/(.*)/, replacement: path.resolve(import.meta.dirname, "../frontend/features/$1") },
  { find: "@frontend", replacement: path.resolve(import.meta.dirname, "../frontend") },
  { find: "@backend", replacement: path.resolve(import.meta.dirname, "../backend") },
  { find: "@", replacement: path.resolve(import.meta.dirname, "../frontend") },
];

export default defineConfig({
  resolve: { alias },
  test: {
    include: ["tests/runner/**/*.test.ts"],
    fileParallelism: false,
    testTimeout: 60_000,
    hookTimeout: 30_000,
  },
});
