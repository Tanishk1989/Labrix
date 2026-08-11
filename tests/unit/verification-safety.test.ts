import { describe, expect, it } from "vitest";
import {
  requireDisposableTestDatabase,
  VerificationSafetyError,
} from "../../scripts/verification-safety";

const testDatabaseUrl = "postgresql://test:test@localhost:5432/labrix_test";

describe("verification database safety", () => {
  it("requires explicit mutation confirmation", () => {
    expect(() => requireDisposableTestDatabase({
      allowMutation: undefined,
      testDatabaseUrl,
    })).toThrow(VerificationSafetyError);
  });

  it("requires a PostgreSQL test database URL", () => {
    expect(() => requireDisposableTestDatabase({
      allowMutation: "true",
      testDatabaseUrl: undefined,
    })).toThrow("LABRIX_TEST_DATABASE_URL is required");
    expect(() => requireDisposableTestDatabase({
      allowMutation: "true",
      testDatabaseUrl: "https://example.test/database",
    })).toThrow("must use PostgreSQL");
  });

  it("rejects the configured development or demo database", () => {
    expect(() => requireDisposableTestDatabase({
      allowMutation: "true",
      testDatabaseUrl,
      configuredDatabaseUrl: testDatabaseUrl,
    })).toThrow("must differ from the configured development/demo database");
    expect(() => requireDisposableTestDatabase({
      allowMutation: "true",
      testDatabaseUrl,
      configuredDatabaseUrl:
        "postgresql://other:credentials@localhost:5432/labrix_test?sslmode=require",
    })).toThrow("must differ from the configured development/demo database");
  });

  it("requires the child process to use the test URL", () => {
    expect(() => requireDisposableTestDatabase({
      allowMutation: "true",
      testDatabaseUrl,
      activeDatabaseUrl: "postgresql://test:test@localhost:5432/labrix_demo",
    })).toThrow("not using LABRIX_TEST_DATABASE_URL");
  });

  it("accepts an explicitly isolated active database", () => {
    expect(requireDisposableTestDatabase({
      allowMutation: "true",
      testDatabaseUrl,
      activeDatabaseUrl: testDatabaseUrl,
    })).toBe(`${testDatabaseUrl}`);
  });
});
