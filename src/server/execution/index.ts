import { JavaHttpExecutionProvider } from "./java-http-provider";
import { CppHttpExecutionProvider } from "./cpp-http-provider";
import { ServerMockExecutionProvider } from "./mock-provider";
import type { ServerExecutionProvider } from "./provider";

const mockProvider: ServerExecutionProvider = new ServerMockExecutionProvider();

export interface ExecutionProviderEnvironment {
  NODE_ENV?: string;
  LABRIX_EXECUTION_PROVIDER?: string;
  LABRIX_JAVA_RUNNER_URL?: string;
  LABRIX_CPP_RUNNER_URL?: string;
  LABRIX_ALLOW_LOCAL_RUNNERS_IN_PRODUCTION?: string;
}

type LocalProviderMode = "java-http" | "cpp-http";

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

export function getServerExecutionProvider(
  environment: ExecutionProviderEnvironment = {
    NODE_ENV: process.env.NODE_ENV,
    LABRIX_EXECUTION_PROVIDER: process.env.LABRIX_EXECUTION_PROVIDER,
    LABRIX_JAVA_RUNNER_URL: process.env.LABRIX_JAVA_RUNNER_URL,
    LABRIX_CPP_RUNNER_URL: process.env.LABRIX_CPP_RUNNER_URL,
    LABRIX_ALLOW_LOCAL_RUNNERS_IN_PRODUCTION:
      process.env.LABRIX_ALLOW_LOCAL_RUNNERS_IN_PRODUCTION,
  },
): ServerExecutionProvider {
  const mode = environment.LABRIX_EXECUTION_PROVIDER ?? "mock";
  if (mode === "mock") return mockProvider;
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
  throw new Error(`Unsupported LABRIX_EXECUTION_PROVIDER: ${mode}`);
}
