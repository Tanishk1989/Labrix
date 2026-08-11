import { loadEnvConfig } from "@next/env";
import { prisma } from "../src/lib/db/prisma";
import {
  authorizeTeacherProvisioningCommand,
  provisionTeacher,
} from "../src/server/admin/teacher-provisioning";

loadEnvConfig(process.cwd());

const args = new Map<string, string>();
for (let index = 2; index < process.argv.length; index += 2) {
  const key = process.argv[index];
  const value = process.argv[index + 1];
  if (key?.startsWith("--") && value) args.set(key.slice(2), value);
}

async function main() {
  const authorization = authorizeTeacherProvisioningCommand({
    allowFlag: process.env.LABRIX_ALLOW_TEACHER_PROVISIONING,
    confirmation: args.get("confirm"),
  });
  const clerkSubject = args.get("clerk-subject") ?? "";
  const userId = args.get("user-id");
  const result = await provisionTeacher(
    prisma,
    authorization,
    userId
      ? { mode: "LINK_EXISTING", userId, clerkSubject }
      : {
          mode: "CREATE",
          name: args.get("name") ?? "",
          email: args.get("email") ?? "",
          clerkSubject,
        },
  );
  console.log(`Teacher ${result.status.toLowerCase()}: ${result.userId}`);
}

main()
  .catch((error: unknown) => {
    console.error(
      error instanceof Error ? error.message : "Teacher provisioning failed.",
    );
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
