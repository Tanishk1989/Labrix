"use client";

import { useDemoRole } from "@/components/app-shell";

export function RoleContentBridge({ teacher, student }: { teacher: React.ReactNode; student: React.ReactNode }) {
  return useDemoRole() === "student" ? student : teacher;
}
