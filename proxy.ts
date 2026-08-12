import { NextRequest, NextResponse } from "next/server";
import { appSessionCookieName, verifyAppSessionToken } from "@/lib/auth/appSession";

const protectedPrefixes = [
  "/dashboard",
  "/school-onboarding",
  "/school-profile",
  "/code-settings",
  "/users",
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

export default async function proxy(request: NextRequest) {
  const shouldProtect = protectedPrefixes.some((prefix) => request.nextUrl.pathname === prefix || request.nextUrl.pathname.startsWith(`${prefix}/`));

  if (!shouldProtect) {
    return NextResponse.next();
  }

  const appSession = verifyAppSessionToken(request.cookies.get(appSessionCookieName)?.value);

  if (appSession) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"]
};
