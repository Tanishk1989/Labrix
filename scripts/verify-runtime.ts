import { boundedInteger } from "./club-capacity";
import { evaluateRuntimeReadiness, type RuntimeDiagnostics } from "./runtime-readiness";

const baseUrl = (process.env.TRACE_BASE_URL ?? process.argv[2] ?? "").replace(/\/$/, "");
const token = process.env.TRACE_DIAGNOSTICS_TOKEN;
if (!baseUrl || !/^https?:\/\//.test(baseUrl)) throw new Error("Set TRACE_BASE_URL.");
if (!token || token.length < 32) throw new Error("Set TRACE_DIAGNOSTICS_TOKEN (32+ characters).");
const minimumCapacity = boundedInteger(process.env.TRACE_CLUB_MIN_EXECUTION_CAPACITY, 8, 1, 250);

async function read(path: string, authenticated = false) {
  const response = await fetch(new URL(path, `${baseUrl}/`), {
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
    headers: authenticated ? { authorization: `Bearer ${token}` } : undefined,
  });
  return {
    statusCode: response.status,
    body: await response.json().catch(() => null) as RuntimeDiagnostics | null,
  };
}

const [publicHealth, privateHealth] = await Promise.all([
  read("/api/health"),
  read("/api/health/details", true),
]);
const failures = evaluateRuntimeReadiness({
  publicStatusCode: publicHealth.statusCode,
  publicStatus: publicHealth.body?.status,
  privateStatusCode: privateHealth.statusCode,
  diagnostics: privateHealth.body,
  minimumCapacity,
});
console.log(JSON.stringify({
  target: baseUrl,
  release: privateHealth.body?.release ?? publicHealth.body?.release ?? "unknown",
  status: failures.length ? "UNHEALTHY" : "HEALTHY",
  diagnostics: privateHealth.body,
  failures,
}, null, 2));
if (failures.length) process.exitCode = 1;
