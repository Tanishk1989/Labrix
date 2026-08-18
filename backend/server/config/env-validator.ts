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
  const mode = (process.env.LABRIX_IDENTITY_MODE === "clerk" ? "clerk" : "demo") as "demo" | "clerk";
  const isProduction = process.env.NODE_ENV === "production";
  const missingRequired: string[] = [];
  const warnings: string[] = [];

  // 1. Database URL
  if (!process.env.DATABASE_URL) {
    missingRequired.push("DATABASE_URL");
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
      warnings.push("CLERK_WEBHOOK_SECRET is not set. User sync via webhook will be disabled.");
    }
  } else if (isProduction && !process.env.LABRIX_ALLOW_DEMO_IDENTITY_IN_PRODUCTION_BUILD) {
    warnings.push(
      "LABRIX_IDENTITY_MODE is 'demo' in a production environment. Switch to 'clerk' for real user security.",
    );
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

  // 5. Runner Configuration
  const runnerConfigured =
    process.env.LABRIX_EXECUTION_PROVIDER === "sandbox" ||
    process.env.LABRIX_EXECUTION_PROVIDER === "local-docker";

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
