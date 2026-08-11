export type ExecutionMode =
  | "simulated"
  | "java-docker-local"
  | "cpp-runner-scaffold";

export type ExecutionModeDisclosure = ExecutionMode | "unavailable";

const executionModeLabels: Record<ExecutionModeDisclosure, string> = {
  simulated: "Simulated execution",
  "java-docker-local": "Java Docker runner",
  "cpp-runner-scaffold": "C++ runner scaffold",
  unavailable: "Execution mode unavailable",
};

export function executionModeLabel(mode: ExecutionModeDisclosure) {
  return executionModeLabels[mode];
}

/** ResultSnapshot does not persist provider identity, so reloads cannot infer it. */
export function executionModeFromPersistedSnapshot() {
  return "unavailable" as const;
}
