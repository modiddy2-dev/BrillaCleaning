"use client";

export function LogoutButton({ label, className = "" }: { label: string; className?: string }) {
  return (
    <button
      type="button"
      className={`relative z-10 min-h-11 touch-manipulation whitespace-nowrap rounded-xl border border-dark-border bg-dark-elevated px-3 py-2 text-sm font-semibold text-slate-200 ${className}`}
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/";
      }}
    >
      {label}
    </button>
  );
}
