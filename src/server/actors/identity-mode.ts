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
}): IdentityMode {
  if (input.mode !== "demo" && input.mode !== "clerk") {
    throw new IdentityConfigurationError(
      "LABRIX_IDENTITY_MODE must be explicitly set to demo or clerk.",
    );
  }
  if (input.mode === "demo" && input.nodeEnv === "production") {
    throw new IdentityConfigurationError(
      "The non-production demo identity mode is unavailable in production.",
    );
  }
  return input.mode;
}

export function getIdentityMode(): IdentityMode {
  return resolveIdentityMode({
    mode: process.env.LABRIX_IDENTITY_MODE,
    nodeEnv: process.env.NODE_ENV,
  });
}
