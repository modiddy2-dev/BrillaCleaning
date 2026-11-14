import { NextResponse } from "next/server";
import { setLanguage } from "@/lib/session";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { lang?: unknown } | null;
  const lang = body?.lang === "es" ? "es" : "en";
  await setLanguage(lang);
  return NextResponse.json({ ok: true });
}
