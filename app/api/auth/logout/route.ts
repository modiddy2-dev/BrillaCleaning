import { NextResponse } from "next/server";
import { destroySession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

export async function POST() {
  await destroySession();
  // Also clear on the response object — some PWA WebViews only honor Set-Cookie here.
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(new Date(0)), maxAge: 0 });
  return response;
}
