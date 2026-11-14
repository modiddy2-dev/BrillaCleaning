import { roundMiles } from "./rules";

/**
 * Road miles for the week of Nov 2–8, 2026, from the handoff (office → jobs in
 * order → office). Cached so the app matches the check numbers with no API key.
 * Unknown pairs fall through to Google Distance Matrix or OSRM when configured.
 */
export const KNOWN_LEG_MILES: Record<string, number> = {
  "office|southridge": 27.0,
  "southridge|office": 26.9,
  "office|mccoy": 4.0,
  "mccoy|office": 3.9,
  "office|hiawatha": 8.8,
  "hiawatha|terry": 9.4,
  "terry|office": 0.6,
  "office|melrose": 0.9,
  "melrose|shady": 2.8,
  "shady|office": 2.0,
};

export function placeKey(addressOrLabel: string): string {
  const s = addressOrLabel.toLowerCase();
  if (s.includes("bluff") || s === "office") return "office";
  if (s.includes("southridge")) return "southridge";
  if (s.includes("creek wood") || s.includes("creekwood") || s === "mccoy") return "mccoy";
  if (s.includes("hiawatha")) return "hiawatha";
  if (s.includes("3rd") || s.includes("terry") || s.includes("angie")) return "terry";
  if (s.includes("shady")) return "shady";
  if (s.includes("melrose")) return "melrose";
  if (s.includes("castle") || s === "malm") return "malm";
  if (s.includes("fenelon") || s.includes("cavanaugh")) return "cavanaugh";
  if (s.includes("beacon")) return "beacon";
  if (s.includes("barbaralee") || s.includes("fischer") || s.startsWith("beth")) return "beth";
  if (s.includes("carter") || s.includes("aranzatxa")) return "aranzatxa";
  if (s.includes("5th") || s.includes("airbnb") || s.includes("dubuque house")) return "airbnb";
  return s;
}

export function cachedMiles(from: string, to: string): number | null {
  const miles = KNOWN_LEG_MILES[`${placeKey(from)}|${placeKey(to)}`];
  return miles == null ? null : miles;
}

type LatLon = { lat: number; lon: number };

async function geocode(query: string): Promise<LatLon | null> {
  const base = process.env.GEOCODER_URL;
  if (!base) return null;
  const url = new URL(base);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) return null;
  const data = (await res.json()) as Array<{ lat: string; lon: string }>;
  const hit = data[0];
  if (!hit) return null;
  const lat = Number(hit.lat);
  const lon = Number(hit.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon };
}

async function googleMiles(from: string, to: string): Promise<number | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return null;
  const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
  url.searchParams.set("origins", from);
  url.searchParams.set("destinations", to);
  url.searchParams.set("units", "imperial");
  url.searchParams.set("key", key);
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    rows?: Array<{ elements?: Array<{ distance?: { value?: number } }> }>;
  };
  const meters = data.rows?.[0]?.elements?.[0]?.distance?.value;
  if (typeof meters !== "number") return null;
  return roundMiles(meters / 1609.344);
}

async function osrmMiles(from: string, to: string): Promise<number | null> {
  const base = process.env.OSRM_BASE_URL;
  if (!base) return null;
  const [a, b] = await Promise.all([geocode(from), geocode(to)]);
  if (!a || !b) return null;
  const root = base.replace(/\/$/, "");
  const url = `${root}/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=false`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as { routes?: Array<{ distance?: number }> };
  const meters = data.routes?.[0]?.distance;
  if (typeof meters !== "number") return null;
  return roundMiles(meters / 1609.344);
}

/** Live miles for a pair the cache does not already know. Never throws. */
export async function liveMiles(from: string, to: string): Promise<number | null> {
  try {
    const google = await googleMiles(from, to);
    if (google != null) return google;
    return await osrmMiles(from, to);
  } catch {
    return null;
  }
}
