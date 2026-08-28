import { createHmac, randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db/prisma";

vi.mock("server-only", () => ({}));

const { POST } = await import("@/app/api/webhooks/clerk/route");
const suffix = randomUUID().slice(0, 8);
const secret = `whsec_${Buffer.from(`webhook-${suffix}`).toString("base64")}`;
const studentSubject = `clerk-student-${suffix}`;
const teacherSubject = `clerk-teacher-${suffix}`;
const studentEmail = `${studentSubject}@example.test`;
const teacherEmail = `${teacherSubject}@example.test`;

function requestFor(data: Record<string, unknown>) {
  const body = JSON.stringify({ type: "user.created", data });
  const id = `msg-${randomUUID()}`;
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = createHmac("sha256", Buffer.from(secret.slice(6), "base64"))
    .update(`${id}.${timestamp}.${body}`)
    .digest("base64");
  return new NextRequest("http://127.0.0.1/api/webhooks/clerk", {
    method: "POST",
    body,
    headers: {
      "content-type": "application/json",
      "svix-id": id,
      "svix-timestamp": timestamp,
      "svix-signature": `v1,${signature}`,
      "x-forwarded-for": "127.0.0.42",
    },
  });
}

describe.sequential("Clerk webhook provisioning", () => {
  beforeAll(() => vi.stubEnv("CLERK_WEBHOOK_SECRET", secret));

  afterAll(async () => {
    await prisma.externalIdentity.deleteMany({
      where: { providerSubject: { in: [studentSubject, teacherSubject] } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [studentEmail, teacherEmail] } },
    });
    vi.unstubAllEnvs();
    await prisma.$disconnect();
  });

  it("keeps a new student unlinked until authenticated role setup", async () => {
    const response = await POST(requestFor({
      id: studentSubject,
      first_name: "New",
      last_name: "Student",
      primary_email_address_id: "email-student",
      email_addresses: [{ id: "email-student", email_address: studentEmail }],
      public_metadata: { role: "STUDENT" },
    }));

    await expect(response.json()).resolves.toMatchObject({
      success: true,
      action: "awaiting_role_onboarding",
    });
    await expect(prisma.externalIdentity.findFirst({
      where: { provider: "clerk", providerSubject: studentSubject },
    })).resolves.toBeNull();
    await expect(prisma.user.findUnique({ where: { email: studentEmail } })).resolves.toBeNull();
  });

  it("does not let webhook metadata provision a teacher", async () => {
    const response = await POST(requestFor({
      id: teacherSubject,
      first_name: "New",
      last_name: "Teacher",
      primary_email_address_id: "email-teacher",
      email_addresses: [{ id: "email-teacher", email_address: teacherEmail }],
      public_metadata: { role: "TEACHER" },
    }));

    await expect(response.json()).resolves.toMatchObject({
      success: true,
      action: "awaiting_role_onboarding",
    });
    await expect(prisma.externalIdentity.findFirst({
      where: { provider: "clerk", providerSubject: teacherSubject },
    })).resolves.toBeNull();
  });
});
