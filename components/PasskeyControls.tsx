"use client";

import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { useEffect, useState } from "react";
import type { Copy } from "@/lib/i18n";
import { ghostBtn, primaryBtn } from "./ui";
import { readPasskey, savePasskey } from "./passkey-store";

export function PasskeyLogin({ role, text }: { role: "owner" | "cleaner"; text: Copy }) {
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = readPasskey();
    setReady(Boolean(saved && saved.role === role && window.PublicKeyCredential));
  }, [role]);

  if (!ready) return null;

  async function signIn() {
    const saved = readPasskey();
    if (!saved) return;
    setPending(true);
    setError("");
    try {
      const optionsResponse = await fetch("/api/auth/webauthn/login/options", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ credentialId: saved.credentialId }),
      });
      if (!optionsResponse.ok) throw new Error("options");
      const { options } = (await optionsResponse.json()) as { options: Parameters<typeof startAuthentication>[0]["optionsJSON"] };
      const response = await startAuthentication({ optionsJSON: options });
      const verify = await fetch("/api/auth/webauthn/login/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ response }),
      });
      if (!verify.ok) throw new Error("verify");
      const body = (await verify.json()) as { role?: string };
      window.location.href = body.role === "owner" ? "/owner" : "/cleaner";
    } catch {
      setError(text.passkeyFail);
      setPending(false);
    }
  }

  return (
    <div className="mb-4 space-y-2">
      <button type="button" className={`${primaryBtn} min-h-14 w-full text-sm`} disabled={pending} onClick={() => void signIn()}>
        {pending ? text.passkeyWorking : text.passkey}
      </button>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <p className="text-sm text-slate-400">{text.passkeyHint}</p>
    </div>
  );
}

export function PasskeySetup({ role, label, text }: { role: "owner" | "cleaner"; label: string; text: Copy }) {
  const [visible, setVisible] = useState(false);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const saved = readPasskey();
    if (saved?.role === role) return;
    if (window.PublicKeyCredential) setVisible(true);
  }, [role]);

  if (!visible && !done) return null;

  async function enroll() {
    setPending(true);
    setMessage("");
    try {
      const optionsResponse = await fetch("/api/auth/webauthn/register/options", { method: "POST" });
      if (!optionsResponse.ok) throw new Error("options");
      const { options } = (await optionsResponse.json()) as { options: Parameters<typeof startRegistration>[0]["optionsJSON"] };
      const response = await startRegistration({ optionsJSON: options });
      const verify = await fetch("/api/auth/webauthn/register/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ response }),
      });
      if (!verify.ok) throw new Error("verify");
      const body = (await verify.json()) as { credentialId?: string };
      if (!body.credentialId) throw new Error("verify");
      savePasskey({ credentialId: body.credentialId, role, label });
      setMessage(text.passkeySaved);
      setDone(true);
      setVisible(false);
    } catch {
      setMessage(text.passkeyFail);
      setPending(false);
    }
  }

  return (
    <section className="rounded-3xl border border-brand-500/50 bg-brand-500/10 p-4">
      <h2 className="font-serif text-xl text-white">{text.passkeySetup}</h2>
      <p className="mt-2 text-sm text-slate-300">{text.passkeyHint}</p>
      <div className="mt-3 flex flex-col gap-2">
        <button type="button" className={`${primaryBtn} min-h-14 w-full text-sm`} disabled={pending} onClick={() => void enroll()}>
          {pending ? text.passkeyWorking : text.passkey}
        </button>
        <button type="button" className={`${ghostBtn} min-h-12 w-full`} onClick={() => setVisible(false)}>
          {text.passkeyLater}
        </button>
      </div>
      {message ? <p className="mt-2 text-sm text-brand-100">{message}</p> : null}
    </section>
  );
}
