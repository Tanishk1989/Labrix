import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { CPP_RUNNER_IMAGE } from "../backend/runner/cpp/docker-executor";
import { JAVA_RUNNER_IMAGE } from "../backend/runner/java/docker-executor";

const services = [
  {
    name: "Java runner",
    healthUrl: "http://127.0.0.1:4010/healthz",
    executionUrl: "http://127.0.0.1:4010/v1/execute/java",
    entrypoint: "backend/runner/java/server.ts",
    image: JAVA_RUNNER_IMAGE,
  },
  {
    name: "C++ runner",
    healthUrl: "http://127.0.0.1:4020/healthz",
    executionUrl: "http://127.0.0.1:4020/v1/execute/cpp",
    entrypoint: "backend/runner/cpp/server.ts",
    image: CPP_RUNNER_IMAGE,
  },
] as const;

function requireDocker() {
  const daemon = spawnSync("docker", ["info"], { stdio: "ignore" });
  if (daemon.status !== 0) {
    throw new Error("Docker Desktop must be running before starting the real-execution demo.");
  }
  for (const service of services) {
    const image = spawnSync("docker", ["image", "inspect", service.image], {
      stdio: "ignore",
    });
    if (image.status !== 0) {
      throw new Error(
        `${service.name} image is missing. Run the matching npm run runner:*:pull command first.`,
      );
    }
  }
}

function restrictedRunnerEnvironment() {
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

function professorDemoEnvironment(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    LABRIX_EXECUTION_PROVIDER: "local-docker",
    LABRIX_IDENTITY_MODE: "demo",
    LABRIX_JAVA_RUNNER_URL: services[0].executionUrl,
    LABRIX_CPP_RUNNER_URL: services[1].executionUrl,
    LABRIX_ALLOW_LOCAL_RUNNERS_IN_PRODUCTION: "true",
    LABRIX_ALLOW_DEMO_IDENTITY_IN_PRODUCTION_BUILD: "true",
    NEXT_PUBLIC_LABRIX_DEMO_RUNTIME: "local-real",
  };
}

function runPreparation(name: string, command: string, args: string[], env: NodeJS.ProcessEnv) {
  console.log(`Preparing professor demo: ${name}...`);
  const result = spawnSync(command, args, { env, stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`Professor demo preparation failed during ${name}.`);
  }
}

async function isHealthy(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 750);
  try {
    const response = await fetch(url, { cache: "no-store", signal: controller.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function waitForHealth(
  service: (typeof services)[number],
  process: ChildProcess,
) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (process.exitCode !== null) {
      throw new Error(`${service.name} exited before becoming healthy.`);
    }
    if (await isHealthy(service.healthUrl)) return;
    await delay(150);
  }
  throw new Error(`${service.name} did not become healthy in time.`);
}

async function main() {
  requireDocker();
  for (const service of services) {
    if (await isHealthy(service.healthUrl)) {
      throw new Error(`${service.name} is already using its configured port. Stop it before starting demo:real.`);
    }
  }

  const tsxCli = resolve(process.cwd(), "node_modules/tsx/dist/cli.mjs");
  const nextCli = resolve(process.cwd(), "node_modules/next/dist/bin/next");
  const appEnvironment = professorDemoEnvironment();

  runPreparation(
    "database readiness check",
    process.execPath,
    [tsxCli, resolve(process.cwd(), "scripts/demo-check.ts")],
    appEnvironment,
  );
  runPreparation(
    "optimized Next.js build",
    process.execPath,
    [nextCli, "build", "frontend"],
    appEnvironment,
  );

  const runners = services.map((service) => spawn(
    process.execPath,
    [tsxCli, resolve(process.cwd(), service.entrypoint)],
    { env: restrictedRunnerEnvironment(), stdio: "inherit" },
  ));

  try {
    await Promise.all(services.map((service, index) => waitForHealth(service, runners[index])));
  } catch (error) {
    for (const runner of runners) if (runner.exitCode === null) runner.kill();
    throw error;
  }

  const next = spawn(
    process.execPath,
    [nextCli, "start", "frontend", "--hostname", "127.0.0.1"],
    {
      env: appEnvironment,
      stdio: "inherit",
    },
  );

  console.log("TRACE professor demo is starting at http://127.0.0.1:3000 from an optimized production build.");
  console.log("C++ and Java requests are routed to separate isolated Docker workers; mock execution is disabled.");
  console.log("This remains a supervised local demonstration, not a production execution service.");

  let stopping = false;
  const stop = (exitCode: number) => {
    if (stopping) return;
    stopping = true;
    process.exitCode = exitCode;
    if (next.exitCode === null) next.kill();
    for (const runner of runners) if (runner.exitCode === null) runner.kill();
  };
  process.once("SIGINT", () => stop(0));
  process.once("SIGTERM", () => stop(0));
  next.once("exit", (code) => {
    if (!stopping) stop(code ?? 1);
  });
  runners.forEach((runner, index) => runner.once("exit", (code) => {
    if (!stopping) {
      console.error(`${services[index].name} stopped; shutting down the demo.`);
      stop(code ?? 1);
    }
  }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "The real-execution demo could not start.");
  process.exitCode = 1;
});
