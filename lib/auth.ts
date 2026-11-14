import { createHash, randomBytes, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const hashCache = new Map<string, Promise<string>>();

function isBcryptHash(value: string): boolean {
  return /^\$2[aby]\$\d{2}\$/.test(value);
}

export function configuredHash(secret: string): Promise<string> {
  if (isBcryptHash(secret)) return Promise.resolve(secret);
  const cached = hashCache.get(secret);
  if (cached) return cached;
  const pending = bcrypt.hash(secret, 10);
  hashCache.set(secret, pending);
  return pending;
}

export async function verifySecret(submitted: string, configured: string): Promise<boolean> {
  const hash = await configuredHash(configured);
  return bcrypt.compare(submitted, hash);
}

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "local";
  return request.headers.get("x-real-ip") ?? "local";
}

export async function rateLimitAllows(bucket: string): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MS);
  const failures = await prisma.authAttempt.count({
    where: { bucket, success: false, createdAt: { gte: since } },
  });
  return failures < MAX_FAILURES;
}

export async function recordAttempt(bucket: string, success: boolean): Promise<void> {
  await prisma.authAttempt.create({
    data: { id: randomBytes(12).toString("hex"), bucket, success },
  });
}

export function sessionTokenHash(token: string): string {
  const secret = process.env.SESSION_SECRET ?? "";
  return createHash("sha256").update(`${secret}:${token}`).digest("hex");
}

export function newId(): string {
  return randomBytes(12).toString("hex");
}

export function ownerPasswordConfigured(): string | null {
  const hash = process.env.OWNER_PASSWORD_HASH;
  if (hash && isBcryptHash(hash)) return hash;
  const plain = process.env.OWNER_PASSWORD;
  if (plain) return plain;
  return null;
}
