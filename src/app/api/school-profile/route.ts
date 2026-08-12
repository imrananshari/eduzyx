import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth/currentUser";
import { prisma } from "@/lib/db";

type SchoolProfileRow = {
  userId: string;
  schoolId: string | null;
  branchId: string | null;
  schoolName: string | null;
  schoolCode: string | null;
  schoolType: string | null;
  board: string | null;
  academicYearStart: string | null;
  academicYearEnd: string | null;
  timezone: string | null;
  currency: string | null;
  schoolEmail: string | null;
  schoolPhone: string | null;
  schoolWhatsapp: string | null;
  website: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  principalName: string | null;
  registrationNumber: string | null;
  taxNumber: string | null;
  attendanceMode: string | null;
  feeCycle: string | null;
  studentIdPrefix: string | null;
  receiptPrefix: string | null;
  defaultClassCapacity: number | null;
  schoolClassFrom: string | null;
  schoolClassTo: string | null;
  parentPortalEnabled: boolean | null;
  studentPortalEnabled: boolean | null;
  whatsappEnabled: boolean | null;
  paymentsEnabled: boolean | null;
  status: string | null;
  branchName: string | null;
  branchCode: string | null;
  branchType: string | null;
  branchStatus: string | null;
  branchEmail: string | null;
  branchPhone: string | null;
  branchWhatsapp: string | null;
  branchAddressLine1: string | null;
  branchAddressLine2: string | null;
  branchCity: string | null;
  branchState: string | null;
  branchCountry: string | null;
  branchPostalCode: string | null;
  branchHeadName: string | null;
  academicYear: string | null;
  workingDays: string | null;
  timetableStart: string | null;
  timetableEnd: string | null;
  branchClassFrom: string | null;
  branchClassTo: string | null;
};

type OnboardingBody = {
  schoolName?: string;
  schoolCode?: string;
  schoolType?: string;
  board?: string;
  academicYearStart?: string;
  academicYearEnd?: string;
  timezone?: string;
  currency?: string;
  schoolEmail?: string;
  schoolPhone?: string;
  schoolWhatsapp?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  principalName?: string;
  registrationNumber?: string;
  taxNumber?: string;
  attendanceMode?: string;
  feeCycle?: string;
  studentIdPrefix?: string;
  receiptPrefix?: string;
  defaultClassCapacity?: string | number;
  schoolClassFrom?: string;
  schoolClassTo?: string;
  branchClassFrom?: string;
  branchClassTo?: string;
  parentPortalEnabled?: boolean;
  studentPortalEnabled?: boolean;
  whatsappEnabled?: boolean;
  paymentsEnabled?: boolean;
  hasBranch?: boolean;
  branchNameSameAsSchool?: boolean;
  branchContactSameAsSchool?: boolean;
  branchAddressSameAsSchool?: boolean;
  branchHeadSameAsSchool?: boolean;
  branchName?: string;
  branchCode?: string;
  branchType?: string;
  branchEmail?: string;
  branchPhone?: string;
  branchWhatsapp?: string;
  branchAddressLine1?: string;
  branchAddressLine2?: string;
  branchCity?: string;
  branchState?: string;
  branchCountry?: string;
  branchPostalCode?: string;
  branchHeadName?: string;
  academicYear?: string;
  workingDays?: string;
  timetableStart?: string;
  timetableEnd?: string;
};

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() || fallback : fallback;
}

function bool(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

export async function GET() {
  try {
    const user = await getCurrentUserContext();

    if (!user) {
      return NextResponse.json({ error: "Login required." }, { status: 401 });
    }

    const rows = await prisma.$queryRaw<SchoolProfileRow[]>`
      select
        u."id" as "userId",
        u."schoolId",
        u."branchId",
        sc."name" as "schoolName",
        sc."code" as "schoolCode",
        sc."type" as "schoolType",
        sc."board",
        sc."academicYearStart",
        sc."academicYearEnd",
        sc."timezone",
        sc."currency",
        sc."email" as "schoolEmail",
        sc."phone" as "schoolPhone",
        sc."whatsappPhone" as "schoolWhatsapp",
        sc."website",
        sc."addressLine1",
        sc."addressLine2",
        sc."city",
        sc."state",
        sc."country",
        sc."postalCode",
        sc."logoUrl",
        sc."coverImageUrl",
        sc."principalName",
        sc."registrationNumber",
        sc."taxNumber",
        sc."attendanceMode",
        sc."feeCycle",
        sc."studentIdPrefix",
        sc."receiptPrefix",
        sc."defaultClassCapacity",
        sc."classFrom" as "schoolClassFrom",
        sc."classTo" as "schoolClassTo",
        sc."parentPortalEnabled",
        sc."studentPortalEnabled",
        sc."whatsappEnabled",
        sc."paymentsEnabled",
        sc."status",
        br."name" as "branchName",
        br."code" as "branchCode",
        br."type" as "branchType",
        br."status" as "branchStatus",
        br."email" as "branchEmail",
        br."phone" as "branchPhone",
        br."whatsappPhone" as "branchWhatsapp",
        br."addressLine1" as "branchAddressLine1",
        br."addressLine2" as "branchAddressLine2",
        br."city" as "branchCity",
        br."state" as "branchState",
        br."country" as "branchCountry",
        br."postalCode" as "branchPostalCode",
        br."branchHeadName",
        br."academicYear",
        br."workingDays",
        br."timetableStart",
        br."timetableEnd",
        br."classFrom" as "branchClassFrom",
        br."classTo" as "branchClassTo"
      from "User" u
      left join "School" sc on sc."id" = u."schoolId"
      left join "SchoolBranch" br on br."id" = u."branchId"
      where u."id" = ${user.id}
      limit 1
    `;
    const row = rows[0];

    return NextResponse.json({
      hasSchoolProfile: Boolean(row?.schoolId),
      school: row?.schoolId ? {
        id: row.schoolId,
        name: row.schoolName,
        code: row.schoolCode,
        type: row.schoolType,
        board: row.board,
        academicYearStart: row.academicYearStart,
        academicYearEnd: row.academicYearEnd,
        timezone: row.timezone,
        currency: row.currency,
        email: row.schoolEmail,
        phone: row.schoolPhone,
        whatsappPhone: row.schoolWhatsapp,
        website: row.website,
        addressLine1: row.addressLine1,
        addressLine2: row.addressLine2,
        city: row.city,
        state: row.state,
        country: row.country,
        postalCode: row.postalCode,
        logoUrl: row.logoUrl,
        coverImageUrl: row.coverImageUrl,
        principalName: row.principalName,
        registrationNumber: row.registrationNumber,
        taxNumber: row.taxNumber,
        attendanceMode: row.attendanceMode,
        feeCycle: row.feeCycle,
        studentIdPrefix: row.studentIdPrefix,
        receiptPrefix: row.receiptPrefix,
        defaultClassCapacity: row.defaultClassCapacity,
        classFrom: row.schoolClassFrom,
        classTo: row.schoolClassTo,
        parentPortalEnabled: row.parentPortalEnabled,
        studentPortalEnabled: row.studentPortalEnabled,
        whatsappEnabled: row.whatsappEnabled,
        paymentsEnabled: row.paymentsEnabled,
        status: row.status
      } : null,
      branch: row?.branchId ? {
        id: row.branchId,
        name: row.branchName,
        code: row.branchCode,
        type: row.branchType,
        status: row.branchStatus,
        email: row.branchEmail,
        phone: row.branchPhone,
        whatsappPhone: row.branchWhatsapp,
        addressLine1: row.branchAddressLine1,
        addressLine2: row.branchAddressLine2,
        city: row.branchCity,
        state: row.branchState,
        country: row.branchCountry,
        postalCode: row.branchPostalCode,
        branchHeadName: row.branchHeadName,
        academicYear: row.academicYear,
        attendanceMode: row.attendanceMode,
        feeCycle: row.feeCycle,
        defaultClassCapacity: row.defaultClassCapacity,
        classFrom: row.branchClassFrom,
        classTo: row.branchClassTo,
        workingDays: row.workingDays,
        timetableStart: row.timetableStart,
        timetableEnd: row.timetableEnd,
        logoUrl: row.logoUrl
      } : null
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load school profile." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUserContext();

    if (!user) {
      return NextResponse.json({ error: "Login required." }, { status: 401 });
    }

    const body = (await request.json()) as OnboardingBody;
    const linked = await prisma.$queryRaw<Array<{ schoolId: string | null; branchId: string | null }>>`
      select "schoolId", "branchId"
      from "User"
      where "id" = ${user.id}
      limit 1
    `;
    const schoolId = linked[0]?.schoolId;
    const branchId = linked[0]?.branchId;

    if (!schoolId || !branchId) {
      return NextResponse.json({ error: "Create a school profile first." }, { status: 400 });
    }

    const defaultClassCapacity = Number(body.defaultClassCapacity);
    if (!Number.isInteger(defaultClassCapacity) || defaultClassCapacity < 1) {
      return NextResponse.json({ error: "Total enrollment capacity must be 1 or more." }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.$executeRaw`
        update "School"
        set
          "name" = ${text(body.schoolName)},
          "code" = ${text(body.schoolCode).toUpperCase()},
          "type" = ${text(body.schoolType, "school")},
          "board" = ${text(body.board, "Other")},
          "academicYearStart" = ${text(body.academicYearStart, "April")},
          "academicYearEnd" = ${text(body.academicYearEnd, "March")},
          "timezone" = ${text(body.timezone, "Asia/Kolkata")},
          "currency" = ${text(body.currency, "INR")},
          "email" = ${text(body.schoolEmail)},
          "phone" = ${text(body.schoolPhone)},
          "whatsappPhone" = ${text(body.schoolWhatsapp) || null},
          "website" = ${text(body.website) || null},
          "addressLine1" = ${text(body.addressLine1)},
          "addressLine2" = ${text(body.addressLine2) || null},
          "city" = ${text(body.city)},
          "state" = ${text(body.state)},
          "country" = ${text(body.country)},
          "postalCode" = ${text(body.postalCode)},
          "logoUrl" = ${text(body.logoUrl) || null},
          "coverImageUrl" = ${text(body.coverImageUrl) || null},
          "principalName" = ${text(body.principalName) || null},
          "registrationNumber" = ${text(body.registrationNumber) || null},
          "taxNumber" = ${text(body.taxNumber) || null},
          "attendanceMode" = ${text(body.attendanceMode, "daily")},
          "feeCycle" = ${text(body.feeCycle, "monthly")},
          "studentIdPrefix" = ${text(body.studentIdPrefix, "STU")},
          "receiptPrefix" = ${text(body.receiptPrefix, "RCT")},
          "defaultClassCapacity" = ${defaultClassCapacity},
          "classFrom" = ${text(body.schoolClassFrom, "Nursery")},
          "classTo" = ${text(body.schoolClassTo, "Class 12")},
          "parentPortalEnabled" = ${bool(body.parentPortalEnabled, true)},
          "studentPortalEnabled" = ${bool(body.studentPortalEnabled, true)},
          "whatsappEnabled" = ${bool(body.whatsappEnabled)},
          "paymentsEnabled" = ${bool(body.paymentsEnabled)},
          "updatedAt" = now()
        where "id" = ${schoolId}
      `,
      prisma.$executeRaw`
        update "SchoolBranch"
        set
          "name" = ${text(body.branchName, `${text(body.schoolName)} Branch`)},
          "code" = ${text(body.branchCode, `${text(body.schoolCode).toUpperCase()}-MAIN`).toUpperCase()},
          "type" = 'branch',
          "email" = ${text(body.branchEmail, text(body.schoolEmail))},
          "phone" = ${text(body.branchPhone, text(body.schoolPhone))},
          "whatsappPhone" = ${text(body.branchWhatsapp) || null},
          "addressLine1" = ${text(body.branchAddressLine1, text(body.addressLine1))},
          "addressLine2" = ${text(body.branchAddressLine2) || null},
          "city" = ${text(body.branchCity, text(body.city))},
          "state" = ${text(body.branchState, text(body.state))},
          "country" = ${text(body.branchCountry, text(body.country))},
          "postalCode" = ${text(body.branchPostalCode, text(body.postalCode))},
          "branchHeadName" = ${text(body.branchHeadName) || null},
          "academicYear" = ${text(body.academicYear, "2026-2027")},
          "attendanceMode" = ${text(body.attendanceMode, "daily")},
          "feeCycle" = ${text(body.feeCycle, "monthly")},
          "defaultClassCapacity" = ${defaultClassCapacity},
          "classFrom" = ${text(body.branchClassFrom, text(body.schoolClassFrom, "Nursery"))},
          "classTo" = ${text(body.branchClassTo, text(body.schoolClassTo, "Class 12"))},
          "workingDays" = ${text(body.workingDays, "Mon,Tue,Wed,Thu,Fri,Sat")},
          "timetableStart" = ${text(body.timetableStart, "08:00")},
          "timetableEnd" = ${text(body.timetableEnd, "15:00")},
          "logoUrl" = ${text(body.logoUrl) || null},
          "updatedAt" = now()
        where "id" = ${branchId}
      `
    ]);

    return NextResponse.json({ ok: true, message: "School profile updated successfully." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update school profile." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUserContext();

    if (!user) {
      return NextResponse.json({ error: "Login required." }, { status: 401 });
    }

    const body = (await request.json()) as OnboardingBody;
    const hasBranch = bool(body.hasBranch);
    const branchNameSameAsSchool = bool(body.branchNameSameAsSchool, true);
    const branchContactSameAsSchool = bool(body.branchContactSameAsSchool, true);
    const branchAddressSameAsSchool = bool(body.branchAddressSameAsSchool, true);
    const branchHeadSameAsSchool = bool(body.branchHeadSameAsSchool, true);
    const required = [
      ["schoolName", body.schoolName],
      ["schoolCode", body.schoolCode],
      ["schoolEmail", body.schoolEmail],
      ["schoolPhone", body.schoolPhone],
      ["addressLine1", body.addressLine1],
      ["city", body.city],
      ["state", body.state],
      ["country", body.country],
      ["postalCode", body.postalCode]
    ];

    if (hasBranch) {
      required.push(["branchCode", body.branchCode]);
      if (!branchNameSameAsSchool) required.push(["branchName", body.branchName]);
      if (!branchContactSameAsSchool) {
        required.push(["branchEmail", body.branchEmail]);
        required.push(["branchPhone", body.branchPhone]);
      }
      if (!branchAddressSameAsSchool) {
        required.push(["branchAddressLine1", body.branchAddressLine1]);
        required.push(["branchCity", body.branchCity]);
        required.push(["branchState", body.branchState]);
        required.push(["branchCountry", body.branchCountry]);
        required.push(["branchPostalCode", body.branchPostalCode]);
      }
      if (!branchHeadSameAsSchool) required.push(["branchHeadName", body.branchHeadName]);
    }

    const missing = required.find(([, value]) => !text(value));
    if (missing) {
      return NextResponse.json({ error: `${missing[0]} is required.` }, { status: 400 });
    }

    const defaultClassCapacity = Number(body.defaultClassCapacity);
    if (!Number.isInteger(defaultClassCapacity) || defaultClassCapacity < 1) {
      return NextResponse.json({ error: "Default class capacity must be 1 or more." }, { status: 400 });
    }

    const existingSchool = await prisma.$queryRaw<Array<{ schoolId: string | null }>>`
      select "schoolId"
      from "User"
      where "id" = ${user.id}
      limit 1
    `;

    if (existingSchool[0]?.schoolId) {
      return NextResponse.json({ error: "School profile is already linked to this account." }, { status: 400 });
    }

    const schoolId = crypto.randomUUID();
    const branchId = crypto.randomUUID();
    const ownerRows = user.role === "SUPERADMIN"
      ? await prisma.$queryRaw<Array<{ id: string }>>`
          select boss."id"
          from "UserInviteToken" invite
          join "User" boss on boss."id" = invite."createdByUserId"
          where invite."targetUserId" = ${user.id}
            and invite."role" = 'SUPERADMIN'::"RoleName"
            and boss."role" = 'BOSS'::"RoleName"
          order by invite."createdAt" desc
          limit 1
        `
      : [];
    const ownerUserId = ownerRows[0]?.id ?? user.id;
    const attendanceMode = text(body.attendanceMode, "daily");
    const feeCycle = text(body.feeCycle, "monthly");
    const schoolName = text(body.schoolName);
    const schoolCode = text(body.schoolCode).toUpperCase();
    const schoolClassFrom = text(body.schoolClassFrom, "Nursery");
    const schoolClassTo = text(body.schoolClassTo, "Class 12");
    const branchName = hasBranch && !branchNameSameAsSchool ? text(body.branchName) : `${schoolName} Branch`;
    const branchCode = hasBranch ? text(body.branchCode).toUpperCase() : `${schoolCode}-MAIN`;
    const branchEmail = hasBranch && !branchContactSameAsSchool ? text(body.branchEmail) : text(body.schoolEmail);
    const branchPhone = hasBranch && !branchContactSameAsSchool ? text(body.branchPhone) : text(body.schoolPhone);
    const branchWhatsapp = hasBranch && !branchContactSameAsSchool ? text(body.branchWhatsapp) : text(body.schoolWhatsapp);
    const branchAddressLine1 = hasBranch && !branchAddressSameAsSchool ? text(body.branchAddressLine1) : text(body.addressLine1);
    const branchAddressLine2 = hasBranch && !branchAddressSameAsSchool ? text(body.branchAddressLine2) : text(body.addressLine2);
    const branchCity = hasBranch && !branchAddressSameAsSchool ? text(body.branchCity) : text(body.city);
    const branchState = hasBranch && !branchAddressSameAsSchool ? text(body.branchState) : text(body.state);
    const branchCountry = hasBranch && !branchAddressSameAsSchool ? text(body.branchCountry) : text(body.country);
    const branchPostalCode = hasBranch && !branchAddressSameAsSchool ? text(body.branchPostalCode) : text(body.postalCode);
    const branchHeadName = hasBranch && !branchHeadSameAsSchool ? text(body.branchHeadName) : text(body.principalName);
    const branchClassFrom = hasBranch ? text(body.branchClassFrom, schoolClassFrom) : schoolClassFrom;
    const branchClassTo = hasBranch ? text(body.branchClassTo, schoolClassTo) : schoolClassTo;

    await prisma.$transaction([
      prisma.$executeRaw`
        insert into "School" (
          "id", "name", "code", "type", "board", "academicYearStart", "academicYearEnd", "timezone", "currency",
          "email", "phone", "whatsappPhone", "website", "addressLine1", "addressLine2", "city", "state", "country", "postalCode",
          "logoUrl", "coverImageUrl", "principalName", "registrationNumber", "taxNumber", "attendanceMode", "feeCycle",
          "studentIdPrefix", "receiptPrefix", "defaultClassCapacity", "parentPortalEnabled", "studentPortalEnabled",
          "classFrom", "classTo",
          "whatsappEnabled", "paymentsEnabled", "status", "ownerUserId", "createdAt", "updatedAt"
        )
        values (
          ${schoolId}, ${schoolName}, ${schoolCode}, ${text(body.schoolType, "school")},
          ${text(body.board, "Other")}, ${text(body.academicYearStart, "April")}, ${text(body.academicYearEnd, "March")},
          ${text(body.timezone, "Asia/Kolkata")}, ${text(body.currency, "INR")}, ${text(body.schoolEmail)}, ${text(body.schoolPhone)},
          ${text(body.schoolWhatsapp) || null}, ${text(body.website) || null}, ${text(body.addressLine1)}, ${text(body.addressLine2) || null},
          ${text(body.city)}, ${text(body.state)}, ${text(body.country)}, ${text(body.postalCode)}, ${text(body.logoUrl) || null},
          ${text(body.coverImageUrl) || null}, ${text(body.principalName) || null}, ${text(body.registrationNumber) || null},
          ${text(body.taxNumber) || null}, ${attendanceMode}, ${feeCycle}, ${text(body.studentIdPrefix, "STU")},
          ${text(body.receiptPrefix, "RCT")}, ${defaultClassCapacity}, ${bool(body.parentPortalEnabled, true)},
          ${bool(body.studentPortalEnabled, true)}, ${schoolClassFrom}, ${schoolClassTo}, ${bool(body.whatsappEnabled)}, ${bool(body.paymentsEnabled)},
          'active', ${ownerUserId}, now(), now()
        )
      `,
      prisma.$executeRaw`
        insert into "SchoolBranch" (
          "id", "schoolId", "name", "code", "type", "isMain", "status", "email", "phone", "whatsappPhone",
          "addressLine1", "addressLine2", "city", "state", "country", "postalCode", "branchHeadName",
          "branchAdminUserId", "academicYear", "attendanceMode", "feeCycle", "defaultClassCapacity", "workingDays",
          "classFrom", "classTo",
          "timetableStart", "timetableEnd", "logoUrl", "createdAt", "updatedAt"
        )
        values (
          ${branchId}, ${schoolId}, ${branchName}, ${branchCode}, 'branch',
          false, 'active', ${branchEmail}, ${branchPhone}, ${branchWhatsapp || null},
          ${branchAddressLine1}, ${branchAddressLine2 || null}, ${branchCity}, ${branchState},
          ${branchCountry}, ${branchPostalCode}, ${branchHeadName || null}, ${user.id},
          ${text(body.academicYear, "2026-2027")}, ${attendanceMode}, ${feeCycle}, ${defaultClassCapacity},
          ${text(body.workingDays, "Mon,Tue,Wed,Thu,Fri,Sat")}, ${branchClassFrom}, ${branchClassTo}, ${text(body.timetableStart, "08:00")},
          ${text(body.timetableEnd, "15:00")}, ${text(body.logoUrl) || null}, now(), now()
        )
      `,
      prisma.$executeRaw`
        update "User"
        set "schoolId" = ${schoolId}, "branchId" = ${branchId}, "updatedAt" = now()
        where "id" = ${user.id}
           or "id" = ${ownerUserId}
           or "id" in (
             select "targetUserId"
             from "UserInviteToken"
             where "createdByUserId" = ${ownerUserId}
               and "role" = 'SUPERADMIN'::"RoleName"
           )
      `
    ]);

    return NextResponse.json({
      ok: true,
      message: "School profile created successfully.",
      school: { id: schoolId, name: schoolName },
      branch: { id: branchId, name: branchName }
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create school profile." }, { status: 500 });
  }
}
