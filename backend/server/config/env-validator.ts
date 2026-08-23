import "server-only";

export interface EnvValidationResult {
  isValid: boolean;
  mode: "demo" | "clerk";
  missingRequired: string[];
  warnings: string[];
  features: {
    groqAiEnabled: boolean;
    geminiAiEnabled: boolean;
    upstashRateLimiting: boolean;
    runnerConfigured: boolean;
  };
}

/**
 * Validates the runtime environment for TRACE / Labrix.
 * Enforces production security invariants while maintaining smooth development defaults.
 */
export function validateEnvironment(): EnvValidationResult {
  const configuredIdentityMode = process.env.LABRIX_IDENTITY_MODE;
  const mode = configuredIdentityMode === "clerk" ? "clerk" : "demo";
  const isProduction = process.env.NODE_ENV === "production";
  const isSupervisedLocalDemo =
    isProduction &&
    mode === "demo" &&
    process.env.LABRIX_ALLOW_DEMO_IDENTITY_IN_PRODUCTION_BUILD === "true" &&
    process.env.NEXT_PUBLIC_LABRIX_DEMO_RUNTIME === "local-real";
  const missingRequired: string[] = [];
  const warnings: string[] = [];

  // 1. Database URL
  if (!process.env.DATABASE_URL) {
    missingRequired.push("DATABASE_URL");
  }
  if (configuredIdentityMode !== "demo" && configuredIdentityMode !== "clerk") {
    if (isProduction) missingRequired.push("LABRIX_IDENTITY_MODE=clerk");
    else warnings.push("LABRIX_IDENTITY_MODE must be explicitly set to 'demo' or 'clerk'.");
  }

  // 2. Authentication Validation
  if (mode === "clerk") {
    if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      missingRequired.push("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
    }
    if (!process.env.CLERK_SECRET_KEY) {
      missingRequired.push("CLERK_SECRET_KEY");
    }
    if (!process.env.CLERK_WEBHOOK_SECRET) {
      if (isProduction) missingRequired.push("CLERK_WEBHOOK_SECRET");
      else warnings.push("CLERK_WEBHOOK_SECRET is not set. Clerk webhook requests will be rejected.");
    }
  } else if (isProduction && !isSupervisedLocalDemo) {
    missingRequired.push("LABRIX_IDENTITY_MODE=clerk");
  }

  // 3. AI Providers
  const groqAiEnabled = Boolean(process.env.GROQ_API_KEY);
  const geminiAiEnabled = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

  if (!groqAiEnabled && !geminiAiEnabled) {
    warnings.push("No AI API keys configured (GROQ_API_KEY or GEMINI_API_KEY). Running deterministic AST fallback.");
  }

  // 4. Rate Limiting
  const upstashRateLimiting = Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
  if (isProduction && !isSupervisedLocalDemo && !upstashRateLimiting) {
    if (!process.env.UPSTASH_REDIS_REST_URL) {
      missingRequired.push("UPSTASH_REDIS_REST_URL");
    }
    if (!process.env.UPSTASH_REDIS_REST_TOKEN) {
      missingRequired.push("UPSTASH_REDIS_REST_TOKEN");
    }
  }
  if (isSupervisedLocalDemo && !upstashRateLimiting) {
    warnings.push("Shared rate limiting is not configured for this supervised single-host demo.");
  }

  // 5. Runner Configuration
  const configuredExecutionProvider = process.env.LABRIX_EXECUTION_PROVIDER;
  const supportedExecutionProvider = isProduction
    ? configuredExecutionProvider === "remote-docker" ||
      (isSupervisedLocalDemo && configuredExecutionProvider === "local-docker")
    : ["local-docker", "remote-docker"].includes(configuredExecutionProvider ?? "");
  const runnerConfigured = supportedExecutionProvider &&
    Boolean(process.env.LABRIX_JAVA_RUNNER_URL) &&
    Boolean(process.env.LABRIX_CPP_RUNNER_URL) &&
    (configuredExecutionProvider !== "remote-docker" ||
      (process.env.LABRIX_RUNNER_BEARER_TOKEN?.length ?? 0) >= 32);

  if (!runnerConfigured) {
    if (isProduction) {
      for (const name of [
        "LABRIX_EXECUTION_PROVIDER",
        "LABRIX_JAVA_RUNNER_URL",
        "LABRIX_CPP_RUNNER_URL",
      ] as const) {
        if (!process.env[name]) missingRequired.push(name);
      }
      if (!supportedExecutionProvider && configuredExecutionProvider) {
        missingRequired.push("LABRIX_EXECUTION_PROVIDER=remote-docker");
      }
      if (configuredExecutionProvider === "remote-docker" &&
        (process.env.LABRIX_RUNNER_BEARER_TOKEN?.length ?? 0) < 32) {
        missingRequired.push("LABRIX_RUNNER_BEARER_TOKEN (minimum 32 characters)");
      }
    } else {
      warnings.push("Real Java and C++ execution runners are not fully configured.");
    }
  }

  return {
    isValid: missingRequired.length === 0,
    mode,
    missingRequired,
    warnings,
    features: {
      groqAiEnabled,
      geminiAiEnabled,
      upstashRateLimiting,
      runnerConfigured,
    },
  };
}
