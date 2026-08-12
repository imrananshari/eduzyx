import { NextResponse } from "next/server";
import { appSessionCookieName } from "@/lib/auth/appSession";

function clearSession(response: NextResponse) {
  response.cookies.set(appSessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
  return response;
}

export async function GET(request: Request) {
  return clearSession(NextResponse.redirect(new URL("/login?status=logged-out", request.url), 303));
}

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearSession(response);
  return response;
}
