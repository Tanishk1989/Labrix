import { describe, expect, it } from "vitest";
import { resolveConfiguredDatabaseUrl } from "../../scripts/demo-env";

describe("database URL resolution", () => {
  it("prefers an explicit demo override", () => {
    expect(resolveConfiguredDatabaseUrl({
      demoDatabaseUrl: "postgresql://demo-override",
      processDatabaseUrl: "postgresql://process",
      localFileDatabaseUrl: "postgresql://local-file",
      envFileDatabaseUrl: "postgresql://env-file",
    })).toBe("postgresql://demo-override");
  });

  it("keeps a parent-process database override ahead of local files", () => {
    expect(resolveConfiguredDatabaseUrl({
      processDatabaseUrl: "postgresql://isolated-process",
      localFileDatabaseUrl: "postgresql://developer-local",
      envFileDatabaseUrl: "postgresql://fallback",
    })).toBe("postgresql://isolated-process");
  });

  it("falls back from .env.local to .env", () => {
    expect(resolveConfiguredDatabaseUrl({
      localFileDatabaseUrl: "postgresql://developer-local",
      envFileDatabaseUrl: "postgresql://fallback",
    })).toBe("postgresql://developer-local");
    expect(resolveConfiguredDatabaseUrl({
      envFileDatabaseUrl: "postgresql://fallback",
    })).toBe("postgresql://fallback");
  });
});
