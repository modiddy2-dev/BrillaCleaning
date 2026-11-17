import { LogoutButton } from "./LogoutButton";

/** Always-reachable logout strip for large phones / Dynamic Island layouts. */
export function LogoutFooter({ label }: { label: string }) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-dark-border px-[max(1rem,env(safe-area-inset-left))] pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl glass-panel pr-[max(1rem,env(safe-area-inset-right))]"
      data-logout-footer
    >
      <div className="mx-auto w-full max-w-7xl">
        <LogoutButton label={label} className="flex min-h-12 w-full items-center justify-center" />
      </div>
    </div>
  );
}
