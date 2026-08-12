import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { appSessionCookieName, verifyAppSessionToken } from "@/lib/auth/appSession";
import { prisma } from "@/lib/db";

export async function GET() {
  const cookieStore = await cookies();
  const session = verifyAppSessionToken(cookieStore.get(appSessionCookieName)?.value);

  if (!session) {
    return NextResponse.json({ session: null }, { status: 401 });
  }

  const users = await prisma.$queryRaw<Array<{ name: string; imageUrl: string | null }>>`
    select "name", "imageUrl"
    from "User"
    where "email" = ${session.email}
    limit 1
  `;
  const user = users[0];

  return NextResponse.json({
    session: {
      email: session.email,
      role: session.role,
      name: user?.name ?? session.name ?? session.email.split("@")[0],
      image: user?.imageUrl ?? null
    }
  });
}
