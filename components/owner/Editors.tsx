"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Copy } from "@/lib/i18n";
import type { ScheduleJob } from "@/lib/rules";
import { CLEANER_NAMES } from "@/lib/validate";
import { fieldClass, ghostBtn, labelClass, primaryBtn } from "../ui";

function useSave(fail: string) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function run(url: string, method: string, body?: unknown) {
    setPending(true);
    setError("");
    try {
      const response = await fetch(url, {
        method,
        headers: body ? { "content-type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!response.ok) throw new Error("save");
      router.refresh();
    } catch {
      setError(fail);
    } finally {
      setPending(false);
    }
  }
  return { error, pending, run };
}

function TeamPicker({ selected }: { selected: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {CLEANER_NAMES.map((name) => (
        <label key={name} className="flex items-center gap-2 rounded-xl border border-dark-border bg-dark-surface px-3 py-2 text-sm text-slate-200">
          <input type="checkbox" name="team" value={name} defaultChecked={selected.includes(name)} className="accent-brand-500" />
          {name}
        </label>
      ))}
    </div>
  );
}

function teamFrom(form: FormData): string[] {
  return form.getAll("team").map(String);
}

export function ClientForm({
  text,
  client,
}: {
  text: Copy;
  client?: {
    id: string;
    name: string;
    address: string;
    city: string;
    frequency: string;
    day: string;
    time: string;
    team: string[];
    reminderContact: string | null;
    price: number | null;
    biweeklyWeek: string | null;
  };
}) {
  const { error, pending, run } = useSave(text.couldNotSave);
  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const frequency = String(form.get("frequency"));
        const body = {
          name: form.get("name"),
          address: form.get("address"),
          city: form.get("city"),
          frequency,
          day: form.get("day"),
          time: form.get("time"),
          team: teamFrom(form),
          reminderContact: form.get("reminderContact"),
          price: form.get("price"),
          biweeklyWeek: frequency === "biweekly" ? form.get("biweeklyWeek") : null,
        };
        void run(client ? `/api/owner/clients/${client.id}` : "/api/owner/clients", client ? "PATCH" : "POST", body);
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label><span className={labelClass}>{text.name}</span><input name="name" required defaultValue={client?.name} className={fieldClass} /></label>
        <label><span className={labelClass}>{text.city}</span><input name="city" required defaultValue={client?.city} className={fieldClass} /></label>
      </div>
      <label><span className={labelClass}>{text.address}</span><input name="address" required defaultValue={client?.address} className={fieldClass} /></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          <span className={labelClass}>{text.frequency}</span>
          <select name="frequency" defaultValue={client?.frequency ?? "biweekly"} className={fieldClass}>
            <option value="weekly">{text.weekly}</option>
            <option value="biweekly">{text.biweekly}</option>
            <option value="on-request">{text.onRequestFreq}</option>
          </select>
        </label>
        <label>
          <span className={labelClass}>{text.weekLetter}</span>
          <select name="biweeklyWeek" defaultValue={client?.biweeklyWeek ?? "A"} className={fieldClass}>
            <option value="A">A</option>
            <option value="B">B</option>
          </select>
        </label>
        <label><span className={labelClass}>{text.day}</span><input name="day" required defaultValue={client?.day ?? "Wed"} className={fieldClass} /></label>
        <label><span className={labelClass}>{text.timeWindow}</span><input name="time" required defaultValue={client?.time ?? "09:00-11:00"} className={fieldClass} /></label>
        <label><span className={labelClass}>{text.contact}</span><input name="reminderContact" defaultValue={client?.reminderContact ?? ""} className={fieldClass} /></label>
        <label><span className={labelClass}>{text.price}</span><input name="price" inputMode="decimal" defaultValue={client?.price ?? ""} className={fieldClass} /></label>
      </div>
      <div>
        <span className={labelClass}>{text.team}</span>
        <TeamPicker selected={client?.team ?? ["Leah", "Nancy"]} />
      </div>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button className={primaryBtn} disabled={pending} type="submit">{pending ? text.saving : text.save}</button>
        {client ? (
          <button className={ghostBtn} type="button" onClick={() => void run(`/api/owner/clients/${client.id}`, "DELETE")}>{text.delete}</button>
        ) : null}
      </div>
    </form>
  );
}

export function JobForm({ text, job }: { text: Copy; job?: ScheduleJob }) {
  const { error, pending, run } = useSave(text.couldNotSave);
  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const body = {
          id: job?.source === "manual" ? job.id : undefined,
          replaces: job ? { date: job.date, property: job.property } : null,
          date: form.get("date"),
          start: form.get("start"),
          end: form.get("end"),
          property: form.get("property"),
          address: form.get("address"),
          team: teamFrom(form),
          type: form.get("type"),
          price: form.get("price"),
          note: form.get("note"),
          sameDay: form.get("sameDay") === "on",
          unconfirmed: form.get("unconfirmed") === "on",
          cancelled: false,
        };
        void run("/api/owner/jobs", "POST", body);
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label><span className={labelClass}>{text.property}</span><input name="property" required defaultValue={job?.property} placeholder="Aranzatxa" className={fieldClass} /></label>
        <label><span className={labelClass}>{text.day}</span><input name="date" type="date" required defaultValue={job?.date} className={fieldClass} /></label>
        <label><span className={labelClass}>{text.time}</span><input name="start" type="time" required defaultValue={job?.start ?? "09:00"} className={fieldClass} /></label>
        <label><span className={labelClass}>{text.timeWindow}</span><input name="end" type="time" required defaultValue={job?.end ?? "11:00"} className={fieldClass} /></label>
      </div>
      <label><span className={labelClass}>{text.address}</span><input name="address" required defaultValue={job?.address} className={fieldClass} /></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          <span className={labelClass}>{text.type}</span>
          <select name="type" defaultValue={job?.type ?? "on-request"} className={fieldClass}>
            <option value="on-request">{text.onRequestFreq}</option>
            <option value="recurring">{text.recurring}</option>
            <option value="turnover">{text.turnover}</option>
          </select>
        </label>
        <label><span className={labelClass}>{text.price}</span><input name="price" inputMode="decimal" defaultValue={job?.price ?? ""} className={fieldClass} /></label>
      </div>
      <label><span className={labelClass}>{text.note}</span><input name="note" defaultValue={job?.note ?? ""} className={fieldClass} /></label>
      <TeamPicker selected={job?.team ?? ["Giselle", "Leah", "Nancy"]} />
      <label className="flex items-center gap-2 text-sm text-slate-200"><input type="checkbox" name="sameDay" defaultChecked={job?.sameDay} className="accent-brand-500" />{text.sameDayLabel}</label>
      <label className="flex items-center gap-2 text-sm text-slate-200"><input type="checkbox" name="unconfirmed" defaultChecked={job?.unconfirmed} className="accent-brand-500" />{text.unconfirmedLabel}</label>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <button className={primaryBtn} disabled={pending} type="submit">{pending ? text.saving : text.save}</button>
    </form>
  );
}

export function SkipButton({ text, job }: { text: Copy; job: ScheduleJob }) {
  const { pending, run } = useSave(text.couldNotSave);
  if (job.source === "manual") {
    return <button type="button" className={ghostBtn} disabled={pending} onClick={() => void run(`/api/owner/jobs/${job.id}`, "DELETE")}>{text.delete}</button>;
  }
  return (
    <button
      type="button"
      className={ghostBtn}
      disabled={pending}
      onClick={() =>
        void run("/api/owner/jobs", "POST", {
          replaces: { date: job.date, property: job.property },
          cancelled: true,
          date: job.date,
          start: job.start,
          end: job.end,
          property: job.property,
          address: job.address,
          team: job.team,
          type: job.type,
          price: job.price,
          note: job.note,
          sameDay: job.sameDay,
          unconfirmed: job.unconfirmed,
        })
      }
    >
      {text.skip}
    </button>
  );
}

export function StayForm({
  text,
  stay,
}: {
  text: Copy;
  stay?: { id: string; rentalKey: "airbnb" | "southridge"; guest: string | null; arrive: string; depart: string; noCleaning: boolean; note: string | null };
}) {
  const { error, pending, run } = useSave(text.couldNotSave);
  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const body = {
          rentalKey: form.get("rentalKey"),
          guest: form.get("guest"),
          arrive: form.get("arrive"),
          depart: form.get("depart"),
          noCleaning: form.get("noCleaning") === "on",
          note: form.get("note"),
        };
        void run(stay ? `/api/owner/stays/${stay.id}` : "/api/owner/stays", stay ? "PATCH" : "POST", body);
      }}
    >
      <label>
        <span className={labelClass}>{text.property}</span>
        <select name="rentalKey" defaultValue={stay?.rentalKey ?? "airbnb"} className={fieldClass}>
          <option value="airbnb">The Dubuque House (Airbnb)</option>
          <option value="southridge">Southridge (Territory)</option>
        </select>
      </label>
      <label><span className={labelClass}>{text.guest}</span><input name="guest" defaultValue={stay?.guest ?? ""} className={fieldClass} /></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label><span className={labelClass}>{text.arrive}</span><input name="arrive" type="date" required defaultValue={stay?.arrive} className={fieldClass} /></label>
        <label><span className={labelClass}>{text.depart}</span><input name="depart" type="date" required defaultValue={stay?.depart} className={fieldClass} /></label>
      </div>
      <label><span className={labelClass}>{text.note}</span><input name="note" defaultValue={stay?.note ?? ""} className={fieldClass} /></label>
      <label className="flex items-center gap-2 text-sm text-slate-200"><input type="checkbox" name="noCleaning" defaultChecked={stay?.noCleaning} className="accent-brand-500" />{text.noCleaningLabel}</label>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button className={primaryBtn} disabled={pending} type="submit">{pending ? text.saving : text.save}</button>
        {stay ? <button className={ghostBtn} type="button" onClick={() => void run(`/api/owner/stays/${stay.id}`, "DELETE")}>{text.delete}</button> : null}
      </div>
    </form>
  );
}

export function PaymentForm({
  text,
  payment,
}: {
  text: Copy;
  payment?: { id: string; date: string; payee: string; via: string; amount: number; note: string | null };
}) {
  const { error, pending, run } = useSave(text.couldNotSave);
  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        void run(payment ? `/api/owner/payments/${payment.id}` : "/api/owner/payments", payment ? "PATCH" : "POST", {
          date: form.get("date"),
          payee: form.get("payee"),
          via: form.get("via"),
          amount: form.get("amount"),
          note: form.get("note"),
        });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label><span className={labelClass}>{text.when}</span><input name="date" required defaultValue={payment?.date} placeholder="2026-11-06" className={fieldClass} /></label>
        <label><span className={labelClass}>{text.payee}</span><input name="payee" required defaultValue={payment?.payee} className={fieldClass} /></label>
        <label>
          <span className={labelClass}>{text.via}</span>
          <select name="via" defaultValue={payment?.via ?? "Venmo"} className={fieldClass}>
            <option>Venmo</option>
            <option>Cash App</option>
          </select>
        </label>
        <label><span className={labelClass}>{text.amount}</span><input name="amount" inputMode="decimal" required defaultValue={payment?.amount ?? ""} className={fieldClass} /></label>
      </div>
      <label><span className={labelClass}>{text.note}</span><input name="note" defaultValue={payment?.note ?? ""} className={fieldClass} /></label>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button className={primaryBtn} disabled={pending} type="submit">{pending ? text.saving : text.save}</button>
        {payment ? <button className={ghostBtn} type="button" onClick={() => void run(`/api/owner/payments/${payment.id}`, "DELETE")}>{text.delete}</button> : null}
      </div>
    </form>
  );
}
