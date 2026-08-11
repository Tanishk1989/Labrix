import { JavaHttpExecutionProvider } from "./java-http-provider";
import { CppHttpExecutionProvider } from "./cpp-http-provider";
import { ServerMockExecutionProvider } from "./mock-provider";
import type { ServerExecutionProvider } from "./provider";

const mockProvider: ServerExecutionProvider = new ServerMockExecutionProvider();

export interface ExecutionProviderEnvironment {
  LABRIX_EXECUTION_PROVIDER?: string;
  LABRIX_JAVA_RUNNER_URL?: string;
  LABRIX_CPP_RUNNER_URL?: string;
}

function requireLoopbackRunnerUrl(value: string | undefined) {
  if (!value) {
    throw new Error(
      "LABRIX_JAVA_RUNNER_URL is required for the java-http provider.",
    );
  }

  const url = new URL(value);
  if (
    url.protocol !== "http:" ||
    !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)
  ) {
    throw new Error(
      "The Java runner spike must use a loopback HTTP endpoint.",
    );
  }
  return url.toString();
}

function requireCppLoopbackRunnerUrl(value: string | undefined) {
  if (!value) {
    throw new Error(
      "LABRIX_CPP_RUNNER_URL is required for the cpp-http provider.",
    );
  }

  const url = new URL(value);
  if (
    url.protocol !== "http:" ||
    !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)
  ) {
    throw new Error(
      "The C++ runner scaffold must use a loopback HTTP endpoint.",
    );
  }
  return url.toString();
}

export function getServerExecutionProvider(
  environment: ExecutionProviderEnvironment = {
    LABRIX_EXECUTION_PROVIDER: process.env.LABRIX_EXECUTION_PROVIDER,
    LABRIX_JAVA_RUNNER_URL: process.env.LABRIX_JAVA_RUNNER_URL,
    LABRIX_CPP_RUNNER_URL: process.env.LABRIX_CPP_RUNNER_URL,
  },
): ServerExecutionProvider {
  const mode = environment.LABRIX_EXECUTION_PROVIDER ?? "mock";
  if (mode === "mock") return mockProvider;
  if (mode === "java-http") {
    return new JavaHttpExecutionProvider({
      endpoint: requireLoopbackRunnerUrl(environment.LABRIX_JAVA_RUNNER_URL),
    });
  }
  if (mode === "cpp-http") {
    return new CppHttpExecutionProvider({
      endpoint: requireCppLoopbackRunnerUrl(environment.LABRIX_CPP_RUNNER_URL),
    });
  }
  throw new Error(`Unsupported LABRIX_EXECUTION_PROVIDER: ${mode}`);
}
