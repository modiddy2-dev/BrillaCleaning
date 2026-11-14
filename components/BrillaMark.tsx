export function Spark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M12 1.2 13.7 8.3 20.8 10 13.7 11.7 12 18.8 10.3 11.7 3.2 10 10.3 8.3Z" fill="currentColor" />
    </svg>
  );
}

export function BrillaMark({ className = "w-full max-w-md" }: { className?: string }) {
  return (
    <svg viewBox="0 0 640 156" className={className} role="img" aria-label="Brilla Cleaning">
      <path d="M320 4 L326 22 L344 28 L326 34 L320 52 L314 34 L296 28 L314 22 Z" fill="#d4af37" />
      <path d="M352 8 L354.5 15 L361 17.5 L354.5 20 L352 27 L349.5 20 L343 17.5 L349.5 15 Z" fill="#e5c07b" />
      <line x1="78" y1="66" x2="562" y2="66" stroke="#f5edd6" strokeWidth="1.25" opacity="0.8" />
      <text
        x="320"
        y="112"
        textAnchor="middle"
        fill="#fbf7ee"
        fontFamily="var(--font-cinzel), Georgia, serif"
        fontWeight="700"
        fontSize="54"
        letterSpacing="16"
      >
        BRILLA
      </text>
      <line x1="78" y1="126" x2="562" y2="126" stroke="#f5edd6" strokeWidth="1.25" opacity="0.8" />
      <text
        x="320"
        y="148"
        textAnchor="middle"
        fill="#d4af37"
        fontFamily="var(--font-cinzel), Georgia, serif"
        fontWeight="600"
        fontSize="15"
        letterSpacing="12"
      >
        CLEANING
      </text>
    </svg>
  );
}

export function BrillaLockup() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 via-brand-500 to-brand-700 text-black shadow-lg shadow-brand-500/20">
        <Spark />
      </div>
      <div>
        <div className="font-serif text-base font-bold leading-none tracking-[0.18em] text-white sm:text-lg sm:tracking-[0.28em]">BRILLA</div>
        <div className="mt-1 font-serif text-[10px] font-semibold tracking-[0.28em] text-brand-400 sm:tracking-[0.42em]">CLEANING</div>
      </div>
    </div>
  );
}
