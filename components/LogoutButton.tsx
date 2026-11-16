"use client";

import { useState } from "react";

export function LogoutButton({ label, fullWidth = false }: { label: string; fullWidth?: boolean }) {
  const [pending, setPending] = useState(false);

  async function logout() {
    if (pending) return;
    setPending(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { accept: "application/json" },
      });
    } catch {
      // Still leave the app; cookie clear may have partially applied.
    }
    window.location.replace("/");
  }

  return (
    <button
      type="button"
      disabled={pending}
      aria-busy={pending}
      className={`relative z-10 min-h-12 touch-manipulation whitespace-nowrap rounded-xl border border-dark-border bg-dark-elevated px-4 py-3 text-sm font-semibold text-slate-200 disabled:opacity-60 ${fullWidth ? "w-full" : ""}`}
      onClick={logout}
    >
      {label}
    </button>
  );
}
