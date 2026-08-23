import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    settings: {
      next: { rootDir: "frontend/" },
    },
    rules: {
      // Existing hydration/recovery effects intentionally restore browser-only
      // state after mount. Keep the rule advisory while those flows are
      // incrementally moved to lazy initializers.
      "react-hooks/set-state-in-effect": "off",
      // Legacy verification and test doubles still contain narrow `any` casts.
      // Surface them without blocking production builds.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "**/.next/**",
    "frontend/.next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
