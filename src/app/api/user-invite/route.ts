import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { dbToAppRole, roleLabel, type DbRoleName } from "@/lib/auth/roles";
import { userInviteTokenHash } from "@/lib/services/auth/userInviteService";

export async function GET(request: Request) {
  try {
    const token = new URL(request.url).searchParams.get("token") ?? "";
    if (!token) return NextResponse.json({ error: "Invite token is required." }, { status: 400 });

    const rows = await prisma.$queryRaw<Array<{ email: string; name: string; role: DbRoleName; expiresAt: Date; usedAt: Date | null }>>`
      select inv."email", u."name", inv."role"::text as "role", inv."expiresAt", inv."usedAt"
      from "UserInviteToken" inv
      join "User" u on u."id" = inv."targetUserId"
      where inv."tokenHash" = ${userInviteTokenHash(token)}
      limit 1
    `;
    const invite = rows[0];
    if (!invite) return NextResponse.json({ error: "Invite link is invalid." }, { status: 404 });
    if (invite.usedAt) return NextResponse.json({ error: "Invite link was already used." }, { status: 400 });
    if (invite.expiresAt < new Date()) return NextResponse.json({ error: "Invite link expired." }, { status: 400 });

    const appRole = dbToAppRole[invite.role] ?? "staff";
    return NextResponse.json({ email: invite.email, name: invite.name, role: appRole, roleLabel: roleLabel(appRole), expiresAt: invite.expiresAt });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not verify invite." }, { status: 500 });
  }
}
