import { NextResponse } from "next/server";
import { appSessionCookieName, createAppSessionToken } from "@/lib/auth/appSession";
import { prisma } from "@/lib/db";
import { dbToAppRole, roleHomePath, type DbRoleName } from "@/lib/auth/roles";
import { verifyPassword } from "@/lib/services/auth/passwordService";

function loginUrl(request: Request, params: Record<string, string>) {
  const url = new URL("/login", request.url);
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }
  return url;
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const email = String(form.get("email") || "").toLowerCase().trim();
    const password = String(form.get("password") || "").trim();

    if (!email || !password) {
      return NextResponse.redirect(loginUrl(request, { error: "missing-login", email }), 303);
    }

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
      return NextResponse.redirect(loginUrl(request, { error: "invalid-login", email }), 303);
    }

    const role = dbToAppRole[dbUser.role] ?? "admin";
    const name = dbUser.name;
    const response = NextResponse.redirect(new URL(roleHomePath(role), request.url), 303);

    response.cookies.set(appSessionCookieName, createAppSessionToken({ email, role, name }), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60
    });

    return response;
  } catch {
    return NextResponse.redirect(loginUrl(request, { error: "login-server" }), 303);
  }
}
