import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth/currentUser";
import { dbToAppRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";
import { previewCode } from "@/lib/services/codes/codeGenerator";
import type { CodeSettingRow } from "@/lib/services/codes/codeTypes";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUserContext();
    if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });
    if (!user.schoolId) return NextResponse.json({ error: "Create a school profile first." }, { status: 400 });
    const role = dbToAppRole[user.role] ?? "staff";
    if (!["boss", "superadmin", "admin", "branch_admin"].includes(role)) return NextResponse.json({ error: "Not allowed." }, { status: 403 });

    const { id } = await context.params;
    const rows = await prisma.$queryRaw<CodeSettingRow[]>`
      select cs.*, br."name" as "branchName", br."code" as "branchCode", sc."name" as "schoolName", sc."code" as "schoolCode"
      from "CodeSequenceSetting" cs
      join "School" sc on sc."id" = cs."schoolId"
      left join "SchoolBranch" br on br."id" = cs."branchId"
      where cs."id" = ${id} and cs."schoolId" = ${user.schoolId}
      limit 1
    `;
    const setting = rows[0];
    if (!setting) return NextResponse.json({ error: "Code setting not found." }, { status: 404 });
    if (role === "branch_admin" && setting.branchId !== user.branchId) return NextResponse.json({ error: "Not allowed." }, { status: 403 });

    return NextResponse.json({ preview: await previewCode(setting) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not preview code." }, { status: 500 });
  }
}
