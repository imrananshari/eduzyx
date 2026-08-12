import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth/currentUser";
import { dbToAppRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUserContext();
    if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });
    if (!user.schoolId) return NextResponse.json({ error: "Create a school profile first." }, { status: 400 });
    const role = dbToAppRole[user.role] ?? "staff";
    if (!["boss", "superadmin", "admin", "branch_admin"].includes(role)) return NextResponse.json({ error: "Not allowed." }, { status: 403 });

    const { id } = await context.params;
    const body = await request.json().catch(() => ({})) as { nextNumber?: number | string };
    const nextNumber = Number(body.nextNumber ?? 1);
    if (!Number.isInteger(nextNumber) || nextNumber < 1) return NextResponse.json({ error: "Next number must be 1 or more." }, { status: 400 });

    const rows = await prisma.$queryRaw<Array<{ id: string; branchId: string | null }>>`
      select "id", "branchId" from "CodeSequenceSetting" where "id" = ${id} and "schoolId" = ${user.schoolId} limit 1
    `;
    const setting = rows[0];
    if (!setting) return NextResponse.json({ error: "Code setting not found." }, { status: 404 });
    if (role === "branch_admin" && setting.branchId !== user.branchId) return NextResponse.json({ error: "Not allowed." }, { status: 403 });

    await prisma.$executeRaw`
      update "CodeSequenceSetting"
      set "nextNumber" = ${nextNumber}, "updatedAt" = now()
      where "id" = ${id}
    `;
    return NextResponse.json({ ok: true, message: "Sequence reset." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not reset sequence." }, { status: 500 });
  }
}
