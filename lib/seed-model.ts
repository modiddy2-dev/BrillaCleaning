import type { ClientInput, PaymentInput, RentalInput, ScheduleJob, StayInput, WeekLetter } from "./rules";

export type SeedCleaner = {
  name: string;
  legalName?: string;
  role: string;
  paidWages: boolean;
  paidVia: string | null;
  gasReimbursement: boolean;
  notes?: string;
};

export type SeedFile = {
  cleaners: SeedCleaner[];
  clients: Array<{
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
  }>;
  rentals: Array<{
    name: string;
    address: string;
    platform?: string;
    manager?: string;
    price?: number;
    team: string[];
    reminders: boolean;
    turnoverTime?: string;
    pricing?: { base: number; over3Nights: number };
  }>;
  rentalStays: {
    airbnb: Array<{ guest?: string; arrive: string; depart: string; note?: string }>;
    southridge: Array<{ guest?: string; arrive: string; depart: string; note?: string }>;
  };
  wagePayments: Array<{ date: string; to: string; via: string; amount: number; note?: string }>;
  openItems: string[];
};

export function slugId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function clientsFromSeed(seed: SeedFile): ClientInput[] {
  return seed.clients.map((client) => ({
    id: `client_${slugId(client.name)}`,
    name: client.name,
    address: client.address,
    city: client.city,
    frequency: client.frequency,
    day: client.day,
    time: client.time,
    team: client.team,
    reminderContact: client.reminderContact,
    price: client.price,
    biweeklyWeek: client.biweeklyWeek,
    active: true,
  }));
}

export function rentalsFromSeed(seed: SeedFile): RentalInput[] {
  return seed.rentals.map((rental) => {
    const key = rental.name.includes("Airbnb") ? "airbnb" : "southridge";
    return {
      key,
      name: rental.name,
      address: rental.address,
      team: rental.team,
      price: rental.price ?? null,
      basePrice: rental.pricing?.base ?? null,
      over3Nights: rental.pricing?.over3Nights ?? null,
      reminders: rental.reminders,
    };
  });
}

export function staysFromSeed(seed: SeedFile): StayInput[] {
  const airbnb = seed.rentalStays.airbnb.map((stay) => ({
    rentalKey: "airbnb" as const,
    guest: stay.guest ?? null,
    arrive: stay.arrive,
    depart: stay.depart,
    note: stay.note ?? null,
    noCleaning: /no cleaning/i.test(stay.note ?? ""),
  }));
  const southridge = seed.rentalStays.southridge.map((stay) => ({
    rentalKey: "southridge" as const,
    guest: stay.guest ?? null,
    arrive: stay.arrive,
    depart: stay.depart,
    note: stay.note ?? null,
    noCleaning: /no cleaning/i.test(stay.note ?? ""),
  }));
  return [...airbnb, ...southridge];
}

export function paymentsFromSeed(seed: SeedFile): PaymentInput[] {
  return seed.wagePayments.map((payment) => ({ payee: payment.to, via: payment.via, amount: payment.amount }));
}

export function manualFromRows(
  rows: Array<{
    id: string;
    date: string;
    start: string;
    end: string;
    property: string;
    address: string;
    team: string;
    type: string;
    price: number | null;
    note: string | null;
    sameDay: boolean;
    unconfirmed: boolean;
    cancelled: boolean;
  }>,
): ScheduleJob[] {
  return rows.map((row) => ({
    id: row.id,
    date: row.date,
    start: row.start,
    end: row.end,
    property: row.property,
    address: row.address,
    team: JSON.parse(row.team) as string[],
    type: row.type as ScheduleJob["type"],
    price: row.price,
    note: row.note,
    sameDay: row.sameDay,
    unconfirmed: row.unconfirmed,
    cancelled: row.cancelled,
    reminderContact: null,
    reminders: false,
    clientId: null,
    rentalKey: null,
    source: "manual",
  }));
}
