import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth/currentUser";
import { prisma } from "@/lib/db";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUserContext();
    if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });
    if (!user.schoolId) return NextResponse.json({ error: "Create a school profile first." }, { status: 400 });
    const { id } = await params;
    const body = (await request.json()) as { classIds?: string[] };
    const classIds = Array.isArray(body.classIds) ? body.classIds.filter(Boolean) : [];

    const teachers = await prisma.$queryRaw<Array<{ id: string; branchId: string | null }>>`
      select "id", "branchId" from "Teacher" where "id" = ${id} and "schoolId" = ${user.schoolId} limit 1
    `;
    const teacher = teachers[0];
    if (!teacher) return NextResponse.json({ error: "Teacher not found." }, { status: 404 });
    if (!teacher.branchId) return NextResponse.json({ error: "Place teacher in a branch before assigning classes." }, { status: 400 });

    for (const classId of classIds) {
      const classes = await prisma.$queryRaw<Array<{ id: string }>>`
        select "id" from "Class"
        where "schoolId" = ${user.schoolId} and "branchId" = ${teacher.branchId} and "id" = ${classId}
        limit 1
      `;
      if (!classes[0]) return NextResponse.json({ error: "All selected classes must belong to the teacher's current branch." }, { status: 400 });
    }

    await prisma.$executeRaw`
      update "Class"
      set "teacherId" = null
      where "teacherId" = ${id} and "schoolId" = ${user.schoolId} and "branchId" = ${teacher.branchId}
    `;
    for (const classId of classIds) {
      await prisma.$executeRaw`
        update "Class"
        set "teacherId" = ${id}
        where "id" = ${classId} and "schoolId" = ${user.schoolId} and "branchId" = ${teacher.branchId}
      `;
    }

    return NextResponse.json({ ok: true, message: "Teacher classes updated successfully." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not assign classes." }, { status: 500 });
  }
}
