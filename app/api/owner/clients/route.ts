import { NextResponse } from "next/server";
import { badRequest, requireOwner, unauthorized } from "@/lib/guard";
import { createClient, parseClientBody } from "@/lib/mutate";

export async function POST(request: Request) {
  if (!(await requireOwner())) return unauthorized();
  const parsed = parseClientBody(await request.json().catch(() => null));
  if (!parsed) return badRequest();
  await createClient(parsed);
  return NextResponse.json({ ok: true });
}
