import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { AccessDeniedError } from "@/server/authorization/classroom-access";
import { getTeacherLiveLabPulse } from "@/server/teacher/live-lab-pulse";

vi.mock("server-only", () => ({}));

const suffix = randomUUID().slice(0, 8);
const teacherId = `pulse-teacher-${suffix}`;
const otherTeacherId = `pulse-other-${suffix}`;
const studentIds = [`pulse-student-a-${suffix}`, `pulse-student-b-${suffix}`];
const classroomId = `pulse-class-${suffix}`;
const taskId = `pulse-task-${suffix}`;
const sessionId = `pulse-session-${suffix}`;
const eventId = `pulse-event-${suffix}`;
const now = new Date("2026-08-29T10:00:00.000Z");

describe.sequential("teacher Live Lab Pulse", () => {
  beforeAll(async () => {
    await prisma.user.createMany({ data: [
      { id: teacherId, name: "Pulse Teacher", email: `${teacherId}@example.test`, platformRole: "TEACHER" },
      { id: otherTeacherId, name: "Other Teacher", email: `${otherTeacherId}@example.test`, platformRole: "TEACHER" },
      { id: studentIds[0], name: "Active Student", email: `${studentIds[0]}@example.test`, platformRole: "STUDENT" },
      { id: studentIds[1], name: "Quiet Student", email: `${studentIds[1]}@example.test`, platformRole: "STUDENT" },
    ] });
    await prisma.classroom.create({
      data: {
        id: classroomId,
        name: "Pulse Lab",
        subject: "Programming",
        section: "A",
        joinCode: `PULSE-${suffix}`.toUpperCase(),
        ownerTeacherId: teacherId,
        memberships: { create: studentIds.map((userId) => ({ userId, role: "STUDENT" as const })) },
      },
    });
    await prisma.task.create({
      data: {
        id: taskId,
        classroomId,
        authorTeacherId: teacherId,
        title: "Pulse Practical",
        instructions: "Persist activity.",
        allowedLanguages: ["JAVA"],
        status: "PUBLISHED",
      },
    });
    await prisma.codingSession.create({
      data: {
        id: sessionId,
        taskId,
        studentId: studentIds[0],
        attemptNumber: 1,
        language: "JAVA",
        updatedAt: new Date("2026-08-29T09:58:00.000Z"),
      },
    });
    await prisma.codeEvent.create({
      data: {
        id: eventId,
        codingSessionId: sessionId,
        sequence: 1,
        type: "DRAFT_SAVED",
        occurredAt: new Date("2026-08-29T09:58:00.000Z"),
      },
    });
  });

  afterAll(async () => {
    await prisma.codeEvent.deleteMany({ where: { codingSessionId: sessionId } });
    await prisma.codingSession.deleteMany({ where: { id: sessionId } });
    await prisma.task.deleteMany({ where: { id: taskId } });
    await prisma.classroom.deleteMany({ where: { id: classroomId } });
    await prisma.user.deleteMany({ where: { id: { in: [teacherId, otherTeacherId, ...studentIds] } } });
  });

  it("groups active classroom members from persisted activity without returning source code", async () => {
    const pulse = await getTeacherLiveLabPulse(teacherId, classroomId, now);

    expect(pulse.counts).toMatchObject({ CODING_NOW: 1, INACTIVE: 1 });
    expect(pulse.students.find((student) => student.id === studentIds[0])).toMatchObject({
      status: "CODING_NOW",
      currentPractical: { id: taskId, title: "Pulse Practical" },
      attemptNumber: 1,
      activity: [{ id: eventId, label: "Saved code for Pulse Practical" }],
    });
    expect(JSON.stringify(pulse)).not.toContain("sourceCode");
  });

  it("rejects teachers who do not own the classroom", async () => {
    await expect(getTeacherLiveLabPulse(otherTeacherId, classroomId, now)).rejects.toBeInstanceOf(AccessDeniedError);
  });
});

