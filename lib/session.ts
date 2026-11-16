import { cookies } from "next/headers";
import { newId, sessionTokenHash } from "./auth";
import { prisma } from "./db";
import type { Lang } from "./rules";

const SESSION_COOKIE = "brilla_session";
const LANG_COOKIE = "brilla_lang";
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

/** Must match on set and clear or browsers keep the cookie (common on HTTPS PWAs). */
function sessionCookieOptions(expires?: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(expires ? { expires } : {}),
  };
}

export type AppSession = {
  role: "owner" | "cleaner";
  userKey: string;
  cleanerName: string | null;
  lang: Lang;
};

export async function readLangCookie(): Promise<Lang> {
  const jar = await cookies();
  return jar.get(LANG_COOKIE)?.value === "es" ? "es" : "en";
}

export async function getSession(): Promise<AppSession | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = await prisma.session.findUnique({ where: { tokenHash: sessionTokenHash(token) } });
  if (!row || row.expiresAt.getTime() < Date.now()) return null;
  if (row.role !== "owner" && row.role !== "cleaner") return null;
  const pref = await prisma.preference.findUnique({ where: { userKey: row.userKey } });
  const lang: Lang = pref?.lang === "es" ? "es" : "en";
  return { role: row.role, userKey: row.userKey, cleanerName: row.cleanerName, lang };
}

export async function createSession(input: { role: "owner" | "cleaner"; userKey: string; cleanerName?: string | null; lang: Lang }): Promise<void> {
  const token = newId() + newId();
  const expiresAt = new Date(Date.now() + TWO_WEEKS_MS);
  await prisma.session.create({
    data: {
      id: newId(),
      tokenHash: sessionTokenHash(token),
      role: input.role,
      userKey: input.userKey,
      cleanerName: input.cleanerName ?? null,
      expiresAt,
    },
  });
  await prisma.preference.upsert({
    where: { userKey: input.userKey },
    update: {},
    create: { userKey: input.userKey, lang: input.lang },
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: sessionTokenHash(token) } }).catch(() => undefined);
  }
  // Match create attributes exactly, or Safari/Chrome keep the live cookie.
  jar.set(SESSION_COOKIE, "", { ...sessionCookieOptions(new Date(0)), maxAge: 0 });
}

export { SESSION_COOKIE, sessionCookieOptions };

export async function setLanguage(lang: Lang): Promise<void> {
  const jar = await cookies();
  jar.set(LANG_COOKIE, lang, { sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  const session = await getSession();
  if (!session) return;
  await prisma.preference.upsert({
    where: { userKey: session.userKey },
    update: { lang },
    create: { userKey: session.userKey, lang },
  });
}
