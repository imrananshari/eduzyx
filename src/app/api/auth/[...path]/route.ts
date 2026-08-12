import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ error: "Neon Auth is disabled. Use /api/custom-auth routes." }, { status: 404 });
}

export const POST = GET;
export const PUT = GET;
export const PATCH = GET;
export const DELETE = GET;
