import { NextResponse } from "next/server";
import { loginOptions, relyingParty } from "@/lib/passkey";

export async function POST(request: Request) {
  const party = relyingParty(request);
  if (!party || !process.env.SESSION_SECRET) return NextResponse.json({ error: "config" }, { status: 500 });
  const body = (await request.json().catch(() => null)) as { credentialId?: unknown } | null;
  const credentialId = typeof body?.credentialId === "string" && body.credentialId.length < 512 ? body.credentialId : null;
  const options = await loginOptions({ rpID: party.rpID, credentialId });
  return NextResponse.json({ options });
}
