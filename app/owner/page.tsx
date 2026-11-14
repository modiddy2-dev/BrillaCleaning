import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { InstallPrompt } from "@/components/InstallPrompt";
import { PasskeySetup } from "@/components/PasskeyControls";
import { Dashboard, ownerTab } from "@/components/owner/Dashboard";
import { copy } from "@/lib/i18n";
import { mondayOf, todayChicago } from "@/lib/rules";
import { loadOwnerWeek } from "@/lib/schedule";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function OwnerPage({ searchParams }: { searchParams: Promise<{ week?: string; tab?: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "owner") redirect("/owner/login");
  const params = await searchParams;
  const raw = params.week && /^\d{4}-\d{2}-\d{2}$/.test(params.week) ? params.week : todayChicago();
  const week = mondayOf(raw);
  const text = copy(session.lang);
  const data = await loadOwnerWeek(week);
  return (
    <>
      <Header lang={session.lang} eyebrow={text.ownerApp} logoutLabel={text.logout} />
      <div className="mx-auto w-full max-w-7xl space-y-3 px-4 pt-4 sm:px-6">
        <InstallPrompt text={text} />
        <PasskeySetup role="owner" label={session.userKey.replace(/^owner:/, "")} text={text} />
      </div>
      <Dashboard data={data} lang={session.lang} tab={ownerTab(params.tab)} />
    </>
  );
}
