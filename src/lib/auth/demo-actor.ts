import { prisma } from "@/lib/db/prisma";
export async function getDemoTeacher() { const teacher = await prisma.user.findUnique({ where: { id: "demo-teacher" } }); if (!teacher) throw new Error("Demo teacher is not seeded."); return teacher; }
