import { JavaHttpExecutionProvider } from "./java-http-provider";
import { CppHttpExecutionProvider } from "./cpp-http-provider";
import { ServerMockExecutionProvider } from "./mock-provider";
import { Judge0ExecutionProvider } from "./judge0-provider";
import { WandboxExecutionProvider } from "./wandbox-provider";
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
  JUDGE0_API_URL?: string;
  JUDGE0_API_KEY?: string;
  JUDGE0_AUTH_TOKEN?: string;
  JUDGE0_API_HOST?: string;
  JUDGE0_JAVA_LANGUAGE_ID?: string;
  JUDGE0_CPP_LANGUAGE_ID?: string;
  WANDBOX_API_URL?: string;
  WANDBOX_JAVA_COMPILER?: string;
  WANDBOX_CPP_COMPILER?: string;
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
  variableName: string,
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
    JUDGE0_API_URL: process.env.JUDGE0_API_URL,
    JUDGE0_API_KEY: process.env.JUDGE0_API_KEY,
    JUDGE0_AUTH_TOKEN: process.env.JUDGE0_AUTH_TOKEN,
    JUDGE0_API_HOST: process.env.JUDGE0_API_HOST,
    JUDGE0_JAVA_LANGUAGE_ID: process.env.JUDGE0_JAVA_LANGUAGE_ID,
    JUDGE0_CPP_LANGUAGE_ID: process.env.JUDGE0_CPP_LANGUAGE_ID,
    WANDBOX_API_URL: process.env.WANDBOX_API_URL,
    WANDBOX_JAVA_COMPILER: process.env.WANDBOX_JAVA_COMPILER,
    WANDBOX_CPP_COMPILER: process.env.WANDBOX_CPP_COMPILER,
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
  if (mode === "judge0") {
    if (!language) {
      throw new Error("Invalid execution provider configuration: judge0 requires a server-resolved execution language.");
    }
    const baseUrl = requireRemoteRunnerUrl(environment.JUDGE0_API_URL, "JUDGE0_API_URL");
    if (!environment.JUDGE0_API_KEY && !environment.JUDGE0_AUTH_TOKEN) {
      throw new Error("Invalid execution provider configuration: JUDGE0_API_KEY or JUDGE0_AUTH_TOKEN is required.");
    }
    return new Judge0ExecutionProvider({
      baseUrl,
      apiKey: environment.JUDGE0_API_KEY,
      authToken: environment.JUDGE0_AUTH_TOKEN,
      apiHost: environment.JUDGE0_API_HOST,
      javaLanguageId: environment.JUDGE0_JAVA_LANGUAGE_ID ? Number(environment.JUDGE0_JAVA_LANGUAGE_ID) : undefined,
      cppLanguageId: environment.JUDGE0_CPP_LANGUAGE_ID ? Number(environment.JUDGE0_CPP_LANGUAGE_ID) : undefined,
    }, language);
  }
  if (mode === "wandbox") {
    if (!language) {
      throw new Error("Invalid execution provider configuration: wandbox requires a server-resolved execution language.");
    }
    return new WandboxExecutionProvider({
      endpoint: environment.WANDBOX_API_URL
        ? requireRemoteRunnerUrl(environment.WANDBOX_API_URL, "WANDBOX_API_URL")
        : undefined,
      javaCompiler: environment.WANDBOX_JAVA_COMPILER,
      cppCompiler: environment.WANDBOX_CPP_COMPILER,
    }, language);
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
        executionMode: "java-docker-remote",
      });
    }
    return new CppHttpExecutionProvider({
      endpoint: requireRemoteRunnerUrl(
        environment.LABRIX_CPP_RUNNER_URL,
        "LABRIX_CPP_RUNNER_URL",
      ),
      bearerToken,
      executionMode: "cpp-docker-remote",
    });
  }
  throw new Error(`Unsupported LABRIX_EXECUTION_PROVIDER: ${mode}`);
}
