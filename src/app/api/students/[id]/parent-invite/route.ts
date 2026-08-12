import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth/currentUser";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/services/auth/passwordService";
import { createParentInvite } from "@/lib/services/auth/parentInviteService";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await getCurrentUserContext();
    if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });
    if (!user.schoolId) return NextResponse.json({ error: "Create a school profile first." }, { status: 400 });

    const { id } = await params;
    const rows = await prisma.$queryRaw<Array<{
      studentName: string;
      parentId: string;
      parentName: string;
      parentEmail: string | null;
      parentUserId: string | null;
      branchId: string | null;
    }>>`
      select st."name" as "studentName", st."branchId", p."id" as "parentId", p."name" as "parentName",
        p."email" as "parentEmail", p."userId" as "parentUserId"
      from "Student" st
      join "Parent" p on p."id" = st."parentId"
      where st."id" = ${id} and st."schoolId" = ${user.schoolId}
      limit 1
    `;
    const row = rows[0];
    if (!row) return NextResponse.json({ error: "Student or parent was not found." }, { status: 404 });
    if (!row.parentEmail) return NextResponse.json({ error: "Parent email is required before sending invite." }, { status: 400 });

    let parentUserId = row.parentUserId;
    if (!parentUserId) {
      const existing = await prisma.$queryRaw<Array<{ id: string }>>`
        select "id" from "User" where "email" = ${row.parentEmail} limit 1
      `;
      parentUserId = existing[0]?.id ?? crypto.randomUUID();
      if (existing[0]) {
        await prisma.$executeRaw`
          update "User"
          set "name" = ${row.parentName}, "role" = 'PARENT'::"RoleName", "schoolId" = ${user.schoolId}, "branchId" = ${row.branchId}, "updatedAt" = now()
          where "id" = ${parentUserId}
        `;
      } else {
        await prisma.$executeRaw`
          insert into "User" ("id", "name", "email", "role", "schoolId", "branchId", "emailVerified", "passwordHash", "createdAt", "updatedAt")
          values (${parentUserId}, ${row.parentName}, ${row.parentEmail}, 'PARENT'::"RoleName", ${user.schoolId}, ${row.branchId}, false, ${await hashPassword(crypto.randomUUID())}, now(), now())
        `;
      }
      await prisma.$executeRaw`update "Parent" set "userId" = ${parentUserId} where "id" = ${row.parentId}`;
    }

    await prisma.$executeRaw`
      update "ParentInviteToken"
      set "usedAt" = now()
      where "parentId" = ${row.parentId} and "usedAt" is null
    `;
    await createParentInvite({
      baseUrl: new URL(request.url).origin,
      parentId: row.parentId,
      userId: parentUserId,
      email: row.parentEmail,
      name: row.parentName,
      studentName: row.studentName
    });

    return NextResponse.json({ ok: true, message: "Parent invite email sent." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not send parent invite." }, { status: 500 });
  }
}
