import { StatusBadge } from "@/components/design-system";
import {
  submissionTimingLabel,
  type SubmissionTimingStatus,
} from "@/domain/submissions/deadline-policy";

export function SubmissionTimingBadge({
  status,
}: {
  status: SubmissionTimingStatus | null;
}) {
  return (
    <StatusBadge
      tone={status === "ON_TIME" ? "success" : status === "LATE" ? "warning" : "neutral"}
    >
      {submissionTimingLabel(status)}
    </StatusBadge>
  );
}
