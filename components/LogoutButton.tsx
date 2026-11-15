"use client";

import { useState } from "react";

export function LogoutButton({ label }: { label: string }) {
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
    // Full navigation avoids stale client/PWA shell state after logout.
    window.location.replace("/");
  }

  return (
    <button
      type="button"
      disabled={pending}
      aria-busy={pending}
      className="min-h-11 whitespace-nowrap rounded-xl border border-dark-border bg-dark-elevated px-3 py-2 text-sm font-semibold text-slate-200 disabled:opacity-60"
      onClick={logout}
    >
      {label}
    </button>
  );
}
