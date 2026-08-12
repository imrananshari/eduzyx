import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { inviteTokenHash } from "@/lib/services/auth/teacherInviteService";

export async function GET(request: Request) {
  try {
    const token = new URL(request.url).searchParams.get("token") ?? "";
    if (!token) return NextResponse.json({ error: "Invite token is required." }, { status: 400 });

    const rows = await prisma.$queryRaw<Array<{ email: string; teacherName: string; expiresAt: Date; usedAt: Date | null }>>`
      select inv."email", t."name" as "teacherName", inv."expiresAt", inv."usedAt"
      from "TeacherInviteToken" inv
      join "Teacher" t on t."id" = inv."teacherId"
      where inv."tokenHash" = ${inviteTokenHash(token)}
      limit 1
    `;
    const invite = rows[0];
    if (!invite) return NextResponse.json({ error: "Invite link is invalid." }, { status: 404 });
    if (invite.usedAt) return NextResponse.json({ error: "Invite link was already used." }, { status: 400 });
    if (invite.expiresAt < new Date()) return NextResponse.json({ error: "Invite link expired." }, { status: 400 });

    return NextResponse.json({ email: invite.email, teacherName: invite.teacherName, expiresAt: invite.expiresAt });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not verify invite." }, { status: 500 });
  }
}
