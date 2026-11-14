import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireOwner, unauthorized } from "@/lib/guard";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await requireOwner())) return unauthorized();
  const { id } = await context.params;
  await prisma.manualJob.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}
