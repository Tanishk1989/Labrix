import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { globalRateLimiter } from "@/server/security/rate-limiter";
import { RATE_LIMIT_CONFIGS } from "@/server/security/rate-limit-configs";
import {
  clerkUserDataSchema,
  clerkWebhookEnvelopeSchema,
  getClerkAssignedRole,
  isClerkUserEventType,
  verifyClerkWebhookSignature,
} from "@/server/onboarding/clerk-webhook";
import { logEvent } from "@/server/observability/logger";

export const dynamic = "force-dynamic";

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
    logEvent("error", "clerk_webhook_configuration_missing");
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

  let rawEvent: unknown;
  try {
    rawEvent = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const envelope = clerkWebhookEnvelopeSchema.safeParse(rawEvent);
  if (!envelope.success) {
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }
  const { type } = envelope.data;
  if (!isClerkUserEventType(type)) {
    return NextResponse.json({ success: true, ignored: type });
  }
  const parsedData = clerkUserDataSchema.safeParse(envelope.data.data);
  if (!parsedData.success) {
    return NextResponse.json({ error: "Invalid user event data" }, { status: 400 });
  }
  const data = parsedData.data;
  const clerkUserId = data.id;

  const primaryEmail =
    data.email_addresses?.find((e) => e.id === data.primary_email_address_id)
      ?.email_address ??
    data.email_addresses?.[0]?.email_address ??
    `${clerkUserId}@placeholder.trace`;

  const fullName = [data.first_name, data.last_name].filter(Boolean).join(" ").trim() || "TRACE User";
  const metadataRole = data.public_metadata?.role;
  // Only Clerk public metadata, controlled by an administrator, may grant the
  // teacher role. User-editable unsafe metadata is intentionally ignored.
  const assignedRole = getClerkAssignedRole(data);

  try {
    switch (type) {
      case "user.created": {
        await prisma.$transaction(async (tx) => {
          const existingIdentity = await tx.externalIdentity.findUnique({
            where: {
              provider_providerSubject: {
                provider: "clerk",
                providerSubject: clerkUserId,
              },
            },
          });
          if (existingIdentity) return;

          const emailOwner = await tx.user.findUnique({
            where: { email: primaryEmail },
            select: { id: true },
          });
          if (emailOwner) {
            throw new Error("A TRACE account already owns this email address.");
          }

          const user = await tx.user.create({
            data: {
              name: fullName,
              email: primaryEmail,
              platformRole: assignedRole,
              accountStatus: "ACTIVE",
            },
          });

          await tx.externalIdentity.create({
            data: {
              userId: user.id,
              provider: "clerk",
              providerSubject: clerkUserId,
            },
          });

        });
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
        });

        if (identity) {
          await prisma.user.update({
            where: { id: identity.userId },
            data: {
              name: fullName,
              email: primaryEmail,
              ...(metadataRole
                ? {
                    platformRole: metadataRole,
                    accountStatus: "ACTIVE" as const,
                    teacherApprovalRequestedAt: null,
                    teacherApprovalNotifiedAt: null,
                    teacherApprovedAt: null,
                  }
                : {}),
            },
          });
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
    }
  } catch (error) {
    logEvent("error", "clerk_webhook_processing_failed", {
      eventType: type,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { error: "Database synchronization failed" },
      { status: 500 },
    );
  }
}
