import { BrillaLockup } from "./BrillaMark";
import { LanguageToggle } from "./LanguageToggle";
import { LogoutButton } from "./LogoutButton";
import type { Lang } from "@/lib/rules";

export function Header({ lang, eyebrow, logoutLabel }: { lang: Lang; eyebrow?: string; logoutLabel?: string }) {
  return (
    // Not sticky: sticky/fixed top chrome can sit under the iPhone status bar
    // at scrollY=0 and never be scrolled into view. Body safe-area padding in
    // globals.css clears the notch; this header scrolls with the page.
    <header className="relative z-40 border-b border-dark-border bg-dark-surface px-4 py-3 lg:px-8">
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
