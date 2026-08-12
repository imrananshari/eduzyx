import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendSmtpOtp } from "@/lib/services/auth/customOtpService";
import { inviteTokenHash } from "@/lib/services/auth/teacherInviteService";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { token?: string };
    if (!body.token) return NextResponse.json({ error: "Invite token is required." }, { status: 400 });

    const rows = await prisma.$queryRaw<Array<{ email: string; expiresAt: Date; usedAt: Date | null }>>`
      select "email", "expiresAt", "usedAt"
      from "TeacherInviteToken"
      where "tokenHash" = ${inviteTokenHash(body.token)}
      limit 1
    `;
    const invite = rows[0];
    if (!invite) return NextResponse.json({ error: "Invite link is invalid." }, { status: 404 });
    if (invite.usedAt) return NextResponse.json({ error: "Invite link was already used." }, { status: 400 });
    if (invite.expiresAt < new Date()) return NextResponse.json({ error: "Invite link expired." }, { status: 400 });

    await sendSmtpOtp(invite.email, "teacher-invite");
    return NextResponse.json({ ok: true, message: "OTP sent to teacher email." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not send invite OTP." }, { status: 500 });
  }
}
