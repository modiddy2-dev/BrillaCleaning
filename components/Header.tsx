import { BrillaLockup } from "./BrillaMark";
import { LanguageToggle } from "./LanguageToggle";
import { LogoutButton } from "./LogoutButton";
import type { Lang } from "@/lib/rules";

export function Header({ lang, eyebrow, logoutLabel }: { lang: Lang; eyebrow?: string; logoutLabel?: string }) {
  return (
    <header className="safe-header sticky top-0 z-50 border-b border-dark-border bg-dark-surface">
      <div className="mx-auto flex max-w-7xl flex-col gap-3">
        <div className="flex min-w-0 items-start justify-between gap-3">
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
        {logoutLabel ? (
          <div className="relative z-10 sm:hidden">
            <LogoutButton label={logoutLabel} fullWidth />
          </div>
        ) : null}
      </div>
    </header>
  );
}
