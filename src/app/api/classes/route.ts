import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth/currentUser";
import { prisma } from "@/lib/db";
import { isClassInRange } from "@/lib/constants/classLevels";

type ClassRow = {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  schoolId: string | null;
  branchId: string | null;
  branchName: string | null;
  schoolName: string | null;
  teacherId: string | null;
  teacherName: string | null;
  createdAt: Date;
  sections: string | null;
  assignmentCount: number;
};

function cleanSections(value: unknown) {
  if (typeof value !== "string") return [];
  return value.split(",").map((section) => section.trim()).filter(Boolean);
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() || fallback : fallback;
}

function cleanStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => text(item)).filter(Boolean);
}

function parseLocationId(value: string) {
  if (value.startsWith("school:")) return { type: "school", id: value.slice("school:".length) };
  if (value.startsWith("branch:")) return { type: "branch", id: value.slice("branch:".length) };
  return { type: "branch", id: value };
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUserContext();
    if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });
    if (!user.schoolId) return NextResponse.json({ error: "Create a school profile first.", classes: [] }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const rawLocationId = searchParams.get("locationId") ?? searchParams.get("branchId") ?? user.branchId ?? "all";
    const location = rawLocationId === "all" ? null : parseLocationId(rawLocationId);

    const rows = !location
      ? await prisma.$queryRaw<ClassRow[]>`
          select
            c."id", c."name", c."description", c."capacity", c."schoolId", c."branchId", b."name" as "branchName",
            sc."name" as "schoolName",
            c."teacherId", t."name" as "teacherName", c."createdAt", string_agg(s."name", ', ' order by s."name") as "sections"
            , count(distinct cta."id")::int as "assignmentCount"
          from "Class" c
          left join "SchoolBranch" b on b."id" = c."branchId"
          left join "School" sc on sc."id" = c."schoolId"
          left join "Section" s on s."classId" = c."id"
          left join "Teacher" t on t."id" = c."teacherId"
          left join "ClassTeacherAssignment" cta on cta."classId" = c."id" and cta."status" = 'active'
          where c."schoolId" = ${user.schoolId}
          group by c."id", b."name", sc."name", t."name"
          order by c."createdAt" desc
        `
      : location.type === "school"
      ? await prisma.$queryRaw<ClassRow[]>`
          select
            c."id", c."name", c."description", c."capacity", c."schoolId", c."branchId", b."name" as "branchName",
            sc."name" as "schoolName",
            c."teacherId", t."name" as "teacherName", c."createdAt", string_agg(s."name", ', ' order by s."name") as "sections"
            , count(distinct cta."id")::int as "assignmentCount"
          from "Class" c
          left join "SchoolBranch" b on b."id" = c."branchId"
          left join "School" sc on sc."id" = c."schoolId"
          left join "Section" s on s."classId" = c."id"
          left join "Teacher" t on t."id" = c."teacherId"
          left join "ClassTeacherAssignment" cta on cta."classId" = c."id" and cta."status" = 'active'
          where c."schoolId" = ${user.schoolId} and c."branchId" is null
          group by c."id", b."name", sc."name", t."name"
          order by c."createdAt" desc
        `
      : await prisma.$queryRaw<ClassRow[]>`
          select
            c."id", c."name", c."description", c."capacity", c."schoolId", c."branchId", b."name" as "branchName",
            sc."name" as "schoolName",
            c."teacherId", t."name" as "teacherName", c."createdAt", string_agg(s."name", ', ' order by s."name") as "sections"
            , count(distinct cta."id")::int as "assignmentCount"
          from "Class" c
          left join "SchoolBranch" b on b."id" = c."branchId"
          left join "School" sc on sc."id" = c."schoolId"
          left join "Section" s on s."classId" = c."id"
          left join "Teacher" t on t."id" = c."teacherId"
          left join "ClassTeacherAssignment" cta on cta."classId" = c."id" and cta."status" = 'active'
          where c."schoolId" = ${user.schoolId} and c."branchId" = ${location.id}
          group by c."id", b."name", sc."name", t."name"
          order by c."createdAt" desc
        `;

    return NextResponse.json({
      classes: rows.map((row) => ({
        id: row.id,
        name: row.name,
        sections: row.sections ?? "No sections",
        description: row.description ?? "No description added yet.",
        capacity: row.capacity,
        schoolId: row.schoolId,
        branchId: row.branchId,
        branchName: row.branchId ? row.branchName ?? "Branch" : row.schoolName ?? "Main school",
        teacherId: row.teacherId,
        teacherName: row.teacherName ?? "Not linked",
        assignmentCount: row.assignmentCount,
        createdAt: row.createdAt
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load classes." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUserContext();
    if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });
    if (!user.schoolId) return NextResponse.json({ error: "Create a school profile first." }, { status: 400 });

    const body = (await request.json()) as {
      name?: string;
      classNames?: string[];
      sections?: string | string[];
      description?: string;
      capacity?: string | number;
      teacherId?: string;
      branchId?: string;
      locationId?: string;
    };

    const classNames = cleanStringArray(body.classNames).length ? cleanStringArray(body.classNames) : [text(body.name)].filter(Boolean);
    const sections = Array.isArray(body.sections) ? cleanStringArray(body.sections) : cleanSections(body.sections);
    const description = text(body.description);
    const capacity = Number(body.capacity);
    const rawLocationId = text(body.locationId || body.branchId || user.branchId);

    if (!classNames.length) return NextResponse.json({ error: "Select at least one class." }, { status: 400 });
    if (!sections.length) return NextResponse.json({ error: "Add at least one class section." }, { status: 400 });
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 300) {
      return NextResponse.json({ error: "Capacity must be a number between 1 and 300." }, { status: 400 });
    }
    if (!rawLocationId) return NextResponse.json({ error: "Select a school or branch before creating a class." }, { status: 400 });

    const location = parseLocationId(rawLocationId);
    let targetBranchId: string | null = null;
    let classFrom = "Nursery";
    let classTo = "Class 12";

    if (location.type === "school") {
      if (location.id !== user.schoolId) return NextResponse.json({ error: "Selected school was not found." }, { status: 400 });
      const schools = await prisma.$queryRaw<Array<{ id: string; classFrom: string; classTo: string }>>`
        select "id", "classFrom", "classTo" from "School" where "id" = ${user.schoolId} limit 1
      `;
      if (!schools[0]) return NextResponse.json({ error: "Selected school was not found." }, { status: 400 });
      classFrom = schools[0].classFrom;
      classTo = schools[0].classTo;
    } else {
      const branch = await prisma.$queryRaw<Array<{ id: string; classFrom: string; classTo: string }>>`
        select "id", "classFrom", "classTo" from "SchoolBranch" where "id" = ${location.id} and "schoolId" = ${user.schoolId} limit 1
      `;
      const selectedBranch = branch[0];
      if (!selectedBranch) return NextResponse.json({ error: "Selected branch was not found." }, { status: 400 });
      targetBranchId = selectedBranch.id;
      classFrom = selectedBranch.classFrom;
      classTo = selectedBranch.classTo;
    }

    for (const className of classNames) {
      if (!isClassInRange(className, classFrom, classTo)) {
        return NextResponse.json({ error: `${className} is outside this location class range.` }, { status: 400 });
      }
      const existing = targetBranchId
        ? await prisma.$queryRaw<Array<{ id: string }>>`
            select "id" from "Class"
            where "schoolId" = ${user.schoolId} and "branchId" = ${targetBranchId} and lower("name") = lower(${className})
            limit 1
          `
        : await prisma.$queryRaw<Array<{ id: string }>>`
            select "id" from "Class"
            where "schoolId" = ${user.schoolId} and "branchId" is null and lower("name") = lower(${className})
            limit 1
          `;
      if (existing[0]) return NextResponse.json({ error: `${className} already exists in this branch.` }, { status: 409 });
    }

    const createdIds: string[] = [];
    const operations = classNames.flatMap((className) => {
      const classId = crypto.randomUUID();
      createdIds.push(classId);
      return [
        prisma.$executeRaw`
          insert into "Class" ("id", "schoolId", "branchId", "name", "description", "capacity", "teacherId", "createdAt")
          values (${classId}, ${user.schoolId}, ${targetBranchId}, ${className}, ${description}, ${capacity}, null, now())
        `,
        ...sections.map((section) => prisma.$executeRaw`
          insert into "Section" ("id", "schoolId", "branchId", "name", "classId")
          values (${crypto.randomUUID()}, ${user.schoolId}, ${targetBranchId}, ${section}, ${classId})
        `)
      ];
    });
    await prisma.$transaction(operations);

    return NextResponse.json({ ok: true, message: `${classNames.length} class${classNames.length === 1 ? "" : "es"} created successfully.`, ids: createdIds }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create class." }, { status: 500 });
  }
}
