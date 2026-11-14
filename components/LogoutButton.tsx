"use client";

export function LogoutButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="min-h-11 whitespace-nowrap rounded-xl border border-dark-border bg-dark-elevated px-3 py-2 text-sm font-semibold text-slate-200"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/";
      }}
    >
      {label}
    </button>
  );
}
