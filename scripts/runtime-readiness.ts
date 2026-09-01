export type RuntimeDiagnostics = {
  status?: string;
  release?: string;
  database?: { status?: string; latencyMs?: number };
  runners?: Record<"java" | "cpp", { status?: string; latencyMs?: number }>;
  executionQueue?: {
    queued?: number;
    running?: number;
    failed?: number;
    failedLastHour?: number;
    oldestQueuedAgeMs?: number;
    workersOnline?: number;
    capacity?: number;
  };
};

export function evaluateRuntimeReadiness(input: {
  publicStatusCode: number;
  publicStatus?: string;
  privateStatusCode: number;
  diagnostics: RuntimeDiagnostics | null;
  minimumCapacity: number;
}) {
  const failures: string[] = [];
  const diagnostics = input.diagnostics;
  const queue = diagnostics?.executionQueue;
  if (input.publicStatusCode !== 200 || input.publicStatus !== "healthy") {
    failures.push("Public liveness health check is not healthy.");
  }
  if (input.privateStatusCode !== 200 || diagnostics?.status !== "healthy") {
    failures.push("Authenticated runtime diagnostics are not healthy.");
  }
  if (diagnostics?.database?.status !== "connected") failures.push("Database is not connected.");
  if (diagnostics?.runners?.java.status !== "connected") failures.push("Java runner is not connected.");
  if (diagnostics?.runners?.cpp.status !== "connected") failures.push("C++ runner is not connected.");
  if ((queue?.workersOnline ?? 0) < 1) failures.push("No execution worker heartbeat is online.");
  if ((queue?.capacity ?? 0) < input.minimumCapacity) {
    failures.push(`Execution capacity ${queue?.capacity ?? 0} is below the required ${input.minimumCapacity}.`);
  }
  const recentFailures = queue?.failedLastHour ?? queue?.failed ?? 0;
  if (recentFailures > 0) failures.push(`${recentFailures} execution jobs failed in the last hour.`);
  if ((queue?.oldestQueuedAgeMs ?? 0) > 45_000) failures.push("The oldest queued job has waited more than 45 seconds.");
  return failures;
}
