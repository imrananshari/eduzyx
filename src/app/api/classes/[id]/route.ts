import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth/currentUser";
import { prisma } from "@/lib/db";

type Params = {
  params: Promise<{ id: string }>;
};

type ClassDetailRow = {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  schoolId: string | null;
  branchId: string | null;
  createdAt: Date;
  schoolName: string | null;
  branchName: string | null;
  sections: string | null;
  studentCount: number;
  assignmentCount: number;
};

type AssignmentRow = {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string | null;
  teacherImageUrl: string | null;
  subjectName: string | null;
  sectionName: string | null;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string | null;
  status: string;
};

function splitList(value: string | null) {
  if (!value) return [];
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await getCurrentUserContext();
    if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });
    if (!user.schoolId) return NextResponse.json({ error: "Create a school profile first." }, { status: 400 });

    const { id } = await params;
    const rows = await prisma.$queryRaw<ClassDetailRow[]>`
      select
        c."id",
        c."name",
        c."description",
        c."capacity",
        c."schoolId",
        c."branchId",
        c."createdAt",
        sc."name" as "schoolName",
        br."name" as "branchName",
        string_agg(distinct sec."name", ', ' order by sec."name") as "sections",
        count(distinct st."id")::int as "studentCount",
        count(distinct cta."id")::int as "assignmentCount"
      from "Class" c
      left join "School" sc on sc."id" = c."schoolId"
      left join "SchoolBranch" br on br."id" = c."branchId"
      left join "Section" sec on sec."classId" = c."id"
      left join "Student" st on st."classId" = c."id"
      left join "ClassTeacherAssignment" cta on cta."classId" = c."id" and cta."status" = 'active'
      where c."id" = ${id} and c."schoolId" = ${user.schoolId}
      group by c."id", sc."name", br."name"
      limit 1
    `;

    const classRow = rows[0];
    if (!classRow) return NextResponse.json({ error: "Class was not found." }, { status: 404 });

    const assignments = await prisma.$queryRaw<AssignmentRow[]>`
      select
        cta."id",
        cta."teacherId",
        t."name" as "teacherName",
        t."email" as "teacherEmail",
        t."imageUrl" as "teacherImageUrl",
        sub."name" as "subjectName",
        sec."name" as "sectionName",
        cta."dayOfWeek",
        cta."startTime",
        cta."endTime",
        cta."room",
        cta."status"
      from "ClassTeacherAssignment" cta
      join "Teacher" t on t."id" = cta."teacherId"
      left join "Subject" sub on sub."id" = cta."subjectId"
      left join "Section" sec on sec."id" = cta."sectionId"
      where cta."classId" = ${id} and cta."schoolId" = ${user.schoolId}
      order by cta."dayOfWeek", cta."startTime", t."name"
    `;

    return NextResponse.json({
      class: {
        id: classRow.id,
        name: classRow.name,
        description: classRow.description ?? "No description added yet.",
        capacity: classRow.capacity,
        schoolId: classRow.schoolId,
        branchId: classRow.branchId,
        locationName: classRow.branchId ? classRow.branchName ?? "Branch" : classRow.schoolName ?? "Main campus",
        locationType: classRow.branchId ? "Branch" : "Main campus",
        sections: splitList(classRow.sections),
        studentCount: classRow.studentCount,
        assignmentCount: classRow.assignmentCount,
        createdAt: classRow.createdAt,
        assignments: assignments.map((assignment) => ({
          id: assignment.id,
          teacherId: assignment.teacherId,
          teacherName: assignment.teacherName,
          teacherEmail: assignment.teacherEmail,
          teacherImageUrl: assignment.teacherImageUrl,
          subjectName: assignment.subjectName ?? "Subject",
          sectionName: assignment.sectionName ?? "All sections",
          dayOfWeek: assignment.dayOfWeek,
          startTime: assignment.startTime,
          endTime: assignment.endTime,
          room: assignment.room,
          status: assignment.status
        }))
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load class detail." }, { status: 500 });
  }
}
