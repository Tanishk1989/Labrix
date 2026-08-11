import { loadEnvConfig } from "@next/env";
import { z } from "zod";
import { prisma } from "../src/lib/db/prisma";
import { linkExternalIdentity } from "../src/server/actors/link-external-identity";

loadEnvConfig(process.cwd());

const args = new Map<string, string>();
for (let index = 2; index < process.argv.length; index += 2) {
  const key = process.argv[index];
  const value = process.argv[index + 1];
  if (key?.startsWith("--") && value) args.set(key.slice(2), value);
}

const input = z
  .object({
    userId: z.string().trim().min(1),
    providerSubject: z.string().trim().min(1),
    allowFlag: z.literal("true"),
    confirmation: z.literal("LINK_EXTERNAL_IDENTITY"),
  })
  .parse({
    userId: args.get("user-id") ?? process.env.LABRIX_LINK_USER_ID,
    providerSubject:
      args.get("clerk-subject") ?? process.env.LABRIX_LINK_CLERK_SUBJECT,
    allowFlag: process.env.LABRIX_ALLOW_IDENTITY_LINKING,
    confirmation: args.get("confirm"),
  });

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "The generic identity-linking command is disabled in production. Use controlled teacher provisioning.",
    );
  }
  await linkExternalIdentity(prisma, {
    userId: input.userId,
    provider: "clerk",
    providerSubject: input.providerSubject,
  });
  console.log("External identity link created.");
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Identity linking failed.");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
