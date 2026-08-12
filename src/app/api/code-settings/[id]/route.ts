import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth/currentUser";
import { dbToAppRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";
import { resetCycles, type CodeResetCycle } from "@/lib/services/codes/codeTypes";

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

function normalizeReset(value: unknown): CodeResetCycle {
  const clean = text(value, "never").toLowerCase();
  return resetCycles.includes(clean as CodeResetCycle) ? clean as CodeResetCycle : "never";
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUserContext();
    if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });
    if (!user.schoolId) return NextResponse.json({ error: "Create a school profile first." }, { status: 400 });

    const role = dbToAppRole[user.role] ?? "staff";
    if (!canManage(role)) return NextResponse.json({ error: "You do not have permission to update code settings." }, { status: 403 });

    const { id } = await context.params;
    const body = await request.json() as Record<string, unknown>;
    const existing = await prisma.$queryRaw<Array<{ id: string; branchId: string | null }>>`
      select "id", "branchId" from "CodeSequenceSetting" where "id" = ${id} and "schoolId" = ${user.schoolId} limit 1
    `;
    const setting = existing[0];
    if (!setting) return NextResponse.json({ error: "Code setting not found." }, { status: 404 });
    if (role === "branch_admin" && setting.branchId !== user.branchId) return NextResponse.json({ error: "You can only edit your branch settings." }, { status: 403 });

    const label = text(body.label);
    const prefix = text(body.prefix).toUpperCase().replace(/[^A-Z0-9]+/g, "");
    const pattern = text(body.pattern, "{PREFIX}-{YEAR}-{SEQ4}").toUpperCase();
    const nextNumber = numberValue(body.nextNumber, 1);
    const padding = numberValue(body.padding, 4);
    const resetCycle = normalizeReset(body.resetCycle);
    const status = text(body.status, "active").toLowerCase() === "inactive" ? "inactive" : "active";

    if (!label || !prefix) return NextResponse.json({ error: "Label and prefix are required." }, { status: 400 });
    if (!pattern.includes("{SEQ")) return NextResponse.json({ error: "Pattern must include a sequence token like {SEQ4}." }, { status: 400 });
    if (nextNumber < 1) return NextResponse.json({ error: "Next number must be 1 or more." }, { status: 400 });
    if (padding < 1 || padding > 10) return NextResponse.json({ error: "Padding must be between 1 and 10." }, { status: 400 });

    await prisma.$executeRaw`
      update "CodeSequenceSetting"
      set "label" = ${label}, "prefix" = ${prefix}, "pattern" = ${pattern}, "nextNumber" = ${nextNumber},
        "padding" = ${padding}, "resetCycle" = ${resetCycle}, "status" = ${status}, "updatedAt" = now()
      where "id" = ${id}
    `;

    return NextResponse.json({ ok: true, message: "Code setting updated." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update code setting." }, { status: 500 });
  }
}
