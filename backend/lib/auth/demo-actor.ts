// Compatibility alias for existing teacher authoring actions. The resolver is
// explicitly non-production and accepts no identity value from the browser.
export { resolveDemoTeacherActor as getDemoTeacher } from "@/server/actors/demo-session";
