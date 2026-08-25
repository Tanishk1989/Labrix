import { describe, expect, it } from "vitest";
import { getServerExecutionProvider } from "@/server/execution";
import { CppHttpExecutionProvider } from "@/server/execution/cpp-http-provider";
import { JavaHttpExecutionProvider } from "@/server/execution/java-http-provider";

const localProviders = [
  {
    mode: "java-http",
    urlName: "LABRIX_JAVA_RUNNER_URL",
    url: "http://127.0.0.1:4010/v1/execute/java",
    provider: JavaHttpExecutionProvider,
  },
  {
    mode: "cpp-http",
    urlName: "LABRIX_CPP_RUNNER_URL",
    url: "http://127.0.0.1:4020/v1/execute/cpp",
    provider: CppHttpExecutionProvider,
  },
] as const;

describe("execution provider production safety configuration", () => {
  it("fails closed when production has no real execution provider", () => {
    expect(() => getServerExecutionProvider({ NODE_ENV: "production" })).toThrow(
      /mock execution is forbidden in production/,
    );
  });

  it.each(localProviders)(
    "rejects $mode in production without explicit acknowledgement",
    ({ mode, urlName, url }) => {
      expect(() =>
        getServerExecutionProvider({
          NODE_ENV: "production",
          LABRIX_EXECUTION_PROVIDER: mode,
          [urlName]: url,
        }),
      ).toThrow(
        /not production-ready[\s\S]*LABRIX_ALLOW_LOCAL_RUNNERS_IN_PRODUCTION/,
      );
    },
  );

  it.each(localProviders)(
    "allows $mode in production only with the exact allow flag",
    ({ mode, urlName, url, provider }) => {
      expect(
        getServerExecutionProvider({
          NODE_ENV: "production",
          LABRIX_EXECUTION_PROVIDER: mode,
          LABRIX_ALLOW_LOCAL_RUNNERS_IN_PRODUCTION: "true",
          [urlName]: url,
        }),
      ).toBeInstanceOf(provider);

      expect(() =>
        getServerExecutionProvider({
          NODE_ENV: "production",
          LABRIX_EXECUTION_PROVIDER: mode,
          LABRIX_ALLOW_LOCAL_RUNNERS_IN_PRODUCTION: "TRUE",
          [urlName]: url,
        }),
      ).toThrow(/not production-ready/);
    },
  );

  it.each(["development", "test"])(
    "allows explicit loopback local providers in %s",
    (nodeEnvironment) => {
      expect(
        getServerExecutionProvider({
          NODE_ENV: nodeEnvironment,
          LABRIX_EXECUTION_PROVIDER: "java-http",
          LABRIX_JAVA_RUNNER_URL:
            "http://localhost:4010/v1/execute/java",
        }),
      ).toBeInstanceOf(JavaHttpExecutionProvider);
      expect(
        getServerExecutionProvider({
          NODE_ENV: nodeEnvironment,
          LABRIX_EXECUTION_PROVIDER: "cpp-http",
          LABRIX_CPP_RUNNER_URL: "http://[::1]:4020/v1/execute/cpp",
        }),
      ).toBeInstanceOf(CppHttpExecutionProvider);
    },
  );

  it.each(["development", "test"])(
    "routes local-docker by the server-resolved language in %s",
    (nodeEnvironment) => {
      const environment = {
        NODE_ENV: nodeEnvironment,
        LABRIX_EXECUTION_PROVIDER: "local-docker",
        LABRIX_JAVA_RUNNER_URL: "http://127.0.0.1:4010/v1/execute/java",
        LABRIX_CPP_RUNNER_URL: "http://127.0.0.1:4020/v1/execute/cpp",
      };
      expect(getServerExecutionProvider(environment, "JAVA")).toBeInstanceOf(
        JavaHttpExecutionProvider,
      );
      expect(getServerExecutionProvider(environment, "CPP")).toBeInstanceOf(
        CppHttpExecutionProvider,
      );
      expect(() => getServerExecutionProvider(environment)).toThrow(
        /requires a server-resolved execution language/,
      );
    },
  );

  it("rejects local-docker in production without explicit acknowledgement", () => {
    expect(() => getServerExecutionProvider({
      NODE_ENV: "production",
      LABRIX_EXECUTION_PROVIDER: "local-docker",
      LABRIX_JAVA_RUNNER_URL: "http://127.0.0.1:4010/v1/execute/java",
      LABRIX_CPP_RUNNER_URL: "http://127.0.0.1:4020/v1/execute/cpp",
    }, "CPP")).toThrow(/not production-ready/);
  });

  it("allows authenticated HTTPS runners in production", () => {
    const environment = {
      NODE_ENV: "production",
      LABRIX_EXECUTION_PROVIDER: "remote-docker",
      LABRIX_JAVA_RUNNER_URL: "https://java-runner.example.test/v1/execute/java",
      LABRIX_CPP_RUNNER_URL: "https://cpp-runner.example.test/v1/execute/cpp",
      LABRIX_RUNNER_BEARER_TOKEN: "test-runner-token-at-least-32-characters",
    };
    expect(getServerExecutionProvider(environment, "JAVA")).toBeInstanceOf(
      JavaHttpExecutionProvider,
    );
    expect(getServerExecutionProvider(environment, "CPP")).toBeInstanceOf(
      CppHttpExecutionProvider,
    );
    expect(getServerExecutionProvider(environment, "JAVA").executionMode).toBe("java-docker-remote");
    expect(getServerExecutionProvider(environment, "CPP").executionMode).toBe("cpp-docker-remote");
  });

  it.each([
    { LABRIX_JAVA_RUNNER_URL: "http://java-runner.example.test/v1/execute/java" },
    { LABRIX_RUNNER_BEARER_TOKEN: "too-short" },
  ])("rejects unsafe remote runner configuration", (override) => {
    expect(() => getServerExecutionProvider({
      NODE_ENV: "production",
      LABRIX_EXECUTION_PROVIDER: "remote-docker",
      LABRIX_JAVA_RUNNER_URL: "https://java-runner.example.test/v1/execute/java",
      LABRIX_CPP_RUNNER_URL: "https://cpp-runner.example.test/v1/execute/cpp",
      LABRIX_RUNNER_BEARER_TOKEN: "test-runner-token-at-least-32-characters",
      ...override,
    }, "JAVA")).toThrow(/Invalid execution provider configuration/);
  });

  it.each([
    "not-a-url",
    "https://127.0.0.1:4010/v1/execute/java",
    "http://runner.example.com/v1/execute/java",
    "http://user:secret@127.0.0.1:4010/v1/execute/java",
  ])("rejects invalid local runner URL %s", (url) => {
    expect(() =>
      getServerExecutionProvider({
        NODE_ENV: "development",
        LABRIX_EXECUTION_PROVIDER: "java-http",
        LABRIX_JAVA_RUNNER_URL: url,
      }),
    ).toThrow(/Invalid execution provider configuration/);
  });
});
