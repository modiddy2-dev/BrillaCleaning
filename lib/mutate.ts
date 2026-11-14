import { newId } from "./auth";
import { prisma } from "./db";
import { skipsCleaning } from "./rules";
import { asOptionalText, asText, isIsoDate, isTime, parsePrice, parseTeam } from "./validate";

const FREQUENCIES = new Set(["weekly", "biweekly", "on-request"]);
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export type ClientBody = {
  name: string;
  address: string;
  city: string;
  frequency: string;
  day: string;
  time: string;
  team: string[];
  reminderContact: string | null;
  price: number | null;
  biweeklyWeek: "A" | "B" | null;
};

export function parseClientBody(body: unknown): ClientBody | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  const name = asText(record.name, 80);
  const address = asText(record.address, 120);
  const city = asText(record.city, 80);
  const frequency = asText(record.frequency, 20);
  const day = asText(record.day, 40);
  const time = asText(record.time, 40);
  const team = parseTeam(record.team);
  const reminderContact = asOptionalText(record.reminderContact, 80);
  const price = parsePrice(record.price);
  if (!name || !address || !city || !frequency || !day || !time || !team) return null;
  if (!FREQUENCIES.has(frequency) || reminderContact === undefined || price === undefined) return null;
  let biweeklyWeek: "A" | "B" | null = null;
  if (frequency === "biweekly") {
    if (record.biweeklyWeek !== "A" && record.biweeklyWeek !== "B") return null;
    biweeklyWeek = record.biweeklyWeek;
  }
  if (frequency !== "on-request") {
    if (!DAYS.includes(day.slice(0, 3)) || !/^(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})$/.test(time)) return null;
  }
  return { name, address, city, frequency, day, time, team, reminderContact, price, biweeklyWeek };
}

function clientData(input: ClientBody) {
  return {
    name: input.name,
    address: input.address,
    city: input.city,
    frequency: input.frequency,
    day: input.day,
    time: input.time,
    team: JSON.stringify(input.team),
    reminderContact: input.reminderContact,
    reminderPhone: null,
    price: input.price,
    biweeklyWeek: input.biweeklyWeek,
    active: true,
  };
}

export async function createClient(input: ClientBody) {
  return prisma.client.create({ data: { id: `client_${newId()}`, ...clientData(input) } });
}

export async function updateClient(id: string, input: ClientBody) {
  return prisma.client.update({ where: { id }, data: clientData(input) });
}

export type JobBody = {
  id?: string;
  replaces?: { date: string; property: string } | null;
  cancelled: boolean;
  date: string;
  start: string;
  end: string;
  property: string;
  address: string;
  team: string[];
  type: "recurring" | "turnover" | "on-request";
  price: number | null;
  note: string | null;
  sameDay: boolean;
  unconfirmed: boolean;
};

export function parseJobBody(body: unknown): JobBody | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  const date = record.date;
  const start = record.start;
  const end = record.end;
  const property = asText(record.property, 80);
  const address = asText(record.address, 160);
  const team = parseTeam(record.team);
  const type = record.type;
  const price = parsePrice(record.price);
  const note = asOptionalText(record.note, 240);
  if (!isIsoDate(date) || !isTime(start) || !isTime(end) || !property || !address || !team || price === undefined || note === undefined) return null;
  if (type !== "recurring" && type !== "turnover" && type !== "on-request") return null;
  if (start >= end) return null;
  let replaces: JobBody["replaces"] = null;
  if (record.replaces && typeof record.replaces === "object") {
    const prior = record.replaces as Record<string, unknown>;
    const priorProperty = asText(prior.property, 80);
    if (!isIsoDate(prior.date) || !priorProperty) return null;
    replaces = { date: prior.date, property: priorProperty };
  }
  const id = typeof record.id === "string" && record.id ? record.id : undefined;
  return {
    id,
    replaces,
    cancelled: record.cancelled === true,
    date,
    start,
    end,
    property,
    address,
    team,
    type,
    price,
    note,
    sameDay: record.sameDay === true,
    unconfirmed: record.unconfirmed === true,
  };
}

async function upsertManual(date: string, property: string, data: Omit<JobBody, "id" | "replaces">) {
  const existing = await prisma.manualJob.findFirst({ where: { date, property } });
  const row = {
    date,
    start: data.start,
    end: data.end,
    property,
    address: data.address,
    team: JSON.stringify(data.team),
    type: data.type,
    price: data.price,
    note: data.note,
    sameDay: data.sameDay,
    unconfirmed: data.unconfirmed,
    cancelled: data.cancelled,
  };
  if (existing) return prisma.manualJob.update({ where: { id: existing.id }, data: row });
  return prisma.manualJob.create({ data: { id: `job_${newId()}`, ...row } });
}

export async function saveJob(input: JobBody) {
  if (input.cancelled && input.replaces) {
    return upsertManual(input.replaces.date, input.replaces.property, { ...input, date: input.replaces.date, property: input.replaces.property, cancelled: true });
  }
  if (input.id) {
    const existing = await prisma.manualJob.findUnique({ where: { id: input.id } });
    if (!existing) return null;
    return prisma.manualJob.update({
      where: { id: input.id },
      data: {
        date: input.date,
        start: input.start,
        end: input.end,
        property: input.property,
        address: input.address,
        team: JSON.stringify(input.team),
        type: input.type,
        price: input.price,
        note: input.note,
        sameDay: input.sameDay,
        unconfirmed: input.unconfirmed,
        cancelled: input.cancelled,
      },
    });
  }
  if (input.replaces && (input.replaces.date !== input.date || input.replaces.property.toLowerCase() !== input.property.toLowerCase())) {
    await upsertManual(input.replaces.date, input.replaces.property, {
      ...input,
      date: input.replaces.date,
      property: input.replaces.property,
      cancelled: true,
      note: "Replaced",
    });
  }
  return upsertManual(input.date, input.property, input);
}

export type StayBody = {
  rentalKey: "airbnb" | "southridge";
  guest: string | null;
  arrive: string;
  depart: string;
  noCleaning: boolean;
  note: string | null;
};

export function parseStayBody(body: unknown): StayBody | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  if (record.rentalKey !== "airbnb" && record.rentalKey !== "southridge") return null;
  if (!isIsoDate(record.arrive) || !isIsoDate(record.depart) || record.depart <= record.arrive) return null;
  const guest = asOptionalText(record.guest, 80);
  const note = asOptionalText(record.note, 200);
  if (guest === undefined || note === undefined) return null;
  const noCleaning = record.noCleaning === true || skipsCleaning({ note, noCleaning: false });
  return { rentalKey: record.rentalKey, guest, arrive: record.arrive, depart: record.depart, noCleaning, note };
}

export async function createStay(input: StayBody) {
  const rental = await prisma.rental.findUnique({ where: { key: input.rentalKey } });
  if (!rental) return null;
  return prisma.stay.create({
    data: {
      id: `stay_${newId()}`,
      rentalId: rental.id,
      guest: input.guest,
      arrive: input.arrive,
      depart: input.depart,
      noCleaning: input.noCleaning,
      note: input.note,
    },
  });
}

export async function updateStay(id: string, input: StayBody) {
  const rental = await prisma.rental.findUnique({ where: { key: input.rentalKey } });
  if (!rental) return null;
  return prisma.stay.update({
    where: { id },
    data: {
      rentalId: rental.id,
      guest: input.guest,
      arrive: input.arrive,
      depart: input.depart,
      noCleaning: input.noCleaning,
      note: input.note,
    },
  });
}

export type PaymentBody = { date: string; payee: string; via: "Venmo" | "Cash App"; amount: number; note: string | null };

export function parsePaymentBody(body: unknown): PaymentBody | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  const date = asText(record.date, 20);
  const payee = asText(record.payee, 80);
  const note = asOptionalText(record.note, 120);
  const amount = parsePrice(record.amount);
  if (!date || !payee || note === undefined || amount == null) return null;
  if (record.via !== "Venmo" && record.via !== "Cash App") return null;
  return { date, payee, via: record.via, amount, note };
}

export async function createPayment(input: PaymentBody) {
  return prisma.wagePayment.create({
    data: { id: `pay_${newId()}`, date: input.date, payee: input.payee, via: input.via, amount: input.amount, note: input.note },
  });
}

export async function updatePayment(id: string, input: PaymentBody) {
  return prisma.wagePayment.update({
    where: { id },
    data: { date: input.date, payee: input.payee, via: input.via, amount: input.amount, note: input.note },
  });
}
