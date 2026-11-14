import Link from "next/link";
import { redirect } from "next/navigation";
import { BrillaMark } from "@/components/BrillaMark";
import { Header } from "@/components/Header";
import { InstallPrompt } from "@/components/InstallPrompt";
import { OwnerLoginForm } from "@/components/LoginForm";
import { copy } from "@/lib/i18n";
import { getSession, readLangCookie } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function OwnerLoginPage() {
  const session = await getSession().catch(() => null);
  if (session?.role === "owner") redirect("/owner");
  if (session?.role === "cleaner") redirect("/cleaner");
  const lang = session?.lang ?? (await readLangCookie());
  const text = copy(lang);
  return (
    <>
      <Header lang={lang} eyebrow={text.ownerApp} />
      <main className="mx-auto w-full max-w-md px-4 py-8">
        <BrillaMark className="mx-auto mb-6 w-full max-w-sm" />
        <div className="mb-4"><InstallPrompt text={text} /></div>
        <section className="rounded-3xl border border-dark-border p-6 glass-panel">
          <h1 className="mb-4 font-serif text-2xl text-white">{text.ownerLoginTitle}</h1>
          <OwnerLoginForm text={text} />
        </section>
        <p className="mt-4 text-center text-sm text-slate-400">
          <Link href="/cleaner/login" className="text-brand-400">{text.otherApp}</Link>
        </p>
      </main>
    </>
  );
}
