import { PlatformRole, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function argument(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length);
}

async function main() {
  if (!process.argv.includes("--confirm")) {
    throw new Error("Refusing to change authorization without --confirm.");
  }
  const email = argument("email")?.trim().toLowerCase();
  const roleValue = argument("role")?.trim().toUpperCase();
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error("Provide one exact account email with --email=user@example.edu.");
  }
  if (roleValue !== PlatformRole.TEACHER && roleValue !== PlatformRole.STUDENT) {
    throw new Error("Provide --role=TEACHER or --role=STUDENT.");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, externalIdentities: { select: { provider: true } } },
  });
  if (!user) throw new Error("No TRACE account has that exact email address.");
  if (!user.externalIdentities.some(({ provider }) => provider === "clerk")) {
    throw new Error("Role changes require a Clerk-linked TRACE account.");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { platformRole: roleValue },
  });
  console.log(JSON.stringify({ updated: true, userId: user.id, role: roleValue }));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Role update failed.");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
