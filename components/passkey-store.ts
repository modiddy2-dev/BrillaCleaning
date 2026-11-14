export type SavedPasskey = {
  credentialId: string;
  role: "owner" | "cleaner";
  label: string;
};

const KEY = "brilla-passkey";

export function readPasskey(): SavedPasskey | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedPasskey;
    if (!parsed || (parsed.role !== "owner" && parsed.role !== "cleaner") || typeof parsed.credentialId !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function savePasskey(value: SavedPasskey) {
  window.localStorage.setItem(KEY, JSON.stringify(value));
}
