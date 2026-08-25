const CURATED_DEMO_CLASSROOM_ID = "dsa-2026";

export function curatedDemoClassroomId(actorId: string) {
  if (process.env.LABRIX_IDENTITY_MODE !== "demo") return undefined;
  if (actorId !== "demo-teacher" && actorId !== "demo-student-1") return undefined;
  return CURATED_DEMO_CLASSROOM_ID;
}
