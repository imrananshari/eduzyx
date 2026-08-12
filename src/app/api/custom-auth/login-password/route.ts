import { NextResponse } from "next/server";
import { appSessionCookieName, createAppSessionToken } from "@/lib/auth/appSession";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/services/auth/passwordService";
import { dbToAppRole, roleHomePath, type DbRoleName } from "@/lib/auth/roles";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };

    if (!body.email || !body.password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const email = body.email.toLowerCase().trim();
    const password = body.password.trim();
    const users = await prisma.$queryRaw<Array<{
      email: string;
      name: string;
      role: DbRoleName;
      imageUrl: string | null;
      passwordHash: string | null;
    }>>`
      select "email", "name", "role"::text as "role", "imageUrl", "passwordHash"
      from "User"
      where "email" = ${email}
      limit 1
    `;
    const dbUser = users[0];

    if (!dbUser || !(await verifyPassword(password, dbUser.passwordHash))) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const role = dbToAppRole[dbUser.role] ?? "admin";
    const name = dbUser.name;
    const response = NextResponse.json({
      ok: true,
      role,
      redirectTo: roleHomePath(role),
      user: { email, name, image: null }
    });

    response.cookies.set(appSessionCookieName, createAppSessionToken({ email, role, name }), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Password login failed." }, { status: 500 });
  }
}
