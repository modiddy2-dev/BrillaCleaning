import { NextResponse } from "next/server";
import { badRequest, requireOwner, unauthorized } from "@/lib/guard";
import { createStay, parseStayBody } from "@/lib/mutate";

export async function POST(request: Request) {
  if (!(await requireOwner())) return unauthorized();
  const parsed = parseStayBody(await request.json().catch(() => null));
  if (!parsed) return badRequest();
  const saved = await createStay(parsed);
  if (!saved) return badRequest();
  return NextResponse.json({ ok: true });
}
