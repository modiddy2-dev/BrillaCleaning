import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { InstallPrompt } from "@/components/InstallPrompt";
import { LogoutFooter } from "@/components/LogoutFooter";
import { PasskeySetup } from "@/components/PasskeyControls";
import { CleanerBoard } from "@/components/cleaner/CleanerBoard";
import { copy } from "@/lib/i18n";
import { addDays, mondayOf, todayChicago } from "@/lib/rules";
import { loadCleanerWeek } from "@/lib/schedule";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function CleanerPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "cleaner" || !session.cleanerName) redirect("/cleaner/login");
  const params = await searchParams;
  const raw = params.week && /^\d{4}-\d{2}-\d{2}$/.test(params.week) ? params.week : todayChicago();
  const week = mondayOf(raw);
  const view = await loadCleanerWeek(session.cleanerName, week);
  if (!view) redirect("/cleaner/login");
  const text = copy(session.lang);
  return (
    <>
      <Header lang={session.lang} eyebrow={session.cleanerName} logoutLabel={text.logout} />
      <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-2 px-4 pt-4">
        <Link href={`/cleaner?week=${addDays(week, -7)}`} className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl border border-dark-border bg-dark-elevated px-4 text-lg text-slate-200" aria-label={text.prev}>←</Link>
        <Link href={`/cleaner?week=${mondayOf(todayChicago())}`} className="min-h-12 px-2 text-center text-sm font-semibold uppercase tracking-wide text-brand-400">{text.thisWeek}</Link>
        <Link href={`/cleaner?week=${addDays(week, 7)}`} className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl border border-dark-border bg-dark-elevated px-4 text-lg text-slate-200" aria-label={text.next}>→</Link>
      </div>
      <CleanerBoard
        view={view}
        lang={session.lang}
        afterGlance={
          <div className="space-y-3">
            <PasskeySetup role="cleaner" label={session.cleanerName} text={text} />
            <InstallPrompt text={text} />
          </div>
        }
      />
      <LogoutFooter label={text.logout} />
    </>
  );
}
