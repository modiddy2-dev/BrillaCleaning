import { NextResponse } from "next/server";
import { badRequest, requireOwner, unauthorized } from "@/lib/guard";
import { createPayment, parsePaymentBody } from "@/lib/mutate";

export async function POST(request: Request) {
  if (!(await requireOwner())) return unauthorized();
  const parsed = parsePaymentBody(await request.json().catch(() => null));
  if (!parsed) return badRequest();
  await createPayment(parsed);
  return NextResponse.json({ ok: true });
}
