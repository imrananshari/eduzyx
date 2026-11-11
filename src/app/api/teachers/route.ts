import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth/currentUser";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/services/auth/passwordService";
import { createTeacherInvite } from "@/lib/services/auth/teacherInviteService";
import { generateNextCode } from "@/lib/services/codes/codeGenerator";

type TeacherRow = {
  id: string;
  userId: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  employeeCode: string | null;
  designation: string | null;
  qualification: string | null;
  experienceYears: number | null;
  status: string;
  imageUrl: string | null;
  branchId: string | null;
  branchName: string | null;
  subjectId: string | null;
  subjectName: string | null;
  linkedClasses: string | null;
  classCount: number;
};

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() || fallback : fallback;
}

function nullableText(value: unknown) {
  const clean = text(value);
  return clean || null;
}

async function generateTeacherCode(schoolId: string, branchId: string | null, teacherId: string, manualCode: unknown, designation: unknown) {
  const typedCode = text(manualCode);
  if (typedCode) return typedCode;

  try {
    return await generateNextCode({
      schoolId,
      branchId,
      entityType: "teacher",
      generatedForId: teacherId,
      context: { type: text(designation, "teacher") }
    });
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("No active code setting")) throw error;

    const year = new Date().getFullYear();
    const prefix = `TEC-${year}`;
    const counts = await prisma.$queryRaw<Array<{ count: number }>>`
      select count(*)::int as "count" from "Teacher" where "schoolId" = ${schoolId} and "employeeCode" like ${`${prefix}-%`}
    `;
    return `${prefix}-${String((counts[0]?.count ?? 0) + 1).padStart(4, "0")}`;
  }
}

async function ensureSubject(schoolId: string, branchId: string | null, name: string) {
  const clean = name.trim();
  if (!clean) return null;

  const existing = branchId
    ? await prisma.$queryRaw<Array<{ id: string }>>`
        select "id"
        from "Subject"
        where "schoolId" = ${schoolId} and "branchId" = ${branchId} and lower("name") = lower(${clean})
        limit 1
      `
    : await prisma.$queryRaw<Array<{ id: string }>>`
        select "id"
        from "Subject"
        where "schoolId" = ${schoolId} and "branchId" is null and lower("name") = lower(${clean})
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

export async function GET(request: Request) {
  try {
    const user = await getCurrentUserContext();
    if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });
    if (!user.schoolId) return NextResponse.json({ error: "Create a school profile first.", teachers: [] }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId") ?? "all";

    if (branchId !== "all") {
      const branch = await prisma.$queryRaw<Array<{ id: string }>>`
        select "id" from "SchoolBranch" where "id" = ${branchId} and "schoolId" = ${user.schoolId} limit 1
      `;
      if (!branch[0]) return NextResponse.json({ error: "Branch not found." }, { status: 404 });
    }

    const teachers = branchId === "all"
      ? await prisma.$queryRaw<TeacherRow[]>`
          select
            t."id", t."userId", t."name", t."email", t."phone", t."employeeCode", t."designation",
            t."qualification", t."experienceYears", t."status", t."imageUrl", t."branchId",
            b."name" as "branchName", t."subjectId", s."name" as "subjectName",
            string_agg(c."name", ', ' order by c."name") as "linkedClasses",
            count(c."id")::int as "classCount"
          from "Teacher" t
          left join "SchoolBranch" b on b."id" = t."branchId"
          left join "Subject" s on s."id" = t."subjectId"
          left join "Class" c on c."teacherId" = t."id"
          where t."schoolId" = ${user.schoolId}
          group by t."id", b."name", s."name"
          order by t."createdAt" desc
        `
      : await prisma.$queryRaw<TeacherRow[]>`
          select
            t."id", t."userId", t."name", t."email", t."phone", t."employeeCode", t."designation",
            t."qualification", t."experienceYears", t."status", t."imageUrl", t."branchId",
            b."name" as "branchName", t."subjectId", s."name" as "subjectName",
            string_agg(c."name", ', ' order by c."name") as "linkedClasses",
            count(c."id")::int as "classCount"
          from "Teacher" t
          left join "SchoolBranch" b on b."id" = t."branchId"
          left join "Subject" s on s."id" = t."subjectId"
          left join "Class" c on c."teacherId" = t."id"
          where t."schoolId" = ${user.schoolId} and t."branchId" = ${branchId}
          group by t."id", b."name", s."name"
          order by t."createdAt" desc
        `;

    return NextResponse.json({
      teachers: teachers.map((teacher) => ({
        ...teacher,
        branchName: teacher.branchName ?? "Organization only",
        subjectName: teacher.subjectName ?? "Subject not linked",
        linkedClasses: teacher.linkedClasses ?? "No classes linked"
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load teachers." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUserContext();
    if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });
    if (!user.schoolId) return NextResponse.json({ error: "Create a school profile first." }, { status: 400 });

    const body = (await request.json()) as {
      name?: string;
      email?: string;
      phone?: string;
      imageUrl?: string;
      employeeCode?: string;
      designation?: string;
      qualification?: string;
      experienceYears?: string | number;
      subject?: string;
      branchId?: string;
      status?: string;
      classIds?: string[];
    };

    const name = text(body.name);
    const email = text(body.email).toLowerCase();
    const phone = text(body.phone);
    const branchId = text(body.branchId) || null;
    const experienceYears = body.experienceYears === "" || body.experienceYears == null ? null : Number(body.experienceYears);
    const classIds = Array.isArray(body.classIds) ? body.classIds.filter(Boolean) : [];

    if (!name || !email || !phone) {
      return NextResponse.json({ error: "Teacher name, email, and phone are required." }, { status: 400 });
    }

    if (experienceYears !== null && (!Number.isInteger(experienceYears) || experienceYears < 0)) {
      return NextResponse.json({ error: "Experience years must be 0 or more." }, { status: 400 });
    }

    if (branchId) {
      const branch = await prisma.$queryRaw<Array<{ id: string }>>`
        select "id" from "SchoolBranch" where "id" = ${branchId} and "schoolId" = ${user.schoolId} limit 1
      `;
      if (!branch[0]) return NextResponse.json({ error: "Selected branch was not found." }, { status: 400 });
    }

    if (classIds.length && !branchId) {
      return NextResponse.json({ error: "Place teacher in a branch before assigning classes." }, { status: 400 });
    }

    for (const classId of classIds) {
      const classes = await prisma.$queryRaw<Array<{ id: string }>>`
        select "id" from "Class"
        where "schoolId" = ${user.schoolId} and "branchId" = ${branchId} and "id" = ${classId}
        limit 1
      `;
      if (!classes[0]) return NextResponse.json({ error: "All selected classes must belong to the same branch." }, { status: 400 });
    }

    const existingUsers = await prisma.$queryRaw<Array<{ id: string; role: string }>>`
      select "id", "role"::text as "role" from "User" where "email" = ${email} limit 1
    `;
    const userId = existingUsers[0]?.id ?? crypto.randomUUID();
    const subjectId = await ensureSubject(user.schoolId, branchId, text(body.subject));
    const teacherId = crypto.randomUUID();
    const employeeCode = await generateTeacherCode(user.schoolId, branchId, teacherId, body.employeeCode, body.designation);

    if (!existingUsers[0]) {
      await prisma.$executeRaw`
        insert into "User" ("id", "name", "email", "role", "imageUrl", "schoolId", "branchId", "emailVerified", "passwordHash", "createdAt", "updatedAt")
        values (
          ${userId}, ${name}, ${email}, 'TEACHER'::"RoleName", ${nullableText(body.imageUrl)}, ${user.schoolId}, ${branchId},
          true, ${await hashPassword(crypto.randomUUID())}, now(), now()
        )
      `;
    } else {
      await prisma.$executeRaw`
        update "User"
        set "name" = ${name}, "role" = 'TEACHER'::"RoleName", "imageUrl" = coalesce(${nullableText(body.imageUrl)}, "imageUrl"),
          "schoolId" = ${user.schoolId}, "branchId" = ${branchId}, "updatedAt" = now()
        where "id" = ${userId}
      `;
    }

    await prisma.$executeRaw`
      insert into "Teacher" (
        "id", "schoolId", "branchId", "userId", "name", "email", "phone", "employeeCode", "designation",
        "qualification", "experienceYears", "status", "subjectId", "imageUrl", "joinedAt", "createdAt"
      )
      values (
        ${teacherId}, ${user.schoolId}, ${branchId}, ${userId}, ${name}, ${email}, ${phone}, ${employeeCode},
        ${nullableText(body.designation)}, ${nullableText(body.qualification)}, ${experienceYears}, ${text(body.status, "active")},
        ${subjectId}, ${nullableText(body.imageUrl)}, now(), now()
      )
    `;

    for (const classId of classIds) {
      await prisma.$executeRaw`
        update "Class"
        set "teacherId" = ${teacherId}
        where "id" = ${classId} and "schoolId" = ${user.schoolId} and "branchId" = ${branchId}
      `;
    }

    await createTeacherInvite({
      baseUrl: new URL(request.url).origin,
      teacherId,
      userId,
      email,
      name
    });

    return NextResponse.json({ ok: true, message: "Teacher onboarded successfully. Invite email sent.", id: teacherId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create teacher." }, { status: 500 });
  }
}
