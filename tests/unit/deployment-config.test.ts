import { describe, expect, it } from "vitest";
import {
  DeploymentConfigurationError,
  validateDeploymentEnvironment,
  type DeploymentEnvironment,
} from "@/server/config/deployment";

const productionEnvironment: DeploymentEnvironment = {
  NODE_ENV: "production",
  DATABASE_URL: "postgresql://app:secret@database.internal:5432/labrix",
  LABRIX_IDENTITY_MODE: "clerk",
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "configured-publishable-key",
  CLERK_SECRET_KEY: "configured-secret-key",
  LABRIX_EXECUTION_PROVIDER: "mock",
};

describe("deployment environment validation", () => {
  it("accepts an explicit production Clerk and mock configuration", () => {
    expect(validateDeploymentEnvironment(productionEnvironment)).toEqual({
      identityMode: "clerk",
      executionMode: "simulated",
    });
  });

  it("rejects demo identity mode in production", () => {
    expect(() =>
      validateDeploymentEnvironment({
        ...productionEnvironment,
        LABRIX_IDENTITY_MODE: "demo",
      }),
    ).toThrow(/demo identity mode is unavailable in production/);
  });

  it.each([
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    "CLERK_SECRET_KEY",
  ] as const)("requires %s in Clerk mode", (name) => {
    expect(() =>
      validateDeploymentEnvironment({
        ...productionEnvironment,
        [name]: "",
      }),
    ).toThrow(`${name} is required`);
  });

  it("requires a valid PostgreSQL database URL without echoing its value", () => {
    const secretValue = "not-a-url-with-secret-data";
    try {
      validateDeploymentEnvironment({
        ...productionEnvironment,
        DATABASE_URL: secretValue,
      });
      throw new Error("Expected deployment validation to fail.");
    } catch (error) {
      expect(error).toBeInstanceOf(DeploymentConfigurationError);
      expect((error as Error).message).toContain("DATABASE_URL");
      expect((error as Error).message).not.toContain(secretValue);
    }
  });

  it("rejects test database mutation allowance in production", () => {
    expect(() =>
      validateDeploymentEnvironment({
        ...productionEnvironment,
        LABRIX_ALLOW_TEST_DATABASE_MUTATION: "true",
      }),
    ).toThrow(/must not be enabled in production/);
  });

  it("keeps explicit demo mode available outside production", () => {
    expect(
      validateDeploymentEnvironment({
        NODE_ENV: "development",
        DATABASE_URL: "postgresql://app:secret@127.0.0.1:5432/labrix",
        LABRIX_IDENTITY_MODE: "demo",
      }),
    ).toEqual({ identityMode: "demo", executionMode: "simulated" });
  });
});
