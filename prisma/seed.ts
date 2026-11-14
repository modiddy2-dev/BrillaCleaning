import { PrismaClient } from "@prisma/client";
import seedJson from "../data/seed.json";
import { cachedMiles } from "../lib/distance";
import { clientsFromSeed, paymentsFromSeed, rentalsFromSeed, staysFromSeed, type SeedFile } from "../lib/seed-model";
import { generateJobs, weekGas, weekMetrics, weekPay, wageTotals } from "../lib/rules";

const prisma = new PrismaClient();
const seed = seedJson as SeedFile;

async function main() {
  await prisma.stay.deleteMany();
  await prisma.manualJob.deleteMany();
  await prisma.rental.deleteMany();
  await prisma.client.deleteMany();
  await prisma.cleaner.deleteMany();
  await prisma.wagePayment.deleteMany();
  await prisma.openItem.deleteMany();
  await prisma.session.deleteMany();
  await prisma.authAttempt.deleteMany();

  const clients = clientsFromSeed(seed);
  const rentals = rentalsFromSeed(seed);
  const stays = staysFromSeed(seed);

  for (const cleaner of seed.cleaners) {
    await prisma.cleaner.create({
      data: {
        id: `cleaner_${cleaner.name.toLowerCase()}`,
        name: cleaner.name,
        legalName: cleaner.legalName ?? null,
        role: cleaner.role,
        paidWages: cleaner.paidWages,
        paidVia: cleaner.paidVia,
        gasReimbursement: cleaner.gasReimbursement,
        notes: cleaner.notes ?? null,
      },
    });
  }

  for (const client of clients) {
    await prisma.client.create({
      data: {
        id: client.id ?? client.name,
        name: client.name,
        address: client.address,
        city: client.city,
        frequency: client.frequency,
        day: client.day,
        time: client.time,
        team: JSON.stringify(client.team),
        reminderContact: client.reminderContact,
        reminderPhone: null,
        price: client.price,
        biweeklyWeek: client.biweeklyWeek,
        active: true,
      },
    });
  }

  for (const rental of seed.rentals) {
    const key = rental.name.includes("Airbnb") ? "airbnb" : "southridge";
    const model = rentals.find((item) => item.key === key);
    if (!model) continue;
    await prisma.rental.create({
      data: {
        id: `rental_${key}`,
        key,
        name: rental.name,
        address: rental.address,
        platform: rental.platform ?? null,
        manager: rental.manager ?? null,
        price: rental.price ?? null,
        basePrice: rental.pricing?.base ?? null,
        over3Nights: rental.pricing?.over3Nights ?? null,
        turnoverTime: rental.turnoverTime ?? null,
        team: JSON.stringify(rental.team),
        reminders: rental.reminders,
      },
    });
  }

  for (const [index, stay] of stays.entries()) {
    await prisma.stay.create({
      data: {
        id: `stay_${stay.rentalKey}_${index}`,
        rentalId: `rental_${stay.rentalKey}`,
        guest: stay.guest ?? null,
        arrive: stay.arrive,
        depart: stay.depart,
        noCleaning: Boolean(stay.noCleaning),
        note: stay.note ?? null,
      },
    });
  }

  for (const [index, payment] of seed.wagePayments.entries()) {
    await prisma.wagePayment.create({
      data: {
        id: `pay_seed_${index}`,
        date: payment.date,
        payee: payment.to,
        via: payment.via,
        amount: payment.amount,
        note: payment.note ?? null,
      },
    });
  }

  for (const [index, text] of seed.openItems.entries()) {
    await prisma.openItem.create({ data: { id: `open_${index}`, sort: index, text } });
  }

  const jobs = generateJobs({ clients, rentals, stays, from: "2026-11-02", to: "2026-11-08" });
  const gas = weekGas(jobs, "2026-11-02", cachedMiles);
  const metrics = weekMetrics(jobs, gas.reimbursement);
  const pay = weekPay(jobs, gas.reimbursement, seed.cleaners);
  const wages = wageTotals(paymentsFromSeed(seed));
  if (
    metrics.revenue !== 1100 ||
    metrics.cleanerHours !== 38 ||
    metrics.paidHours !== 34 ||
    metrics.labor !== 510 ||
    metrics.profit !== 590 ||
    gas.miles !== 86.3 ||
    gas.reimbursement !== 43.15 ||
    metrics.profitAfterGas !== 546.85 ||
    pay.lines.find((line) => line.name === "Leah")?.total !== 270 ||
    pay.lines.find((line) => line.name === "Nancy")?.total !== 283.15 ||
    pay.total !== 553.15 ||
    wages.venmo !== 3827.5 ||
    wages.cashAppNancy !== 2020
  ) {
    throw new Error(`Seed check numbers failed: ${JSON.stringify({ metrics, gas, pay: pay.total, wages })}`);
  }
  console.log("Seeded Brilla Cleaning. Nov 2–8 check numbers match.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
