export type ExecutionMode = "simulated" | "java-docker-local";

export type ExecutionModeDisclosure = ExecutionMode | "unavailable";

const executionModeLabels: Record<ExecutionModeDisclosure, string> = {
  simulated: "Simulated execution",
  "java-docker-local": "Java Docker runner",
  unavailable: "Execution mode unavailable",
};

export function executionModeLabel(mode: ExecutionModeDisclosure) {
  return executionModeLabels[mode];
}

/** ResultSnapshot does not persist provider identity, so reloads cannot infer it. */
export function executionModeFromPersistedSnapshot() {
  return "unavailable" as const;
}
