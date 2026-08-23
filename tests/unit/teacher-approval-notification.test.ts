import { afterEach, describe, expect, it, vi } from "vitest";
import { sendTeacherApprovalEmail } from "@/server/teacher-approval/notification";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("teacher approval email notification", () => {
  it("sends one idempotent Resend request to the configured administrator", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("TEACHER_APPROVAL_EMAIL", "admin@example.edu");
    vi.stubEnv("TEACHER_APPROVAL_FROM_EMAIL", "TRACE <approvals@example.edu>");
    vi.stubEnv("TEACHER_APPROVAL_SECRET", "test-only-teacher-approval-secret-with-32-characters");
    vi.stubEnv("LABRIX_APP_URL", "https://trace.example.edu");
    const fetchImplementation = vi.fn<typeof fetch>(
      async () => new Response(null, { status: 200 }),
    );
    const requestedAt = new Date("2026-08-23T09:30:00.000Z");

    await sendTeacherApprovalEmail(
      {
        userId: "teacher-1",
        name: "A Teacher <unsafe>",
        email: "teacher@example.edu",
        requestedAt,
      },
      { fetchImplementation },
    );

    expect(fetchImplementation).toHaveBeenCalledOnce();
    const [url, options] = fetchImplementation.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(options?.headers).toMatchObject({
      Authorization: "Bearer re_test_key",
      "Idempotency-Key": `teacher-approval/teacher-1/${requestedAt.getTime()}`,
    });
    const body = JSON.parse(String(options?.body));
    expect(body.to).toEqual(["admin@example.edu"]);
    expect(body.text).toContain("teacher@example.edu");
    expect(body.html).toContain("A Teacher &lt;unsafe&gt;");
    expect(body.html).toContain("https://trace.example.edu/teacher-approvals/");
  });

  it("fails closed when delivery credentials are absent", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("TEACHER_APPROVAL_EMAIL", "admin@example.edu");
    vi.stubEnv("TEACHER_APPROVAL_FROM_EMAIL", "TRACE <approvals@example.edu>");
    vi.stubEnv("TEACHER_APPROVAL_SECRET", "test-only-teacher-approval-secret-with-32-characters");
    await expect(
      sendTeacherApprovalEmail(
        {
          userId: "teacher-1",
          name: "Teacher",
          email: "teacher@example.edu",
          requestedAt: new Date(),
        },
        { fallbackOrigin: "http://127.0.0.1:3000" },
      ),
    ).rejects.toThrow(/RESEND_API_KEY/);
  });
});
