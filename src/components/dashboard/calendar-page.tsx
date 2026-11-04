"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  Filter,
  LogIn,
  RefreshCw,
  UsersRound,
} from "lucide-react";
import { dashboardApi } from "@/API";

type CalendarEventType = "LEAVE" | "HIRE" | "CONTRACT_START" | "CONTRACT_END" | "ATTENDANCE";
type CalendarEvent = {
  id: string;
  type: CalendarEventType;
  title: string;
  startDate: string;
  endDate: string | null;
  status: string;
  subtitle: string;
  badgeNumber: string | null;
};
type CalendarResponse = {
  range: { startDate: string; endDate: string };
  summary: { leaveRequests: number; hires: number; contractMilestones: number; attendanceDays: number };
  events: CalendarEvent[];
};
type CalendarView = "month" | "agenda";

const eventTypes: Array<{ type: CalendarEventType; label: string }> = [
  { type: "LEAVE", label: "Congés" },
  { type: "HIRE", label: "Embauches" },
  { type: "CONTRACT_START", label: "Début de contrat" },
  { type: "CONTRACT_END", label: "Fin de contrat" },
  { type: "ATTENDANCE", label: "Pointages" },
];
const weekdays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function CalendarPage() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [view, setView] = useState<CalendarView>("month");
  const [activeTypes, setActiveTypes] = useState<CalendarEventType[]>(eventTypes.map(({ type }) => type));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setIsHydrated(true);
    const today = businessDateKey(new Date());
    setVisibleMonth(today.slice(0, 7));
    setSelectedDate(today);
  }, []);

  const range = useMemo(() => visibleMonth ? getCalendarGridRange(visibleMonth) : null, [visibleMonth]);

  const loadCalendar = useCallback(async (signal: AbortSignal) => {
    if (!range) return;
    setLoading(true);
    setError("");
    try {
      const response = await dashboardApi.calendar(range.startDate, range.endDate, signal);
      const data = await response.json().catch(() => null) as (CalendarResponse & { message?: string | string[] }) | null;
      if (!response.ok || !Array.isArray(data?.events) || !data.summary) {
        const message = Array.isArray(data?.message) ? data.message.join(", ") : data?.message;
        throw new Error(message ?? "Impossible de charger le calendrier RH.");
      }
      setEvents(data.events);
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setError(cause instanceof Error ? cause.message : "Impossible de charger le calendrier RH.");
      setEvents([]);
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    const controller = new AbortController();
    void loadCalendar(controller.signal);
    return () => controller.abort();
  }, [loadCalendar, reloadKey]);

  const visibleEvents = useMemo(() => events.filter((event) => activeTypes.includes(event.type)), [events, activeTypes]);
  const summary = useMemo(() => {
    if (!visibleMonth) return null;
    const [year, month] = visibleMonth.split("-").map(Number);
    const monthStart = `${visibleMonth}-01`;
    const monthEnd = `${visibleMonth}-${String(new Date(Date.UTC(year, month, 0)).getUTCDate()).padStart(2, "0")}`;
    const monthEvents = events.filter((event) => event.startDate <= monthEnd && (event.endDate ?? event.startDate) >= monthStart);
    return {
      leaveRequests: monthEvents.filter((event) => event.type === "LEAVE").length,
      hires: monthEvents.filter((event) => event.type === "HIRE" && event.startDate >= monthStart && event.startDate <= monthEnd).length,
      contractMilestones: monthEvents.filter((event) => event.type === "CONTRACT_START" || event.type === "CONTRACT_END").length,
      attendanceDays: new Set(monthEvents.filter((event) => event.type === "ATTENDANCE").map((event) => event.startDate)).size,
    };
  }, [events, visibleMonth]);
  const selectedEvents = useMemo(() => selectedDate ? getEventsForDate(visibleEvents, selectedDate) : [], [visibleEvents, selectedDate]);
  const monthDays = useMemo(() => visibleMonth ? getMonthDays(visibleMonth) : [], [visibleMonth]);
  const title = visibleMonth ? formatMonthTitle(visibleMonth) : "Chargement…";

  function moveMonth(amount: number) {
    if (!visibleMonth) return;
    const [year, month] = visibleMonth.split("-").map(Number);
    const nextMonth = new Date(Date.UTC(year, month - 1 + amount, 1));
    const nextKey = nextMonth.toISOString().slice(0, 7);
    setVisibleMonth(nextKey);
    setSelectedDate(`${nextKey}-01`);
  }

  function goToToday() {
    const today = businessDateKey(new Date());
    setVisibleMonth(today.slice(0, 7));
    setSelectedDate(today);
  }

  function toggleType(type: CalendarEventType) {
    setActiveTypes((current) => current.includes(type) ? current.filter((item) => item !== type) : [...current, type]);
  }

  return (
    <main className="flex h-full min-h-0 flex-col gap-5 overflow-y-auto bg-[#f5f8fc] p-5 lg:p-7">
      <header className="flex shrink-0 flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-medium text-slate-500">Temps et absences <span className="mx-2">›</span> Calendrier</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 lg:text-3xl">Calendrier RH</h1>
          <p className="mt-1 text-sm text-slate-500">Visualisez les congés, les arrivées, les contrats et l’activité de pointage.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={goToToday} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Aujourd’hui</button>
          <button type="button" onClick={() => setReloadKey((key) => key + 1)} disabled={Boolean(isHydrated && (loading || !range))} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Actualiser</button>
        </div>
      </header>

      <section className="grid shrink-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={<CalendarDays className="h-5 w-5" />} label="Demandes de congé" value={summary?.leaveRequests} tone="blue" loading={loading} />
        <SummaryCard icon={<UsersRound className="h-5 w-5" />} label="Embauches" value={summary?.hires} tone="green" loading={loading} />
        <SummaryCard icon={<FileText className="h-5 w-5" />} label="Jalons de contrat" value={summary?.contractMilestones} tone="violet" loading={loading} />
        <SummaryCard icon={<LogIn className="h-5 w-5" />} label="Jours avec pointages" value={summary?.attendanceDays} tone="slate" loading={loading} />
      </section>

      <section className="shrink-0 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Mois précédent" onClick={() => moveMonth(-1)} disabled={Boolean(isHydrated && !visibleMonth)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"><ChevronLeft className="h-4 w-4" /></button>
            <button type="button" aria-label="Mois suivant" onClick={() => moveMonth(1)} disabled={Boolean(isHydrated && !visibleMonth)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"><ChevronRight className="h-4 w-4" /></button>
            <h2 className="ml-2 min-w-40 text-lg font-bold capitalize text-slate-900">{title}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              <ViewButton active={view === "month"} onClick={() => setView("month")} icon={<CalendarRange className="h-4 w-4" />}>Mois</ViewButton>
              <ViewButton active={view === "agenda"} onClick={() => setView("agenda")} icon={<CalendarDays className="h-4 w-4" />}>Agenda</ViewButton>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500"><Filter className="h-3.5 w-3.5" /> Afficher</span>
          {eventTypes.map(({ type, label }) => <label key={type} className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={activeTypes.includes(type)} onChange={() => toggleType(type)} className="h-4 w-4 rounded border-slate-300 accent-blue-600" /><span className={`h-2 w-2 rounded-full ${eventDotClass(type)}`} />{label}</label>)}
        </div>
      </section>

      {error && <div role="alert" className="flex shrink-0 items-center justify-between rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700"><span>{error}</span><button type="button" onClick={() => setReloadKey((key) => key + 1)} className="font-semibold underline">Réessayer</button></div>}

      <section className="grid min-h-0 shrink-0 gap-5 2xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          {view === "month" ? (
            <div className="overflow-x-auto"><MonthGrid days={monthDays} visibleMonth={visibleMonth} events={visibleEvents} selectedDate={selectedDate} onSelectDate={(date) => { setSelectedDate(date); if (date.slice(0, 7) !== visibleMonth) setVisibleMonth(date.slice(0, 7)); }} loading={loading} /></div>
          ) : (
            <AgendaView month={visibleMonth} events={visibleEvents} loading={loading} onSelectDate={setSelectedDate} />
          )}
        </div>
        <DayDetails date={selectedDate} events={selectedEvents} loading={loading} />
      </section>
    </main>
  );
}

function SummaryCard({ icon, label, value, tone, loading }: { icon: ReactNode; label: string; value?: number; tone: "blue" | "green" | "violet" | "slate"; loading: boolean }) {
  const tones = { blue: "bg-blue-50 text-blue-600", green: "bg-emerald-50 text-emerald-600", violet: "bg-violet-50 text-violet-600", slate: "bg-slate-100 text-slate-600" };
  return <article className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>{icon}</span><div><p className="text-2xl font-bold text-slate-900">{loading && value === undefined ? "—" : value ?? "—"}</p><p className="text-xs text-slate-500">{label}</p></div></article>;
}

function ViewButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: ReactNode; children: ReactNode }) {
  return <button type="button" onClick={onClick} className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition ${active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>{icon}{children}</button>;
}

function MonthGrid({ days, visibleMonth, events, selectedDate, onSelectDate, loading }: { days: string[]; visibleMonth: string | null; events: CalendarEvent[]; selectedDate: string | null; onSelectDate: (date: string) => void; loading: boolean }) {
  return <div className="min-w-[760px]">
    <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/70">{weekdays.map((day) => <div key={day} className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">{day}</div>)}</div>
    <div className="grid grid-cols-7">
      {days.map((date) => {
        const dayEvents = getEventsForDate(events, date);
        const isCurrentMonth = date.slice(0, 7) === visibleMonth;
        const isToday = date === businessDateKey(new Date());
        const selected = date === selectedDate;
        return <button key={date} type="button" onClick={() => onSelectDate(date)} className={`group min-h-28 border-b border-r border-slate-100 p-2 text-left transition hover:bg-blue-50/50 focus:z-10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-300 sm:min-h-32 sm:p-2.5 ${selected ? "bg-blue-50/70" : "bg-white"} ${!isCurrentMonth ? "opacity-50" : ""}`}>
          <span className={`mb-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${isToday ? "bg-blue-600 text-white" : selected ? "bg-blue-100 text-blue-700" : "text-slate-600"}`}>{Number(date.slice(-2))}</span>
          {loading ? <span className="block h-5 animate-pulse rounded bg-slate-100" /> : <span className="block space-y-1">{dayEvents.slice(0, 3).map((event) => <span key={event.id} title={`${event.title} · ${event.subtitle}`} className={`block truncate rounded-md px-1.5 py-1 text-[9px] font-semibold leading-tight sm:text-[10px] ${eventTagClass(event)}`}>{event.title}</span>)}{dayEvents.length > 3 && <span className="block px-1 text-[9px] font-semibold text-slate-500">+{dayEvents.length - 3} autres</span>}</span>}
        </button>;
      })}
    </div>
    {days.length === 0 && <div className="p-8"><CalendarSkeleton /></div>}
  </div>;
}

function AgendaView({ month, events, loading, onSelectDate }: { month: string | null; events: CalendarEvent[]; loading: boolean; onSelectDate: (date: string) => void }) {
  const days = month ? getMonthDays(month).filter((date) => date.slice(0, 7) === month && getEventsForDate(events, date).length > 0) : [];
  if (loading) return <div className="space-y-3 p-5"><CalendarSkeleton /></div>;
  if (!days.length) return <div className="flex min-h-80 flex-col items-center justify-center gap-3 px-5 text-center"><CalendarDays className="h-9 w-9 text-slate-300" /><p className="font-semibold text-slate-700">Aucun événement ce mois-ci</p><p className="text-sm text-slate-500">Essayez d’activer d’autres catégories ou de consulter un autre mois.</p></div>;
  return <div className="divide-y divide-slate-100 p-4 sm:p-5">{days.map((date) => <div key={date} className="grid gap-3 py-4 first:pt-0 sm:grid-cols-[120px_1fr]"><button type="button" onClick={() => onSelectDate(date)} className="h-fit text-left"><span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">{formatWeekday(date)}</span><span className="mt-1 block text-sm font-bold text-slate-800">{formatFullDate(date)}</span></button><div className="space-y-2">{getEventsForDate(events, date).map((event) => <EventRow key={`${date}-${event.id}`} event={event} compact />)}</div></div>)}</div>;
}

function DayDetails({ date, events, loading }: { date: string | null; events: CalendarEvent[]; loading: boolean }) {
  return <aside className="min-w-0 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
    <div className="mb-4 flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Détails du jour</p><h2 className="mt-1 text-lg font-bold capitalize text-slate-900">{date ? formatFullDate(date) : "Sélectionnez un jour"}</h2></div><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><CalendarDays className="h-4 w-4" /></span></div>
    {loading ? <CalendarSkeleton /> : events.length ? <div className="space-y-3">{events.map((event) => <EventRow key={event.id} event={event} />)}</div> : <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 px-4 text-center"><CheckCircle2 className="h-7 w-7 text-slate-300" /><p className="mt-2 text-sm font-medium text-slate-600">Aucun événement</p><p className="mt-1 text-xs text-slate-400">Cette journée ne contient aucun élément selon les filtres actifs.</p></div>}
  </aside>;
}

function EventRow({ event, compact = false }: { event: CalendarEvent; compact?: boolean }) {
  const Icon = event.type === "LEAVE" ? CalendarDays : event.type === "HIRE" ? UsersRound : event.type.startsWith("CONTRACT") ? FileText : Clock3;
  return <article className={`flex items-start gap-3 rounded-xl border border-slate-100 p-3 ${compact ? "bg-white" : "bg-slate-50/70"}`}>
    <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${eventIconClass(event)}`}><Icon className="h-4 w-4" /></span>
    <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{event.title}</p><p className="mt-1 text-xs text-slate-500">{event.subtitle}</p>{event.badgeNumber && <p className="mt-1 text-[11px] text-slate-400">Matricule {event.badgeNumber}</p>}</div>
  </article>;
}

function CalendarSkeleton() { return <div className="space-y-3">{[0, 1, 2].map((item) => <div key={item} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}</div>; }

function getEventsForDate(events: CalendarEvent[], date: string) {
  return events.filter((event) => event.startDate <= date && (event.endDate ?? event.startDate) >= date);
}

function getCalendarGridRange(month: string) {
  const first = new Date(`${month}-01T00:00:00Z`);
  const offset = (first.getUTCDay() + 6) % 7;
  const start = new Date(first.getTime() - offset * 86_400_000);
  const end = new Date(start.getTime() + 41 * 86_400_000);
  return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) };
}

function getMonthDays(month: string) {
  const first = new Date(`${month}-01T00:00:00Z`);
  const start = new Date(first.getTime() - ((first.getUTCDay() + 6) % 7) * 86_400_000);
  return Array.from({ length: 42 }, (_, index) => new Date(start.getTime() + index * 86_400_000).toISOString().slice(0, 10));
}

function businessDateKey(date: Date) { return new Date(date.getTime() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10); }
function formatMonthTitle(month: string) { return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "Africa/Nairobi" }).format(new Date(`${month}-01T12:00:00+03:00`)); }
function formatFullDate(date: string) { return new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Nairobi" }).format(new Date(`${date}T12:00:00+03:00`)); }
function formatWeekday(date: string) { return new Intl.DateTimeFormat("fr-FR", { weekday: "long", timeZone: "Africa/Nairobi" }).format(new Date(`${date}T12:00:00+03:00`)); }
function eventDotClass(type: CalendarEventType) { return ({ LEAVE: "bg-blue-500", HIRE: "bg-emerald-500", CONTRACT_START: "bg-violet-500", CONTRACT_END: "bg-amber-500", ATTENDANCE: "bg-cyan-500" } as Record<CalendarEventType, string>)[type]; }
function eventIconClass(event: CalendarEvent) { return event.type === "LEAVE" ? (event.status === "PENDING" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700") : ({ HIRE: "bg-emerald-50 text-emerald-700", CONTRACT_START: "bg-violet-50 text-violet-700", CONTRACT_END: "bg-amber-50 text-amber-700", ATTENDANCE: "bg-cyan-50 text-cyan-700" } as Record<Exclude<CalendarEventType, "LEAVE">, string>)[event.type as Exclude<CalendarEventType, "LEAVE">]; }
function eventTagClass(event: CalendarEvent) { return event.type === "LEAVE" ? (event.status === "PENDING" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700") : ({ HIRE: "bg-emerald-50 text-emerald-700", CONTRACT_START: "bg-violet-50 text-violet-700", CONTRACT_END: "bg-amber-50 text-amber-700", ATTENDANCE: "bg-cyan-50 text-cyan-700" } as Record<Exclude<CalendarEventType, "LEAVE">, string>)[event.type as Exclude<CalendarEventType, "LEAVE">]; }
