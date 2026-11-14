import { parseISODate } from "./rules";

export const CLEANER_NAMES = ["Leah", "Nancy", "Giselle"] as const;
export type CleanerName = (typeof CLEANER_NAMES)[number];

export function isCleanerName(value: string): value is CleanerName {
  return (CLEANER_NAMES as readonly string[]).includes(value);
}

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = parseISODate(value);
  return date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month && date.getUTCDate() === day;
}

export function isTime(value: unknown): value is string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function parseTeam(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const team = value.map((item) => String(item));
  if (team.some((name) => !isCleanerName(name))) return null;
  return [...new Set(team)];
}

export function parsePrice(value: unknown): number | null | undefined {
  if (value == null || value === "") return null;
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number) || number < 0 || number > 100000) return undefined;
  return Math.round(number * 100) / 100;
}

export function asText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text || text.length > max) return null;
  return text;
}

export function asOptionalText(value: unknown, max: number): string | null | undefined {
  if (value == null || value === "") return null;
  if (typeof value !== "string") return undefined;
  const text = value.trim();
  if (text.length > max) return undefined;
  return text || null;
}
