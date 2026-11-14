"use client";

import { useState } from "react";
import type { Copy } from "@/lib/i18n";
import { PasskeyLogin } from "./PasskeyControls";
import { fieldClass, labelClass, primaryBtn } from "./ui";

export function OwnerLoginForm({ text }: { text: Copy }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    const response = await fetch("/api/auth/owner", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: form.get("username"), password: form.get("password") }),
    });
    setPending(false);
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      setError(body.error === "rate" ? text.rate : body.error === "config" ? text.config : text.invalid);
      return;
    }
    window.location.href = "/owner";
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <PasskeyLogin role="owner" text={text} />
      <label className="block">
        <span className={labelClass}>{text.username}</span>
        <input name="username" autoComplete="username" required className={fieldClass} />
      </label>
      <label className="block">
        <span className={labelClass}>{text.password}</span>
        <input name="password" type="password" autoComplete="current-password" required className={fieldClass} />
      </label>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <button className={`${primaryBtn} w-full`} disabled={pending} type="submit">
        {pending ? text.signingIn : text.signIn}
      </button>
    </form>
  );
}

export function CleanerLoginForm({ text, names }: { text: Copy; names: string[] }) {
  const [name, setName] = useState(names[0] ?? "Leah");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    const response = await fetch("/api/auth/cleaner", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, pin: form.get("pin") }),
    });
    setPending(false);
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      setError(body.error === "rate" ? text.rate : body.error === "config" ? text.config : text.invalid);
      return;
    }
    window.location.href = "/cleaner";
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <PasskeyLogin role="cleaner" text={text} />
      <p className={labelClass}>{text.chooseName}</p>
      <div className="grid grid-cols-3 gap-2">
        {names.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setName(option)}
            className={`min-h-14 rounded-xl border px-2 py-3 text-base font-semibold ${option === name ? "border-brand-500 bg-brand-500 text-black" : "border-dark-border bg-dark-elevated text-slate-200"}`}
          >
            {option}
          </button>
        ))}
      </div>
      <label className="block">
        <span className={labelClass}>{text.pin}</span>
        <input name="pin" type="password" inputMode="numeric" autoComplete="off" required className={fieldClass} />
      </label>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <button className={`${primaryBtn} w-full`} disabled={pending} type="submit">
        {pending ? text.signingIn : text.signIn}
      </button>
    </form>
  );
}
