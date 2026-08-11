export type VersionedPracticalContent = {
  instructions: string;
  constraints: string | null;
  allowedLanguages: readonly string[];
  cppStarterCode: string | null;
  javaStarterCode: string | null;
  deadline: Date | null;
};

function sameLanguages(left: readonly string[], right: readonly string[]) {
  return [...left].sort().join("\u0000") === [...right].sort().join("\u0000");
}

function sameInstant(left: Date | null, right: Date | null) {
  return left?.getTime() === right?.getTime();
}

export function versionedPracticalContentChanged(
  current: VersionedPracticalContent,
  requested: VersionedPracticalContent,
  testsChanged: boolean,
) {
  return (
    testsChanged ||
    current.instructions !== requested.instructions ||
    current.constraints !== requested.constraints ||
    !sameLanguages(current.allowedLanguages, requested.allowedLanguages) ||
    current.cppStarterCode !== requested.cppStarterCode ||
    current.javaStarterCode !== requested.javaStarterCode ||
    !sameInstant(current.deadline, requested.deadline)
  );
}

export function nextPracticalVersion({
  currentVersion,
  isPublished,
  contentChanged,
}: {
  currentVersion: number | null;
  isPublished: boolean;
  contentChanged: boolean;
}) {
  if (currentVersion === null) return 1;
  return isPublished && contentChanged ? currentVersion + 1 : currentVersion;
}

export function practicalVersionLabel(version: number | null) {
  return version === null
    ? "Version unavailable"
    : `Submitted against version ${version}`;
}

export function practicalVersionForSubmission(taskVersion: number) {
  if (!Number.isInteger(taskVersion) || taskVersion < 1) {
    throw new Error("Practical version must be a positive integer.");
  }
  return taskVersion;
}
