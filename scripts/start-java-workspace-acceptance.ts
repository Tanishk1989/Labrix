import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { JAVA_RUNNER_IMAGE } from "../backend/runner/java/docker-executor";
import {
  configuredDevelopmentDatabaseUrl,
  verificationValue,
} from "./verification-env";
import {
  requireDisposableTestDatabase,
} from "./verification-safety";

const runnerUrl = "http://127.0.0.1:4010";
const runnerHealthUrl = `${runnerUrl}/healthz`;
const runnerExecutionUrl = `${runnerUrl}/v1/execute/java`;

function requireDocker() {
  const daemon = spawnSync("docker", ["info"], { stdio: "ignore" });
  if (daemon.status !== 0) {
    throw new Error("Docker is required and its daemon must be reachable.");
  }
  const image = spawnSync("docker", ["image", "inspect", JAVA_RUNNER_IMAGE], {
    stdio: "ignore",
  });
  if (image.status !== 0) {
    throw new Error(
      "The pinned Java runner image is missing. Run npm run runner:java:pull first.",
    );
  }
}

function runnerEnvironment() {
  const environment: NodeJS.ProcessEnv = { NODE_ENV: "development" };
  const allowedNames = [
    "APPDATA",
    "ComSpec",
    "DOCKER_CERT_PATH",
    "DOCKER_CONFIG",
    "DOCKER_HOST",
    "DOCKER_TLS_VERIFY",
    "HOME",
    "LOCALAPPDATA",
    "NO_PROXY",
    "PATH",
    "PATHEXT",
    "SystemRoot",
    "TEMP",
    "TMP",
    "TMPDIR",
    "USERPROFILE",
    "WINDIR",
    "XDG_RUNTIME_DIR",
  ];
  for (const name of allowedNames) {
    if (process.env[name] !== undefined) environment[name] = process.env[name];
  }
  return environment;
}

async function runnerIsHealthy() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 500);
  try {
    const response = await fetch(runnerHealthUrl, {
      cache: "no-store",
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function waitForRunner(runner: ChildProcess) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (runner.exitCode !== null) {
      throw new Error("The local Java runner exited before becoming healthy.");
    }
    if (await runnerIsHealthy()) return;
    await delay(100);
  }
  throw new Error("The local Java runner did not become healthy in time.");
}

async function main() {
  const testDatabaseUrl = requireDisposableTestDatabase({
    allowMutation: verificationValue("LABRIX_ALLOW_TEST_DATABASE_MUTATION"),
    testDatabaseUrl: verificationValue("LABRIX_TEST_DATABASE_URL"),
    configuredDatabaseUrl: configuredDevelopmentDatabaseUrl(),
  });
  requireDocker();
  if (await runnerIsHealthy()) {
    throw new Error(
      "Port 4010 already has a healthy runner. Stop it before using the supervised acceptance launcher.",
    );
  }

  const runner = spawn(
    process.execPath,
    [
      resolve(process.cwd(), "node_modules/tsx/dist/cli.mjs"),
      resolve(process.cwd(), "backend/runner/java/server.ts"),
    ],
    { env: runnerEnvironment(), stdio: "inherit" },
  );
  try {
    await waitForRunner(runner);
  } catch (error) {
    if (runner.exitCode === null) runner.kill();
    throw error;
  }

  const applicationEnvironment = {
    ...process.env,
    DATABASE_URL: testDatabaseUrl,
    LABRIX_ALLOW_TEST_DATABASE_MUTATION: "true",
    LABRIX_EXECUTION_PROVIDER: "java-http",
    LABRIX_IDENTITY_MODE: "demo",
    LABRIX_JAVA_RUNNER_URL: runnerExecutionUrl,
    LABRIX_TEST_DATABASE_URL: testDatabaseUrl,
  };
  const next = spawn(
    process.execPath,
    [
      resolve(process.cwd(), "node_modules/next/dist/bin/next"),
      "dev",
      "frontend",
      "--hostname",
      "127.0.0.1",
      "--port",
      "3000",
    ],
    { env: applicationEnvironment, stdio: "inherit" },
  );

  console.log(
    "Java workspace acceptance is using the confirmed disposable database.",
  );
  console.log("Open http://127.0.0.1:3000/tasks/two-sum and use Run/Submit.");
  console.log("Press Ctrl+C to stop both Next.js and the Java runner.");

  let stopping = false;
  const stop = (exitCode: number) => {
    if (stopping) return;
    stopping = true;
    process.exitCode = exitCode;
    if (runner.exitCode === null) runner.kill();
    if (next.exitCode === null) next.kill();
  };
  process.once("SIGINT", () => stop(0));
  process.once("SIGTERM", () => stop(0));
  runner.once("exit", (code) => {
    if (!stopping) {
      console.error("The Java runner stopped; shutting down acceptance.");
      stop(code ?? 1);
    }
  });
  next.once("exit", (code) => {
    if (!stopping) {
      console.error("Next.js stopped; shutting down acceptance.");
      stop(code ?? 1);
    }
  });
}

main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Java workspace acceptance could not start.",
  );
  process.exitCode = 1;
});
