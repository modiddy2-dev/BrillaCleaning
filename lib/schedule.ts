import { cachedMiles, liveMiles, placeKey } from "./distance";
import { prisma } from "./db";
import { manualFromRows, type SeedCleaner } from "./seed-model";
import {
  FLAG_COPY,
  HOURLY_WAGE,
  OFFICE,
  SCHEDULE_FROM,
  SCHEDULE_TO,
  addDays,
  emptyGas,
  generateJobs,
  nancyStops,
  remindersForWeek,
  rentalSchedule,
  toCleanerView,
  turnoverRevenue,
  wageTotals,
  weekGas,
  weekMetrics,
  weekPay,
  type CleanerWeekView,
  type ClientInput,
  type GasWeek,
  type MilesLookup,
  type PaymentInput,
  type Reminder,
  type RentalInput,
  type RentalRow,
  type ScheduleJob,
  type StayInput,
  type WeekLetter,
  type WeekMetrics,
} from "./rules";

export type Staff = {
  name: string;
  legalName: string | null;
  role: string;
  paidWages: boolean;
  paidVia: string | null;
  gasReimbursement: boolean;
  notes: string | null;
};

export type PaymentRow = PaymentInput & { id: string; date: string; note: string | null };

export type StayRow = StayInput & { id: string };

export type Flag = {
  id: string;
  date: string;
  tone: "danger" | "warning";
  titleKey: keyof typeof FLAG_COPY;
};

export type OwnerWeek = {
  weekStart: string;
  metrics: WeekMetrics;
  jobs: ScheduleJob[];
  gas: GasWeek;
  leahOnlyDates: string[];
  pay: ReturnType<typeof weekPay>;
  reminders: Reminder[];
  rentalRows: RentalRow[];
  turnoverTotal: number;
  clients: ClientInput[];
  payments: PaymentRow[];
  wages: { venmo: number; cashAppNancy: number };
  openItems: string[];
  flags: Flag[];
  stays: StayRow[];
  staff: Staff[];
  gasIncomplete: boolean;
};

async function resolveMiles(from: string, to: string): Promise<number | null> {
  const known = cachedMiles(from, to);
  if (known != null) return known;
  const pair = `${placeKey(from)}|${placeKey(to)}`;
  const row = await prisma.distanceCache.findUnique({ where: { pair } });
  if (row) return row.miles;
  const live = await liveMiles(from, to);
  if (live == null) return null;
  await prisma.distanceCache.upsert({
    where: { pair },
    update: { miles: live },
    create: { id: pair, pair, miles: live },
  });
  return live;
}

async function lookupFor(jobs: ScheduleJob[]): Promise<MilesLookup> {
  const pairs = new Map<string, { from: string; to: string }>();
  for (const date of new Set(jobs.map((job) => job.date))) {
    const stops = nancyStops(jobs, date);
    if (!stops) continue;
    for (let index = 0; index < stops.length - 1; index += 1) {
      pairs.set(`${stops[index].address}=>${stops[index + 1].address}`, {
        from: stops[index].address,
        to: stops[index + 1].address,
      });
    }
  }
  const resolved = new Map<string, number | null>();
  for (const [key, pair] of pairs) {
    resolved.set(key, await resolveMiles(pair.from, pair.to));
  }
  return (from, to) => {
    const key = `${from}=>${to}`;
    return resolved.has(key) ? resolved.get(key) ?? null : cachedMiles(from, to);
  };
}

function mapClients(rows: Array<{
  id: string;
  name: string;
  address: string;
  city: string;
  frequency: string;
  day: string;
  time: string;
  team: string;
  reminderContact: string | null;
  price: number | null;
  biweeklyWeek: string | null;
  active: boolean;
}>): ClientInput[] {
  return rows.filter((row) => row.active).map((row) => ({
    id: row.id,
    name: row.name,
    address: row.address,
    city: row.city,
    frequency: row.frequency,
    day: row.day,
    time: row.time,
    team: JSON.parse(row.team) as string[],
    reminderContact: row.reminderContact,
    price: row.price,
    biweeklyWeek: row.biweeklyWeek === "A" || row.biweeklyWeek === "B" ? row.biweeklyWeek : null,
    active: row.active,
  }));
}

function mapRentals(rows: Array<{
  key: string;
  name: string;
  address: string;
  team: string;
  price: number | null;
  basePrice: number | null;
  over3Nights: number | null;
  reminders: boolean;
}>): RentalInput[] {
  return rows.map((row) => ({
    key: row.key === "airbnb" ? "airbnb" : "southridge",
    name: row.name,
    address: row.address,
    team: JSON.parse(row.team) as string[],
    price: row.price,
    basePrice: row.basePrice,
    over3Nights: row.over3Nights,
    reminders: row.reminders,
  }));
}

async function loadInputs() {
  const [clients, rentals, manual, payments, openItems, cleaners] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: "asc" } }),
    prisma.rental.findMany(),
    prisma.manualJob.findMany(),
    prisma.wagePayment.findMany(),
    prisma.openItem.findMany({ orderBy: { sort: "asc" } }),
    prisma.cleaner.findMany(),
  ]);
  return {
    clients: mapClients(clients),
    rentals: mapRentals(rentals),
    manual: manualFromRows(manual),
    payments: payments
      .map((payment) => ({
        id: payment.id,
        date: payment.date,
        payee: payment.payee,
        via: payment.via,
        amount: payment.amount,
        note: payment.note,
      }))
      .sort((a, b) => a.date.localeCompare(b.date) || a.payee.localeCompare(b.payee)),
    openItems: openItems.map((item) => item.text),
    cleaners,
  };
}

function rentalKeyFromStay(stay: { rentalId: string }, rentals: Array<{ id: string; key: string }>): "airbnb" | "southridge" {
  const rental = rentals.find((item) => item.id === stay.rentalId);
  return rental?.key === "airbnb" ? "airbnb" : "southridge";
}

function leahOnlyDates(jobs: ScheduleJob[], weekStart: string): string[] {
  const dates: string[] = [];
  for (let index = 0; index < 7; index += 1) {
    const date = addDays(weekStart, index);
    const dayJobs = jobs.filter((job) => job.date === date);
    if (dayJobs.length > 0 && dayJobs.every((job) => !job.team.includes("Nancy"))) dates.push(date);
  }
  return dates;
}

function flagsFor(jobs: ScheduleJob[]): Flag[] {
  const sameDay = jobs
    .filter((job) => job.sameDay)
    .map((job) => ({ id: `same-${job.id}`, date: job.date, tone: "danger" as const, titleKey: "sameDay" as const }));
  return [
    ...sameDay,
    { id: "malm", date: "2026-11-25", tone: "warning" as const, titleKey: "malm" as const },
    { id: "thanksgiving", date: "2026-11-26", tone: "warning" as const, titleKey: "thanksgiving" as const },
  ];
}

const STAFF_ORDER = ["Leah", "Nancy", "Giselle"];

export async function loadOwnerWeek(weekStart: string): Promise<OwnerWeek> {
  const rawRentals = await prisma.rental.findMany();
  const inputs = await loadInputs();
  const stays: StayRow[] = (await prisma.stay.findMany()).map((stay) => ({
    id: stay.id,
    rentalKey: rentalKeyFromStay(stay, rawRentals),
    guest: stay.guest,
    arrive: stay.arrive,
    depart: stay.depart,
    note: stay.note,
    noCleaning: stay.noCleaning,
  }));
  const allJobs = generateJobs({
    clients: inputs.clients,
    rentals: inputs.rentals,
    stays,
    manual: inputs.manual,
    from: SCHEDULE_FROM,
    to: SCHEDULE_TO,
  });
  const weekEnd = addDays(weekStart, 6);
  const jobs = allJobs.filter((job) => job.date >= weekStart && job.date <= weekEnd);
  const lookup = await lookupFor(jobs);
  const gas = weekGas(jobs, weekStart, lookup);
  const nancyGas = gas.reimbursement;
  const staff: Staff[] = inputs.cleaners
    .map((cleaner) => ({
      name: cleaner.name,
      legalName: cleaner.legalName,
      role: cleaner.role,
      paidWages: cleaner.paidWages,
      paidVia: cleaner.paidVia,
      gasReimbursement: cleaner.gasReimbursement,
      notes: cleaner.notes,
    }))
    .sort((a, b) => STAFF_ORDER.indexOf(a.name) - STAFF_ORDER.indexOf(b.name));
  const rentalRows = rentalSchedule(stays, inputs.rentals);
  return {
    weekStart,
    metrics: weekMetrics(jobs, nancyGas),
    jobs,
    gas,
    leahOnlyDates: leahOnlyDates(jobs, weekStart),
    pay: weekPay(jobs, nancyGas, staff),
    reminders: remindersForWeek(jobs, weekStart),
    rentalRows,
    turnoverTotal: turnoverRevenue(rentalRows),
    clients: inputs.clients,
    payments: inputs.payments,
    wages: wageTotals(inputs.payments),
    openItems: inputs.openItems,
    flags: flagsFor(allJobs),
    stays,
    staff,
    gasIncomplete: gas.incomplete,
  };
}

export async function loadCleanerWeek(cleanerName: string, weekStart: string): Promise<CleanerWeekView | null> {
  const cleaner = await prisma.cleaner.findUnique({ where: { name: cleanerName } });
  if (!cleaner) return null;
  const rawRentals = await prisma.rental.findMany();
  const inputs = await loadInputs();
  const stays: StayInput[] = (await prisma.stay.findMany()).map((stay) => ({
    rentalKey: rentalKeyFromStay(stay, rawRentals),
    guest: stay.guest,
    arrive: stay.arrive,
    depart: stay.depart,
    note: stay.note,
    noCleaning: stay.noCleaning,
  }));
  const jobs = generateJobs({
    clients: inputs.clients,
    rentals: inputs.rentals,
    stays,
    manual: inputs.manual,
    from: weekStart,
    to: addDays(weekStart, 6),
  });
  let gas = emptyGas();
  if (cleaner.gasReimbursement) {
    gas = weekGas(jobs, weekStart, await lookupFor(jobs), OFFICE, 0.5, cleaner.name);
  }
  return toCleanerView(
    jobs,
    cleaner.name,
    weekStart,
    gas,
    HOURLY_WAGE,
    cleaner.paidVia,
    !cleaner.paidWages,
    cleaner.gasReimbursement,
  );
}

export type { SeedCleaner, WeekLetter };
