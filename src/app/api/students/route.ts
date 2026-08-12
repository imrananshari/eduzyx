import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth/currentUser";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/services/auth/passwordService";
import { createParentInvite } from "@/lib/services/auth/parentInviteService";

type StudentListRow = {
  id: string;
  studentCode: string;
  admissionNumber: string | null;
  rollNo: string | null;
  name: string;
  status: string;
  imageUrl: string | null;
  branchId: string | null;
  branchName: string | null;
  schoolName: string | null;
  classId: string | null;
  className: string | null;
  sectionId: string | null;
  sectionName: string | null;
  parentName: string | null;
  parentEmail: string | null;
  parentPhone: string | null;
  createdAt: Date;
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

function parseLocationId(value: string) {
  if (value.startsWith("school:")) return { type: "school", id: value.slice("school:".length) };
  if (value.startsWith("branch:")) return { type: "branch", id: value.slice("branch:".length) };
  return { type: "branch", id: value };
}

type IdSettingRow = {
  id: string;
  branchId: string | null;
  classId: string | null;
  sectionId: string | null;
  prefix: string;
  nextNumber: number;
  padding: number;
  includeYear: boolean;
  separator: string;
};

function safeCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function buildCodeFromSetting(setting: Pick<IdSettingRow, "prefix" | "nextNumber" | "padding" | "includeYear" | "separator">) {
  const separator = setting.separator || "-";
  return [setting.prefix, setting.includeYear ? String(new Date().getFullYear()) : "", String(setting.nextNumber).padStart(setting.padding, "0")].filter(Boolean).join(separator);
}

async function findStudentIdSetting(schoolId: string, branchId: string | null, classId: string, sectionId: string) {
  const settings = await prisma.$queryRaw<IdSettingRow[]>`
    select "id", "branchId", "classId", "sectionId", "prefix", "nextNumber", "padding", "includeYear", "separator"
    from "StudentIdSetting"
    where "schoolId" = ${schoolId}
  `;
  return settings
    .filter((setting) => setting.branchId === branchId)
    .sort((left, right) => {
      const score = (setting: IdSettingRow) => (setting.sectionId === sectionId ? 4 : 0) + (setting.classId === classId ? 2 : 0) + (!setting.classId ? 1 : 0);
      return score(right) - score(left);
    })
    .find((setting) => (!setting.classId || setting.classId === classId) && (!setting.sectionId || setting.sectionId === sectionId));
}

async function generateStudentCode(schoolId: string, branchId: string | null, classId: string, sectionId: string) {
  const setting = await findStudentIdSetting(schoolId, branchId, classId, sectionId);
  if (setting) {
    const code = buildCodeFromSetting(setting);
    await prisma.$executeRaw`
      update "StudentIdSetting"
      set "nextNumber" = "nextNumber" + 1, "updatedAt" = now()
      where "id" = ${setting.id}
    `;
    return code;
  }

  const schools = await prisma.$queryRaw<Array<{ code: string; studentIdPrefix: string }>>`
    select "code", "studentIdPrefix" from "School" where "id" = ${schoolId} limit 1
  `;
  const school = schools[0];
  if (!school) throw new Error("School profile was not found.");

  let codePart = school.code;
  if (branchId) {
    const branches = await prisma.$queryRaw<Array<{ code: string }>>`
      select "code" from "SchoolBranch" where "id" = ${branchId} and "schoolId" = ${schoolId} limit 1
    `;
    codePart = branches[0]?.code ?? school.code;
  }

  const year = new Date().getFullYear();
  const prefix = `${safeCode(school.studentIdPrefix || "STU")}-${safeCode(codePart)}-${year}`;
  const counts = await prisma.$queryRaw<Array<{ count: number }>>`
    select count(*)::int as "count" from "Student" where "schoolId" = ${schoolId} and "studentCode" like ${`${prefix}-%`}
  `;
  return `${prefix}-${String((counts[0]?.count ?? 0) + 1).padStart(4, "0")}`;
}

async function createOrUpdateParentUser({
  schoolId,
  branchId,
  name,
  email,
  imageUrl
}: {
  schoolId: string;
  branchId: string | null;
  name: string;
  email: string;
  imageUrl: string | null;
}) {
  const existing = await prisma.$queryRaw<Array<{ id: string }>>`
    select "id" from "User" where "email" = ${email} limit 1
  `;
  const userId = existing[0]?.id ?? crypto.randomUUID();
  if (existing[0]) {
    await prisma.$executeRaw`
      update "User"
      set "name" = ${name}, "role" = 'PARENT'::"RoleName", "imageUrl" = coalesce(${imageUrl}, "imageUrl"),
        "schoolId" = ${schoolId}, "branchId" = ${branchId}, "updatedAt" = now()
      where "id" = ${userId}
    `;
  } else {
    await prisma.$executeRaw`
      insert into "User" ("id", "name", "email", "role", "imageUrl", "schoolId", "branchId", "emailVerified", "passwordHash", "createdAt", "updatedAt")
      values (${userId}, ${name}, ${email}, 'PARENT'::"RoleName", ${imageUrl}, ${schoolId}, ${branchId}, false, ${await hashPassword(crypto.randomUUID())}, now(), now())
    `;
  }
  return userId;
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUserContext();
    if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });
    if (!user.schoolId) return NextResponse.json({ error: "Create a school profile first.", students: [] }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId") ?? "all";
    const classId = searchParams.get("classId") ?? "all";
    const sectionId = searchParams.get("sectionId") ?? "all";
    const query = text(searchParams.get("query")).toLowerCase();
    const location = locationId === "all" ? null : parseLocationId(locationId);

    const rows = !location
      ? await prisma.$queryRaw<StudentListRow[]>`
          select st."id", st."studentCode", st."admissionNumber", st."rollNo", st."name", st."status"::text as "status",
            st."imageUrl", st."branchId", br."name" as "branchName", sc."name" as "schoolName",
            st."classId", cl."name" as "className", st."sectionId", se."name" as "sectionName",
            p."name" as "parentName", p."email" as "parentEmail", p."phone" as "parentPhone", st."createdAt"
          from "Student" st
          left join "School" sc on sc."id" = st."schoolId"
          left join "SchoolBranch" br on br."id" = st."branchId"
          left join "Class" cl on cl."id" = st."classId"
          left join "Section" se on se."id" = st."sectionId"
          left join "Parent" p on p."id" = st."parentId"
          where st."schoolId" = ${user.schoolId}
          order by st."createdAt" desc
        `
      : location.type === "school"
      ? await prisma.$queryRaw<StudentListRow[]>`
          select st."id", st."studentCode", st."admissionNumber", st."rollNo", st."name", st."status"::text as "status",
            st."imageUrl", st."branchId", br."name" as "branchName", sc."name" as "schoolName",
            st."classId", cl."name" as "className", st."sectionId", se."name" as "sectionName",
            p."name" as "parentName", p."email" as "parentEmail", p."phone" as "parentPhone", st."createdAt"
          from "Student" st
          left join "School" sc on sc."id" = st."schoolId"
          left join "SchoolBranch" br on br."id" = st."branchId"
          left join "Class" cl on cl."id" = st."classId"
          left join "Section" se on se."id" = st."sectionId"
          left join "Parent" p on p."id" = st."parentId"
          where st."schoolId" = ${user.schoolId} and st."branchId" is null
          order by st."createdAt" desc
        `
      : await prisma.$queryRaw<StudentListRow[]>`
          select st."id", st."studentCode", st."admissionNumber", st."rollNo", st."name", st."status"::text as "status",
            st."imageUrl", st."branchId", br."name" as "branchName", sc."name" as "schoolName",
            st."classId", cl."name" as "className", st."sectionId", se."name" as "sectionName",
            p."name" as "parentName", p."email" as "parentEmail", p."phone" as "parentPhone", st."createdAt"
          from "Student" st
          left join "School" sc on sc."id" = st."schoolId"
          left join "SchoolBranch" br on br."id" = st."branchId"
          left join "Class" cl on cl."id" = st."classId"
          left join "Section" se on se."id" = st."sectionId"
          left join "Parent" p on p."id" = st."parentId"
          where st."schoolId" = ${user.schoolId} and st."branchId" = ${location.id}
          order by st."createdAt" desc
        `;

    const filtered = rows.filter((row) => {
      const matchesClass = classId === "all" || row.classId === classId;
      const matchesSection = sectionId === "all" || row.sectionId === sectionId;
      const haystack = [row.name, row.studentCode, row.rollNo, row.parentName, row.parentEmail, row.parentPhone, row.className, row.sectionName].join(" ").toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      return matchesClass && matchesSection && matchesQuery;
    });

    return NextResponse.json({
      students: filtered.map((student) => ({
        ...student,
        locationName: student.branchId ? student.branchName ?? "Branch" : student.schoolName ?? "Main campus",
        className: student.className ?? "Class not linked",
        sectionName: student.sectionName ?? "Section not linked",
        parentName: student.parentName ?? "Guardian not linked"
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load students." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUserContext();
    if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });
    if (!user.schoolId) return NextResponse.json({ error: "Create a school profile first." }, { status: 400 });

    const body = (await request.json()) as Record<string, unknown>;
    const locationId = text(body.locationId);
    const location = locationId ? parseLocationId(locationId) : null;
    const classId = text(body.classId);
    const sectionId = text(body.sectionId);
    const studentName = text(body.name);
    const parentName = text(body.parentName);
    const parentEmail = text(body.parentEmail).toLowerCase();
    const parentPhone = text(body.parentPhone);
    const status = text(body.status, "ACTIVE").toUpperCase();

    if (!location) return NextResponse.json({ error: "Select a school or branch." }, { status: 400 });
    if (!classId || !sectionId) return NextResponse.json({ error: "Select class and section." }, { status: 400 });
    if (!studentName || !parentName || !parentPhone) return NextResponse.json({ error: "Student name, parent name, and parent phone are required." }, { status: 400 });
    if (!["ACTIVE", "INACTIVE", "GRADUATED"].includes(status)) return NextResponse.json({ error: "Invalid student status." }, { status: 400 });

    let branchId: string | null = null;
    if (location.type === "branch") {
      const branches = await prisma.$queryRaw<Array<{ id: string }>>`
        select "id" from "SchoolBranch" where "id" = ${location.id} and "schoolId" = ${user.schoolId} limit 1
      `;
      if (!branches[0]) return NextResponse.json({ error: "Selected branch was not found." }, { status: 400 });
      branchId = branches[0].id;
    } else if (location.id !== user.schoolId) {
      return NextResponse.json({ error: "Selected school was not found." }, { status: 400 });
    }

    const classes = branchId
      ? await prisma.$queryRaw<Array<{ id: string }>>`
          select "id" from "Class" where "id" = ${classId} and "schoolId" = ${user.schoolId} and "branchId" = ${branchId} limit 1
        `
      : await prisma.$queryRaw<Array<{ id: string }>>`
          select "id" from "Class" where "id" = ${classId} and "schoolId" = ${user.schoolId} and "branchId" is null limit 1
        `;
    if (!classes[0]) return NextResponse.json({ error: "Selected class does not belong to this location." }, { status: 400 });

    const sections = branchId
      ? await prisma.$queryRaw<Array<{ id: string }>>`
          select "id" from "Section" where "id" = ${sectionId} and "classId" = ${classId} and "schoolId" = ${user.schoolId} and "branchId" = ${branchId} limit 1
        `
      : await prisma.$queryRaw<Array<{ id: string }>>`
          select "id" from "Section" where "id" = ${sectionId} and "classId" = ${classId} and "schoolId" = ${user.schoolId} and "branchId" is null limit 1
        `;
    if (!sections[0]) return NextResponse.json({ error: "Selected section does not belong to this class." }, { status: 400 });

    let parentId = crypto.randomUUID();
    let parentUserId: string | null = null;
    const existingParent = parentEmail
      ? await prisma.$queryRaw<Array<{ id: string; userId: string | null }>>`
          select "id", "userId" from "Parent" where "schoolId" = ${user.schoolId} and lower("email") = lower(${parentEmail}) limit 1
        `
      : await prisma.$queryRaw<Array<{ id: string; userId: string | null }>>`
          select "id", "userId" from "Parent" where "schoolId" = ${user.schoolId} and "phone" = ${parentPhone} limit 1
        `;

    if (existingParent[0]) {
      parentId = existingParent[0].id;
      parentUserId = existingParent[0].userId;
      await prisma.$executeRaw`
        update "Parent"
        set "branchId" = ${branchId}, "name" = ${parentName}, "email" = ${parentEmail || null}, "phone" = ${parentPhone},
          "relation" = ${nullableText(body.parentRelation)}, "alternatePhone" = ${nullableText(body.parentAlternatePhone)},
          "addressLine1" = ${nullableText(body.addressLine1)}, "addressLine2" = ${nullableText(body.addressLine2)},
          "city" = ${nullableText(body.city)}, "state" = ${nullableText(body.state)}, "postalCode" = ${nullableText(body.postalCode)}
        where "id" = ${parentId}
      `;
    } else {
      if (parentEmail) {
        parentUserId = await createOrUpdateParentUser({ schoolId: user.schoolId, branchId, name: parentName, email: parentEmail, imageUrl: null });
      }
      await prisma.$executeRaw`
        insert into "Parent" (
          "id", "schoolId", "branchId", "userId", "name", "email", "phone", "relation", "alternatePhone",
          "addressLine1", "addressLine2", "city", "state", "postalCode", "createdAt"
        )
        values (
          ${parentId}, ${user.schoolId}, ${branchId}, ${parentUserId}, ${parentName}, ${parentEmail || null}, ${parentPhone},
          ${nullableText(body.parentRelation)}, ${nullableText(body.parentAlternatePhone)}, ${nullableText(body.addressLine1)},
          ${nullableText(body.addressLine2)}, ${nullableText(body.city)}, ${nullableText(body.state)}, ${nullableText(body.postalCode)}, now()
        )
      `;
    }

    if (parentEmail && !parentUserId) {
      parentUserId = await createOrUpdateParentUser({ schoolId: user.schoolId, branchId, name: parentName, email: parentEmail, imageUrl: null });
      await prisma.$executeRaw`update "Parent" set "userId" = ${parentUserId} where "id" = ${parentId}`;
    }

    const studentId = crypto.randomUUID();
    const studentCode = await generateStudentCode(user.schoolId, branchId, classId, sectionId);
    const admissionDate = parseDate(body.admissionDate) ?? new Date();
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    await prisma.$executeRaw`
      insert into "Student" (
        "id", "schoolId", "branchId", "studentCode", "admissionNumber", "rollNo", "name", "status", "classId", "sectionId",
        "parentId", "imageUrl", "dateOfBirth", "gender", "bloodGroup", "admissionDate", "emergencyContactName",
        "emergencyContactPhone", "addressLine1", "addressLine2", "city", "state", "postalCode", "idCardIssuedAt",
        "idCardExpiresAt", "notes", "createdAt", "updatedAt"
      )
      values (
        ${studentId}, ${user.schoolId}, ${branchId}, ${studentCode}, ${nullableText(body.admissionNumber)}, ${nullableText(body.rollNo)},
        ${studentName}, ${status}::"StudentStatus", ${classId}, ${sectionId}, ${parentId}, ${nullableText(body.imageUrl)},
        ${parseDate(body.dateOfBirth)}, ${nullableText(body.gender)}, ${nullableText(body.bloodGroup)}, ${admissionDate},
        ${nullableText(body.emergencyContactName)}, ${nullableText(body.emergencyContactPhone)}, ${nullableText(body.addressLine1)},
        ${nullableText(body.addressLine2)}, ${nullableText(body.city)}, ${nullableText(body.state)}, ${nullableText(body.postalCode)},
        ${issuedAt}, ${expiresAt}, ${nullableText(body.notes)}, now(), now()
      )
    `;

    let inviteMessage = "";
    if (parentEmail && parentUserId) {
      try {
        await createParentInvite({
          baseUrl: new URL(request.url).origin,
          parentId,
          userId: parentUserId,
          email: parentEmail,
          name: parentName,
          studentName
        });
        inviteMessage = " Parent invite email sent.";
      } catch {
        inviteMessage = " Parent saved, but invite email could not be sent. You can resend it from the student profile.";
      }
    }

    return NextResponse.json({ ok: true, message: `Student onboarded successfully.${inviteMessage}`, id: studentId, studentCode }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not onboard student." }, { status: 500 });
  }
}
