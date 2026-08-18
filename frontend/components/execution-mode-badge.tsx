import {
  executionModeLabel,
  type ExecutionModeDisclosure,
} from "@/domain/execution/execution-mode";

export function ExecutionModeBadge({
  mode,
}: {
  mode: ExecutionModeDisclosure;
}) {
  return (
    <span className="status-badge status-neutral">
      {executionModeLabel(mode)}
    </span>
  );
}
