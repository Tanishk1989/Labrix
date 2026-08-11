export type DatabaseSafetyInput = {
  allowMutation: string | undefined;
  testDatabaseUrl: string | undefined;
  activeDatabaseUrl?: string | undefined;
  configuredDatabaseUrl?: string | undefined;
};

export class VerificationSafetyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VerificationSafetyError";
  }
}

function normalizedDatabaseUrl(value: string, label: string) {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new VerificationSafetyError(`${label} must be a valid PostgreSQL URL.`);
  }
  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    throw new VerificationSafetyError(`${label} must use PostgreSQL.`);
  }
  return parsed.toString();
}

function databaseIdentity(value: string) {
  const parsed = new URL(value);
  const port = parsed.port || "5432";
  return `${parsed.protocol}//${parsed.hostname}:${port}${parsed.pathname}`;
}

export function requireDisposableTestDatabase(input: DatabaseSafetyInput) {
  if (input.allowMutation !== "true") {
    throw new VerificationSafetyError(
      "Database-mutating verification is blocked. Set LABRIX_ALLOW_TEST_DATABASE_MUTATION=true only for a disposable test database.",
    );
  }
  if (!input.testDatabaseUrl?.trim()) {
    throw new VerificationSafetyError(
      "LABRIX_TEST_DATABASE_URL is required for database-mutating verification.",
    );
  }

  const testDatabaseUrl = normalizedDatabaseUrl(
    input.testDatabaseUrl.trim(),
    "LABRIX_TEST_DATABASE_URL",
  );
  if (input.configuredDatabaseUrl?.trim()) {
    const configuredDatabaseUrl = normalizedDatabaseUrl(
      input.configuredDatabaseUrl.trim(),
      "DATABASE_URL",
    );
    if (databaseIdentity(configuredDatabaseUrl) === databaseIdentity(testDatabaseUrl)) {
      throw new VerificationSafetyError(
        "The disposable test database must differ from the configured development/demo database.",
      );
    }
  }
  if (input.activeDatabaseUrl?.trim()) {
    const activeDatabaseUrl = normalizedDatabaseUrl(
      input.activeDatabaseUrl.trim(),
      "DATABASE_URL",
    );
    if (activeDatabaseUrl !== testDatabaseUrl) {
      throw new VerificationSafetyError(
        "The verification process is not using LABRIX_TEST_DATABASE_URL.",
      );
    }
  }

  return testDatabaseUrl;
}
