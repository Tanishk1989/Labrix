import { defineConfig, devices } from "@playwright/test";
import { requireDisposableTestDatabase } from "../scripts/verification-safety";

const readOnlyAcceptance = process.env.LABRIX_E2E_READ_ONLY === "true";
if (!readOnlyAcceptance) {
  requireDisposableTestDatabase({
    allowMutation: process.env.LABRIX_ALLOW_TEST_DATABASE_MUTATION,
    testDatabaseUrl: process.env.LABRIX_TEST_DATABASE_URL,
    activeDatabaseUrl: process.env.DATABASE_URL,
  });
}

export default defineConfig({
  testDir: "e2e",
  testMatch: readOnlyAcceptance ? "read-only-routes.spec.ts" : undefined,
  timeout: 120_000,
  expect: { timeout: 30_000 },
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3000",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    // The isolated harness has already validated and seeded its database. Launch
    // Next directly so Playwright can terminate the server process reliably on
    // Windows instead of leaving a grandchild behind an npm/tsx wrapper.
    command: "node ../node_modules/next/dist/bin/next dev ../frontend",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: false,
  },
});
