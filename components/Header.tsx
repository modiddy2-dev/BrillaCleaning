import { BrillaLockup } from "./BrillaMark";
import { LanguageToggle } from "./LanguageToggle";
import { LogoutButton } from "./LogoutButton";
import type { Lang } from "@/lib/rules";

export function Header({ lang, eyebrow, logoutLabel }: { lang: Lang; eyebrow?: string; logoutLabel?: string }) {
  return (
    <>
      <header className="safe-header sticky z-50 border-b border-dark-border bg-dark-surface">
        <div className="mx-auto flex max-w-7xl items-start justify-between gap-3">
          <div className="min-w-0">
            <BrillaLockup />
            {eyebrow ? <p className="mt-1 text-xs text-slate-400">{eyebrow}</p> : null}
          </div>
          <div className="relative z-10 flex shrink-0 items-center gap-2 pt-0.5">
            <LanguageToggle lang={lang} />
            {logoutLabel ? (
              <div className="hidden sm:block">
                <LogoutButton label={logoutLabel} />
              </div>
            ) : null}
          </div>
        </div>
      </header>
      {/*
        Mobile Log out lives in normal document flow (not sticky).
        If the sticky bar is still clipped by the status bar, this stays on-screen
        and scrolls with the page — no need to scroll "up past zero".
      */}
      {logoutLabel ? (
        <div className="border-b border-dark-border bg-dark-surface px-4 py-3 sm:hidden">
          <div className="mx-auto max-w-7xl">
            <LogoutButton label={logoutLabel} fullWidth />
          </div>
        </div>
      ) : null}
    </>
  );
}
