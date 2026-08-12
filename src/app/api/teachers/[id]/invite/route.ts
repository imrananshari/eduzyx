import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth/currentUser";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/services/auth/passwordService";
import { createTeacherInvite } from "@/lib/services/auth/teacherInviteService";

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() || fallback : fallback;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUserContext();
    if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });
    if (!user.schoolId) return NextResponse.json({ error: "Create a school profile first." }, { status: 400 });

    const { id } = await params;
    const body = (await request.json()) as { email?: string };
    const email = text(body.email).toLowerCase();
    if (!email || !email.includes("@")) return NextResponse.json({ error: "Enter a valid teacher email." }, { status: 400 });

    const teachers = await prisma.$queryRaw<Array<{ id: string; userId: string | null; name: string; imageUrl: string | null; branchId: string | null }>>`
      select "id", "userId", "name", "imageUrl", "branchId"
      from "Teacher"
      where "id" = ${id} and "schoolId" = ${user.schoolId}
      limit 1
    `;
    const teacher = teachers[0];
    if (!teacher) return NextResponse.json({ error: "Teacher not found." }, { status: 404 });

    const existingUsers = await prisma.$queryRaw<Array<{ id: string }>>`
      select "id" from "User" where "email" = ${email} limit 1
    `;
    const existingUser = existingUsers[0];
    if (existingUser && existingUser.id !== teacher.userId) {
      return NextResponse.json({ error: "This email is already linked with another user." }, { status: 409 });
    }

    const userId = teacher.userId ?? crypto.randomUUID();
    const passwordHash = await hashPassword(crypto.randomUUID());

    if (teacher.userId) {
      await prisma.$executeRaw`
        update "User"
        set "name" = ${teacher.name}, "email" = ${email}, "role" = 'TEACHER'::"RoleName",
          "imageUrl" = ${teacher.imageUrl}, "schoolId" = ${user.schoolId}, "branchId" = ${teacher.branchId},
          "passwordHash" = ${passwordHash}, "emailVerified" = false, "updatedAt" = now()
        where "id" = ${teacher.userId}
      `;
    } else {
      await prisma.$executeRaw`
        insert into "User" ("id", "name", "email", "role", "imageUrl", "schoolId", "branchId", "passwordHash", "emailVerified", "createdAt", "updatedAt")
        values (${userId}, ${teacher.name}, ${email}, 'TEACHER'::"RoleName", ${teacher.imageUrl}, ${user.schoolId}, ${teacher.branchId}, ${passwordHash}, false, now(), now())
      `;
    }

    await prisma.$executeRaw`
      update "Teacher"
      set "email" = ${email}, "userId" = ${userId}
      where "id" = ${id} and "schoolId" = ${user.schoolId}
    `;

    await prisma.$executeRaw`
      update "TeacherInviteToken"
      set "usedAt" = now()
      where "teacherId" = ${id} and "usedAt" is null
    `;

    await createTeacherInvite({
      baseUrl: new URL(request.url).origin,
      teacherId: id,
      userId,
      email,
      name: teacher.name
    });

    return NextResponse.json({ ok: true, message: "Teacher login email updated and password set link sent." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not send teacher invite." }, { status: 500 });
  }
}
