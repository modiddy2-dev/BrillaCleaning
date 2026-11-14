import { NextResponse } from "next/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { relyingParty, verifyRegistration } from "@/lib/passkey";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "invalid" }, { status: 401 });
  const party = relyingParty(request);
  if (!party) return NextResponse.json({ error: "config" }, { status: 500 });
  const body = (await request.json().catch(() => null)) as { response?: RegistrationResponseJSON } | null;
  if (!body?.response || typeof body.response.id !== "string") return NextResponse.json({ error: "invalid" }, { status: 400 });
  const saved = await verifyRegistration({
    userKey: session.userKey,
    role: session.role,
    cleanerName: session.cleanerName,
    response: body.response,
    origin: party.origin,
    rpID: party.rpID,
  });
  if (!saved) return NextResponse.json({ error: "invalid" }, { status: 401 });
  return NextResponse.json({ ok: true, credentialId: saved.credentialId });
}
