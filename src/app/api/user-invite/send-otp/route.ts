import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendSmtpOtp } from "@/lib/services/auth/customOtpService";
import { userInviteTokenHash } from "@/lib/services/auth/userInviteService";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { token?: string };
    if (!body.token) return NextResponse.json({ error: "Invite token is required." }, { status: 400 });

    const rows = await prisma.$queryRaw<Array<{ email: string; expiresAt: Date; usedAt: Date | null }>>`
      select "email", "expiresAt", "usedAt"
      from "UserInviteToken"
      where "tokenHash" = ${userInviteTokenHash(body.token)}
      limit 1
    `;
    const invite = rows[0];
    if (!invite) return NextResponse.json({ error: "Invite link is invalid." }, { status: 404 });
    if (invite.usedAt) return NextResponse.json({ error: "Invite link was already used." }, { status: 400 });
    if (invite.expiresAt < new Date()) return NextResponse.json({ error: "Invite link expired." }, { status: 400 });

    await sendSmtpOtp(invite.email, "user-invite");
    return NextResponse.json({ ok: true, message: "Invite OTP sent by SMTP." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not send invite OTP." }, { status: 500 });
  }
}
