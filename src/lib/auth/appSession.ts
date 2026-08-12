import crypto from "node:crypto";
import type { Role } from "@/types";

export const appSessionCookieName = "edumanage_session";

export type AppSession = {
  email: string;
  role: Role;
  name?: string;
  image?: string | null;
  exp: number;
};

function sessionSecret() {
  return process.env.SMTP_OTP_SECRET || process.env.NEON_AUTH_COOKIE_SECRET || "development-only-session-secret";
}

function base64Url(input: string) {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string) {
  return crypto.createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function createAppSessionToken(session: Omit<AppSession, "exp" | "image">) {
  const payload = base64Url(JSON.stringify({ ...session, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }));
  return `${payload}.${sign(payload)}`;
}

export function verifyAppSessionToken(token?: string | null): AppSession | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || sign(payload) !== signature) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AppSession;
    if (!session.exp || session.exp < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}
