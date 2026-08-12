import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { appSessionCookieName, createAppSessionToken } from "@/lib/auth/appSession";
import { verifySmtpOtp, type OtpPurpose } from "@/lib/services/auth/customOtpService";
import { dbToAppRole, roleHomePath, type DbRoleName } from "@/lib/auth/roles";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; otp?: string; purpose?: OtpPurpose };

    if (!body.email || !body.otp || !body.purpose) {
      return NextResponse.json({ error: "Email, OTP, and purpose are required." }, { status: 400 });
    }

    const result = await verifySmtpOtp(body.email, body.purpose, body.otp);

    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    const email = body.email.toLowerCase().trim();

    if (body.purpose === "signup") {
      await prisma.user.updateMany({
        where: { email },
        data: { emailVerified: true }
      });
    }

    const users = await prisma.$queryRaw<Array<{ name: string; role: DbRoleName; imageUrl: string | null }>>`
      select "name", "role"::text as "role", "imageUrl" from "User" where "email" = ${email} limit 1
    `;
    const user = users[0];
    const role = user ? dbToAppRole[user.role] ?? "admin" : "admin";
    const response = NextResponse.json({
      ...result,
      role,
      redirectTo: roleHomePath(role)
    });

    response.cookies.set(appSessionCookieName, createAppSessionToken({
      email,
      role,
      name: user?.name
    }), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "OTP verification failed." }, { status: 500 });
  }
}
