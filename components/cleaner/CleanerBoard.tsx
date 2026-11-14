import type { ReactNode } from "react";
import { formatHours, formatMoney } from "@/lib/format";
import { copy, typeLabel } from "@/lib/i18n";
import { addDays, formatDay, formatTimeRange, isMondayTerritoryJob, type CleanerWeekView, type Lang } from "@/lib/rules";

export function CleanerBoard({ view, lang, afterGlance }: { view: CleanerWeekView; lang: Lang; afterGlance?: ReactNode }) {
  const text = copy(lang);
  const pay = view.pay;
  const payLabel = pay.ownerNoWage ? text.ownerNoWage : formatMoney(pay.total);
  return (
    <div className="mx-auto w-full max-w-lg space-y-4 px-4 py-4">
      <section className="rounded-3xl border border-dark-border p-4 glass-panel">
        <p className="text-sm font-bold uppercase tracking-wide text-brand-400">{view.cleaner}</p>
        <p className="mt-1 text-sm text-slate-400">{formatDay(view.weekStart, lang)} – {formatDay(addDays(view.weekStart, 6), lang)}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Glance label={text.hours} value={formatHours(view.hours)} />
          <Glance label={text.myPay} value={payLabel} />
        </div>
      </section>
      {afterGlance}

      {view.jobs.length === 0 ? <p className="rounded-2xl border border-dark-border bg-dark-surface p-4 text-base text-slate-400">{text.free}</p> : null}
      <div className="space-y-3">
        {view.jobs.map((job) => (
          <article
            key={`${job.date}-${job.start}-${job.property}`}
            className={`rounded-2xl border p-4 ${job.sameDay ? "border-rose-400/80 bg-rose-500/10" : job.type === "turnover" ? "border-brand-500/60 bg-brand-500/10" : "border-dark-border bg-dark-elevated"}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-400">{formatDay(job.date, lang)}</p>
              {job.sameDay ? <Badge tone="danger">{text.sameDay}</Badge> : job.type === "turnover" ? <Badge>{text.turnover}</Badge> : null}
            </div>
            <h2 className="mt-2 text-xl font-semibold leading-tight text-white">{job.property}</h2>
            <p className="mt-1 font-mono text-lg text-brand-100">{formatTimeRange(job.start, job.end)}</p>
            <p className="mt-3 break-words text-base leading-6 text-slate-200">{job.address}</p>
            <p className="mt-2 text-base text-slate-300">
              {job.teammates.length ? `${text.with}: ${job.teammates.join(", ")}` : text.alone}
            </p>
            {job.note ? <p className="mt-2 break-words text-sm leading-5 text-slate-400">{job.note}</p> : null}
            <p className="sr-only">{typeLabel(job.type, lang)}</p>
          </article>
        ))}
      </div>
      {view.estimateNote ? <p className="text-sm leading-5 text-slate-400">{text.estimate}</p> : null}

      {!pay.ownerNoWage ? (
        <section className="space-y-3">
          {pay.days.map((day) => (
            <div key={day.date} className="rounded-2xl border border-dark-border bg-dark-elevated p-4">
              <p className="text-base font-semibold text-white">{formatDay(day.date, lang)}</p>
              <p className="mt-1 font-mono text-2xl text-brand-100">{formatMoney(day.total)}</p>
              <p className="mt-1 text-sm text-slate-400">
                {formatHours(day.hours)} h · {formatMoney(day.wages)}
                {day.gas > 0 ? ` + ${formatMoney(day.gas)}` : ""}
              </p>
            </div>
          ))}
          <p className="text-sm leading-5 text-slate-400">{pay.paidVia}</p>
          <p className="text-sm leading-5 text-slate-400">
            {view.jobs.some((job) => isMondayTerritoryJob(job))
              ? pay.gas > 0
                ? text.perHourTerritoryGas
                : text.perHourTerritory
              : pay.gas > 0
                ? text.perHourGas
                : text.perHour}
          </p>
        </section>
      ) : null}
    </div>
  );
}

function Glance({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-dark-border bg-dark-elevated p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 break-words font-mono text-3xl leading-none text-white">{value}</p>
    </div>
  );
}

function Badge({ children, tone = "gold" }: { children: string; tone?: "gold" | "danger" }) {
  const toneClass = tone === "danger" ? "border-rose-400/60 bg-rose-500/20 text-rose-100" : "border-brand-500/40 bg-brand-500/15 text-brand-100";
  return <span className={`rounded-full border px-2 py-1 text-xs font-bold uppercase tracking-wide ${toneClass}`}>{children}</span>;
}
