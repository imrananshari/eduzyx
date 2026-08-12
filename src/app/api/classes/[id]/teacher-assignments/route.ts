import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth/currentUser";
import { prisma } from "@/lib/db";

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() || fallback : fallback;
}

async function ensureSubject(schoolId: string, branchId: string, name: string) {
  const clean = name.trim();
  if (!clean) return null;

  const existing = await prisma.$queryRaw<Array<{ id: string }>>`
    select "id"
    from "Subject"
    where "schoolId" = ${schoolId} and "branchId" = ${branchId} and lower("name") = lower(${clean})
    limit 1
  `;
  if (existing[0]) return existing[0].id;

  const id = crypto.randomUUID();
  await prisma.$executeRaw`
    insert into "Subject" ("id", "schoolId", "branchId", "name")
    values (${id}, ${schoolId}, ${branchId}, ${clean})
  `;
  return id;
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUserContext();
    if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });
    if (!user.schoolId) return NextResponse.json({ error: "Create a school profile first." }, { status: 400 });
    const { id } = await params;

    const classes = await prisma.$queryRaw<Array<{ id: string; name: string; description: string | null; capacity: number; branchId: string | null; branchName: string | null; schoolName: string | null }>>`
      select c."id", c."name", c."description", c."capacity", c."branchId", b."name" as "branchName", sc."name" as "schoolName"
      from "Class" c
      left join "SchoolBranch" b on b."id" = c."branchId"
      left join "School" sc on sc."id" = c."schoolId"
      where c."id" = ${id} and c."schoolId" = ${user.schoolId}
      limit 1
    `;
    const schoolClass = classes[0];
    if (!schoolClass) return NextResponse.json({ error: "Class not found." }, { status: 404 });
    const mainBranches = await prisma.$queryRaw<Array<{ id: string; name: string }>>`
      select "id", "name"
      from "SchoolBranch"
      where "schoolId" = ${user.schoolId}
      order by "isMain" desc, "createdAt" asc
      limit 1
    `;
    const effectiveBranchId = schoolClass.branchId ?? mainBranches[0]?.id;
    if (!effectiveBranchId) return NextResponse.json({ error: "Main branch not found for teacher linking." }, { status: 400 });

    const [sections, teachers, subjects, assignments] = await Promise.all([
      schoolClass.branchId
        ? prisma.$queryRaw<Array<{ id: string; name: string }>>`
            select "id", "name"
            from "Section"
            where "classId" = ${id} and "schoolId" = ${user.schoolId} and "branchId" = ${schoolClass.branchId}
            order by "name" asc
          `
        : prisma.$queryRaw<Array<{ id: string; name: string }>>`
            select "id", "name"
            from "Section"
            where "classId" = ${id} and "schoolId" = ${user.schoolId} and "branchId" is null
            order by "name" asc
          `,
      prisma.$queryRaw<Array<{ id: string; name: string; email: string | null; designation: string | null; imageUrl: string | null; subjectName: string | null; branchName: string | null }>>`
        select t."id", t."name", t."email", t."designation", t."imageUrl", s."name" as "subjectName", b."name" as "branchName"
        from "Teacher" t
        left join "Subject" s on s."id" = t."subjectId"
        left join "SchoolBranch" b on b."id" = t."branchId"
        where t."schoolId" = ${user.schoolId} and t."branchId" = ${effectiveBranchId} and t."status" = 'active'
        order by t."name" asc
      `,
      prisma.$queryRaw<Array<{ id: string; name: string }>>`
        select distinct "id", "name"
        from "Subject"
        where "schoolId" = ${user.schoolId} and "branchId" = ${effectiveBranchId}
        order by "name" asc
      `,
      prisma.$queryRaw<Array<{
        id: string;
        sectionId: string | null;
        sectionName: string | null;
        teacherId: string;
        teacherName: string;
        teacherImageUrl: string | null;
        subjectId: string;
        subjectName: string;
        dayOfWeek: string;
        startTime: string;
        endTime: string;
        room: string | null;
        status: string;
      }>>`
        select
          a."id", a."sectionId", sec."name" as "sectionName", a."teacherId", t."name" as "teacherName",
          t."imageUrl" as "teacherImageUrl", a."subjectId", sub."name" as "subjectName", a."dayOfWeek",
          a."startTime", a."endTime", a."room", a."status"
        from "ClassTeacherAssignment" a
        join "Teacher" t on t."id" = a."teacherId"
        join "Subject" sub on sub."id" = a."subjectId"
        left join "Section" sec on sec."id" = a."sectionId"
        where a."classId" = ${id} and a."schoolId" = ${user.schoolId} and a."branchId" = ${effectiveBranchId}
        order by a."dayOfWeek", a."startTime"
      `
    ]);

    return NextResponse.json({
      class: { ...schoolClass, branchId: effectiveBranchId, branchName: schoolClass.branchId ? schoolClass.branchName ?? "Branch" : schoolClass.schoolName ?? "Main school" },
      sections,
      teachers: teachers.map((teacher) => ({ ...teacher, subjectName: teacher.subjectName ?? "Subject not linked", branchName: teacher.branchName ?? "Branch" })),
      subjects,
      assignments
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load teacher assignments." }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUserContext();
    if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });
    if (!user.schoolId) return NextResponse.json({ error: "Create a school profile first." }, { status: 400 });
    const { id } = await params;
    const body = (await request.json()) as {
      teacherId?: string;
      subjectName?: string;
      sectionId?: string;
      dayOfWeek?: string;
      startTime?: string;
      endTime?: string;
      room?: string;
    };

    const teacherId = text(body.teacherId);
    const subjectName = text(body.subjectName);
    const sectionId = text(body.sectionId) || null;
    const dayOfWeek = text(body.dayOfWeek);
    const startTime = text(body.startTime);
    const endTime = text(body.endTime);
    const room = text(body.room) || null;

    if (!teacherId || !subjectName || !sectionId || !dayOfWeek || !startTime || !endTime) {
      return NextResponse.json({ error: "Teacher, subject, section, day, start time, and end time are required." }, { status: 400 });
    }
    if (startTime >= endTime) return NextResponse.json({ error: "End time must be after start time." }, { status: 400 });

    const classes = await prisma.$queryRaw<Array<{ id: string; branchId: string | null }>>`
      select "id", "branchId"
      from "Class"
      where "id" = ${id} and "schoolId" = ${user.schoolId}
      limit 1
    `;
    const schoolClass = classes[0];
    if (!schoolClass) return NextResponse.json({ error: "Class not found." }, { status: 404 });
    const mainBranches = await prisma.$queryRaw<Array<{ id: string }>>`
      select "id"
      from "SchoolBranch"
      where "schoolId" = ${user.schoolId}
      order by "isMain" desc, "createdAt" asc
      limit 1
    `;
    const effectiveBranchId = schoolClass.branchId ?? mainBranches[0]?.id;
    if (!effectiveBranchId) return NextResponse.json({ error: "Main branch not found for teacher linking." }, { status: 400 });

    const section = schoolClass.branchId
      ? await prisma.$queryRaw<Array<{ id: string }>>`
          select "id"
          from "Section"
          where "id" = ${sectionId} and "classId" = ${id} and "schoolId" = ${user.schoolId} and "branchId" = ${schoolClass.branchId}
          limit 1
        `
      : await prisma.$queryRaw<Array<{ id: string }>>`
          select "id"
          from "Section"
          where "id" = ${sectionId} and "classId" = ${id} and "schoolId" = ${user.schoolId} and "branchId" is null
          limit 1
        `;
    if (!section[0]) return NextResponse.json({ error: "Selected section does not belong to this class." }, { status: 400 });

    const teacher = await prisma.$queryRaw<Array<{ id: string }>>`
      select "id"
      from "Teacher"
      where "id" = ${teacherId} and "schoolId" = ${user.schoolId} and "branchId" = ${effectiveBranchId} and "status" = 'active'
      limit 1
    `;
    if (!teacher[0]) return NextResponse.json({ error: "Selected teacher must belong to this class branch." }, { status: 400 });

    const duplicate = await prisma.$queryRaw<Array<{ id: string }>>`
      select "id"
      from "ClassTeacherAssignment"
      where "classId" = ${id} and "sectionId" = ${sectionId} and "teacherId" = ${teacherId}
        and lower("dayOfWeek") = lower(${dayOfWeek}) and "startTime" = ${startTime} and "endTime" = ${endTime}
        and "status" = 'active'
      limit 1
    `;
    if (duplicate[0]) return NextResponse.json({ error: "This teacher is already linked to that exact period." }, { status: 409 });

    const subjectId = await ensureSubject(user.schoolId, effectiveBranchId, subjectName);
    if (!subjectId) return NextResponse.json({ error: "Subject is required." }, { status: 400 });

    const assignmentId = crypto.randomUUID();
    await prisma.$executeRaw`
      insert into "ClassTeacherAssignment" (
        "id", "schoolId", "branchId", "classId", "sectionId", "teacherId", "subjectId",
        "dayOfWeek", "startTime", "endTime", "room", "status", "createdAt", "updatedAt"
      )
      values (
        ${assignmentId}, ${user.schoolId}, ${effectiveBranchId}, ${id}, ${sectionId}, ${teacherId}, ${subjectId},
        ${dayOfWeek}, ${startTime}, ${endTime}, ${room}, 'active', now(), now()
      )
    `;

    return NextResponse.json({ ok: true, message: "Teacher period linked successfully.", id: assignmentId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create teacher assignment." }, { status: 500 });
  }
}
