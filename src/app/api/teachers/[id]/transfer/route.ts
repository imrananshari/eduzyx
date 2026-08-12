import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth/currentUser";
import { prisma } from "@/lib/db";

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() || fallback : fallback;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUserContext();
    if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });
    if (!user.schoolId) return NextResponse.json({ error: "Create a school profile first." }, { status: 400 });
    const { id } = await params;
    const body = (await request.json()) as { toBranchId?: string; reason?: string; effectiveDate?: string };
    const toBranchId = text(body.toBranchId) || null;
    const reason = text(body.reason, "Branch transfer");
    const effectiveDate = body.effectiveDate ? new Date(body.effectiveDate) : new Date();

    const teachers = await prisma.$queryRaw<Array<{ id: string; branchId: string | null; userId: string | null }>>`
      select "id", "branchId", "userId" from "Teacher" where "id" = ${id} and "schoolId" = ${user.schoolId} limit 1
    `;
    const teacher = teachers[0];
    if (!teacher) return NextResponse.json({ error: "Teacher not found." }, { status: 404 });

    if (toBranchId) {
      const branches = await prisma.$queryRaw<Array<{ id: string }>>`
        select "id" from "SchoolBranch" where "id" = ${toBranchId} and "schoolId" = ${user.schoolId} limit 1
      `;
      if (!branches[0]) return NextResponse.json({ error: "Target branch not found." }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.$executeRaw`
        update "Class"
        set "teacherId" = null
        where "teacherId" = ${id} and "schoolId" = ${user.schoolId} and (("branchId" = ${teacher.branchId}) or ("branchId" is null and ${teacher.branchId} is null))
      `,
      prisma.$executeRaw`
        update "Teacher"
        set "branchId" = ${toBranchId}
        where "id" = ${id} and "schoolId" = ${user.schoolId}
      `,
      prisma.$executeRaw`
        update "User"
        set "branchId" = ${toBranchId}, "updatedAt" = now()
        where "id" = ${teacher.userId}
      `,
      prisma.$executeRaw`
        insert into "TeacherBranchTransfer" ("id", "teacherId", "schoolId", "fromBranchId", "toBranchId", "reason", "effectiveDate", "createdByUserId", "createdAt")
        values (${crypto.randomUUID()}, ${id}, ${user.schoolId}, ${teacher.branchId}, ${toBranchId}, ${reason}, ${effectiveDate}, ${user.id}, now())
      `
    ]);

    return NextResponse.json({ ok: true, message: "Teacher transferred successfully." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not transfer teacher." }, { status: 500 });
  }
}
