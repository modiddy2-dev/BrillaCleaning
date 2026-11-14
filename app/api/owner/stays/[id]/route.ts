import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { badRequest, requireOwner, unauthorized } from "@/lib/guard";
import { parseStayBody, updateStay } from "@/lib/mutate";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await requireOwner())) return unauthorized();
  const { id } = await context.params;
  const parsed = parseStayBody(await request.json().catch(() => null));
  if (!parsed) return badRequest();
  try {
    const saved = await updateStay(id, parsed);
    if (!saved) return badRequest();
  } catch {
    return badRequest();
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await requireOwner())) return unauthorized();
  const { id } = await context.params;
  await prisma.stay.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}
