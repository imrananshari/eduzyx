import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth/currentUser";
import { dbToAppRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";
import { codeEntityTypes, resetCycles, type CodeEntityType, type CodeResetCycle, type CodeSettingRow } from "@/lib/services/codes/codeTypes";
import { previewCode } from "@/lib/services/codes/codeGenerator";

function canManage(role: string) {
  return ["boss", "superadmin", "admin", "branch_admin"].includes(role);
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() || fallback : fallback;
}

function numberValue(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : fallback;
}

function normalizeEntity(value: unknown): CodeEntityType | null {
  const clean = text(value).toLowerCase();
  return codeEntityTypes.includes(clean as CodeEntityType) ? clean as CodeEntityType : null;
}

function normalizeReset(value: unknown): CodeResetCycle {
  const clean = text(value, "never").toLowerCase();
  return resetCycles.includes(clean as CodeResetCycle) ? clean as CodeResetCycle : "never";
}

export async function GET() {
  try {
    const user = await getCurrentUserContext();
    if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });
    if (!user.schoolId) return NextResponse.json({ error: "Create a school profile first.", settings: [] }, { status: 400 });

    const role = dbToAppRole[user.role] ?? "staff";
    if (!canManage(role)) return NextResponse.json({ error: "You do not have permission to manage code settings." }, { status: 403 });

    const rows = role === "branch_admin"
      ? await prisma.$queryRaw<CodeSettingRow[]>`
          select cs.*, br."name" as "branchName", br."code" as "branchCode", sc."name" as "schoolName", sc."code" as "schoolCode"
          from "CodeSequenceSetting" cs
          join "School" sc on sc."id" = cs."schoolId"
          left join "SchoolBranch" br on br."id" = cs."branchId"
          where cs."schoolId" = ${user.schoolId} and cs."branchId" = ${user.branchId}
          order by cs."createdAt" desc
        `
      : await prisma.$queryRaw<CodeSettingRow[]>`
          select cs.*, br."name" as "branchName", br."code" as "branchCode", sc."name" as "schoolName", sc."code" as "schoolCode"
          from "CodeSequenceSetting" cs
          join "School" sc on sc."id" = cs."schoolId"
          left join "SchoolBranch" br on br."id" = cs."branchId"
          where cs."schoolId" = ${user.schoolId}
          order by cs."createdAt" desc
        `;

    const settings = await Promise.all(rows.map(async (row) => ({
      ...row,
      scopeLabel: row.branchId ? row.branchName ?? "Branch" : "Organization",
      preview: await previewCode(row)
    })));

    return NextResponse.json({ settings, entityTypes: codeEntityTypes, resetCycles });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load code settings." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUserContext();
    if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });
    if (!user.schoolId) return NextResponse.json({ error: "Create a school profile first." }, { status: 400 });

    const role = dbToAppRole[user.role] ?? "staff";
    if (!canManage(role)) return NextResponse.json({ error: "You do not have permission to create code settings." }, { status: 403 });

    const body = await request.json() as Record<string, unknown>;
    const entityType = normalizeEntity(body.entityType);
    const label = text(body.label);
    const prefix = text(body.prefix).toUpperCase().replace(/[^A-Z0-9]+/g, "");
    const pattern = text(body.pattern, "{PREFIX}-{YEAR}-{SEQ4}").toUpperCase();
    const nextNumber = numberValue(body.nextNumber, 1);
    const padding = numberValue(body.padding, 4);
    const resetCycle = normalizeReset(body.resetCycle);
    const status = text(body.status, "active").toLowerCase() === "inactive" ? "inactive" : "active";
    let branchId = text(body.branchId) || null;

    if (!entityType) return NextResponse.json({ error: "Select a valid entity type." }, { status: 400 });
    if (!label || !prefix) return NextResponse.json({ error: "Label and prefix are required." }, { status: 400 });
    if (!pattern.includes("{SEQ")) return NextResponse.json({ error: "Pattern must include a sequence token like {SEQ4}." }, { status: 400 });
    if (nextNumber < 1) return NextResponse.json({ error: "Next number must be 1 or more." }, { status: 400 });
    if (padding < 1 || padding > 10) return NextResponse.json({ error: "Padding must be between 1 and 10." }, { status: 400 });

    if (role === "branch_admin") branchId = user.branchId;
    if (branchId) {
      const branches = await prisma.$queryRaw<Array<{ id: string }>>`
        select "id" from "SchoolBranch" where "id" = ${branchId} and "schoolId" = ${user.schoolId} limit 1
      `;
      if (!branches[0]) return NextResponse.json({ error: "Selected branch was not found." }, { status: 400 });
    }

    const duplicates = branchId
      ? await prisma.$queryRaw<Array<{ id: string }>>`
          select "id" from "CodeSequenceSetting"
          where "schoolId" = ${user.schoolId} and "branchId" = ${branchId} and "entityType" = ${entityType}
          limit 1
        `
      : await prisma.$queryRaw<Array<{ id: string }>>`
          select "id" from "CodeSequenceSetting"
          where "schoolId" = ${user.schoolId} and "branchId" is null and "entityType" = ${entityType}
          limit 1
        `;
    if (duplicates[0]) return NextResponse.json({ error: "A code setting already exists for this entity and scope. Edit it instead." }, { status: 400 });

    const id = crypto.randomUUID();
    await prisma.$executeRaw`
      insert into "CodeSequenceSetting" (
        "id", "schoolId", "branchId", "entityType", "label", "prefix", "pattern", "nextNumber",
        "padding", "resetCycle", "status", "createdByUserId", "createdAt", "updatedAt"
      )
      values (${id}, ${user.schoolId}, ${branchId}, ${entityType}, ${label}, ${prefix}, ${pattern}, ${nextNumber}, ${padding}, ${resetCycle}, ${status}, ${user.id}, now(), now())
    `;

    return NextResponse.json({ ok: true, message: "Code setting created.", id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create code setting." }, { status: 500 });
  }
}
