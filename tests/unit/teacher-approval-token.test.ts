import { describe, expect, it } from "vitest";
import {
  createTeacherApprovalToken,
  TEACHER_APPROVAL_TOKEN_TTL_MS,
  verifyTeacherApprovalToken,
} from "@/server/teacher-approval/approval-token";

const secret = "test-only-teacher-approval-secret-with-32-characters";
const now = Date.parse("2026-08-23T10:00:00.000Z");
const requestedAt = new Date("2026-08-23T09:30:00.000Z");

describe("teacher approval capability token", () => {
  it("round-trips the scoped user and request timestamp", () => {
    const token = createTeacherApprovalToken(
      { userId: "teacher-1", requestedAt },
      secret,
      now,
    );
    expect(verifyTeacherApprovalToken(token, secret, now)).toEqual({
      userId: "teacher-1",
      requestedAt,
      expiresAt: new Date(now + TEACHER_APPROVAL_TOKEN_TTL_MS),
    });
  });

  it("rejects tampering and expiration", () => {
    const token = createTeacherApprovalToken(
      { userId: "teacher-1", requestedAt },
      secret,
      now,
    );
    expect(verifyTeacherApprovalToken(`${token}x`, secret, now)).toBeNull();
    expect(
      verifyTeacherApprovalToken(
        token,
        secret,
        now + TEACHER_APPROVAL_TOKEN_TTL_MS + 1,
      ),
    ).toBeNull();
  });

  it("requires a high-entropy deployment secret", () => {
    expect(() =>
      createTeacherApprovalToken({ userId: "teacher-1", requestedAt }, "short"),
    ).toThrow(/at least 32 characters/);
  });
});
