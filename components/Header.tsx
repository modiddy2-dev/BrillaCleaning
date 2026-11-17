import { BrillaLockup } from "./BrillaMark";
import { LanguageToggle } from "./LanguageToggle";
import { LogoutButton } from "./LogoutButton";
import type { Lang } from "@/lib/rules";

export function Header({ lang, eyebrow, logoutLabel }: { lang: Lang; eyebrow?: string; logoutLabel?: string }) {
  return (
    <header className="sticky top-0 z-50 border-b border-dark-border pb-3 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[max(0.75rem,env(safe-area-inset-top))] shadow-2xl glass-panel lg:pl-[max(2rem,env(safe-area-inset-left))] lg:pr-[max(2rem,env(safe-area-inset-right))]">
      <div className="relative z-10 mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <BrillaLockup />
          {eyebrow ? <p className="mt-1 text-xs text-slate-400">{eyebrow}</p> : null}
        </div>
        <div className="relative z-10 flex flex-wrap items-center gap-2">
          <LanguageToggle lang={lang} />
          {logoutLabel ? <LogoutButton label={logoutLabel} /> : null}
        </div>
      </div>
    </header>
  );
}
