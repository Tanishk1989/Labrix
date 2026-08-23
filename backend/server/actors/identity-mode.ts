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
  const mode = input.mode;
  if (mode === "clerk") {
    return "clerk";
  }
  if (mode === "demo") {
    if (
      input.nodeEnv === "production" &&
      input.allowProductionBuildDemo !== "true" &&
      process.env.NEXT_PHASE !== "phase-production-build"
    ) {
      throw new IdentityConfigurationError(
        "Demo identity mode is forbidden in production unless explicitly allowed.",
      );
    }
    return "demo";
  }
  return "clerk";
}

export function getIdentityMode(): IdentityMode {
  return resolveIdentityMode({
    mode: process.env.LABRIX_IDENTITY_MODE,
    nodeEnv: process.env.NODE_ENV,
    allowProductionBuildDemo:
      process.env.LABRIX_ALLOW_DEMO_IDENTITY_IN_PRODUCTION_BUILD ?? "false",
  });
}
