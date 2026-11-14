"use client";

import { useEffect, useState } from "react";
import type { Copy } from "@/lib/i18n";
import { primaryBtn } from "./ui";

type BeforeInstall = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function InstallPrompt({ text }: { text: Copy }) {
  const [hidden, setHidden] = useState(true);
  const [promptEvent, setPromptEvent] = useState<BeforeInstall | null>(null);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    setHidden(standalone);
    function onPrompt(event: Event) {
      event.preventDefault();
      setPromptEvent(event as BeforeInstall);
      setHidden(false);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (hidden) return null;

  return (
    <section className="rounded-3xl border border-brand-500/40 bg-dark-elevated p-4">
      <h2 className="font-serif text-xl text-white">{text.installTitle}</h2>
      <p className="mt-2 text-base leading-6 text-slate-300">{text.installBody}</p>
      {promptEvent ? (
        <button
          type="button"
          className={`${primaryBtn} mt-3 min-h-14 w-full text-sm`}
          onClick={() => {
            void promptEvent.prompt().then(() => setPromptEvent(null));
          }}
        >
          {text.installButton}
        </button>
      ) : null}
    </section>
  );
}
