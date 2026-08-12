import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/services/email/smtpService";

export type OtpPurpose = "signup" | "login" | "reset-password" | "teacher-invite" | "parent-invite" | "user-invite";

const OTP_TTL_MINUTES = 10;

function otpSecret() {
  return process.env.SMTP_OTP_SECRET || process.env.NEON_AUTH_COOKIE_SECRET || "development-only-otp-secret";
}

function hashOtp(email: string, purpose: OtpPurpose, otp: string) {
  return crypto
    .createHash("sha256")
    .update(`${email.toLowerCase()}:${purpose}:${otp}:${otpSecret()}`)
    .digest("hex");
}

function createOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

export async function sendSmtpOtp(email: string, purpose: OtpPurpose) {
  const normalizedEmail = email.toLowerCase().trim();
  const otp = createOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await prisma.emailOtp.create({
    data: {
      email: normalizedEmail,
      purpose,
      codeHash: hashOtp(normalizedEmail, purpose, otp),
      expiresAt
    }
  });

  await sendMail({
    to: normalizedEmail,
    subject: purpose === "signup" ? "Verify your EduManage account" : purpose === "reset-password" ? "Reset your EduManage password" : purpose === "teacher-invite" ? "Verify your EduManage teacher invite" : purpose === "parent-invite" ? "Verify your EduManage parent invite" : purpose === "user-invite" ? "Verify your EduManage invite" : "Your EduManage login OTP",
    text: `Your EduManage OTP is ${otp}. It expires in ${OTP_TTL_MINUTES} minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#f7f7f5;padding:24px;color:#151313">
        <div style="max-width:520px;margin:auto;background:#ffffff;border-radius:24px;padding:24px">
          <p style="font-size:12px;font-weight:700;text-transform:uppercase;color:#72706c">EduManage OTP</p>
          <h1 style="font-size:28px;margin:8px 0 12px">Your code is ${otp}</h1>
          <p style="font-size:14px;line-height:1.6;color:#5f5b55">Use this code to ${purpose === "signup" ? "verify your account" : purpose === "reset-password" ? "reset your password" : purpose === "teacher-invite" ? "activate your teacher account" : purpose === "parent-invite" ? "activate your parent account" : purpose === "user-invite" ? "activate your EduManage account" : "login"}.</p>
          <p style="font-size:14px;line-height:1.6;color:#5f5b55">This OTP expires in ${OTP_TTL_MINUTES} minutes.</p>
        </div>
      </div>
    `
  });

  return { expiresAt };
}

export async function verifySmtpOtp(email: string, purpose: OtpPurpose, otp: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const record = await prisma.emailOtp.findFirst({
    where: {
      email: normalizedEmail,
      purpose,
      consumedAt: null,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: "desc" }
  });

  if (!record) {
    return { ok: false, message: "OTP expired or not found." };
  }

  if (record.attempts >= 5) {
    return { ok: false, message: "Too many OTP attempts. Request a new code." };
  }

  const isValid = record.codeHash === hashOtp(normalizedEmail, purpose, otp.trim());

  await prisma.emailOtp.update({
    where: { id: record.id },
    data: {
      attempts: { increment: 1 },
      consumedAt: isValid ? new Date() : undefined
    }
  });

  if (!isValid) {
    return { ok: false, message: "Invalid OTP." };
  }

  return { ok: true, message: "OTP verified." };
}

export async function checkSmtpOtp(email: string, purpose: OtpPurpose, otp: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const record = await prisma.emailOtp.findFirst({
    where: {
      email: normalizedEmail,
      purpose,
      consumedAt: null,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: "desc" }
  });

  if (!record) {
    return { ok: false, message: "OTP expired or not found." };
  }

  if (record.attempts >= 5) {
    return { ok: false, message: "Too many OTP attempts. Request a new code." };
  }

  const isValid = record.codeHash === hashOtp(normalizedEmail, purpose, otp.trim());

  if (!isValid) {
    await prisma.emailOtp.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } }
    });
    return { ok: false, message: "Invalid OTP." };
  }

  return { ok: true, message: "OTP verified. You can reset your password now." };
}
