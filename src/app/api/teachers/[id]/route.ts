import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth/currentUser";
import { prisma } from "@/lib/db";

type TeacherDetailRow = {
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
};

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() || fallback : fallback;
}

function nullableText(value: unknown) {
  const clean = text(value);
  return clean || null;
}

async function ensureSubject(schoolId: string, branchId: string | null, name: string) {
  const clean = name.trim();
  if (!clean) return null;
  const existing = branchId
    ? await prisma.$queryRaw<Array<{ id: string }>>`
        select "id" from "Subject"
        where "schoolId" = ${schoolId} and "branchId" = ${branchId} and lower("name") = lower(${clean})
        limit 1
      `
    : await prisma.$queryRaw<Array<{ id: string }>>`
        select "id" from "Subject"
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

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUserContext();
    if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });
    if (!user.schoolId) return NextResponse.json({ error: "Create a school profile first." }, { status: 400 });
    const { id } = await params;

    const teachers = await prisma.$queryRaw<TeacherDetailRow[]>`
      select
        t."id", t."userId", t."name", t."email", t."phone", t."employeeCode", t."designation",
        t."qualification", t."experienceYears", t."status", t."imageUrl", t."branchId",
        b."name" as "branchName", t."subjectId", s."name" as "subjectName",
        string_agg(c."name", ', ' order by c."name") as "linkedClasses"
      from "Teacher" t
      left join "SchoolBranch" b on b."id" = t."branchId"
      left join "Subject" s on s."id" = t."subjectId"
      left join "Class" c on c."teacherId" = t."id"
      where t."id" = ${id} and t."schoolId" = ${user.schoolId}
      group by t."id", b."name", s."name"
      limit 1
    `;
    const teacher = teachers[0];

    if (!teacher) return NextResponse.json({ error: "Teacher not found." }, { status: 404 });

    const classes = await prisma.$queryRaw<Array<{ id: string; name: string; branchId: string | null }>>`
      select "id", "name", "branchId"
      from "Class"
      where "teacherId" = ${id} and "schoolId" = ${user.schoolId}
      order by "name" asc
    `;
    const transfers = await prisma.$queryRaw<Array<{ id: string; reason: string; effectiveDate: Date; createdAt: Date; fromBranchName: string | null; toBranchName: string | null }>>`
      select tr."id", tr."reason", tr."effectiveDate", tr."createdAt", fb."name" as "fromBranchName", tb."name" as "toBranchName"
      from "TeacherBranchTransfer" tr
      left join "SchoolBranch" fb on fb."id" = tr."fromBranchId"
      left join "SchoolBranch" tb on tb."id" = tr."toBranchId"
      where tr."teacherId" = ${id} and tr."schoolId" = ${user.schoolId}
      order by tr."createdAt" desc
    `;

    return NextResponse.json({
      teacher: {
        ...teacher,
        branchName: teacher.branchName ?? "Organization only",
        subjectName: teacher.subjectName ?? "Subject not linked",
        linkedClasses: teacher.linkedClasses ?? "No classes linked",
        classes,
        transfers
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load teacher." }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUserContext();
    if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });
    if (!user.schoolId) return NextResponse.json({ error: "Create a school profile first." }, { status: 400 });
    const { id } = await params;
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
      status?: string;
    };
    const name = text(body.name);
    const email = text(body.email).toLowerCase();
    const phone = text(body.phone);
    const experienceYears = body.experienceYears === "" || body.experienceYears == null ? null : Number(body.experienceYears);
    if (!name || !email || !phone) return NextResponse.json({ error: "Name, email, and phone are required." }, { status: 400 });
    if (experienceYears !== null && (!Number.isInteger(experienceYears) || experienceYears < 0)) {
      return NextResponse.json({ error: "Experience years must be 0 or more." }, { status: 400 });
    }

    const teachers = await prisma.$queryRaw<Array<{ id: string; userId: string | null; branchId: string | null }>>`
      select "id", "userId", "branchId" from "Teacher" where "id" = ${id} and "schoolId" = ${user.schoolId} limit 1
    `;
    const teacher = teachers[0];
    if (!teacher) return NextResponse.json({ error: "Teacher not found." }, { status: 404 });
    const subjectId = await ensureSubject(user.schoolId, teacher.branchId, text(body.subject));

    await prisma.$executeRaw`
      update "Teacher"
      set "name" = ${name}, "email" = ${email}, "phone" = ${phone}, "employeeCode" = ${nullableText(body.employeeCode)},
        "designation" = ${nullableText(body.designation)}, "qualification" = ${nullableText(body.qualification)},
        "experienceYears" = ${experienceYears}, "status" = ${text(body.status, "active")}, "subjectId" = ${subjectId},
        "imageUrl" = ${nullableText(body.imageUrl)}
      where "id" = ${id} and "schoolId" = ${user.schoolId}
    `;

    if (teacher.userId) {
      await prisma.$executeRaw`
        update "User"
        set "name" = ${name}, "email" = ${email}, "imageUrl" = ${nullableText(body.imageUrl)}, "updatedAt" = now()
        where "id" = ${teacher.userId}
      `;
    }

    return NextResponse.json({ ok: true, message: "Teacher updated successfully." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update teacher." }, { status: 500 });
  }
}
