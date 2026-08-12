import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth/currentUser";
import { prisma } from "@/lib/db";

type Params = {
  params: Promise<{ id: string }>;
};

type StudentDetailRow = {
  id: string;
  studentCode: string;
  admissionNumber: string | null;
  rollNo: string | null;
  name: string;
  status: string;
  imageUrl: string | null;
  dateOfBirth: Date | null;
  gender: string | null;
  bloodGroup: string | null;
  admissionDate: Date | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  idCardIssuedAt: Date | null;
  idCardExpiresAt: Date | null;
  notes: string | null;
  schoolId: string | null;
  schoolName: string | null;
  schoolCode: string | null;
  schoolLogoUrl: string | null;
  branchId: string | null;
  branchName: string | null;
  classId: string | null;
  className: string | null;
  sectionId: string | null;
  sectionName: string | null;
  parentId: string | null;
  parentName: string | null;
  parentEmail: string | null;
  parentPhone: string | null;
  parentRelation: string | null;
  parentAlternatePhone: string | null;
  createdAt: Date;
};

type TeacherAssignmentRow = {
  id: string;
  teacherName: string;
  subjectName: string | null;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string | null;
};

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() || fallback : fallback;
}

function nullableText(value: unknown) {
  const clean = text(value);
  return clean || null;
}

function parseDate(value: unknown) {
  const clean = text(value);
  if (!clean) return null;
  const date = new Date(clean);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await getCurrentUserContext();
    if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });
    if (!user.schoolId) return NextResponse.json({ error: "Create a school profile first." }, { status: 400 });

    const { id } = await params;
    const rows = await prisma.$queryRaw<StudentDetailRow[]>`
      select st."id", st."studentCode", st."admissionNumber", st."rollNo", st."name", st."status"::text as "status",
        st."imageUrl", st."dateOfBirth", st."gender", st."bloodGroup", st."admissionDate",
        st."emergencyContactName", st."emergencyContactPhone", st."addressLine1", st."addressLine2",
        st."city", st."state", st."postalCode", st."idCardIssuedAt", st."idCardExpiresAt", st."notes",
        st."schoolId", sc."name" as "schoolName", sc."code" as "schoolCode", sc."logoUrl" as "schoolLogoUrl",
        st."branchId", br."name" as "branchName", st."classId", cl."name" as "className", st."sectionId",
        se."name" as "sectionName", st."parentId", p."name" as "parentName", p."email" as "parentEmail",
        p."phone" as "parentPhone", p."relation" as "parentRelation", p."alternatePhone" as "parentAlternatePhone",
        st."createdAt"
      from "Student" st
      left join "School" sc on sc."id" = st."schoolId"
      left join "SchoolBranch" br on br."id" = st."branchId"
      left join "Class" cl on cl."id" = st."classId"
      left join "Section" se on se."id" = st."sectionId"
      left join "Parent" p on p."id" = st."parentId"
      where st."id" = ${id} and st."schoolId" = ${user.schoolId}
      limit 1
    `;
    const student = rows[0];
    if (!student) return NextResponse.json({ error: "Student was not found." }, { status: 404 });

    const assignments = student.classId
      ? await prisma.$queryRaw<TeacherAssignmentRow[]>`
          select cta."id", t."name" as "teacherName", sub."name" as "subjectName",
            cta."dayOfWeek", cta."startTime", cta."endTime", cta."room"
          from "ClassTeacherAssignment" cta
          join "Teacher" t on t."id" = cta."teacherId"
          left join "Subject" sub on sub."id" = cta."subjectId"
          where cta."classId" = ${student.classId}
            and cta."schoolId" = ${user.schoolId}
            and cta."status" = 'active'
            and (cta."sectionId" = ${student.sectionId} or cta."sectionId" is null)
          order by cta."dayOfWeek", cta."startTime"
        `
      : [];

    return NextResponse.json({
      student: {
        ...student,
        locationName: student.branchId ? student.branchName ?? "Branch" : student.schoolName ?? "Main campus",
        className: student.className ?? "Class not linked",
        sectionName: student.sectionName ?? "Section not linked",
        parentName: student.parentName ?? "Guardian not linked",
        parentPhone: student.parentPhone ?? "",
        teacherAssignments: assignments.map((assignment) => ({
          ...assignment,
          subjectName: assignment.subjectName ?? "Subject"
        }))
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load student detail." }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const user = await getCurrentUserContext();
    if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });
    if (!user.schoolId) return NextResponse.json({ error: "Create a school profile first." }, { status: 400 });

    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const status = text(body.status, "ACTIVE").toUpperCase();
    if (!["ACTIVE", "INACTIVE", "GRADUATED"].includes(status)) return NextResponse.json({ error: "Invalid student status." }, { status: 400 });
    if (!text(body.name)) return NextResponse.json({ error: "Student name is required." }, { status: 400 });
    const studentCode = text(body.studentCode);
    if (!studentCode) return NextResponse.json({ error: "Student ID is required." }, { status: 400 });

    const existing = await prisma.$queryRaw<Array<{ id: string; parentId: string | null }>>`
      select "id", "parentId" from "Student" where "id" = ${id} and "schoolId" = ${user.schoolId} limit 1
    `;
    if (!existing[0]) return NextResponse.json({ error: "Student was not found." }, { status: 404 });
    const duplicate = await prisma.$queryRaw<Array<{ id: string }>>`
      select "id" from "Student" where "studentCode" = ${studentCode} and "id" <> ${id} limit 1
    `;
    if (duplicate[0]) return NextResponse.json({ error: "This student ID is already used." }, { status: 409 });

    await prisma.$executeRaw`
      update "Student"
      set "studentCode" = ${studentCode}, "name" = ${text(body.name)}, "rollNo" = ${nullableText(body.rollNo)}, "admissionNumber" = ${nullableText(body.admissionNumber)},
        "status" = ${status}::"StudentStatus", "imageUrl" = ${nullableText(body.imageUrl)}, "dateOfBirth" = ${parseDate(body.dateOfBirth)},
        "gender" = ${nullableText(body.gender)}, "bloodGroup" = ${nullableText(body.bloodGroup)}, "admissionDate" = ${parseDate(body.admissionDate)},
        "emergencyContactName" = ${nullableText(body.emergencyContactName)}, "emergencyContactPhone" = ${nullableText(body.emergencyContactPhone)},
        "addressLine1" = ${nullableText(body.addressLine1)}, "addressLine2" = ${nullableText(body.addressLine2)}, "city" = ${nullableText(body.city)},
        "state" = ${nullableText(body.state)}, "postalCode" = ${nullableText(body.postalCode)}, "notes" = ${nullableText(body.notes)}, "updatedAt" = now()
      where "id" = ${id} and "schoolId" = ${user.schoolId}
    `;

    if (existing[0].parentId) {
      await prisma.$executeRaw`
        update "Parent"
        set "name" = ${text(body.parentName)}, "email" = ${nullableText(body.parentEmail)}, "phone" = ${text(body.parentPhone)},
          "relation" = ${nullableText(body.parentRelation)}, "alternatePhone" = ${nullableText(body.parentAlternatePhone)},
          "addressLine1" = ${nullableText(body.addressLine1)}, "addressLine2" = ${nullableText(body.addressLine2)},
          "city" = ${nullableText(body.city)}, "state" = ${nullableText(body.state)}, "postalCode" = ${nullableText(body.postalCode)}
        where "id" = ${existing[0].parentId} and "schoolId" = ${user.schoolId}
      `;
    }

    return NextResponse.json({ ok: true, message: "Student updated successfully." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update student." }, { status: 500 });
  }
}
