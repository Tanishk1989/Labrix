import { resolveIdentityMode } from "@/server/actors/identity-mode";
import { getServerExecutionProvider } from "@/server/execution";

export interface DeploymentEnvironment {
  NODE_ENV?: string;
  DATABASE_URL?: string;
  LABRIX_IDENTITY_MODE?: string;
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?: string;
  CLERK_SECRET_KEY?: string;
  LABRIX_EXECUTION_PROVIDER?: string;
  LABRIX_JAVA_RUNNER_URL?: string;
  LABRIX_CPP_RUNNER_URL?: string;
  LABRIX_ALLOW_LOCAL_RUNNERS_IN_PRODUCTION?: string;
  LABRIX_ALLOW_TEST_DATABASE_MUTATION?: string;
}

export class DeploymentConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DeploymentConfigurationError";
  }
}

function requireValue(
  environment: DeploymentEnvironment,
  name:
    | "DATABASE_URL"
    | "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
    | "CLERK_SECRET_KEY",
) {
  const value = environment[name]?.trim();
  if (!value) {
    throw new DeploymentConfigurationError(
      `Invalid deployment configuration: ${name} is required.`,
    );
  }
  return value;
}

function validateDatabaseUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new DeploymentConfigurationError(
      "Invalid deployment configuration: DATABASE_URL must be a valid PostgreSQL URL.",
    );
  }
  if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname) {
    throw new DeploymentConfigurationError(
      "Invalid deployment configuration: DATABASE_URL must be a valid PostgreSQL URL.",
    );
  }
}

export function validateDeploymentEnvironment(
  environment: DeploymentEnvironment,
) {
  validateDatabaseUrl(requireValue(environment, "DATABASE_URL"));

  let identityMode: "demo" | "clerk";
  try {
    identityMode = resolveIdentityMode({
      mode: environment.LABRIX_IDENTITY_MODE,
      nodeEnv: environment.NODE_ENV,
    });
  } catch (error) {
    throw new DeploymentConfigurationError(
      error instanceof Error
        ? error.message
        : "Invalid deployment identity configuration.",
    );
  }

  if (identityMode === "clerk") {
    requireValue(environment, "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
    requireValue(environment, "CLERK_SECRET_KEY");
  }

  if (
    environment.NODE_ENV === "production" &&
    environment.LABRIX_ALLOW_TEST_DATABASE_MUTATION === "true"
  ) {
    throw new DeploymentConfigurationError(
      "Invalid deployment configuration: LABRIX_ALLOW_TEST_DATABASE_MUTATION must not be enabled in production.",
    );
  }

  let executionProvider;
  try {
    executionProvider = getServerExecutionProvider({
      NODE_ENV: environment.NODE_ENV,
      LABRIX_EXECUTION_PROVIDER: environment.LABRIX_EXECUTION_PROVIDER,
      LABRIX_JAVA_RUNNER_URL: environment.LABRIX_JAVA_RUNNER_URL,
      LABRIX_CPP_RUNNER_URL: environment.LABRIX_CPP_RUNNER_URL,
      LABRIX_ALLOW_LOCAL_RUNNERS_IN_PRODUCTION:
        environment.LABRIX_ALLOW_LOCAL_RUNNERS_IN_PRODUCTION,
    });
  } catch (error) {
    throw new DeploymentConfigurationError(
      error instanceof Error
        ? error.message
        : "Invalid deployment execution configuration.",
    );
  }

  return {
    identityMode,
    executionMode: executionProvider.executionMode,
  } as const;
}
