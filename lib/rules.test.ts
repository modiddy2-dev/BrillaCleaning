import { describe, expect, it } from "vitest";
import seedJson from "../data/seed.json";
import { cachedMiles } from "./distance";
import { clientsFromSeed, paymentsFromSeed, rentalsFromSeed, staysFromSeed, type SeedFile } from "./seed-model";
import {
  OFFICE,
  airbnbPrice,
  assertCleanerPayload,
  dayOfWeekSun0,
  cleanerJobWage,
  generateJobs,
  jobLabor,
  nightsBetween,
  remindersForWeek,
  rentalSchedule,
  roundMoney,
  toCleanerView,
  turnoverRevenue,
  wageTotals,
  weekGas,
  weekLetter,
  weekMetrics,
  weekPay,
  type ScheduleJob,
} from "./rules";

const seed = seedJson as SeedFile;
const clients = clientsFromSeed(seed);
const rentals = rentalsFromSeed(seed);
const stays = staysFromSeed(seed);
const payments = paymentsFromSeed(seed);
const cleaners = seed.cleaners.map((cleaner) => ({
  name: cleaner.name,
  paidWages: cleaner.paidWages,
  paidVia: cleaner.paidVia,
  gasReimbursement: cleaner.gasReimbursement,
}));

function weekJobs(from: string, to = from): ScheduleJob[] {
  const end = to === from ? addWeekEnd(from) : to;
  return generateJobs({ clients, rentals, stays, from, to: end });
}

function addWeekEnd(monday: string): string {
  const [y, m, d] = monday.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + 6));
  return date.toISOString().slice(0, 10);
}

describe("check numbers for the week of Nov 2–8, 2026", () => {
  const jobs = weekJobs("2026-11-02");
  const gas = weekGas(jobs, "2026-11-02", cachedMiles, OFFICE);
  const metrics = weekMetrics(jobs, gas.reimbursement);
  const pay = weekPay(jobs, gas.reimbursement, cleaners);
  const wages = wageTotals(payments);

  it("reproduces revenue, hours, labor, profit, gas, and pay", () => {
    expect(metrics.revenue).toBe(1100);
    expect(metrics.cleanerHours).toBe(38);
    expect(metrics.paidHours).toBe(34);
    expect(metrics.labor).toBe(510);
    expect(metrics.profit).toBe(590);
    expect(gas.miles).toBe(86.3);
    expect(gas.reimbursement).toBe(43.15);
    expect(metrics.nancyGas).toBe(43.15);
    expect(metrics.profitAfterGas).toBe(546.85);
    expect(pay.lines.find((line) => line.name === "Leah")?.total).toBe(270);
    expect(pay.lines.find((line) => line.name === "Nancy")?.total).toBe(283.15);
    expect(pay.lines.find((line) => line.name === "Giselle")?.ownerNoWage).toBe(true);
    expect(pay.total).toBe(553.15);
    expect(wages.venmo).toBe(3827.5);
    expect(wages.cashAppNancy).toBe(2020);
  });

  it("reproduces Nancy's daily gas: Mon 53.9 mi $26.95, Tue 7.9 mi $3.95, Wed 18.8 mi $9.40, Thu 5.7 mi $2.85", () => {
    const byDate = Object.fromEntries(gas.days.map((day) => [day.date, day]));
    expect(byDate["2026-11-02"]).toMatchObject({ miles: 53.9, reimbursement: 26.95 });
    expect(byDate["2026-11-03"]).toMatchObject({ miles: 7.9, reimbursement: 3.95 });
    expect(byDate["2026-11-04"]).toMatchObject({ miles: 18.8, reimbursement: 9.4 });
    expect(byDate["2026-11-05"]).toMatchObject({ miles: 5.7, reimbursement: 2.85 });
    expect(gas.days.map((day) => day.date)).not.toContain("2026-11-08");
    expect(gas.incomplete).toBe(false);
    expect(roundMoney(26.95 + 3.95 + 9.4 + 2.85)).toBe(43.15);
  });

  it("matches the seeded jobs for that week", () => {
    expect(jobs.map((job) => [job.date, job.start, job.end, job.property, job.team.join(","), job.price, job.type])).toEqual([
      ["2026-11-02", "09:00", "13:00", "Southridge (Territory)", "Leah,Nancy", 225, "turnover"],
      ["2026-11-03", "09:00", "13:00", "McCoy", "Giselle,Leah,Nancy", 360, "recurring"],
      ["2026-11-04", "09:00", "11:00", "Hiawatha", "Leah,Nancy", 120, "recurring"],
      ["2026-11-04", "11:15", "13:15", "Terry & Angie", "Leah,Nancy", 100, "recurring"],
      ["2026-11-05", "09:00", "11:00", "Melrose", "Leah,Nancy", 120, "recurring"],
      ["2026-11-05", "11:15", "13:15", "Shady Oaks", "Leah,Nancy", 120, "recurring"],
      ["2026-11-08", "11:00", "13:00", "The Dubuque House (Airbnb)", "Leah", 55, "turnover"],
    ]);
    const southridge = jobs.find((job) => job.property.startsWith("Southridge"));
    const airbnb = jobs.find((job) => job.property.includes("Airbnb"));
    expect(southridge?.note).toBe("Checkout Sun Nov 1; next arrival Fri Nov 6");
    expect(airbnb?.note).toBe("Latham checks out (2 nights); next arrival Thu Nov 12; length estimated at 2h");
    expect(metrics.jobs).toBe(7);
    expect(metrics.rentalTurnovers).toBe(2);
  });
});

describe("cadence, rentals, and exceptions", () => {
  it("treats Nov 2 as week A and Nov 9 as week B", () => {
    expect(weekLetter("2026-11-02")).toBe("A");
    expect(weekLetter("2026-11-09")).toBe("B");
    expect(dayOfWeekSun0("2026-11-01")).toBe(0);
    expect(dayOfWeekSun0("2026-11-02")).toBe(1);
    expect(dayOfWeekSun0("2026-12-21")).toBe(1);
    expect(dayOfWeekSun0("2026-12-27")).toBe(0);
  });

  it("schedules week B clients and not week A clients", () => {
    const jobs = weekJobs("2026-11-09");
    const names = jobs.map((job) => job.property);
    expect(names).toContain("McCoy");
    expect(names).toContain("Malm");
    expect(names).toContain("Cavanaugh");
    expect(names).toContain("Beacon Hill");
    expect(names).toContain("Beth & Darrin's (Fischer)");
    expect(names).not.toContain("Southridge (Territory)");
    expect(names).not.toContain("Hiawatha");
    expect(names).not.toContain("Terry & Angie");
    expect(names).not.toContain("Melrose");
    expect(names).not.toContain("Shady Oaks");
    expect(jobs.find((job) => job.property === "Malm")?.price).toBeNull();
  });

  it("leaves unpriced jobs out of revenue, labor, and profit", () => {
    const jobs = weekJobs("2026-11-09");
    const metrics = weekMetrics(jobs, 0);
    const malm = jobs.find((job) => job.property === "Malm");
    expect(malm).toBeTruthy();
    const withMalmPriced = jobs.map((job) => (job.property === "Malm" ? { ...job, price: 0 } : job));
    expect(metrics.revenue).toBe(weekMetrics(jobs.filter((job) => job.price != null), 0).revenue);
    expect(metrics.labor).toBe(weekMetrics(jobs.filter((job) => job.price != null), 0).labor);
    expect(weekMetrics(withMalmPriced, 0).revenue).toBe(metrics.revenue);
  });

  it("schedules Southridge every Monday at 9–1 and pays Leah and Nancy $60 each", () => {
    const withCheckout = weekJobs("2026-11-02").find((job) => job.property.startsWith("Southridge"));
    expect(withCheckout).toMatchObject({ start: "09:00", end: "13:00", team: ["Leah", "Nancy"], price: 225, type: "turnover" });
    expect(withCheckout && jobLabor(withCheckout, 20)).toBe(120);
    expect(withCheckout && cleanerJobWage(withCheckout, "Leah", 20)).toBe(60);
    expect(withCheckout && cleanerJobWage(withCheckout, "Nancy", 20)).toBe(60);
    expect(withCheckout && cleanerJobWage(withCheckout, "Giselle", 20)).toBe(0);

    const plainMonday = weekJobs("2026-11-30").find((job) => job.property.startsWith("Southridge"));
    expect(plainMonday).toMatchObject({ date: "2026-11-30", start: "09:00", end: "13:00", price: 225, team: ["Leah", "Nancy"], note: "Every Monday, 9–1" });
    expect(plainMonday?.team).not.toContain("Giselle");

    const dec21 = weekJobs("2026-12-21").filter((job) => job.property.startsWith("Southridge"));
    expect(dec21.map((job) => [job.date, job.start, job.end])).toEqual([
      ["2026-12-21", "09:00", "13:00"],
      ["2026-12-21", "11:00", "15:00"],
      ["2026-12-27", "11:00", "15:00"],
    ]);
    expect(weekJobs("2026-12-28").find((job) => job.date === "2026-12-28" && job.property.startsWith("Southridge"))).toMatchObject({
      start: "09:00",
      end: "13:00",
      team: ["Leah", "Nancy"],
      price: 225,
    });

    const bumped = weekPay(weekJobs("2026-11-02"), 43.15, cleaners, 20);
    expect(bumped.lines.find((line) => line.name === "Leah")?.wages).toBe(340);
    expect(bumped.lines.find((line) => line.name === "Nancy")?.wages).toBe(300);
    const leah = toCleanerView(weekJobs("2026-11-02"), "Leah", "2026-11-02", weekGas(weekJobs("2026-11-02"), "2026-11-02", cachedMiles, OFFICE), 20, "Venmo", false, false);
    expect(leah.pay).toMatchObject({ ownerNoWage: false });
    if (!leah.pay.ownerNoWage) expect(leah.pay.days.find((day) => day.date === "2026-11-02")?.wages).toBe(60);
  });

  it("prices Airbnb from the stay just cleaned and applies Southridge rules", () => {
    expect(nightsBetween("2026-11-06", "2026-11-08")).toBe(2);
    expect(nightsBetween("2026-11-12", "2026-11-15")).toBe(3);
    expect(nightsBetween("2026-11-25", "2026-11-29")).toBe(4);
    expect(airbnbPrice(2)).toBe(55);
    expect(airbnbPrice(3)).toBe(55);
    expect(airbnbPrice(4)).toBe(75);
    const rows = rentalSchedule(stays, rentals);
    const skipped = rows.find((row) => row.arrive === "2026-11-06" && row.property.startsWith("Southridge"));
    const sameDay = rows.find((row) => row.arrive === "2026-12-25");
    const mondayCheckout = rows.find((row) => row.arrive === "2026-12-19");
    const deegan = rows.find((row) => row.guest === "Deegan");
    const miller = rows.find((row) => row.guest === "Miller");
    expect(skipped).toMatchObject({ noCleaning: true, price: null, cleaningDate: null });
    expect(sameDay).toMatchObject({ sameDay: true, cleaningDate: "2026-12-27", start: "11:00", price: 225 });
    expect(mondayCheckout).toMatchObject({ cleaningDate: "2026-12-21", start: "11:00", end: "15:00", sameDay: false, price: 225 });
    expect(deegan?.price).toBe(75);
    expect(miller?.price).toBe(55);
    expect(turnoverRevenue(rows)).toBe(2675);
  });

  it("cancels Malm on Nov 25, moves Beth to 9:00, and leaves Thanksgiving unconfirmed", () => {
    const jobs = weekJobs("2026-11-23");
    expect(jobs.find((job) => job.date === "2026-11-25" && job.property === "Malm")).toBeUndefined();
    expect(jobs.find((job) => job.date === "2026-11-25" && job.property.startsWith("Beth"))).toMatchObject({ start: "09:00", end: "10:30" });
    expect(jobs.find((job) => job.date === "2026-11-25" && job.property === "Cavanaugh")?.start).toBe("11:30");
    expect(jobs.find((job) => job.date === "2026-11-26" && job.property === "Beacon Hill")?.unconfirmed).toBe(true);
    expect(jobs.find((job) => job.date === "2026-11-26" && job.property.startsWith("Beth"))?.unconfirmed).toBe(true);
    const reminders = remindersForWeek(jobs, "2026-11-23");
    expect(reminders.map((reminder) => reminder.contact)).not.toContain("Greg Malm");
  });

  it("lists five regular-client reminders and no rental reminders for Nov 2–8", () => {
    const jobs = weekJobs("2026-11-02");
    const reminders = remindersForWeek(jobs, "2026-11-02");
    expect(reminders.map((reminder) => [reminder.whenDate, reminder.whenTime, reminder.contact, reminder.property])).toEqual([
      ["2026-11-02", "19:00", "Greg McCoy", "McCoy"],
      ["2026-11-03", "19:00", "Emily Mccollugh", "Hiawatha"],
      ["2026-11-03", "19:00", "Angie Mozena", "Terry & Angie"],
      ["2026-11-04", "19:00", "Melrose Cleaning", "Melrose"],
      ["2026-11-04", "19:00", "Jeffrey Boudin", "Shady Oaks"],
    ]);
  });
});

describe("cleaner privacy", () => {
  const jobs = weekJobs("2026-11-02");
  const gas = weekGas(jobs, "2026-11-02", cachedMiles, OFFICE);

  it("gives Leah only her jobs and pay, with no prices, contacts, or Nancy's gas", () => {
    const view = toCleanerView(jobs, "Leah", "2026-11-02", gas, 15, "Venmo", false, false);
    assertCleanerPayload(view);
    expect(view.jobCount).toBe(7);
    expect(view.hours).toBe(18);
    expect(view.pay).toMatchObject({ ownerNoWage: false, paidVia: "Venmo", wages: 270, gas: 0, total: 270 });
    const text = JSON.stringify(view);
    expect(text).not.toContain("Greg McCoy");
    expect(text).not.toContain("Emily Mccollugh");
    expect(text).not.toContain("26.95");
    expect(text).not.toContain("283.15");
    expect(text).not.toContain("3827.5");
    expect(text).not.toContain("profit");
    expect(text).not.toContain("225");
    expect(text).not.toContain("reminderContact");
  });

  it("gives Nancy her wages and gas only", () => {
    const view = toCleanerView(jobs, "Nancy", "2026-11-02", gas, 15, "Cash App", false, true);
    expect(view.jobs.map((job) => job.property)).not.toContain("The Dubuque House (Airbnb)");
    expect(view.pay).toMatchObject({ wages: 240, gas: 43.15, total: 283.15, paidVia: "Cash App" });
    const text = JSON.stringify(view);
    expect(text).not.toContain("270");
    expect(text).not.toContain("Greg McCoy");
    expect(text).not.toContain("3827.5");
  });

  it("shows Giselle only McCoy and Owner — no wage", () => {
    const view = toCleanerView(jobs, "Giselle", "2026-11-02", gas, 15, null, true, false);
    expect(view.jobs.map((job) => job.property)).toEqual(["McCoy"]);
    expect(view.hours).toBe(4);
    expect(view.pay).toEqual({ ownerNoWage: true });
    const text = JSON.stringify(view);
    expect(text).not.toContain("270");
    expect(text).not.toContain("283.15");
    expect(text).not.toContain("26.95");
    expect(text).not.toContain("Venmo");
    expect(text).not.toContain("Cash App");
    expect(text).not.toMatch(/\$\d/);
  });
});
