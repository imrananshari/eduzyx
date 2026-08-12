import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parentInviteTokenHash } from "@/lib/services/auth/parentInviteService";

export async function GET(request: Request) {
  try {
    const token = new URL(request.url).searchParams.get("token") ?? "";
    if (!token) return NextResponse.json({ error: "Invite token is required." }, { status: 400 });

    const rows = await prisma.$queryRaw<Array<{ email: string; parentName: string; expiresAt: Date; usedAt: Date | null }>>`
      select inv."email", p."name" as "parentName", inv."expiresAt", inv."usedAt"
      from "ParentInviteToken" inv
      join "Parent" p on p."id" = inv."parentId"
      where inv."tokenHash" = ${parentInviteTokenHash(token)}
      limit 1
    `;
    const invite = rows[0];
    if (!invite) return NextResponse.json({ error: "Invite link is invalid." }, { status: 404 });
    if (invite.usedAt) return NextResponse.json({ error: "Invite link was already used." }, { status: 400 });
    if (invite.expiresAt < new Date()) return NextResponse.json({ error: "Invite link expired." }, { status: 400 });

    return NextResponse.json({ email: invite.email, parentName: invite.parentName, expiresAt: invite.expiresAt });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not verify invite." }, { status: 500 });
  }
}
