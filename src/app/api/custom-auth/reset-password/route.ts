import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySmtpOtp } from "@/lib/services/auth/customOtpService";
import { hashPassword } from "@/lib/services/auth/passwordService";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; otp?: string; password?: string };

    if (!body.email || !body.otp || !body.password) {
      return NextResponse.json({ error: "Email, OTP, and new password are required." }, { status: 400 });
    }

    const password = body.password.trim();

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const email = body.email.toLowerCase().trim();
    const verified = await verifySmtpOtp(email, "reset-password", body.otp);

    if (!verified.ok) {
      return NextResponse.json({ error: verified.message }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const updatedCount = await prisma.$executeRaw`
      update "User"
      set "passwordHash" = ${passwordHash}, "emailVerified" = true, "updatedAt" = now()
      where "email" = ${email}
    `;

    if (updatedCount === 0) {
      return NextResponse.json({ error: "No account found for this email." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, message: "Password reset successful. You can login now." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Password reset failed." }, { status: 500 });
  }
}
