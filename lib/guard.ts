import { NextResponse } from "next/server";
import { getSession, type AppSession } from "./session";

export async function requireOwner(): Promise<AppSession | null> {
  const session = await getSession();
  if (!session || session.role !== "owner") return null;
  return session;
}

export function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export function badRequest() {
  return NextResponse.json({ error: "invalid" }, { status: 400 });
}
