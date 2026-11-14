export const OFFICE = "196 Bluff St, Dubuque, IA 52001";
export const WEEK_A_MONDAY = "2026-11-02";
export const HOURLY_WAGE = 15;
export const MILEAGE_RATE = 0.5;
export const UNPAID_CLEANERS = ["Giselle"] as const;
export const REMINDER_TIME = "19:00";
export const AIRBNB_HOURS = 2;
export const SOUTHRIDGE_HOURS = 4;
/** Flat pay for each paid cleaner on the Monday Southridge job. Not the $15 hourly wage. */
export const SOUTHRIDGE_MONDAY_WAGE = 60;

export const REMINDER_TEXT = {
  en: "Girls will be over tomorrow morning",
  es: "Las muchachas irán mañana en la mañana",
} as const;

export type Lang = "en" | "es";
export type WeekLetter = "A" | "B";
export type JobType = "recurring" | "turnover" | "on-request";

export type ClientInput = {
  id?: string;
  name: string;
  address: string;
  city: string;
  frequency: string;
  day: string;
  time: string;
  team: string[];
  reminderContact: string | null;
  price: number | null;
  biweeklyWeek: WeekLetter | null;
  active?: boolean;
};

export type RentalInput = {
  key: "airbnb" | "southridge";
  name: string;
  address: string;
  team: string[];
  price?: number | null;
  basePrice?: number | null;
  over3Nights?: number | null;
  reminders?: boolean;
};

export type StayInput = {
  id?: string;
  rentalKey: "airbnb" | "southridge";
  guest?: string | null;
  arrive: string;
  depart: string;
  note?: string | null;
  noCleaning?: boolean;
};

export type ScheduleJob = {
  id: string;
  date: string;
  start: string;
  end: string;
  property: string;
  address: string;
  team: string[];
  type: JobType;
  price: number | null;
  note: string | null;
  sameDay: boolean;
  unconfirmed: boolean;
  cancelled: boolean;
  reminderContact: string | null;
  reminders: boolean;
  clientId: string | null;
  rentalKey: string | null;
  source: "generated" | "manual";
};

export type MilesLookup = (from: string, to: string) => number | null;

const MON0: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
const WD_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WD_ES = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MO_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MO_ES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function roundMoney(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function roundMiles(n: number): number {
  return Math.round((n + Number.EPSILON) * 10) / 10;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatISODate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(iso: string, days: number): string {
  const date = parseISODate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return formatISODate(date);
}

export function dayOfWeekSun0(iso: string): number {
  return parseISODate(iso).getUTCDay();
}

export function mondayOf(iso: string): string {
  const dow = dayOfWeekSun0(iso);
  const delta = dow === 0 ? -6 : 1 - dow;
  return addDays(iso, delta);
}

export function weekLetter(monday: string, anchor = WEEK_A_MONDAY): WeekLetter {
  const weeks = Math.round((parseISODate(monday).getTime() - parseISODate(anchor).getTime()) / (7 * 86400000));
  return ((weeks % 2) + 2) % 2 === 0 ? "A" : "B";
}

export function todayChicago(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function fromMinutes(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function durationHours(start: string, end: string): number {
  return (toMinutes(end) - toMinutes(start)) / 60;
}

export function formatDay(iso: string, lang: Lang): string {
  const date = parseISODate(iso);
  const dow = date.getUTCDay();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  if (lang === "es") return `${WD_ES[dow]} ${day} ${MO_ES[month]}`;
  return `${WD_EN[dow]} ${MO_EN[month]} ${day}`;
}

export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${String(m).padStart(2, "0")}`;
}

export function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)}–${formatTime(end)}`;
}

export function nightsBetween(arrive: string, depart: string): number {
  return Math.round((parseISODate(depart).getTime() - parseISODate(arrive).getTime()) / 86400000);
}

export function airbnbPrice(nights: number, base = 55, over3 = 75): number {
  return nights > 3 ? over3 : base;
}

export function skipsCleaning(stay: { note?: string | null; noCleaning?: boolean }): boolean {
  if (stay.noCleaning) return true;
  return /no cleaning/i.test(stay.note ?? "");
}

export function paidTeam(team: string[], unpaid: readonly string[] = UNPAID_CLEANERS): string[] {
  return team.filter((name) => !unpaid.includes(name));
}

export function isMondayTerritoryJob(job: { property: string; date: string; start: string; end: string; rentalKey?: string | null }): boolean {
  const territory = job.rentalKey === "southridge" || job.property.startsWith("Southridge");
  return territory && dayOfWeekSun0(job.date) === 1 && job.start === "09:00" && job.end === "13:00";
}

export function cleanerJobWage(
  job: Pick<ScheduleJob, "start" | "end" | "team" | "cancelled" | "property" | "date" | "rentalKey">,
  name: string,
  wage = HOURLY_WAGE,
  unpaid: readonly string[] = UNPAID_CLEANERS,
): number {
  if (job.cancelled || !job.team.includes(name) || unpaid.includes(name)) return 0;
  if (isMondayTerritoryJob(job)) return SOUTHRIDGE_MONDAY_WAGE;
  return durationHours(job.start, job.end) * wage;
}

export function jobLabor(
  job: Pick<ScheduleJob, "start" | "end" | "team" | "cancelled" | "property" | "date" | "rentalKey">,
  wage = HOURLY_WAGE,
  unpaid: readonly string[] = UNPAID_CLEANERS,
): number {
  if (job.cancelled) return 0;
  return paidTeam(job.team, unpaid).reduce((sum, name) => sum + cleanerJobWage(job, name, wage, unpaid), 0);
}

export function isPriced(job: Pick<ScheduleJob, "price" | "cancelled">): boolean {
  return !job.cancelled && job.price != null;
}

export type WeekMetrics = {
  jobs: number;
  cleanerHours: number;
  paidHours: number;
  rentalTurnovers: number;
  revenue: number;
  labor: number;
  profit: number;
  nancyGas: number;
  profitAfterGas: number;
};

/** Unpriced jobs stay on the calendar and still earn wages, but are left out of revenue, labor, and profit. */
export function weekMetrics(jobs: ScheduleJob[], nancyGas: number, wage = HOURLY_WAGE, unpaid: readonly string[] = UNPAID_CLEANERS): WeekMetrics {
  const active = jobs.filter((job) => !job.cancelled);
  const priced = active.filter((job) => job.price != null);
  const revenue = priced.reduce((sum, job) => sum + (job.price ?? 0), 0);
  const labor = priced.reduce((sum, job) => sum + jobLabor(job, wage, unpaid), 0);
  const cleanerHours = active.reduce((sum, job) => sum + durationHours(job.start, job.end) * job.team.length, 0);
  const paidHours = active.reduce((sum, job) => sum + durationHours(job.start, job.end) * paidTeam(job.team, unpaid).length, 0);
  const profit = revenue - labor;
  return {
    jobs: active.length,
    cleanerHours,
    paidHours,
    rentalTurnovers: active.filter((job) => job.type === "turnover").length,
    revenue: roundMoney(revenue),
    labor: roundMoney(labor),
    profit: roundMoney(profit),
    nancyGas: roundMoney(nancyGas),
    profitAfterGas: roundMoney(profit - nancyGas),
  };
}

export function hoursFor(jobs: ScheduleJob[], name: string): number {
  return jobs
    .filter((job) => !job.cancelled && job.team.includes(name))
    .reduce((sum, job) => sum + durationHours(job.start, job.end), 0);
}

export type CleanerPayLine = {
  name: string;
  hours: number;
  wages: number | null;
  gas: number | null;
  total: number | null;
  via: string;
  ownerNoWage: boolean;
};

export function weekPay(
  jobs: ScheduleJob[],
  nancyGas: number,
  cleaners: Array<{ name: string; paidWages: boolean; paidVia: string | null; gasReimbursement: boolean }>,
  wage = HOURLY_WAGE,
): { lines: CleanerPayLine[]; totalWages: number; totalGas: number; total: number } {
  const lines = cleaners.map((cleaner) => {
    const hours = hoursFor(jobs, cleaner.name);
    if (!cleaner.paidWages) {
      return { name: cleaner.name, hours, wages: null, gas: null, total: null, via: "Owner", ownerNoWage: true };
    }
    const wages = roundMoney(jobs.reduce((sum, job) => sum + cleanerJobWage(job, cleaner.name, wage), 0));
    const gas = cleaner.gasReimbursement ? roundMoney(nancyGas) : 0;
    return {
      name: cleaner.name,
      hours,
      wages,
      gas,
      total: roundMoney(wages + gas),
      via: cleaner.paidVia ?? "",
      ownerNoWage: false,
    };
  });
  const paid = lines.filter((line) => !line.ownerNoWage);
  const totalWages = roundMoney(paid.reduce((sum, line) => sum + (line.wages ?? 0), 0));
  const totalGas = roundMoney(paid.reduce((sum, line) => sum + (line.gas ?? 0), 0));
  return { lines, totalWages, totalGas, total: roundMoney(totalWages + totalGas) };
}

export type PaymentInput = { payee: string; via: string; amount: number };

export function wageTotals(payments: PaymentInput[]): { venmo: number; cashAppNancy: number } {
  const venmo = payments.filter((p) => p.via === "Venmo").reduce((sum, p) => sum + p.amount, 0);
  const cashAppNancy = payments.filter((p) => p.via === "Cash App" && p.payee === "Nancy").reduce((sum, p) => sum + p.amount, 0);
  return { venmo: roundMoney(venmo), cashAppNancy: roundMoney(cashAppNancy) };
}

export type GasLeg = { from: string; to: string; miles: number | null };
export type GasDay = { date: string; legs: GasLeg[]; miles: number | null; reimbursement: number | null };
export type GasWeek = { days: GasDay[]; miles: number; reimbursement: number; incomplete: boolean };

export function shortLabel(property: string): string {
  if (property.startsWith("Southridge")) return "Southridge";
  if (property.includes("Airbnb") || property.includes("Dubuque House")) return "The Dubuque House";
  return property;
}

export function nancyStops(jobs: ScheduleJob[], date: string, office = OFFICE, reimburseName = "Nancy"): Array<{ label: string; address: string }> | null {
  const dayJobs = jobs
    .filter((job) => !job.cancelled && job.date === date && job.team.includes(reimburseName))
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  if (dayJobs.length === 0) return null;
  return [
    { label: "Office", address: office },
    ...dayJobs.map((job) => ({ label: shortLabel(job.property), address: job.address })),
    { label: "Office", address: office },
  ];
}

export function weekGas(jobs: ScheduleJob[], weekStart: string, lookup: MilesLookup, office = OFFICE, rate = MILEAGE_RATE, reimburseName = "Nancy"): GasWeek {
  const days: GasDay[] = [];
  for (let i = 0; i < 7; i += 1) {
    const date = addDays(weekStart, i);
    const stops = nancyStops(jobs, date, office, reimburseName);
    if (!stops) continue;
    const legs: GasLeg[] = [];
    for (let s = 0; s < stops.length - 1; s += 1) {
      legs.push({ from: stops[s].label, to: stops[s + 1].label, miles: lookup(stops[s].address, stops[s + 1].address) });
    }
    const incompleteDay = legs.some((leg) => leg.miles == null);
    const miles = incompleteDay ? null : roundMiles(legs.reduce((sum, leg) => sum + (leg.miles ?? 0), 0));
    days.push({ date, legs, miles, reimbursement: miles == null ? null : roundMoney(miles * rate) });
  }
  const incomplete = days.some((day) => day.miles == null);
  const miles = roundMiles(days.reduce((sum, day) => sum + (day.miles ?? 0), 0));
  const reimbursement = roundMoney(days.reduce((sum, day) => sum + (day.reimbursement ?? 0), 0));
  return { days, miles, reimbursement, incomplete };
}

export type Reminder = {
  whenDate: string;
  whenTime: typeof REMINDER_TIME;
  contact: string;
  property: string;
  jobDate: string;
};

export function remindersForWeek(jobs: ScheduleJob[], weekStart: string): Reminder[] {
  const end = addDays(weekStart, 6);
  return jobs
    .filter((job) => !job.cancelled && job.type === "recurring" && job.reminders && job.reminderContact)
    .filter((job) => job.date >= weekStart && job.date <= end)
    .map((job) => ({
      whenDate: addDays(job.date, -1),
      whenTime: "19:00" as const,
      contact: job.reminderContact as string,
      property: job.property,
      jobDate: job.date,
    }))
    .sort((a, b) => a.whenDate.localeCompare(b.whenDate) || a.property.localeCompare(b.property));
}

export type RentalRow = {
  property: string;
  guest: string;
  arrive: string;
  depart: string;
  cleaningDate: string | null;
  start: string | null;
  end: string | null;
  sameDay: boolean;
  noCleaning: boolean;
  price: number | null;
  team: string[];
};

export function rentalSchedule(stays: StayInput[], rentals: RentalInput[]): RentalRow[] {
  const byKey = new Map(rentals.map((rental) => [rental.key, rental]));
  const grouped = new Map<string, StayInput[]>();
  for (const stay of stays) {
    const list = grouped.get(stay.rentalKey) ?? [];
    list.push(stay);
    grouped.set(stay.rentalKey, list);
  }
  const rows: RentalRow[] = [];
  for (const [key, list] of grouped) {
    const rental = byKey.get(key as "airbnb" | "southridge");
    if (!rental) continue;
    const sorted = [...list].sort((a, b) => a.arrive.localeCompare(b.arrive) || a.depart.localeCompare(b.depart));
    sorted.forEach((stay, index) => {
      const next = sorted[index + 1] ?? null;
      const slot = cleaningSlot(stay, next, rental);
      rows.push({
        property: rental.name,
        guest: stay.guest?.trim() ? stay.guest : "—",
        arrive: stay.arrive,
        depart: stay.depart,
        cleaningDate: slot?.noCleaning ? null : slot?.date ?? null,
        start: slot?.noCleaning ? null : slot?.start ?? null,
        end: slot?.noCleaning ? null : slot?.end ?? null,
        sameDay: slot?.sameDay ?? false,
        noCleaning: slot?.noCleaning ?? false,
        price: slot?.noCleaning ? null : slot?.price ?? null,
        team: rental.team,
      });
    });
  }
  rows.sort((a, b) => a.depart.localeCompare(b.depart) || a.property.localeCompare(b.property));
  return rows;
}

type Slot = { date: string; start: string; end: string; sameDay: boolean; noCleaning: boolean; price: number | null };

function cleaningSlot(stay: StayInput, next: StayInput | null, rental: RentalInput): Slot | null {
  if (skipsCleaning(stay)) {
    return { date: stay.depart, start: "11:00", end: "15:00", sameDay: false, noCleaning: true, price: null };
  }
  if (rental.key === "airbnb") {
    const nights = nightsBetween(stay.arrive, stay.depart);
    return {
      date: stay.depart,
      start: "11:00",
      end: fromMinutes(toMinutes("11:00") + AIRBNB_HOURS * 60),
      sameDay: false,
      noCleaning: false,
      price: airbnbPrice(nights, rental.basePrice ?? 55, rental.over3Nights ?? 75),
    };
  }
  const dow = dayOfWeekSun0(stay.depart);
  const sameDay = dow === 0 && !!next && next.arrive === stay.depart;
  if (sameDay) {
    return {
      date: stay.depart,
      start: "11:00",
      end: fromMinutes(toMinutes("11:00") + SOUTHRIDGE_HOURS * 60),
      sameDay: true,
      noCleaning: false,
      price: rental.price ?? null,
    };
  }
  if (dow === 0) {
    return { date: addDays(stay.depart, 1), start: "09:00", end: "13:00", sameDay: false, noCleaning: false, price: rental.price ?? null };
  }
  return {
    date: stay.depart,
    start: "11:00",
    end: fromMinutes(toMinutes("11:00") + SOUTHRIDGE_HOURS * 60),
    sameDay: false,
    noCleaning: false,
    price: rental.price ?? null,
  };
}

function joinAddress(address: string, city: string): string {
  const cityCore = city.replace(/\(unconfirmed\)/i, "").trim();
  const cityName = cityCore.split(",")[0]?.trim().toLowerCase() ?? "";
  if (cityName && address.toLowerCase().includes(cityName)) return address;
  const suffix = /\(unconfirmed\)/i.test(city) ? `${cityCore} (unconfirmed)` : cityCore;
  return `${address}, ${suffix}`;
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function shadowKey(date: string, property: string): string {
  return `${date}|${property.toLowerCase()}`;
}

function stayNote(stay: StayInput, next: StayInput | null, rental: RentalInput): string {
  if (rental.key === "airbnb") {
    const nights = nightsBetween(stay.arrive, stay.depart);
    const guest = stay.guest?.trim() || "Guest";
    const nextBit = next ? `; next arrival ${formatDay(next.arrive, "en")}` : "";
    return `${guest} checks out (${nights} night${nights === 1 ? "" : "s"})${nextBit}; length estimated at 2h`;
  }
  const nextBit = next ? `; next arrival ${formatDay(next.arrive, "en")}` : "";
  return `Checkout ${formatDay(stay.depart, "en")}${nextBit}`;
}

const TERRITORY_TEAM = ["Leah", "Nancy"] as const;
const TERRITORY_NOTE = "Every Monday, 9–1";

function territoryMondaysSkipped(stays: StayInput[]): Set<string> {
  const skipped = new Set<string>();
  for (const stay of stays) {
    if (stay.rentalKey !== "southridge" || !skipsCleaning(stay)) continue;
    const dow = dayOfWeekSun0(stay.depart);
    if (dow === 0) skipped.add(addDays(stay.depart, 1));
    else if (dow === 1) skipped.add(stay.depart);
  }
  return skipped;
}

function sundayCheckoutForMonday(stays: StayInput[], monday: string): { stay: StayInput; next: StayInput | null; sameDay: boolean } | null {
  const sunday = addDays(monday, -1);
  const list = stays
    .filter((stay) => stay.rentalKey === "southridge")
    .sort((a, b) => a.arrive.localeCompare(b.arrive) || a.depart.localeCompare(b.depart));
  const index = list.findIndex((stay) => stay.depart === sunday);
  if (index < 0) return null;
  const stay = list[index];
  const next = list[index + 1] ?? null;
  return { stay, next, sameDay: Boolean(next && next.arrive === stay.depart) };
}

/** Standing Monday clean. A Sunday checkout note is attached when that is why this Monday is busy. Same-day Sunday stays a separate job. */
function mondayTerritoryJobs(stays: StayInput[], rentals: RentalInput[], from: string, to: string): ScheduleJob[] {
  const rental = rentals.find((item) => item.key === "southridge");
  if (!rental) return [];
  const skipped = territoryMondaysSkipped(stays);
  const jobs: ScheduleJob[] = [];
  let monday = mondayOf(from);
  while (monday <= to) {
    if (monday >= from && !skipped.has(monday)) {
      const checkout = sundayCheckoutForMonday(stays, monday);
      const note = checkout && !checkout.sameDay && !skipsCleaning(checkout.stay) ? stayNote(checkout.stay, checkout.next, rental) : TERRITORY_NOTE;
      jobs.push({
        id: `gen_${monday}_southridge_09:00`,
        date: monday,
        start: "09:00",
        end: "13:00",
        property: rental.name,
        address: rental.address,
        team: [...TERRITORY_TEAM],
        type: "turnover",
        price: rental.price ?? 225,
        note,
        sameDay: false,
        unconfirmed: false,
        cancelled: false,
        reminderContact: null,
        reminders: false,
        clientId: null,
        rentalKey: "southridge",
        source: "generated",
      });
    }
    monday = addDays(monday, 7);
  }
  return jobs;
}

function generatedTurnovers(stays: StayInput[], rentals: RentalInput[], from: string, to: string): ScheduleJob[] {
  const rows = rentalSchedule(stays, rentals);
  const rentalByName = new Map(rentals.map((rental) => [rental.name, rental]));
  const jobs: ScheduleJob[] = [];
  const grouped = new Map<string, StayInput[]>();
  for (const stay of stays) {
    const list = grouped.get(stay.rentalKey) ?? [];
    list.push(stay);
    grouped.set(stay.rentalKey, list);
  }
  for (const row of rows) {
    if (row.noCleaning || !row.cleaningDate || !row.start || !row.end) continue;
    if (row.cleaningDate < from || row.cleaningDate > to) continue;
    // The standing Monday 9–1 job already covers a normal Sunday checkout.
    if (row.property.startsWith("Southridge") && row.start === "09:00" && row.end === "13:00" && dayOfWeekSun0(row.cleaningDate) === 1) continue;
    const rental = rentalByName.get(row.property);
    if (!rental) continue;
    const stayList = [...(grouped.get(rental.key) ?? [])].sort((a, b) => a.arrive.localeCompare(b.arrive));
    const stay = stayList.find((item) => item.arrive === row.arrive && item.depart === row.depart);
    const next = stay ? stayList[stayList.indexOf(stay) + 1] ?? null : null;
    jobs.push({
      id: `gen_${row.cleaningDate}_${rental.key}_${row.start}`,
      date: row.cleaningDate,
      start: row.start,
      end: row.end,
      property: rental.name,
      address: rental.address,
      team: rental.team,
      type: "turnover",
      price: row.price,
      note: stay ? stayNote(stay, next, rental) : null,
      sameDay: row.sameDay,
      unconfirmed: false,
      cancelled: false,
      reminderContact: null,
      reminders: false,
      clientId: null,
      rentalKey: rental.key,
      source: "generated",
    });
  }
  return jobs;
}

const MALM_CANCEL_DATE = "2026-11-25";
const THANKSGIVING_DATE = "2026-11-26";

function applyExceptions(jobs: ScheduleJob[], clients: ClientInput[], from: string, to: string): ScheduleJob[] {
  const next = jobs.map((job) => {
    if (job.date === MALM_CANCEL_DATE && job.property === "Malm") {
      return { ...job, cancelled: true, reminders: false, reminderContact: null };
    }
    if (job.date === THANKSGIVING_DATE && (job.property === "Beacon Hill" || job.property.startsWith("Beth"))) {
      return { ...job, unconfirmed: true };
    }
    return job;
  });
  const beth = clients.find((client) => client.name.startsWith("Beth"));
  if (beth && MALM_CANCEL_DATE >= from && MALM_CANCEL_DATE <= to) {
    const exists = next.some((job) => job.date === MALM_CANCEL_DATE && job.property === beth.name && !job.cancelled);
    if (!exists) {
      next.push({
        id: `gen_${MALM_CANCEL_DATE}_${slug(beth.name)}_09:00`,
        date: MALM_CANCEL_DATE,
        start: "09:00",
        end: "10:30",
        property: beth.name,
        address: joinAddress(beth.address, beth.city),
        team: beth.team,
        type: "recurring",
        price: beth.price,
        note: "Takes Malm's 9:00 slot; Malm cancelled",
        sameDay: false,
        unconfirmed: false,
        cancelled: false,
        reminderContact: beth.reminderContact,
        reminders: true,
        clientId: beth.id ?? null,
        rentalKey: null,
        source: "generated",
      });
    }
  }
  return next;
}

export function generateJobs(input: {
  clients: ClientInput[];
  rentals: RentalInput[];
  stays: StayInput[];
  manual?: ScheduleJob[];
  from: string;
  to: string;
}): ScheduleJob[] {
  const jobs: ScheduleJob[] = [];
  let monday = mondayOf(input.from);
  while (monday <= input.to) {
    const letter = weekLetter(monday);
    for (const client of input.clients) {
      if (client.active === false) continue;
      if (client.frequency === "on-request") continue;
      if (client.frequency === "biweekly" && client.biweeklyWeek !== letter) continue;
      if (client.frequency !== "weekly" && client.frequency !== "biweekly") continue;
      const offset = MON0[client.day.slice(0, 3)];
      const window = client.time.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
      if (offset == null || !window) continue;
      const date = addDays(monday, offset);
      if (date < input.from || date > input.to) continue;
      jobs.push({
        id: `gen_${date}_${slug(client.name)}_${window[1]}`,
        date,
        start: window[1],
        end: window[2],
        property: client.name,
        address: joinAddress(client.address, client.city),
        team: [...client.team],
        type: "recurring",
        price: client.price,
        note: null,
        sameDay: false,
        unconfirmed: false,
        cancelled: false,
        reminderContact: client.reminderContact,
        reminders: Boolean(client.reminderContact),
        clientId: client.id ?? null,
        rentalKey: null,
        source: "generated",
      });
    }
    monday = addDays(monday, 7);
  }

  jobs.push(...mondayTerritoryJobs(input.stays, input.rentals, input.from, input.to));
  jobs.push(...generatedTurnovers(input.stays, input.rentals, input.from, input.to));
  const withExceptions = applyExceptions(jobs, input.clients, input.from, input.to);
  const manual = (input.manual ?? []).filter((job) => job.date >= input.from && job.date <= input.to);
  const manualKeys = new Set(manual.map((job) => shadowKey(job.date, job.property)));
  const active = withExceptions.filter(
    (job) => !job.cancelled && job.date >= input.from && job.date <= input.to && !manualKeys.has(shadowKey(job.date, job.property)),
  );
  const extras = manual.filter((job) => !job.cancelled);
  return [...active, ...extras].sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start) || a.property.localeCompare(b.property));
}

export type CleanerJobView = {
  date: string;
  start: string;
  end: string;
  property: string;
  address: string;
  teammates: string[];
  type: JobType;
  note: string | null;
  sameDay: boolean;
};

export type CleanerWeekView = {
  cleaner: string;
  weekStart: string;
  hours: number;
  jobCount: number;
  jobs: CleanerJobView[];
  estimateNote: boolean;
  pay:
    | { ownerNoWage: true }
    | {
        ownerNoWage: false;
        paidVia: string;
        days: Array<{ date: string; hours: number; wages: number; gas: number; total: number }>;
        wages: number;
        gas: number;
        total: number;
      };
};

const FORBIDDEN_CLEANER_KEYS = new Set([
  "price",
  "profit",
  "revenue",
  "labor",
  "reminderContact",
  "reminderPhone",
  "phone",
  "payments",
  "wagePayments",
  "clients",
  "profitAfterGas",
  "otherPay",
]);

export function assertCleanerPayload(value: unknown): void {
  const walk = (node: unknown) => {
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (node && typeof node === "object") {
      for (const [key, child] of Object.entries(node as Record<string, unknown>)) {
        if (FORBIDDEN_CLEANER_KEYS.has(key)) throw new Error(`Cleaner payload leaked field: ${key}`);
        walk(child);
      }
    }
  };
  walk(value);
}

export function emptyGas(): GasWeek {
  return { days: [], miles: 0, reimbursement: 0, incomplete: false };
}

export function toCleanerView(
  jobs: ScheduleJob[],
  cleaner: string,
  weekStart: string,
  gas: GasWeek,
  wage: number,
  paidVia: string | null,
  ownerNoWage: boolean,
  reimbursesGas = false,
): CleanerWeekView {
  const end = addDays(weekStart, 6);
  const mine = jobs
    .filter((job) => !job.cancelled && job.date >= weekStart && job.date <= end && job.team.includes(cleaner))
    .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start));
  const hours = mine.reduce((sum, job) => sum + durationHours(job.start, job.end), 0);
  const base: Omit<CleanerWeekView, "pay"> = {
    cleaner,
    weekStart,
    hours,
    jobCount: mine.length,
    estimateNote: mine.some((job) => job.property.includes("Airbnb")),
    jobs: mine.map((job) => ({
      date: job.date,
      start: job.start,
      end: job.end,
      property: job.property,
      address: job.address,
      teammates: job.team.filter((name) => name !== cleaner),
      type: job.type,
      note: job.note,
      sameDay: job.sameDay,
    })),
  };
  if (ownerNoWage) {
    const view: CleanerWeekView = { ...base, pay: { ownerNoWage: true } };
    assertCleanerPayload(view);
    return view;
  }
  const gasSource = reimbursesGas ? gas : emptyGas();
  const gasByDate = new Map(gasSource.days.map((day) => [day.date, day.reimbursement ?? 0]));
  const hoursByDate = new Map<string, number>();
  const wagesByDate = new Map<string, number>();
  for (const job of mine) {
    hoursByDate.set(job.date, (hoursByDate.get(job.date) ?? 0) + durationHours(job.start, job.end));
    wagesByDate.set(job.date, (wagesByDate.get(job.date) ?? 0) + cleanerJobWage(job, cleaner, wage));
  }
  const days = [...hoursByDate.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, dayHours]) => {
      const dayGas = gasByDate.has(date) ? roundMoney(gasByDate.get(date) ?? 0) : 0;
      const wages = roundMoney(wagesByDate.get(date) ?? 0);
      return { date, hours: dayHours, wages, gas: dayGas, total: roundMoney(wages + dayGas) };
    });
  const wagesSum = roundMoney(days.reduce((sum, day) => sum + day.wages, 0));
  const gasSum = roundMoney(days.reduce((sum, day) => sum + day.gas, 0));
  const view: CleanerWeekView = {
    ...base,
    pay: { ownerNoWage: false, paidVia: paidVia ?? "", days, wages: wagesSum, gas: gasSum, total: roundMoney(wagesSum + gasSum) },
  };
  assertCleanerPayload(view);
  return view;
}

export function turnoverRevenue(rows: RentalRow[]): number {
  return roundMoney(rows.reduce((sum, row) => sum + (row.price ?? 0), 0));
}

export const SCHEDULE_FROM = "2026-10-01";
export const SCHEDULE_TO = "2027-01-31";

export const FLAG_COPY = {
  sameDay: {
    en: { title: "Southridge same-day turnover", detail: "Guests leave and new guests arrive the same day. Clean at 11:00." },
    es: { title: "Cambio el mismo día en Southridge", detail: "Los huéspedes salen y llegan el mismo día. Limpiar a las 11:00." },
  },
  malm: {
    en: { title: "Malm cancelled, Beth's instead", detail: "Beth & Darrin's takes Malm's 9:00 slot; Cavanaugh stays 11:30. No reminder to Greg Malm." },
    es: { title: "Malm cancelado, entra Beth", detail: "Beth & Darrin's toma el horario de las 9:00 de Malm; Cavanaugh sigue a las 11:30. Sin recordatorio a Greg Malm." },
  },
  thanksgiving: {
    en: { title: "Thanksgiving: Beacon Hill + Beth's", detail: "Still on the calendar; waiting for Gabriel to confirm." },
    es: { title: "Acción de Gracias: Beacon Hill y Beth", detail: "Siguen en el calendario; falta la confirmación de Gabriel." },
  },
} as const;
