import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { sendTeacherApprovalEmail } from "@/server/teacher-approval/notification";
import { globalRateLimiter } from "@/server/security/rate-limiter";
import { RATE_LIMIT_CONFIGS } from "@/server/security/rate-limit-configs";
import crypto from "crypto";

export const dynamic = "force-dynamic";

interface ClerkWebhookEvent {
  type: "user.created" | "user.updated" | "user.deleted";
  data: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    email_addresses?: Array<{ id: string; email_address: string }>;
    primary_email_address_id?: string | null;
    public_metadata?: { role?: "TEACHER" | "STUDENT" };
    unsafe_metadata?: { role?: "TEACHER" | "STUDENT" };
  };
}

interface PendingTeacherRequest {
  userId: string;
  name: string;
  email: string;
  requestedAt: Date;
}

async function notifyPendingTeacher(
  request: PendingTeacherRequest,
  fallbackOrigin: string,
) {
  await sendTeacherApprovalEmail(request, { fallbackOrigin });
  await prisma.user.updateMany({
    where: {
      id: request.userId,
      accountStatus: "PENDING_TEACHER_APPROVAL",
      teacherApprovalRequestedAt: request.requestedAt,
      teacherApprovalNotifiedAt: null,
    },
    data: { teacherApprovalNotifiedAt: new Date() },
  });
}

function verifyClerkWebhookSignature(
  payload: string,
  headers: Headers,
  secret: string,
): boolean {
  const svixId = headers.get("svix-id");
  const svixTimestamp = headers.get("svix-timestamp");
  const svixSignature = headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature || !secret) {
    return false;
  }

  // Prevent replay attacks (timestamp within 5 minutes)
  const timestampMs = parseInt(svixTimestamp, 10) * 1000;
  if (Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) {
    return false;
  }

  try {
    const toSign = `${svixId}.${svixTimestamp}.${payload}`;
    // Clerk uses base64-encoded secret with whsec_ prefix
    const secretKey = secret.startsWith("whsec_")
      ? Buffer.from(secret.slice(6), "base64")
      : Buffer.from(secret);

    const expectedSignature = crypto
      .createHmac("sha256", secretKey)
      .update(toSign)
      .digest("base64");

    const passedSignatures = svixSignature
      .split(" ")
      .map((part) => (part.startsWith("v1,") ? part.slice(3) : part));

    return passedSignatures.some((sig) => {
      try {
        return crypto.timingSafeEqual(
          Buffer.from(sig),
          Buffer.from(expectedSignature),
        );
      } catch {
        return false;
      }
    });
  } catch (err) {
    console.error("Clerk webhook signature verification error:", err);
    return false;
  }
}

export async function POST(req: NextRequest) {
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";
  const rl = await globalRateLimiter.check(clientIp, RATE_LIMIT_CONFIGS.WEBHOOK);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many webhook requests" },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSeconds) },
      },
    );
  }

  const rawBody = await req.text();
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("CLERK_WEBHOOK_SECRET is not configured.");
    return NextResponse.json(
      { error: "Webhook verification is unavailable." },
      { status: 503 },
    );
  }
  const isValid = verifyClerkWebhookSignature(rawBody, req.headers, webhookSecret);
  if (!isValid) {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 401 },
    );
  }

  let event: ClerkWebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const { type, data } = event;
  const clerkUserId = data.id;

  if (!clerkUserId) {
    return NextResponse.json({ error: "Missing user ID in event data" }, { status: 400 });
  }

  const primaryEmail =
    data.email_addresses?.find((e) => e.id === data.primary_email_address_id)
      ?.email_address ??
    data.email_addresses?.[0]?.email_address ??
    `${clerkUserId}@placeholder.trace`;

  const fullName = [data.first_name, data.last_name].filter(Boolean).join(" ").trim() || "TRACE User";
  const metadataRole = data.public_metadata?.role;
  // Unsafe metadata can request teacher access, but never grants it directly:
  // the local account remains blocked until the signed email link is approved.
  const requestedTeacher =
    metadataRole === "TEACHER" || data.unsafe_metadata?.role === "TEACHER";
  const assignedRole = requestedTeacher ? "TEACHER" : "STUDENT";

  try {
    switch (type) {
      case "user.created": {
        const teacherRequest = await prisma.$transaction(async (tx) => {
          const existingIdentity = await tx.externalIdentity.findUnique({
            where: {
              provider_providerSubject: {
                provider: "clerk",
                providerSubject: clerkUserId,
              },
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  accountStatus: true,
                  teacherApprovalRequestedAt: true,
                  teacherApprovalNotifiedAt: true,
                },
              },
            },
          });
          if (existingIdentity) {
            const existingUser = existingIdentity.user;
            if (
              existingUser.accountStatus === "PENDING_TEACHER_APPROVAL" &&
              existingUser.teacherApprovalRequestedAt &&
              !existingUser.teacherApprovalNotifiedAt
            ) {
              return {
                userId: existingUser.id,
                name: existingUser.name,
                email: existingUser.email,
                requestedAt: existingUser.teacherApprovalRequestedAt,
              };
            }
            return null;
          }

          const emailOwner = await tx.user.findUnique({
            where: { email: primaryEmail },
            select: { id: true },
          });
          if (emailOwner) {
            throw new Error("A TRACE account already owns this email address.");
          }

          const teacherApprovalRequestedAt =
            assignedRole === "TEACHER" ? new Date() : null;
          const user = await tx.user.create({
            data: {
              name: fullName,
              email: primaryEmail,
              platformRole: assignedRole,
              accountStatus:
                assignedRole === "TEACHER"
                  ? "PENDING_TEACHER_APPROVAL"
                  : "ACTIVE",
              teacherApprovalRequestedAt,
            },
          });

          await tx.externalIdentity.create({
            data: {
              userId: user.id,
              provider: "clerk",
              providerSubject: clerkUserId,
            },
          });

          return teacherApprovalRequestedAt
            ? {
                userId: user.id,
                name: user.name,
                email: user.email,
                requestedAt: teacherApprovalRequestedAt,
              }
            : null;
        });
        if (teacherRequest) {
          await notifyPendingTeacher(teacherRequest, req.nextUrl.origin);
        }
        return NextResponse.json({ success: true, action: "created", userId: clerkUserId });
      }

      case "user.updated": {
        const identity = await prisma.externalIdentity.findUnique({
          where: {
            provider_providerSubject: {
              provider: "clerk",
              providerSubject: clerkUserId,
            },
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                platformRole: true,
                accountStatus: true,
                teacherApprovalRequestedAt: true,
                teacherApprovalNotifiedAt: true,
              },
            },
          },
        });

        let teacherRequest: PendingTeacherRequest | null = null;
        if (identity) {
          const becameTeacher =
            requestedTeacher &&
            identity.user.platformRole !== "TEACHER";
          const teacherApprovalRequestedAt = becameTeacher ? new Date() : null;
          const updatedUser = await prisma.user.update({
            where: { id: identity.userId },
            data: {
              name: fullName,
              email: primaryEmail,
              ...(metadataRole ? { platformRole: metadataRole } : {}),
              ...(becameTeacher
                ? {
                    platformRole: "TEACHER" as const,
                    accountStatus: "PENDING_TEACHER_APPROVAL" as const,
                    teacherApprovalRequestedAt,
                    teacherApprovalNotifiedAt: null,
                    teacherApprovedAt: null,
                  }
                : {}),
              ...(metadataRole === "STUDENT" &&
              identity.user.accountStatus === "PENDING_TEACHER_APPROVAL"
                ? {
                    platformRole: "STUDENT" as const,
                    accountStatus: "ACTIVE" as const,
                    teacherApprovalRequestedAt: null,
                    teacherApprovalNotifiedAt: null,
                    teacherApprovedAt: null,
                  }
                : {}),
            },
          });

          if (teacherApprovalRequestedAt) {
            teacherRequest = {
              userId: updatedUser.id,
              name: updatedUser.name,
              email: updatedUser.email,
              requestedAt: teacherApprovalRequestedAt,
            };
          } else if (
            requestedTeacher &&
            identity.user.accountStatus === "PENDING_TEACHER_APPROVAL" &&
            identity.user.teacherApprovalRequestedAt &&
            !identity.user.teacherApprovalNotifiedAt
          ) {
            teacherRequest = {
              userId: identity.user.id,
              name: updatedUser.name,
              email: updatedUser.email,
              requestedAt: identity.user.teacherApprovalRequestedAt,
            };
          }
        }
        if (teacherRequest) {
          await notifyPendingTeacher(teacherRequest, req.nextUrl.origin);
        }
        return NextResponse.json({ success: true, action: "updated", userId: clerkUserId });
      }

      case "user.deleted": {
        const identity = await prisma.externalIdentity.findUnique({
          where: {
            provider_providerSubject: {
              provider: "clerk",
              providerSubject: clerkUserId,
            },
          },
        });

        if (identity) {
          await prisma.user.update({
            where: { id: identity.userId },
            data: { accountStatus: "DISABLED" },
          });
        }
        return NextResponse.json({ success: true, action: "disabled", userId: clerkUserId });
      }

      default:
        return NextResponse.json({ success: true, ignored: type });
    }
  } catch (error) {
    console.error(`Failed processing webhook event ${type}:`, error);
    return NextResponse.json(
      { error: "Database synchronization failed" },
      { status: 500 },
    );
  }
}
