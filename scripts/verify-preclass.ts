import { boundedInteger } from "./club-capacity";
import { evaluateOperationalEvidence } from "./preclass-readiness";
import { evaluateRuntimeReadiness, type RuntimeDiagnostics } from "./runtime-readiness";

const baseUrl = (process.env.TRACE_BASE_URL ?? process.argv[2] ?? "").replace(/\/$/, "");
const token = process.env.TRACE_DIAGNOSTICS_TOKEN;
if (!baseUrl || !/^https?:\/\//.test(baseUrl)) {
  throw new Error("Set TRACE_BASE_URL to the deployed TRACE origin.");
}
if (!token || token.length < 32) {
  throw new Error("Set the 32+ character TRACE_DIAGNOSTICS_TOKEN used by the deployment.");
}
const minimumCapacity = boundedInteger(process.env.TRACE_CLUB_MIN_EXECUTION_CAPACITY, 8, 1, 250);

async function jsonRequest(path: string, authorization?: string) {
  const response = await fetch(new URL(path, `${baseUrl}/`), {
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
    headers: authorization ? { authorization } : undefined,
  });
  const body = await response.json().catch(() => null) as RuntimeDiagnostics | null;
  return { statusCode: response.status, body };
}

const [publicHealth, privateHealth] = await Promise.all([
  jsonRequest("/api/health"),
  jsonRequest("/api/health/details", `Bearer ${token}`),
]);
const failures = evaluateOperationalEvidence({
  backupVerifiedAt: process.env.TRACE_BACKUP_VERIFIED_AT,
  restoreDrillVerifiedAt: process.env.TRACE_RESTORE_DRILL_VERIFIED_AT,
  authenticatedSmokeVerifiedAt: process.env.TRACE_AUTHENTICATED_SMOKE_VERIFIED_AT,
});
const diagnostics = privateHealth.body;
failures.push(...evaluateRuntimeReadiness({
  publicStatusCode: publicHealth.statusCode,
  publicStatus: publicHealth.body?.status,
  privateStatusCode: privateHealth.statusCode,
  diagnostics,
  minimumCapacity,
}));

console.log(JSON.stringify({
  target: baseUrl,
  release: diagnostics?.release ?? publicHealth.body?.release ?? "unknown",
  status: failures.length ? "NO-GO" : "GO",
  diagnostics: diagnostics ? {
    database: diagnostics.database,
    runners: diagnostics.runners,
    executionQueue: diagnostics.executionQueue,
  } : null,
  operationalEvidence: {
    backupVerifiedAt: process.env.TRACE_BACKUP_VERIFIED_AT ?? null,
    restoreDrillVerifiedAt: process.env.TRACE_RESTORE_DRILL_VERIFIED_AT ?? null,
    authenticatedSmokeVerifiedAt: process.env.TRACE_AUTHENTICATED_SMOKE_VERIFIED_AT ?? null,
  },
  failures,
}, null, 2));
if (failures.length) process.exitCode = 1;
