import { defineConfig, devices } from "@playwright/test";
import { requireDisposableTestDatabase } from "./scripts/verification-safety";

const readOnlyAcceptance = process.env.LABRIX_E2E_READ_ONLY === "true";
if (!readOnlyAcceptance) {
  requireDisposableTestDatabase({
    allowMutation: process.env.LABRIX_ALLOW_TEST_DATABASE_MUTATION,
    testDatabaseUrl: process.env.LABRIX_TEST_DATABASE_URL,
    activeDatabaseUrl: process.env.DATABASE_URL,
  });
}

export default defineConfig({
  testDir: "tests/e2e",
  testMatch: readOnlyAcceptance ? "read-only-routes.spec.ts" : undefined,
  timeout: 120_000,
  expect: { timeout: 30_000 },
  use: {
    baseURL: "http://127.0.0.1:3000",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: "npm.cmd run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: false,
  },
});
