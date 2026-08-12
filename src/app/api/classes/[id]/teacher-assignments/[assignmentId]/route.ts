import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth/currentUser";
import { prisma } from "@/lib/db";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string; assignmentId: string }> }) {
  try {
    const user = await getCurrentUserContext();
    if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });
    if (!user.schoolId) return NextResponse.json({ error: "Create a school profile first." }, { status: 400 });
    const { id, assignmentId } = await params;

    const result = await prisma.$executeRaw`
      delete from "ClassTeacherAssignment"
      where "id" = ${assignmentId} and "classId" = ${id} and "schoolId" = ${user.schoolId}
    `;
    if (Number(result) === 0) return NextResponse.json({ error: "Assignment not found." }, { status: 404 });

    return NextResponse.json({ ok: true, message: "Teacher assignment removed." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not remove assignment." }, { status: 500 });
  }
}
