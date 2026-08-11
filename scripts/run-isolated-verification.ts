import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import {
  configuredDevelopmentDatabaseUrl,
  verificationValue,
} from "./verification-env";
import {
  requireDisposableTestDatabase,
  VerificationSafetyError,
} from "./verification-safety";

const target = process.argv[2];
if (
  target !== "prepare" &&
  target !== "integration" &&
  target !== "e2e" &&
  target !== "read-only"
) {
  console.error("Verification target must be prepare, integration, e2e, or read-only.");
  process.exit(1);
}

const forwardedArguments = process.argv.slice(3);
let commandArguments: string[];
let childEnvironment = { ...process.env };

if (target === "read-only") {
  childEnvironment = {
    ...childEnvironment,
    LABRIX_E2E_READ_ONLY: "true",
    LABRIX_IDENTITY_MODE: "demo",
  };
  commandArguments = [
    resolve(process.cwd(), "node_modules/@playwright/test/cli.js"),
    "test",
    "tests/e2e/read-only-routes.spec.ts",
    ...forwardedArguments,
  ];
} else {
  try {
    const testDatabaseUrl = requireDisposableTestDatabase({
      allowMutation: verificationValue("LABRIX_ALLOW_TEST_DATABASE_MUTATION"),
      testDatabaseUrl: verificationValue("LABRIX_TEST_DATABASE_URL"),
      configuredDatabaseUrl: configuredDevelopmentDatabaseUrl(),
    });
    childEnvironment = {
      ...childEnvironment,
      DATABASE_URL: testDatabaseUrl,
      LABRIX_TEST_DATABASE_URL: testDatabaseUrl,
      LABRIX_ALLOW_TEST_DATABASE_MUTATION: "true",
    };
    if (target === "e2e") {
      childEnvironment.LABRIX_E2E_ISOLATED = "true";
      childEnvironment.LABRIX_IDENTITY_MODE = "demo";
    }
  } catch (error) {
    console.error(
      error instanceof VerificationSafetyError
        ? error.message
        : "Verification safety check failed.",
    );
    process.exit(1);
  }

  commandArguments = target === "prepare"
    ? [
        resolve(process.cwd(), "node_modules/prisma/build/index.js"),
        "migrate",
        "deploy",
        ...forwardedArguments,
      ]
    : target === "integration"
      ? [
          resolve(process.cwd(), "node_modules/vitest/vitest.mjs"),
          "run",
          "--config",
          "vitest.integration.config.ts",
          ...forwardedArguments,
        ]
      : [
          resolve(process.cwd(), "node_modules/@playwright/test/cli.js"),
          "test",
          ...forwardedArguments,
        ];
}

function run(arguments_: string[]) {
  return spawnSync(process.execPath, arguments_, {
    stdio: "inherit",
    env: childEnvironment,
  }).status ?? 1;
}

const status = run(commandArguments);
if (status !== 0 || target !== "prepare") process.exit(status);

const seedStatus = run([
  resolve(process.cwd(), "node_modules/tsx/dist/cli.mjs"),
  resolve(process.cwd(), "prisma/seed.ts"),
]);
process.exit(seedStatus);
