import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth/currentUser";
import { prisma } from "@/lib/db";

type SettingRow = {
  id: string;
  schoolId: string;
  branchId: string | null;
  classId: string | null;
  sectionId: string | null;
  prefix: string;
  nextNumber: number;
  padding: number;
  includeYear: boolean;
  separator: string;
  className: string | null;
  sectionName: string | null;
  branchName: string | null;
  schoolName: string | null;
  updatedAt: Date;
};

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() || fallback : fallback;
}

function parseLocationId(value: string) {
  if (value.startsWith("school:")) return { type: "school", id: value.slice("school:".length) };
  if (value.startsWith("branch:")) return { type: "branch", id: value.slice("branch:".length) };
  return { type: "branch", id: value };
}

function buildPreview(setting: { prefix: string; nextNumber: number; padding: number; includeYear: boolean; separator: string }) {
  const separator = setting.separator || "-";
  return [setting.prefix, setting.includeYear ? String(new Date().getFullYear()) : "", String(setting.nextNumber).padStart(setting.padding, "0")].filter(Boolean).join(separator);
}

export async function GET() {
  try {
    const user = await getCurrentUserContext();
    if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });
    if (!user.schoolId) return NextResponse.json({ error: "Create a school profile first.", settings: [] }, { status: 400 });

    const rows = await prisma.$queryRaw<SettingRow[]>`
      select s."id", s."schoolId", s."branchId", s."classId", s."sectionId", s."prefix", s."nextNumber",
        s."padding", s."includeYear", s."separator", c."name" as "className", sec."name" as "sectionName",
        br."name" as "branchName", sc."name" as "schoolName", s."updatedAt"
      from "StudentIdSetting" s
      left join "Class" c on c."id" = s."classId"
      left join "Section" sec on sec."id" = s."sectionId"
      left join "SchoolBranch" br on br."id" = s."branchId"
      left join "School" sc on sc."id" = s."schoolId"
      where s."schoolId" = ${user.schoolId}
      order by s."updatedAt" desc
    `;

    return NextResponse.json({
      settings: rows.map((row) => ({
        ...row,
        locationName: row.branchId ? row.branchName ?? "Branch" : row.schoolName ?? "Main campus",
        className: row.className ?? "All classes",
        sectionName: row.sectionName ?? "All sections",
        nextPreview: buildPreview(row)
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load student ID settings." }, { status: 500 });
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
    const prefix = text(body.prefix).toUpperCase().replace(/[^A-Z0-9-]/g, "");
    const nextNumber = Number(body.nextNumber);
    const padding = Number(body.padding);
    const separator = text(body.separator, "-").slice(0, 3);
    const includeYear = Boolean(body.includeYear);
    const classId = text(body.classId) || null;
    const sectionId = text(body.sectionId) || null;

    if (!location) return NextResponse.json({ error: "Select a school or branch." }, { status: 400 });
    if (!prefix) return NextResponse.json({ error: "Prefix is required." }, { status: 400 });
    if (!Number.isInteger(nextNumber) || nextNumber < 1) return NextResponse.json({ error: "Next number must be 1 or more." }, { status: 400 });
    if (!Number.isInteger(padding) || padding < 2 || padding > 8) return NextResponse.json({ error: "Padding must be between 2 and 8." }, { status: 400 });

    let branchId: string | null = null;
    if (location.type === "branch") {
      const branch = await prisma.$queryRaw<Array<{ id: string }>>`
        select "id" from "SchoolBranch" where "id" = ${location.id} and "schoolId" = ${user.schoolId} limit 1
      `;
      if (!branch[0]) return NextResponse.json({ error: "Selected branch was not found." }, { status: 400 });
      branchId = branch[0].id;
    } else if (location.id !== user.schoolId) {
      return NextResponse.json({ error: "Selected school was not found." }, { status: 400 });
    }

    if (classId) {
      const klass = branchId
        ? await prisma.$queryRaw<Array<{ id: string }>>`select "id" from "Class" where "id" = ${classId} and "schoolId" = ${user.schoolId} and "branchId" = ${branchId} limit 1`
        : await prisma.$queryRaw<Array<{ id: string }>>`select "id" from "Class" where "id" = ${classId} and "schoolId" = ${user.schoolId} and "branchId" is null limit 1`;
      if (!klass[0]) return NextResponse.json({ error: "Selected class does not belong to this location." }, { status: 400 });
    }

    if (sectionId && classId) {
      const section = branchId
        ? await prisma.$queryRaw<Array<{ id: string }>>`select "id" from "Section" where "id" = ${sectionId} and "classId" = ${classId} and "schoolId" = ${user.schoolId} and "branchId" = ${branchId} limit 1`
        : await prisma.$queryRaw<Array<{ id: string }>>`select "id" from "Section" where "id" = ${sectionId} and "classId" = ${classId} and "schoolId" = ${user.schoolId} and "branchId" is null limit 1`;
      if (!section[0]) return NextResponse.json({ error: "Selected section does not belong to this class." }, { status: 400 });
    }

    const allSettings = await prisma.$queryRaw<Array<{ id: string; branchId: string | null; classId: string | null; sectionId: string | null }>>`
      select "id", "branchId", "classId", "sectionId" from "StudentIdSetting" where "schoolId" = ${user.schoolId}
    `;
    const existing = allSettings.find((item) => item.branchId === branchId && item.classId === classId && item.sectionId === sectionId);
    const id = existing?.id ?? crypto.randomUUID();

    if (existing) {
      await prisma.$executeRaw`
        update "StudentIdSetting"
        set "prefix" = ${prefix}, "nextNumber" = ${nextNumber}, "padding" = ${padding}, "includeYear" = ${includeYear},
          "separator" = ${separator}, "updatedAt" = now()
        where "id" = ${id} and "schoolId" = ${user.schoolId}
      `;
    } else {
      await prisma.$executeRaw`
        insert into "StudentIdSetting" ("id", "schoolId", "branchId", "classId", "sectionId", "prefix", "nextNumber", "padding", "includeYear", "separator", "updatedAt", "createdAt")
        values (${id}, ${user.schoolId}, ${branchId}, ${classId}, ${sectionId}, ${prefix}, ${nextNumber}, ${padding}, ${includeYear}, ${separator}, now(), now())
      `;
    }

    return NextResponse.json({ ok: true, message: "Student ID master setting saved.", nextPreview: buildPreview({ prefix, nextNumber, padding, includeYear, separator }) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save student ID setting." }, { status: 500 });
  }
}
