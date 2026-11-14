import { NextResponse } from "next/server";
import { clientIp, ownerPasswordConfigured, rateLimitAllows, recordAttempt, safeEqual, verifySecret } from "@/lib/auth";
import { createSession, readLangCookie } from "@/lib/session";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { username?: unknown; password?: unknown } | null;
  const username = typeof body?.username === "string" ? body.username : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (username.length > 80 || password.length > 200) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const bucket = `owner:${clientIp(request)}`;
  try {
    if (!(await rateLimitAllows(bucket))) return NextResponse.json({ error: "rate" }, { status: 429 });
    const expectedUser = process.env.OWNER_USERNAME ?? "";
    const configured = ownerPasswordConfigured();
    if (!expectedUser || !configured || !process.env.SESSION_SECRET) {
      return NextResponse.json({ error: "config" }, { status: 500 });
    }
    const userOk = safeEqual(username, expectedUser);
    const passOk = userOk && (await verifySecret(password, configured));
    if (!userOk || !passOk) {
      await recordAttempt(bucket, false);
      return NextResponse.json({ error: "invalid" }, { status: 401 });
    }
    await recordAttempt(bucket, true);
    const lang = await readLangCookie();
    await createSession({ role: "owner", userKey: `owner:${expectedUser}`, lang });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "config" }, { status: 500 });
  }
}
