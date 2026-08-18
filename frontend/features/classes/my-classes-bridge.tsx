"use client";

import { useDemoRole } from "@/components/app-shell";

export function MyClassesBridge({ teacherContent, studentContent }: { teacherContent: React.ReactNode; studentContent: React.ReactNode }) {
  return useDemoRole() === "student" ? studentContent : teacherContent;
}
