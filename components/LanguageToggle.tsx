"use client";

import { useRouter } from "next/navigation";
import type { Lang } from "@/lib/rules";

export function LanguageToggle({ lang }: { lang: Lang }) {
  const router = useRouter();
  async function choose(next: Lang) {
    if (next === lang) return;
    await fetch("/api/lang", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lang: next }),
    });
    router.refresh();
  }
  return (
    <div className="relative z-10 flex overflow-hidden rounded-xl border border-dark-border">
      <button
        type="button"
        onClick={() => choose("en")}
        className={`min-h-12 touch-manipulation px-3 py-3 text-sm font-semibold ${lang === "en" ? "bg-brand-500 text-black" : "bg-dark-elevated text-slate-300"}`}
      >
        <span className="sm:hidden">EN</span>
        <span className="hidden sm:inline">English</span>
      </button>
      <button
        type="button"
        onClick={() => choose("es")}
        className={`min-h-12 touch-manipulation px-3 py-3 text-sm font-semibold ${lang === "es" ? "bg-brand-500 text-black" : "bg-dark-elevated text-slate-300"}`}
      >
        <span className="sm:hidden">ES</span>
        <span className="hidden sm:inline">Español</span>
      </button>
    </div>
  );
}
