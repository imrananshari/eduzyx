import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/services/auth/passwordService";
import { sendSmtpOtp } from "@/lib/services/auth/customOtpService";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      fullName?: string;
      email?: string;
      password?: string;
      image?: string;
    };

    if (!body.fullName || !body.email || !body.password) {
      return NextResponse.json({ error: "Full name, email, and password are required." }, { status: 400 });
    }

    const email = body.email.toLowerCase().trim();
    const password = body.password.trim();
    const existingUsers = await prisma.$queryRaw<Array<{
      emailVerified: boolean;
      imageUrl: string | null;
      passwordHash: string | null;
    }>>`
      select "emailVerified", "imageUrl", "passwordHash"
      from "User"
      where "email" = ${email}
      limit 1
    `;
    const existingUser = existingUsers[0];
    const passwordHash = await hashPassword(password);

    if (existingUser?.passwordHash && existingUser.emailVerified) {
      return NextResponse.json({ error: "Account already exists. Please login instead." }, { status: 400 });
    }

    await prisma.$executeRaw`
      insert into "User" ("id", "name", "email", "role", "imageUrl", "emailVerified", "passwordHash", "createdAt", "updatedAt")
      values (
        ${crypto.randomUUID()},
        ${body.fullName},
        ${email},
        'ADMIN'::"RoleName",
        ${body.image || null},
        false,
        ${passwordHash},
        now(),
        now()
      )
      on conflict ("email") do update
      set
        "name" = excluded."name",
        "role" = excluded."role",
        "imageUrl" = coalesce(excluded."imageUrl", "User"."imageUrl"),
        "emailVerified" = false,
        "passwordHash" = excluded."passwordHash",
        "updatedAt" = now()
    `;

    await sendSmtpOtp(email, "signup");

    return NextResponse.json({ ok: true, message: "Account created. OTP sent by SMTP." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Signup failed." }, { status: 500 });
  }
}
