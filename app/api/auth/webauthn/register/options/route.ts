import { NextResponse } from "next/server";
import { registrationOptions, relyingParty } from "@/lib/passkey";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "invalid" }, { status: 401 });
  const party = relyingParty(request);
  if (!party || !process.env.SESSION_SECRET) return NextResponse.json({ error: "config" }, { status: 500 });
  const userName = session.role === "cleaner" ? session.cleanerName ?? "cleaner" : session.userKey.replace(/^owner:/, "");
  const options = await registrationOptions({ userKey: session.userKey, userName, rpID: party.rpID });
  return NextResponse.json({ options });
}
