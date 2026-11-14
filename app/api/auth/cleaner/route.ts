import { NextResponse } from "next/server";
import { clientIp, rateLimitAllows, recordAttempt, verifySecret } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createSession, readLangCookie } from "@/lib/session";
import { isCleanerName } from "@/lib/validate";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { name?: unknown; pin?: unknown } | null;
  const name = typeof body?.name === "string" ? body.name : "";
  const pin = typeof body?.pin === "string" ? body.pin : "";
  if (!isCleanerName(name) || pin.length < 1 || pin.length > 20) {
    return NextResponse.json({ error: "invalid" }, { status: 401 });
  }
  const bucket = `pin:${name}:${clientIp(request)}`;
  try {
    if (!(await rateLimitAllows(bucket))) return NextResponse.json({ error: "rate" }, { status: 429 });
    const configured = process.env[`PIN_${name.toUpperCase()}`];
    if (!configured || !process.env.SESSION_SECRET) return NextResponse.json({ error: "config" }, { status: 500 });
    const cleaner = await prisma.cleaner.findUnique({ where: { name } });
    const ok = Boolean(cleaner) && (await verifySecret(pin, configured));
    if (!ok) {
      await recordAttempt(bucket, false);
      return NextResponse.json({ error: "invalid" }, { status: 401 });
    }
    await recordAttempt(bucket, true);
    const lang = await readLangCookie();
    await createSession({ role: "cleaner", userKey: `cleaner:${name}`, cleanerName: name, lang });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "config" }, { status: 500 });
  }
}
