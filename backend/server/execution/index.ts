import { JavaHttpExecutionProvider } from "./java-http-provider";
import { CppHttpExecutionProvider } from "./cpp-http-provider";
import { ServerMockExecutionProvider } from "./mock-provider";
import type { AllowedLanguage } from "@prisma/client";
import type { ServerExecutionProvider } from "./provider";

const mockProvider: ServerExecutionProvider = new ServerMockExecutionProvider();

export interface ExecutionProviderEnvironment {
  NODE_ENV?: string;
  LABRIX_EXECUTION_PROVIDER?: string;
  LABRIX_JAVA_RUNNER_URL?: string;
  LABRIX_CPP_RUNNER_URL?: string;
  LABRIX_RUNNER_BEARER_TOKEN?: string;
  LABRIX_ALLOW_LOCAL_RUNNERS_IN_PRODUCTION?: string;
}

type LocalProviderMode = "java-http" | "cpp-http" | "local-docker";

function requireLocalRunnerProductionAllowance(
  mode: LocalProviderMode,
  environment: ExecutionProviderEnvironment,
) {
  if (
    environment.NODE_ENV === "production" &&
    environment.LABRIX_ALLOW_LOCAL_RUNNERS_IN_PRODUCTION !== "true"
  ) {
    throw new Error(
      `Invalid execution provider configuration: ${mode} is a local development proof and is not production-ready. ` +
        "Set LABRIX_ALLOW_LOCAL_RUNNERS_IN_PRODUCTION=true only for an explicitly accepted local production exception.",
    );
  }
}

function requireLoopbackRunnerUrl(
  value: string | undefined,
  variableName: "LABRIX_JAVA_RUNNER_URL" | "LABRIX_CPP_RUNNER_URL",
  providerMode: LocalProviderMode,
) {
  if (!value) {
    throw new Error(
      `Invalid execution provider configuration: ${variableName} is required for the ${providerMode} provider.`,
    );
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(
      `Invalid execution provider configuration: ${variableName} must be a valid HTTP loopback URL.`,
    );
  }
  if (
    url.protocol !== "http:" ||
    !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) ||
    url.username !== "" ||
    url.password !== ""
  ) {
    throw new Error(
      `Invalid execution provider configuration: ${variableName} for ${providerMode} must use an unauthenticated loopback HTTP URL on 127.0.0.1, localhost, or ::1.`,
    );
  }
  return url.toString();
}

function requireRemoteRunnerUrl(
  value: string | undefined,
  variableName: "LABRIX_JAVA_RUNNER_URL" | "LABRIX_CPP_RUNNER_URL",
) {
  if (!value) {
    throw new Error(`Invalid execution provider configuration: ${variableName} is required.`);
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid execution provider configuration: ${variableName} must be a valid HTTPS URL.`);
  }
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error(`Invalid execution provider configuration: ${variableName} must use HTTPS without URL credentials.`);
  }
  return url.toString();
}

function requireRunnerToken(value: string | undefined) {
  if (!value || value.length < 32) {
    throw new Error(
      "Invalid execution provider configuration: LABRIX_RUNNER_BEARER_TOKEN must contain at least 32 characters.",
    );
  }
  return value;
}

export function getServerExecutionProvider(
  environment: ExecutionProviderEnvironment = {
    NODE_ENV: process.env.NODE_ENV,
    LABRIX_EXECUTION_PROVIDER: process.env.LABRIX_EXECUTION_PROVIDER,
    LABRIX_JAVA_RUNNER_URL: process.env.LABRIX_JAVA_RUNNER_URL,
    LABRIX_CPP_RUNNER_URL: process.env.LABRIX_CPP_RUNNER_URL,
    LABRIX_RUNNER_BEARER_TOKEN: process.env.LABRIX_RUNNER_BEARER_TOKEN,
    LABRIX_ALLOW_LOCAL_RUNNERS_IN_PRODUCTION:
      process.env.LABRIX_ALLOW_LOCAL_RUNNERS_IN_PRODUCTION,
  },
  language?: AllowedLanguage,
): ServerExecutionProvider {
  const mode = environment.LABRIX_EXECUTION_PROVIDER ?? "mock";
  if (mode === "mock") {
    if (environment.NODE_ENV === "production") {
      throw new Error(
        "Invalid execution provider configuration: mock execution is forbidden in production.",
      );
    }
    return mockProvider;
  }
  if (mode === "java-http") {
    requireLocalRunnerProductionAllowance(mode, environment);
    return new JavaHttpExecutionProvider({
      endpoint: requireLoopbackRunnerUrl(
        environment.LABRIX_JAVA_RUNNER_URL,
        "LABRIX_JAVA_RUNNER_URL",
        mode,
      ),
    });
  }
  if (mode === "cpp-http") {
    requireLocalRunnerProductionAllowance(mode, environment);
    return new CppHttpExecutionProvider({
      endpoint: requireLoopbackRunnerUrl(
        environment.LABRIX_CPP_RUNNER_URL,
        "LABRIX_CPP_RUNNER_URL",
        mode,
      ),
    });
  }
  if (mode === "local-docker") {
    requireLocalRunnerProductionAllowance(mode, environment);
    if (!language) {
      throw new Error(
        "Invalid execution provider configuration: local-docker requires a server-resolved execution language.",
      );
    }
    if (language === "JAVA") {
      return new JavaHttpExecutionProvider({
        endpoint: requireLoopbackRunnerUrl(
          environment.LABRIX_JAVA_RUNNER_URL,
          "LABRIX_JAVA_RUNNER_URL",
          mode,
        ),
      });
    }
    return new CppHttpExecutionProvider({
      endpoint: requireLoopbackRunnerUrl(
        environment.LABRIX_CPP_RUNNER_URL,
        "LABRIX_CPP_RUNNER_URL",
        mode,
      ),
    });
  }
  if (mode === "remote-docker") {
    if (!language) {
      throw new Error(
        "Invalid execution provider configuration: remote-docker requires a server-resolved execution language.",
      );
    }
    const bearerToken = requireRunnerToken(environment.LABRIX_RUNNER_BEARER_TOKEN);
    if (language === "JAVA") {
      return new JavaHttpExecutionProvider({
        endpoint: requireRemoteRunnerUrl(
          environment.LABRIX_JAVA_RUNNER_URL,
          "LABRIX_JAVA_RUNNER_URL",
        ),
        bearerToken,
      });
    }
    return new CppHttpExecutionProvider({
      endpoint: requireRemoteRunnerUrl(
        environment.LABRIX_CPP_RUNNER_URL,
        "LABRIX_CPP_RUNNER_URL",
      ),
      bearerToken,
    });
  }
  throw new Error(`Unsupported LABRIX_EXECUTION_PROVIDER: ${mode}`);
}
