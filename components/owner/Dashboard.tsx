import Link from "next/link";
import { formatHours, formatMoney } from "@/lib/format";
import { copy, frequencyLabel, typeLabel } from "@/lib/i18n";
import {
  FLAG_COPY,
  REMINDER_TEXT,
  addDays,
  formatDay,
  formatTimeRange,
  SOUTHRIDGE_MONDAY_WAGE,
  isMondayTerritoryJob,
  jobLabor,
  todayChicago,
  mondayOf,
  type Lang,
} from "@/lib/rules";
import type { OwnerWeek } from "@/lib/schedule";
import { ClientForm, JobForm, PaymentForm, SkipButton, StayForm } from "./Editors";

const TABS = ["overview", "jobs", "pay", "wages", "reminders", "rentals", "flags", "clients"] as const;
export type OwnerTab = (typeof TABS)[number];

export function ownerTab(value: string | undefined): OwnerTab {
  return TABS.includes(value as OwnerTab) ? (value as OwnerTab) : "overview";
}

function href(week: string, tab: OwnerTab) {
  return `/owner?week=${week}&tab=${tab}`;
}

function moneyOrDash(value: number | null): string {
  return value == null ? "—" : formatMoney(value);
}

export function Dashboard({ data, lang, tab }: { data: OwnerWeek; lang: Lang; tab: OwnerTab }) {
  const text = copy(lang);
  const weekEnd = addDays(data.weekStart, 6);
  const current = mondayOf(todayChicago());
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-4 sm:px-6">
      <div className="flex items-center justify-between gap-2">
        <Link href={href(addDays(data.weekStart, -7), tab)} className="inline-flex min-h-12 min-w-12 shrink-0 items-center justify-center rounded-xl border border-dark-border bg-dark-elevated px-3 text-lg text-slate-200" aria-label={text.prev}>←</Link>
        <div className="min-w-0 flex-1 text-center">
          <p className="break-words font-serif text-base text-white sm:text-2xl">{formatDay(data.weekStart, lang)} – {formatDay(weekEnd, lang)}</p>
          <Link href={href(current, tab)} className="inline-flex min-h-11 items-center text-sm font-semibold uppercase tracking-wide text-brand-400">{text.thisWeek}</Link>
        </div>
        <Link href={href(addDays(data.weekStart, 7), tab)} className="inline-flex min-h-12 min-w-12 shrink-0 items-center justify-center rounded-xl border border-dark-border bg-dark-elevated px-3 text-lg text-slate-200" aria-label={text.next}>→</Link>
      </div>
      <nav className="flex flex-wrap gap-2 border-b border-dark-border pb-2">
        {TABS.map((item) => (
          <Link
            key={item}
            href={href(data.weekStart, item)}
            className={`inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-semibold ${item === tab ? "bg-brand-500 text-black" : "text-slate-300 hover:bg-dark-elevated"}`}
          >
            {text.tabs[item]}
          </Link>
        ))}
      </nav>
      {tab === "overview" ? <Overview data={data} lang={lang} /> : null}
      {tab === "jobs" ? <Jobs data={data} lang={lang} /> : null}
      {tab === "pay" ? <Pay data={data} lang={lang} /> : null}
      {tab === "wages" ? <Wages data={data} lang={lang} /> : null}
      {tab === "reminders" ? <Reminders data={data} lang={lang} /> : null}
      {tab === "rentals" ? <Rentals data={data} lang={lang} /> : null}
      {tab === "flags" ? <Flags data={data} lang={lang} /> : null}
      {tab === "clients" ? <Clients data={data} lang={lang} /> : null}
    </div>
  );
}

function Overview({ data, lang }: { data: OwnerWeek; lang: Lang }) {
  const text = copy(lang);
  const metrics = [
    [String(data.metrics.jobs), text.jobsN, ""],
    [formatHours(data.metrics.cleanerHours), text.hrs, `${formatHours(data.metrics.paidHours)} ${text.paidHours} · ${text.hrsD}`],
    [String(data.metrics.rentalTurnovers), text.turns, ""],
    [String(data.reminders.length), text.rem, ""],
    [formatMoney(data.metrics.revenue), text.rev, text.revD],
    [formatMoney(data.metrics.labor), text.lab, text.labD],
    [formatMoney(data.metrics.profit), text.prof, text.profD],
    [formatMoney(data.metrics.profitAfterGas), text.net, text.netD],
  ];
  const days = Array.from({ length: 7 }, (_, index) => addDays(data.weekStart, index));
  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-dark-border p-5 glass-panel sm:p-8">
        <p className="text-xs font-bold uppercase tracking-wider text-brand-400">{text.brandCity}</p>
        <h1 className="mt-1 font-serif text-3xl font-bold tracking-wide text-white sm:text-4xl">{text.glance}</h1>
        <p className="mt-2 text-sm text-slate-300">
          {lang === "es"
            ? `${data.metrics.jobs} trabajos, ${data.metrics.rentalTurnovers} de ellos cambios de huéspedes.`
            : `${data.metrics.jobs} jobs, ${data.metrics.rentalTurnovers} of them rental turnovers.`}
        </p>
        <p className="mt-1 text-xs text-slate-500">{text.central}</p>
      </section>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map(([value, label, detail]) => (
          <article key={label} className="rounded-2xl border border-dark-border p-4 glass-panel">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-1 font-mono text-2xl text-white">{value}</p>
            {detail ? <p className="mt-1 text-xs text-brand-400">{detail}</p> : null}
          </article>
        ))}
      </div>
      {data.gasIncomplete ? <p className="rounded-2xl border border-amber-400/50 bg-amber-500/10 p-3 text-sm text-amber-100">{text.gasIncomplete}</p> : null}
      <section className="space-y-3">
        <h2 className="font-serif text-2xl text-white">{text.tabs.overview}</h2>
        <div className="grid gap-3 md:grid-cols-7">
          {days.map((date) => {
            const jobs = data.jobs.filter((job) => job.date === date);
            return (
              <div key={date} className="rounded-2xl border border-dark-border bg-dark-elevated p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-400">{formatDay(date, lang)}</p>
                {jobs.length === 0 ? <p className="mt-2 text-sm text-slate-500">{text.noJobs}</p> : null}
                <div className="mt-2 space-y-2">
                  {jobs.map((job) => (
                    <div key={job.id} className={`rounded-xl border p-2 text-sm ${cardTone(job.sameDay, job.unconfirmed, job.type)}`}>
                      <p className="font-semibold text-white">{job.property}</p>
                      <p className="font-mono text-xs text-slate-300">{formatTimeRange(job.start, job.end)}</p>
                      <p className="text-xs text-slate-400">{job.team.join(", ")}</p>
                      {job.sameDay ? <p className="mt-1 text-[10px] font-bold uppercase text-rose-200">{text.sameDay}</p> : null}
                      {job.unconfirmed ? <p className="mt-1 text-[10px] font-bold uppercase text-amber-200">{text.unconfirmed}</p> : null}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function cardTone(sameDay: boolean, unconfirmed: boolean, type: string): string {
  if (sameDay) return "border-rose-400/80 bg-rose-500/15";
  if (unconfirmed) return "border-amber-400/70 bg-amber-500/10";
  if (type === "turnover") return "border-brand-500/70 bg-brand-500/10";
  return "border-dark-border bg-dark-surface";
}

function Jobs({ data, lang }: { data: OwnerWeek; lang: Lang }) {
  const text = copy(lang);
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-serif text-2xl text-white">{text.jobs}</h2>
      </div>
      <details className="rounded-2xl border border-dark-border bg-dark-elevated p-4">
        <summary className="cursor-pointer text-sm font-semibold text-brand-400">{text.addJob}</summary>
        <div className="mt-4"><JobForm text={text} /></div>
      </details>
      <div className="space-y-3">
        {data.jobs.map((job) => {
          const labor = jobLabor(job);
          const priced = job.price != null;
          return (
            <article key={job.id} className={`rounded-2xl border p-4 ${cardTone(job.sameDay, job.unconfirmed, job.type)}`}>
              <p className="text-xs uppercase tracking-wide text-brand-400">{formatDay(job.date, lang)} · {formatTimeRange(job.start, job.end)}</p>
              <h3 className="text-lg font-semibold text-white">{job.property}</h3>
              <p className="break-words text-sm text-slate-300">{job.address}</p>
              <p className="text-sm text-slate-400">{job.team.join(", ")} · {typeLabel(job.type, lang)}</p>
              {job.note ? <p className="mt-1 text-sm text-slate-400">{job.note}</p> : null}
              {isMondayTerritoryJob(job) ? <p className="mt-1 text-sm text-brand-100">{text.territoryPay.replaceAll("{wage}", formatMoney(SOUTHRIDGE_MONDAY_WAGE))}</p> : null}
              <p className="mt-2 font-mono text-sm text-white">{text.cols[6]} {priced ? formatMoney(job.price ?? 0) : "—"} · {text.cols[7]} {priced ? formatMoney(labor) : "—"} · {text.cols[8]} {priced ? formatMoney((job.price ?? 0) - labor) : "—"}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <details className="rounded-xl border border-dark-border px-3 py-2"><summary className="cursor-pointer text-xs font-semibold text-slate-200">{text.editJob}</summary><div className="mt-3"><JobForm text={text} job={job} /></div></details>
                <SkipButton text={text} job={job} />
              </div>
            </article>
          );
        })}
      </div>
      <p className="text-sm text-slate-400">{text.laborNote}</p>
      <p className="text-sm text-slate-400">{text.onRequest}</p>
    </section>
  );
}

function Pay({ data, lang }: { data: OwnerWeek; lang: Lang }) {
  const text = copy(lang);
  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-dark-border p-4 glass-panel sm:p-6">
        <h2 className="font-serif text-2xl text-white">{text.payTitle}</h2>
        <div className="mt-4 space-y-2">
          {data.pay.lines.map((line) => (
            <div key={line.name} className="grid grid-cols-2 gap-2 rounded-xl border border-dark-border bg-dark-elevated p-3 text-sm sm:grid-cols-6">
              <p className="font-semibold text-white">{line.name}</p>
              <p className="text-slate-300">{formatHours(line.hours)} h</p>
              <p className="font-mono text-slate-200">{line.ownerNoWage ? text.ownerNoWage : moneyOrDash(line.wages)}</p>
              <p className="font-mono text-slate-200">{line.gas ? formatMoney(line.gas) : "—"}</p>
              <p className="font-mono text-brand-100">{line.ownerNoWage ? "—" : moneyOrDash(line.total)}</p>
              <p className="text-slate-400">{line.ownerNoWage ? text.owner : line.via}</p>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-xl bg-brand-500 px-4 py-3 text-black">
            <span className="text-xs font-bold uppercase tracking-wider">{text.total}</span>
            <span className="font-mono text-lg font-bold">{formatMoney(data.pay.totalWages)} + {formatMoney(data.pay.totalGas)} = {formatMoney(data.pay.total)}</span>
          </div>
        </div>
      </section>
      <section className="rounded-3xl border border-dark-border p-4 glass-panel sm:p-6">
        <h2 className="font-serif text-2xl text-white">{text.gasTitle}</h2>
        <div className="mt-4 space-y-2">
          {data.gas.days.map((day) => (
            <div key={day.date} className="rounded-xl border border-dark-border bg-dark-elevated p-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-white">{formatDay(day.date, lang)}</p>
                <p className="font-mono text-brand-100">{day.reimbursement == null ? "—" : formatMoney(day.reimbursement)}</p>
              </div>
              <p className="mt-1 text-slate-300">{day.legs.map((leg) => `${leg.from} → ${leg.to}${leg.miles == null ? "" : ` ${leg.miles.toFixed(1)}`}`).join(" · ")}</p>
              <p className="text-xs text-slate-500">{day.miles == null ? text.milesMissing : `${day.miles.toFixed(1)} ${text.miles.toLowerCase()}`}</p>
            </div>
          ))}
          {data.leahOnlyDates.map((date) => (
            <div key={date} className="rounded-xl border border-dark-border bg-dark-surface p-3 text-sm text-slate-300">
              <span className="font-semibold text-white">{formatDay(date, lang)}</span>
              <span className="mt-1 block">{text.airbnbOnly}</span>
              <span className="font-mono">$0.00</span>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-xl bg-dark-elevated px-4 py-3">
            <span className="text-sm text-slate-300">{text.weekTotal}</span>
            <span className="font-mono text-brand-100">{data.gas.miles.toFixed(1)} · {formatMoney(data.gas.reimbursement)}</span>
          </div>
        </div>
        {data.gasIncomplete ? <p className="mt-3 text-sm text-amber-200">{text.gasIncomplete}</p> : null}
        <p className="mt-3 text-sm text-slate-400">{text.gasNote}</p>
      </section>
    </div>
  );
}

function Wages({ data, lang }: { data: OwnerWeek; lang: Lang }) {
  const text = copy(lang);
  const venmo = data.payments.filter((payment) => payment.via === "Venmo");
  const cash = data.payments.filter((payment) => payment.via === "Cash App");
  return (
    <section className="space-y-4">
      <h2 className="font-serif text-2xl text-white">{text.wagesTitle}</h2>
      <details className="rounded-2xl border border-dark-border bg-dark-elevated p-4">
        <summary className="cursor-pointer text-sm font-semibold text-brand-400">{text.addPayment}</summary>
        <div className="mt-4"><PaymentForm text={text} /></div>
      </details>
      <PaymentTable title={text.venmo} rows={venmo} total={data.wages.venmo} text={text} lang={lang} />
      <PaymentTable title={text.cashApp} rows={cash} total={data.wages.cashAppNancy} text={text} lang={lang} />
      <p className="text-sm text-slate-400">{text.wageNote}</p>
    </section>
  );
}

function PaymentTable({
  title,
  rows,
  total,
  text,
}: {
  title: string;
  rows: OwnerWeek["payments"];
  total: number;
  text: ReturnType<typeof copy>;
  lang: Lang;
}) {
  return (
    <div className="rounded-2xl border border-dark-border bg-dark-surface p-4">
      <h3 className="font-semibold text-white">{title}</h3>
      <div className="mt-3 space-y-2">
        {rows.map((row) => (
          <div key={row.id} className="rounded-xl border border-dark-border bg-dark-elevated p-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-slate-300">{row.date}</p>
              <p className="font-mono text-brand-100">{formatMoney(row.amount)}</p>
            </div>
            <p className="text-white">{row.payee}</p>
            <details className="mt-2"><summary className="cursor-pointer text-xs text-slate-400">{text.editPayment}</summary><div className="mt-3"><PaymentForm text={text} payment={row} /></div></details>
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm text-slate-300">{text.total}: <span className="font-mono text-white">{formatMoney(total)}</span></p>
    </div>
  );
}

function Reminders({ data, lang }: { data: OwnerWeek; lang: Lang }) {
  const text = copy(lang);
  return (
    <section className="space-y-3 rounded-3xl border border-dark-border p-4 glass-panel sm:p-6">
      <h2 className="font-serif text-2xl text-white">{text.remindersTitle}</h2>
      <p className="text-sm text-slate-300">{text.reminderBody} “{REMINDER_TEXT[lang]}”</p>
      <p className="text-sm text-amber-200">{text.notSent}</p>
      {data.reminders.length === 0 ? <p className="text-slate-400">{text.noReminders}</p> : null}
      <div className="space-y-2">
        {data.reminders.map((reminder) => (
          <div key={`${reminder.whenDate}-${reminder.property}`} className="rounded-xl border border-dark-border bg-dark-elevated p-3 text-sm">
            <p className="text-brand-400">{formatDay(reminder.whenDate, lang)} · 7:00 PM</p>
            <p className="text-white">{reminder.contact}</p>
            <p className="text-slate-400">{reminder.property}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Rentals({ data, lang }: { data: OwnerWeek; lang: Lang }) {
  const text = copy(lang);
  return (
    <section className="space-y-4">
      <h2 className="font-serif text-2xl text-white">{text.rentalsTitle}</h2>
      <p className="text-sm text-slate-300">{text.expected}: <span className="font-mono text-brand-100">{formatMoney(data.turnoverTotal)}</span></p>
      <p className="text-sm text-slate-400">{text.rentalNote}</p>
      <details className="rounded-2xl border border-dark-border bg-dark-elevated p-4">
        <summary className="cursor-pointer text-sm font-semibold text-brand-400">{text.addStay}</summary>
        <div className="mt-4"><StayForm text={text} /></div>
      </details>
      <div className="space-y-2">
        {data.rentalRows.map((row) => {
          const stay = data.stays.find((item) => item.arrive === row.arrive && item.depart === row.depart && item.rentalKey === (row.property.includes("Airbnb") ? "airbnb" : "southridge"));
          return (
            <article key={`${row.property}-${row.arrive}`} className={`rounded-2xl border p-4 ${row.sameDay ? "border-rose-400/80 bg-rose-500/10" : "border-dark-border bg-dark-elevated"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{row.property}</p>
                  <p className="text-sm text-slate-400">{row.guest}</p>
                  <p className="text-sm text-slate-300">{formatDay(row.arrive, lang)} – {formatDay(row.depart, lang)}</p>
                </div>
                <p className="font-mono text-brand-100">{row.price == null ? "—" : formatMoney(row.price)}</p>
              </div>
              <p className={`mt-2 text-sm ${row.sameDay ? "font-semibold text-rose-200" : "text-slate-300"}`}>
                {row.noCleaning || !row.cleaningDate || !row.start || !row.end
                  ? text.noCleaning
                  : `${row.sameDay ? `${text.sameDay} ` : ""}${formatDay(row.cleaningDate, lang)} ${formatTimeRange(row.start, row.end)} · ${row.team.join(", ")}`}
              </p>
              {stay ? <details className="mt-3"><summary className="cursor-pointer text-xs text-slate-400">{text.editStay}</summary><div className="mt-3"><StayForm text={text} stay={{ id: stay.id, rentalKey: stay.rentalKey, guest: stay.guest ?? null, arrive: stay.arrive, depart: stay.depart, noCleaning: Boolean(stay.noCleaning), note: stay.note ?? null }} /></div></details> : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Flags({ data, lang }: { data: OwnerWeek; lang: Lang }) {
  const text = copy(lang);
  const label = { sameDay: text.sameDay, malm: text.changed, thanksgiving: text.unconfirmed };
  return (
    <section className="space-y-4">
      <h2 className="font-serif text-2xl text-white">{text.flags}</h2>
      <div className="space-y-3">
        {data.flags.map((flag) => {
          const body = FLAG_COPY[flag.titleKey][lang];
          return (
            <article key={flag.id} className={`rounded-2xl border p-4 ${flag.tone === "danger" ? "border-rose-400/70 bg-rose-500/10" : "border-amber-400/60 bg-amber-500/10"}`}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-white">{body.title}</h3>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${flag.tone === "danger" ? "border-rose-300/50 text-rose-100" : "border-amber-300/50 text-amber-100"}`}>{label[flag.titleKey]}</span>
              </div>
              <p className="mt-1 text-sm text-slate-300">{body.detail}</p>
              <p className="mt-2 text-xs text-slate-400">{formatDay(flag.date, lang)}</p>
            </article>
          );
        })}
      </div>
      <div className="rounded-3xl border border-dark-border p-4 glass-panel">
        <h3 className="font-serif text-xl text-white">{text.openItems}</h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-300">
          {data.openItems.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>
    </section>
  );
}

function Clients({ data, lang }: { data: OwnerWeek; lang: Lang }) {
  const text = copy(lang);
  return (
    <section className="space-y-4">
      <h2 className="font-serif text-2xl text-white">{text.clientsTitle}</h2>
      <p className="text-sm text-slate-400">{text.noPrice}</p>
      <details className="rounded-2xl border border-dark-border bg-dark-elevated p-4">
        <summary className="cursor-pointer text-sm font-semibold text-brand-400">{text.addClient}</summary>
        <div className="mt-4"><ClientForm text={text} /></div>
      </details>
      <div className="space-y-3">
        {data.clients.map((client) => (
          <article key={client.id} className="rounded-2xl border border-dark-border bg-dark-elevated p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-white">{client.name}</h3>
                <p className="text-sm text-slate-300">{client.address}{client.city ? `, ${client.city}` : ""}</p>
                <p className="text-sm text-slate-400">{frequencyLabel(client.frequency, client.day, lang)}</p>
                <p className="text-sm text-slate-400">{client.reminderContact || "—"}</p>
              </div>
              <p className="font-mono text-brand-100">{client.price == null ? "—" : formatMoney(client.price)}</p>
            </div>
            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-slate-400">{text.editClient}</summary>
              <div className="mt-3"><ClientForm text={text} client={{ ...client, id: client.id ?? client.name, biweeklyWeek: client.biweeklyWeek }} /></div>
            </details>
          </article>
        ))}
      </div>
      <div className="rounded-2xl border border-dark-border bg-dark-surface p-4">
        <h3 className="font-semibold text-white">{text.staff}</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {data.staff.map((person) => (
            <div key={person.name} className="rounded-xl border border-dark-border bg-dark-elevated p-3 text-sm">
              <p className="font-semibold text-white">{person.name}</p>
              <p className="text-slate-400">{person.paidWages ? person.paidVia : text.ownerNoWage}</p>
              {person.notes ? <p className="mt-1 text-xs text-slate-500">{person.notes}</p> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
