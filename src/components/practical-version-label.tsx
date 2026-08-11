import { practicalVersionLabel } from "@/domain/practicals/versioning";

export function PracticalVersionLabel({ version }: { version: number | null }) {
  return (
    <span className="text-[10px] font-medium text-[var(--text-muted)]">
      {practicalVersionLabel(version)}
    </span>
  );
}
