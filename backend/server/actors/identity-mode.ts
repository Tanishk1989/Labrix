export type IdentityMode = "demo" | "clerk";

export class IdentityConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IdentityConfigurationError";
  }
}

export function resolveIdentityMode(input: {
  mode?: string;
  nodeEnv?: string;
  allowProductionBuildDemo?: string;
}): IdentityMode {
  const mode =
    input.mode || (input.nodeEnv !== "production" ? "demo" : undefined);
  if (mode !== "demo" && mode !== "clerk") {
    throw new IdentityConfigurationError(
      "LABRIX_IDENTITY_MODE must be explicitly set to demo or clerk.",
    );
  }
  if (
    mode === "demo" &&
    input.nodeEnv === "production" &&
    input.allowProductionBuildDemo !== "true"
  ) {
    throw new IdentityConfigurationError(
      "The non-production demo identity mode is unavailable in production. " +
        "LABRIX_ALLOW_DEMO_IDENTITY_IN_PRODUCTION_BUILD=true is reserved for the supervised local professor-demo launcher.",
    );
  }
  return mode;
}

export function getIdentityMode(): IdentityMode {
  return resolveIdentityMode({
    mode: process.env.LABRIX_IDENTITY_MODE,
    nodeEnv: process.env.NODE_ENV,
    allowProductionBuildDemo:
      process.env.LABRIX_ALLOW_DEMO_IDENTITY_IN_PRODUCTION_BUILD,
  });
}
