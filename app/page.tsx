import Link from "next/link";
import { BrillaMark } from "@/components/BrillaMark";
import { Header } from "@/components/Header";
import { copy } from "@/lib/i18n";
import { getSession, readLangCookie } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let lang = await readLangCookie();
  let role: "owner" | "cleaner" | null = null;
  try {
    const session = await getSession();
    if (session) {
      lang = session.lang;
      role = session.role;
    }
  } catch {
    role = null;
  }
  const text = copy(lang);
  return (
    <>
      <Header lang={lang} eyebrow={text.brandCity} logoutLabel={role ? text.logout : undefined} />
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
        <BrillaMark />
        <div className="rounded-3xl border border-dark-border p-6 glass-panel sm:p-8">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-400">{text.homeKicker}</p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-white">{text.homeLead}</h1>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href={role === "owner" ? "/owner" : "/owner/login"} className="rounded-3xl border border-dark-border bg-dark-elevated p-6 transition hover:border-brand-500/60">
            <p className="font-serif text-2xl text-white">{text.ownerApp}</p>
            <p className="mt-2 text-sm text-slate-400">{text.ownerBlurb}</p>
            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-brand-400">{role === "owner" ? text.continueOwner : text.openOwner} →</p>
          </Link>
          <Link href={role === "cleaner" ? "/cleaner" : "/cleaner/login"} className="rounded-3xl border border-dark-border bg-dark-elevated p-6 transition hover:border-brand-500/60">
            <p className="font-serif text-2xl text-white">{text.cleanerApp}</p>
            <p className="mt-2 text-sm text-slate-400">{text.cleanerBlurb}</p>
            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-brand-400">{text.openCleaner} →</p>
          </Link>
        </div>
      </main>
    </>
  );
}
