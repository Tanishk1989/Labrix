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
    input.mode || (input.nodeEnv !== "production" ? "demo" : "demo");
  if (mode === "clerk") {
    return "clerk";
  }
  return "demo";
}

export function getIdentityMode(): IdentityMode {
  return resolveIdentityMode({
    mode: process.env.LABRIX_IDENTITY_MODE,
    nodeEnv: process.env.NODE_ENV,
    allowProductionBuildDemo:
      process.env.LABRIX_ALLOW_DEMO_IDENTITY_IN_PRODUCTION_BUILD,
  });
}
