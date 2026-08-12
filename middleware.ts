import { NextRequest, NextResponse } from "next/server";

const appSessionCookieName = "edumanage_session";

const protectedPrefixes = [
  "/dashboard",
  "/school-onboarding",
  "/school-profile",
  "/code-settings",
  "/users",
  "/teachers",
  "/students",
  "/classes",
  "/attendance",
  "/homework",
  "/timetable",
  "/exams",
  "/results",
  "/fees",
  "/payments",
  "/notices",
  "/reports",
  "/whatsapp-automation",
  "/ai-assistant",
  "/media",
  "/settings"
];

function sessionSecret() {
  return process.env.SMTP_OTP_SECRET || process.env.NEON_AUTH_COOKIE_SECRET || "development-only-session-secret";
}

function base64UrlToBytes(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function bytesToBase64Url(bytes: ArrayBuffer) {
  const binary = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function verifyAppSessionToken(token?: string | null) {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(sessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const expected = bytesToBase64Url(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
  if (expected !== signature) return false;

  try {
    const session = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload))) as { exp?: number };
    return Boolean(session.exp && session.exp > Date.now());
  } catch {
    return false;
  }
}

export default async function middleware(request: NextRequest) {
  const shouldProtect = protectedPrefixes.some((prefix) => request.nextUrl.pathname === prefix || request.nextUrl.pathname.startsWith(`${prefix}/`));

  if (!shouldProtect) {
    return NextResponse.next();
  }

  const appSession = await verifyAppSessionToken(request.cookies.get(appSessionCookieName)?.value);

  if (appSession) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"]
};
