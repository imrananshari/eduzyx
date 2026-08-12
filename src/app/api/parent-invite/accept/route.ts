import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySmtpOtp } from "@/lib/services/auth/customOtpService";
import { hashPassword } from "@/lib/services/auth/passwordService";
import { parentInviteTokenHash } from "@/lib/services/auth/parentInviteService";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { token?: string; password?: string; otp?: string };
    if (!body.token || !body.password || !body.otp) {
      return NextResponse.json({ error: "Invite token, password, and OTP are required." }, { status: 400 });
    }
    const password = body.password.trim();
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const rows = await prisma.$queryRaw<Array<{ id: string; userId: string; email: string; expiresAt: Date; usedAt: Date | null }>>`
      select "id", "userId", "email", "expiresAt", "usedAt"
      from "ParentInviteToken"
      where "tokenHash" = ${parentInviteTokenHash(body.token)}
      limit 1
    `;
    const invite = rows[0];
    if (!invite) return NextResponse.json({ error: "Invite link is invalid." }, { status: 404 });
    if (invite.usedAt) return NextResponse.json({ error: "Invite link was already used." }, { status: 400 });
    if (invite.expiresAt < new Date()) return NextResponse.json({ error: "Invite link expired." }, { status: 400 });

    const verified = await verifySmtpOtp(invite.email, "parent-invite", body.otp);
    if (!verified.ok) return NextResponse.json({ error: verified.message }, { status: 400 });

    await prisma.$transaction([
      prisma.$executeRaw`
        update "User"
        set "passwordHash" = ${await hashPassword(password)}, "emailVerified" = true, "updatedAt" = now()
        where "id" = ${invite.userId}
      `,
      prisma.$executeRaw`
        update "ParentInviteToken"
        set "usedAt" = now()
        where "id" = ${invite.id}
      `
    ]);

    return NextResponse.json({ ok: true, message: "Parent account activated. You can login now.", email: invite.email });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not activate parent invite." }, { status: 500 });
  }
}
