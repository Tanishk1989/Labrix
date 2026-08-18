export type DemoFixturePresence = {
  teacher: boolean;
  student: boolean;
  classroom: boolean;
};

export function classifyDemoFixturePresence(
  fixtures: DemoFixturePresence,
): "fresh" | "ready" | "incomplete" {
  const present = Object.values(fixtures).filter(Boolean).length;
  if (present === 0) return "fresh";
  if (present === Object.keys(fixtures).length) return "ready";
  return "incomplete";
}
