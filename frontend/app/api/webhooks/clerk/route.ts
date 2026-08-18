import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
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
  const rawBody = await req.text();
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  // In production with CLERK_WEBHOOK_SECRET set, enforce signature verification
  if (webhookSecret) {
    const isValid = verifyClerkWebhookSignature(rawBody, req.headers, webhookSecret);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 },
      );
    }
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
  const assignedRole = data.public_metadata?.role || data.unsafe_metadata?.role || "STUDENT";

  try {
    switch (type) {
      case "user.created": {
        // Upsert user and link external identity
        await prisma.$transaction(async (tx) => {
          const user = await tx.user.upsert({
            where: { email: primaryEmail },
            update: { name: fullName },
            create: {
              name: fullName,
              email: primaryEmail,
              platformRole: assignedRole,
              accountStatus: "ACTIVE",
            },
          });

          await tx.externalIdentity.upsert({
            where: {
              provider_providerSubject: {
                provider: "clerk",
                providerSubject: clerkUserId,
              },
            },
            update: { userId: user.id },
            create: {
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

      default:
        return NextResponse.json({ success: true, ignored: type });
    }
  } catch (error) {
    console.error(`Failed processing webhook event ${type}:`, error);
    return NextResponse.json(
      { error: "Database synchronization failed", details: String(error) },
      { status: 500 },
    );
  }
}
