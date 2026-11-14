import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { badRequest, requireOwner, unauthorized } from "@/lib/guard";
import { parseClientBody, updateClient } from "@/lib/mutate";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await requireOwner())) return unauthorized();
  const { id } = await context.params;
  const parsed = parseClientBody(await request.json().catch(() => null));
  if (!parsed) return badRequest();
  try {
    await updateClient(id, parsed);
  } catch {
    return badRequest();
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await requireOwner())) return unauthorized();
  const { id } = await context.params;
  await prisma.client.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}
