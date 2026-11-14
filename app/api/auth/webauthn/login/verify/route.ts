import { NextResponse } from "next/server";
import type { AuthenticationResponseJSON } from "@simplewebauthn/server";
import { clientIp, rateLimitAllows, recordAttempt } from "@/lib/auth";
import { relyingParty, verifyLogin } from "@/lib/passkey";
import { createSession, readLangCookie } from "@/lib/session";

export async function POST(request: Request) {
  const party = relyingParty(request);
  if (!party || !process.env.SESSION_SECRET) return NextResponse.json({ error: "config" }, { status: 500 });
  const bucket = `passkey:${clientIp(request)}`;
  if (!(await rateLimitAllows(bucket))) return NextResponse.json({ error: "rate" }, { status: 429 });
  const body = (await request.json().catch(() => null)) as { response?: AuthenticationResponseJSON } | null;
  if (!body?.response || typeof body.response.id !== "string") return NextResponse.json({ error: "invalid" }, { status: 400 });
  const account = await verifyLogin({ response: body.response, origin: party.origin, rpID: party.rpID });
  if (!account) {
    await recordAttempt(bucket, false);
    return NextResponse.json({ error: "invalid" }, { status: 401 });
  }
  await recordAttempt(bucket, true);
  const lang = await readLangCookie();
  await createSession({ role: account.role, userKey: account.userKey, cleanerName: account.cleanerName, lang });
  return NextResponse.json({ ok: true, role: account.role });
}
