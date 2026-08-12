import { NextResponse } from "next/server";
import { checkSmtpOtp } from "@/lib/services/auth/customOtpService";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; otp?: string };

    if (!body.email || !body.otp) {
      return NextResponse.json({ error: "Email and OTP are required." }, { status: 400 });
    }

    const result = await checkSmtpOtp(body.email, "reset-password", body.otp);

    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "OTP verification failed." }, { status: 500 });
  }
}
