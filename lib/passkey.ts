import { createHash } from "crypto";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from "@simplewebauthn/server";
import { newId } from "./auth";
import { prisma } from "./db";
import { relyingParty, relyingPartyFromUrl } from "./relying-party";

export { relyingParty, relyingPartyFromUrl };

const FIVE_MINUTES_MS = 5 * 60 * 1000;

function asBytes(input: Uint8Array): Uint8Array<ArrayBuffer> {
  const copy = new ArrayBuffer(input.byteLength);
  const view = new Uint8Array(copy);
  view.set(input);
  return view;
}

function userIdBytes(userKey: string): Uint8Array<ArrayBuffer> {
  return asBytes(createHash("sha256").update(userKey).digest());
}

function bytesToBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  return asBytes(Buffer.from(value, "base64url"));
}

async function saveChallenge(input: { challenge: string; kind: "register" | "login"; userKey?: string | null; role?: string | null; cleanerName?: string | null }) {
  const now = new Date();
  await prisma.webAuthnChallenge.deleteMany({ where: { expiresAt: { lt: now } } });
  await prisma.webAuthnChallenge.create({
    data: {
      id: newId(),
      challenge: input.challenge,
      kind: input.kind,
      userKey: input.userKey ?? null,
      role: input.role ?? null,
      cleanerName: input.cleanerName ?? null,
      expiresAt: new Date(Date.now() + FIVE_MINUTES_MS),
    },
  });
}

export async function registrationOptions(input: { userKey: string; userName: string; rpID: string }) {
  const existing = await prisma.passkey.findMany({ where: { userKey: input.userKey } });
  const options = await generateRegistrationOptions({
    rpName: "Brilla Cleaning",
    rpID: input.rpID,
    userName: input.userName,
    userDisplayName: input.userName,
    userID: userIdBytes(input.userKey),
    attestationType: "none",
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      residentKey: "required",
      userVerification: "required",
    },
    preferredAuthenticatorType: "localDevice",
    excludeCredentials: existing.map((row) => ({
      id: row.credentialId,
      transports: row.transports?.split(",").filter(Boolean),
    })),
  });
  await saveChallenge({ challenge: options.challenge, kind: "register", userKey: input.userKey });
  return options;
}

export async function verifyRegistration(input: { userKey: string; role: "owner" | "cleaner"; cleanerName: string | null; response: RegistrationResponseJSON; origin: string; rpID: string }) {
  const pending = await prisma.webAuthnChallenge.findFirst({
    where: { userKey: input.userKey, kind: "register", expiresAt: { gt: new Date() } },
    orderBy: { expiresAt: "desc" },
  });
  if (!pending) return null;
  let verification: Awaited<ReturnType<typeof verifyRegistrationResponse>>;
  try {
    verification = await verifyRegistrationResponse({
      response: input.response,
      expectedChallenge: pending.challenge,
      expectedOrigin: input.origin,
      expectedRPID: input.rpID,
      requireUserVerification: true,
    });
  } catch {
    return null;
  } finally {
    await prisma.webAuthnChallenge.deleteMany({ where: { id: pending.id } });
  }
  if (!verification.verified) return null;
  const credential = verification.registrationInfo.credential;
  await prisma.passkey.upsert({
    where: { credentialId: credential.id },
    update: {
      publicKey: bytesToBase64Url(credential.publicKey),
      counter: credential.counter,
      transports: credential.transports?.join(",") ?? null,
    },
    create: {
      id: newId(),
      userKey: input.userKey,
      role: input.role,
      cleanerName: input.cleanerName,
      credentialId: credential.id,
      publicKey: bytesToBase64Url(credential.publicKey),
      counter: credential.counter,
      transports: credential.transports?.join(",") ?? input.response.response.transports?.join(",") ?? null,
    },
  });
  return { credentialId: credential.id };
}

export async function loginOptions(input: { rpID: string; credentialId?: string | null }) {
  const stored = input.credentialId ? await prisma.passkey.findUnique({ where: { credentialId: input.credentialId } }) : null;
  const options = await generateAuthenticationOptions({
    rpID: input.rpID,
    userVerification: "required",
    allowCredentials: stored
      ? [{ id: stored.credentialId, transports: stored.transports?.split(",").filter(Boolean) }]
      : undefined,
  });
  await saveChallenge({
    challenge: options.challenge,
    kind: "login",
    userKey: stored?.userKey ?? null,
    role: stored?.role ?? null,
    cleanerName: stored?.cleanerName ?? null,
  });
  return options;
}

export async function verifyLogin(input: { response: AuthenticationResponseJSON; origin: string; rpID: string }) {
  const credentialId = input.response.id;
  const passkey = await prisma.passkey.findUnique({ where: { credentialId } });
  if (!passkey) return null;
  const pending = await prisma.webAuthnChallenge.findFirst({
    where: { kind: "login", expiresAt: { gt: new Date() }, OR: [{ userKey: passkey.userKey }, { userKey: null }] },
    orderBy: { expiresAt: "desc" },
  });
  if (!pending) return null;
  let verification: Awaited<ReturnType<typeof verifyAuthenticationResponse>>;
  try {
    verification = await verifyAuthenticationResponse({
      response: input.response,
      expectedChallenge: pending.challenge,
      expectedOrigin: input.origin,
      expectedRPID: input.rpID,
      requireUserVerification: true,
      credential: {
        id: passkey.credentialId,
        publicKey: base64UrlToBytes(passkey.publicKey),
        counter: passkey.counter,
        transports: passkey.transports?.split(",").filter(Boolean),
      },
    });
  } catch {
    return null;
  } finally {
    await prisma.webAuthnChallenge.deleteMany({ where: { id: pending.id } });
  }
  if (!verification.verified || !verification.authenticationInfo.userVerified) return null;
  if (verification.authenticationInfo.newCounter > passkey.counter || passkey.counter === 0) {
    await prisma.passkey.update({ where: { id: passkey.id }, data: { counter: verification.authenticationInfo.newCounter } });
  }
  if (passkey.role !== "owner" && passkey.role !== "cleaner") return null;
  return { role: passkey.role as "owner" | "cleaner", userKey: passkey.userKey, cleanerName: passkey.cleanerName };
}
