import { describe, expect, it, vi } from "vitest";
import { getEffectiveStudentHintPermission } from "@/server/hints/permissions";

vi.mock("server-only", () => ({}));

type MockHintDb = Parameters<typeof getEffectiveStudentHintPermission>[0];

describe("getEffectiveStudentHintPermission", () => {
  it("defaults to strictly LOCKED when no policy or override exists", async () => {
    const mockDb = {
      studentHintPermission: {
        findUnique: async () => null,
      },
      classroomHintPolicy: {
        findUnique: async () => null,
      },
    } as unknown as MockHintDb;

    const result = await getEffectiveStudentHintPermission(mockDb, "class-1", "student-1");
    expect(result.allowed).toBe(false);
    expect(result.source).toBe("SYSTEM_DEFAULT");
    expect(result.classDefault).toBe(false);
    expect(result.studentOverride).toBeNull();
  });

  it("uses classroom default when no student override is set", async () => {
    const mockDb = {
      studentHintPermission: {
        findUnique: async () => null,
      },
      classroomHintPolicy: {
        findUnique: async () => ({ enabledForAll: true }),
      },
    } as unknown as MockHintDb;

    const result = await getEffectiveStudentHintPermission(mockDb, "class-1", "student-1");
    expect(result.allowed).toBe(true);
    expect(result.source).toBe("CLASSROOM_DEFAULT");
    expect(result.classDefault).toBe(true);
    expect(result.studentOverride).toBeNull();
  });

  it("student override takes strict precedence over classroom policy", async () => {
    // Case 1: Classroom enabled, but student explicitly locked
    const mockDb1 = {
      studentHintPermission: {
        findUnique: async () => ({ enabled: false }),
      },
      classroomHintPolicy: {
        findUnique: async () => ({ enabledForAll: true }),
      },
    } as unknown as MockHintDb;

    const result1 = await getEffectiveStudentHintPermission(mockDb1, "class-1", "student-1");
    expect(result1.allowed).toBe(false);
    expect(result1.source).toBe("STUDENT_OVERRIDE");
    expect(result1.studentOverride).toBe(false);

    // Case 2: Classroom locked, but student explicitly enabled
    const mockDb2 = {
      studentHintPermission: {
        findUnique: async () => ({ enabled: true }),
      },
      classroomHintPolicy: {
        findUnique: async () => ({ enabledForAll: false }),
      },
    } as unknown as MockHintDb;

    const result2 = await getEffectiveStudentHintPermission(mockDb2, "class-1", "student-2");
    expect(result2.allowed).toBe(true);
    expect(result2.source).toBe("STUDENT_OVERRIDE");
    expect(result2.studentOverride).toBe(true);
  });
});
