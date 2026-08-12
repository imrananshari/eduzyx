import crypto from "node:crypto";
import { NextResponse } from "next/server";

export async function GET() {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

  if (!privateKey || !publicKey || !urlEndpoint) {
    return NextResponse.json({ error: "ImageKit environment variables are missing." }, { status: 500 });
  }

  const token = crypto.randomUUID();
  const expire = Math.floor(Date.now() / 1000) + 15 * 60;
  const signature = crypto.createHmac("sha1", privateKey).update(token + expire).digest("hex");

  return NextResponse.json({
    token,
    expire,
    signature,
    publicKey,
    urlEndpoint
  });
}
