import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendSmtpOtp } from "@/lib/services/auth/customOtpService";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };

    if (!body.email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const email = body.email.toLowerCase().trim();
    const users = await prisma.$queryRaw<Array<{ id: string }>>`
      select "id"
      from "User"
      where "email" = ${email}
      limit 1
    `;
    const user = users[0];

    if (!user) {
      return NextResponse.json({ error: "No account found for this email." }, { status: 404 });
    }

    await sendSmtpOtp(email, "reset-password");
    return NextResponse.json({ ok: true, message: "Password reset OTP sent by SMTP." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not send reset OTP." }, { status: 500 });
  }
}
