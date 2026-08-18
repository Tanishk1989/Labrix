import path from "node:path";
import { defineConfig } from "vitest/config";

const alias = [
  { find: /^@\/server\/(.*)/, replacement: path.resolve(__dirname, "../backend/server/$1") },
  { find: /^@\/data\/(.*)/, replacement: path.resolve(__dirname, "../backend/data/$1") },
  { find: /^@\/domain\/(.*)/, replacement: path.resolve(__dirname, "../backend/domain/$1") },
  { find: /^@\/lib\/(.*)/, replacement: path.resolve(__dirname, "../backend/lib/$1") },
  { find: /^@\/runner\/(.*)/, replacement: path.resolve(__dirname, "../backend/runner/$1") },
  { find: /^@\/prisma\/(.*)/, replacement: path.resolve(__dirname, "../backend/prisma/$1") },
  { find: /^@\/app\/(.*)/, replacement: path.resolve(__dirname, "../frontend/app/$1") },
  { find: /^@\/components\/(.*)/, replacement: path.resolve(__dirname, "../frontend/components/$1") },
  { find: /^@\/features\/(.*)/, replacement: path.resolve(__dirname, "../frontend/features/$1") },
  { find: "@frontend", replacement: path.resolve(__dirname, "../frontend") },
  { find: "@backend", replacement: path.resolve(__dirname, "../backend") },
  { find: "@", replacement: path.resolve(__dirname, "../frontend") },
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
