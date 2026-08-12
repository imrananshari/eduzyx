import nodemailer from "nodemailer";

export type MailPayload = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

function assertSmtpConfig() {
  const required = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_APP_PASSWORD", "SMTP_FROM_EMAIL"] as const;
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length) {
    throw new Error(`SMTP configuration missing: ${missing.join(", ")}`);
  }
}

export async function sendMail(payload: MailPayload) {
  assertSmtpConfig();

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: process.env.SMTP_SECURE !== "false",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_APP_PASSWORD
    }
  });

  return transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME ?? "EduManage"}" <${process.env.SMTP_FROM_EMAIL}>`,
    ...payload
  });
}
