import { BrillaLockup } from "./BrillaMark";
import { LanguageToggle } from "./LanguageToggle";
import { LogoutButton } from "./LogoutButton";
import type { Lang } from "@/lib/rules";

export function Header({ lang, eyebrow, logoutLabel }: { lang: Lang; eyebrow?: string; logoutLabel?: string }) {
  return (
    <header className="safe-header sticky top-0 z-40 border-b border-dark-border shadow-2xl glass-panel">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <BrillaLockup />
          {eyebrow ? <p className="mt-1 text-xs text-slate-400">{eyebrow}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LanguageToggle lang={lang} />
          {logoutLabel ? <LogoutButton label={logoutLabel} /> : null}
        </div>
      </div>
    </header>
  );
}
