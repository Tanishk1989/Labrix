import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.com https://cdn.jsdelivr.net https://clerk.trace-seven-alpha.vercel.app https://challenges.cloudflare.com https://*.protect.clerk.com;
  worker-src 'self' blob:;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' data: https://fonts.gstatic.com;
  img-src 'self' data: blob: https://img.clerk.com https://images.clerk.dev;
  connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://cdn.jsdelivr.net https://clerk.trace-seven-alpha.vercel.app https://*.protect.clerk.com:* https://api.groq.com https://generativelanguage.googleapis.com;
  frame-ancestors 'self';
  frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com https://*.protect.clerk.com;
  form-action 'self' https://*.clerk.accounts.dev https://*.clerk.com https://accounts.google.com https://github.com;
  base-uri 'self';
`.replace(/\s{2,}/g, ' ').trim();

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: cspHeader,
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  distDir: process.env.VERCEL ? "../.next" : ".next",
  allowedDevOrigins: ["127.0.0.1"],
  output: process.env.NEXT_OUTPUT_STANDALONE === "true" ? "standalone" : undefined,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/__clerk/npm/:path*",
        destination: "https://cdn.jsdelivr.net/npm/:path*",
      },
    ];
  },
};

export default nextConfig;

