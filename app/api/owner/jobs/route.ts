import { NextResponse } from "next/server";
import { badRequest, requireOwner, unauthorized } from "@/lib/guard";
import { parseJobBody, saveJob } from "@/lib/mutate";

export async function POST(request: Request) {
  if (!(await requireOwner())) return unauthorized();
  const parsed = parseJobBody(await request.json().catch(() => null));
  if (!parsed) return badRequest();
  const saved = await saveJob(parsed);
  if (!saved) return badRequest();
  return NextResponse.json({ ok: true });
}
