import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/services/email/smtpService";
import type { DbRoleName } from "@/lib/auth/roles";

const INVITE_TTL_HOURS = 24;

function hashInviteToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function userInviteTokenHash(token: string) {
  return hashInviteToken(token);
}

export async function createUserInvite({
  baseUrl,
  targetUserId,
  createdByUserId,
  email,
  name,
  role
}: {
  baseUrl: string;
  targetUserId: string;
  createdByUserId: string;
  email: string;
  name: string;
  role: DbRoleName;
}) {
  const token = crypto.randomBytes(32).toString("base64url");
  const inviteUrl = `${baseUrl.replace(/\/$/, "")}/user-invite?token=${encodeURIComponent(token)}`;
  const expiresAt = new Date(Date.now() + INVITE_TTL_HOURS * 60 * 60 * 1000);
  const label = role.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

  await prisma.$executeRaw`
    insert into "UserInviteToken" ("id", "targetUserId", "createdByUserId", "email", "role", "tokenHash", "expiresAt", "createdAt")
    values (${crypto.randomUUID()}, ${targetUserId}, ${createdByUserId}, ${email}, ${role}::"RoleName", ${hashInviteToken(token)}, ${expiresAt}, now())
  `;

  await sendMail({
    to: email,
    subject: "Set up your EduManage login",
    text: `Hi ${name}, set your EduManage ${label} password here: ${inviteUrl}. This link expires in ${INVITE_TTL_HOURS} hours.`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#f7f7f5;padding:24px;color:#151313">
        <div style="max-width:560px;margin:auto;background:#ffffff;border-radius:24px;padding:24px">
          <p style="font-size:12px;font-weight:700;text-transform:uppercase;color:#72706c">EduManage User Invite</p>
          <h1 style="font-size:26px;margin:8px 0 12px">Welcome, ${name}</h1>
          <p style="font-size:14px;line-height:1.6;color:#5f5b55">You have been invited to EduManage. Click the button below to verify your email and set your password.</p>
          <a href="${inviteUrl}" style="display:inline-block;margin-top:16px;background:#ff5734;color:#ffffff;text-decoration:none;border-radius:999px;padding:12px 18px;font-weight:700">Set password</a>
          <p style="font-size:12px;line-height:1.6;color:#72706c;margin-top:18px">This link expires in ${INVITE_TTL_HOURS} hours.</p>
        </div>
      </div>
    `
  });

  return { inviteUrl, expiresAt };
}
