export type ExecutionMode =
  | "simulated"
  | "java-docker-local"
  | "cpp-docker-local"
  | "java-docker-remote"
  | "cpp-docker-remote";

export type ExecutionModeDisclosure = ExecutionMode | "unavailable";

const executionModeLabels: Record<ExecutionModeDisclosure, string> = {
  simulated: "Simulated execution",
  "java-docker-local": "Java Docker runner",
  "cpp-docker-local": "C++ Docker runner",
  "java-docker-remote": "Java cloud runner",
  "cpp-docker-remote": "C++ cloud runner",
  unavailable: "Execution mode unavailable",
};

export function executionModeLabel(mode: ExecutionModeDisclosure) {
  return executionModeLabels[mode];
}

/** Null remains the honest disclosure for snapshots created before mode storage. */
export function executionModeFromPersistedSnapshot(
  mode: ExecutionMode | null | undefined,
): ExecutionModeDisclosure {
  return mode ?? "unavailable";
}
