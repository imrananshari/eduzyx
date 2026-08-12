import { NextResponse } from "next/server";
import { sendSmtpOtp } from "@/lib/services/auth/customOtpService";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };

    if (!body.email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    await sendSmtpOtp(body.email, "login");
    return NextResponse.json({ ok: true, message: "Login OTP sent by SMTP." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not send OTP." }, { status: 500 });
  }
}
