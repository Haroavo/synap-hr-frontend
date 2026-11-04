"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ArrowRight, ArrowUpRight, Building2, CalendarDays, CheckCircle2, LogIn, LogOut, RefreshCw, UsersRound } from "lucide-react";
import { dashboardApi } from "@/API";

type Overview = {
  generatedAt: string;
  summary: {
    activeEmployees: number;
    totalEmployees: number;
    newHiresThisMonth: number;
    pendingLeaveRequests: number;
    presentNow: number;
    employeesCheckedInToday: number;
    activeContracts: number;
    expiringContracts: number;
  };
  todayAttendance: { entries: number; exits: number };
  attendanceTrend: Array<{ date: string; count: number }>;
  monthlyHires: Array<{ month: string; count: number }>;
  employeeStatuses: Array<{ status: string; count: number }>;
  leaveStatuses: Array<{ status: string; count: number }>;
  departments: Array<{ id: string; name: string; employeeCount: number }>;
  contractTypes: Array<{ id: string; label: string; contractCount: number }>;
  recentHires: Array<{ id: string; employeeName: string; badgeNumber: string; departmentName: string; hireDate: string; status: string }>;
  recentAttendances: Array<{ id: string; employeeName: string; badgeNumber: string | null; type: "ENTER" | "EXIT"; punchedAt: string; checkpointNumber: number }>;
  pendingLeaves: Array<{ id: string; employeeName: string; departureDate: string; returnDate: string; requestedDays: number; submittedAt: string | null }>;
  expiringContracts: Array<{ id: string; number: string; employeeName: string; contractType: string; endDate: string | null }>;
};

const departmentColors = ["bg-sky-500", "bg-emerald-500", "bg-violet-500", "bg-cyan-500", "bg-indigo-500", "bg-teal-500"];
const contractColors = ["bg-emerald-50 text-emerald-700", "bg-blue-50 text-blue-700", "bg-violet-50 text-violet-700", "bg-slate-100 text-slate-700"];

export function DashboardOverview({ username }: { username: string }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const loadOverview = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    setError("");
    try {
      const response = await dashboardApi.overview(signal);
      const data = await response.json().catch(() => null) as (Overview & { message?: string | string[] }) | null;
      if (!response.ok || !data?.summary) {
        const message = Array.isArray(data?.message) ? data.message.join(", ") : data?.message;
        throw new Error(message ?? "Impossible de charger les indicateurs RH.");
      }
      setOverview(data);
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setError(cause instanceof Error ? cause.message : "Impossible de charger les indicateurs RH.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsHydrated(true);
    const controller = new AbortController();
    void loadOverview(controller.signal);
    return () => controller.abort();
  }, [loadOverview, reloadKey]);

  const dateLabel = overview ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeZone: "Africa/Nairobi" }).format(new Date(overview.generatedAt)) : "";

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-y-auto bg-[#f5f8fc] p-5 lg:p-7">
      <header className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">Aperçu <span className="mx-2">›</span> Tableau de bord</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 lg:text-3xl">Bonjour, {username}</h1>
          <p className="mt-1 text-sm text-slate-500">Voici ce qui se passe dans votre équipe aujourd’hui.</p>
        </div>
        <div className="flex items-center gap-3">
          {dateLabel && <span className="hidden text-sm capitalize text-slate-500 sm:block">{dateLabel}</span>}
          <button type="button" onClick={() => setReloadKey((key) => key + 1)} disabled={Boolean(isHydrated && loading)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Actualiser</button>
        </div>
      </header>

      {error && <div role="alert" className="flex shrink-0 items-center justify-between rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"><span>{error}</span><button type="button" onClick={() => setReloadKey((key) => key + 1)} className="font-semibold underline">Réessayer</button></div>}

      <section className="grid shrink-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Employés actifs" value={overview?.summary.activeEmployees} detail={overview ? `${overview.summary.totalEmployees} dossiers au total` : loading ? "Chargement des effectifs" : "Données indisponibles"} icon={<UsersRound className="h-5 w-5" />} tone="emerald" loading={loading} />
        <MetricCard title="Présents aujourd’hui" value={overview?.summary.presentNow} detail="Selon le dernier pointage de la journée" icon={<CheckCircle2 className="h-5 w-5" />} tone="blue" loading={loading} />
        <MetricCard title="Embauches ce mois" value={overview?.summary.newHiresThisMonth} detail="Dates d’embauche sur le mois en cours" icon={<ArrowUpRight className="h-5 w-5" />} tone="violet" loading={loading} />
        <MetricCard title="Congés à valider" value={overview?.summary.pendingLeaveRequests} detail="Demandes en attente de décision" icon={<CalendarDays className="h-5 w-5" />} tone="amber" loading={loading} />
      </section>

      <section className="grid shrink-0 gap-3 sm:grid-cols-3">
        <InsightCard label="Pointages d’entrée" value={overview?.todayAttendance.entries} hint={`${overview?.summary.employeesCheckedInToday ?? 0} employés ont pointé aujourd’hui`} loading={loading} icon={<LogIn className="h-4 w-4" />} />
        <InsightCard label="Pointages de sortie" value={overview?.todayAttendance.exits} hint="Sorties enregistrées aujourd’hui" loading={loading} icon={<LogOut className="h-4 w-4" />} />
        <InsightCard label="Contrats à renouveler" value={overview?.summary.expiringContracts} hint="Échéance prévue dans les 30 jours" loading={loading} icon={<CalendarDays className="h-4 w-4" />} />
      </section>

      <section className="grid shrink-0 gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div><h2 className="font-semibold text-slate-900">Présence sur 7 jours</h2><p className="mt-1 text-sm text-slate-500">Employés ayant enregistré au moins une entrée chaque jour</p></div>
            <span className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700">Cette semaine</span>
          </div>
          {loading && !overview ? <ChartSkeleton /> : overview?.attendanceTrend.length ? <AttendanceChart rows={overview.attendanceTrend} /> : <EmptyPanel message="Aucune donnée de pointage pour cette période." />}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between"><div><h2 className="font-semibold text-slate-900">Effectif par département</h2><p className="mt-1 text-sm text-slate-500">Répartition des employés actifs</p></div><Building2 className="h-5 w-5 text-slate-400" /></div>
          {loading && !overview ? <ListSkeleton /> : overview?.departments.length ? <div className="space-y-4">{overview.departments.map((department, index) => {
            const max = Math.max(...overview.departments.map((item) => item.employeeCount), 1);
            return <div key={department.id}><div className="mb-1.5 flex items-center justify-between gap-3 text-sm"><span className="truncate font-medium text-slate-700">{department.name}</span><span className="shrink-0 text-xs font-semibold text-slate-500">{department.employeeCount}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${departmentColors[index % departmentColors.length]}`} style={{ width: `${Math.max((department.employeeCount / max) * 100, 2)}%` }} /></div></div>;
          })}</div> : <EmptyPanel message="Aucun département avec des employés actifs." />}
        </div>
      </section>

      <section className="grid min-h-0 shrink-0 gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="font-semibold text-slate-900">Demandes de congé à traiter</h2><p className="mt-1 text-sm text-slate-500">Les dernières demandes en attente</p></div><Link href="/leave-management/requests" className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-800">Tout voir <ArrowRight className="h-4 w-4" /></Link></div>
          {loading && !overview ? <ListSkeleton /> : overview?.pendingLeaves.length ? <div className="divide-y divide-slate-100">{overview.pendingLeaves.map((leave) => <div key={leave.id} className="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-0"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{leave.employeeName}</p><p className="mt-1 text-xs text-slate-500">{formatDateRange(leave.departureDate, leave.returnDate)} · {formatDays(leave.requestedDays)}</p></div><span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">En attente</span></div>)}</div> : <EmptyPanel message="Aucune demande en attente." />}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6">
          <div className="mb-4 flex items-start justify-between"><div><h2 className="font-semibold text-slate-900">Derniers pointages</h2><p className="mt-1 text-sm text-slate-500">Activité enregistrée aujourd’hui</p></div><Link href="/attendances" className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-800">Pointage <ArrowRight className="h-4 w-4" /></Link></div>
          {loading && !overview ? <ListSkeleton /> : overview?.recentAttendances.length ? <div className="divide-y divide-slate-100">{overview.recentAttendances.map((attendance) => <div key={attendance.id} className="flex items-center gap-3 py-3 first:pt-1 last:pb-0"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${attendance.type === "ENTER" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>{attendance.type === "ENTER" ? <LogIn className="h-4 w-4" /> : <LogOut className="h-4 w-4" />}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{attendance.employeeName}</p><p className="mt-0.5 truncate text-xs text-slate-500">{attendance.badgeNumber ?? "Matricule non renseigné"} · Pointage {attendance.checkpointNumber}</p></div><div className="shrink-0 text-right"><p className="text-xs font-semibold text-slate-700">{attendance.type === "ENTER" ? "Entrée" : "Sortie"}</p><p className="mt-0.5 text-xs text-slate-500">{formatTime(attendance.punchedAt)}</p></div></div>)}</div> : <EmptyPanel message="Aucun pointage enregistré aujourd’hui." />}
        </div>
      </section>

      <section className="grid shrink-0 gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold text-slate-900">Contrats actifs</h2><p className="mt-1 text-sm text-slate-500">Par nature de contrat</p></div><span className="text-2xl font-bold text-slate-900">{overview?.summary.activeContracts ?? "—"}</span></div>
          {loading && !overview ? <ListSkeleton /> : overview?.contractTypes.length ? <div className="flex flex-wrap gap-2">{overview.contractTypes.map((type, index) => <span key={type.id} className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${contractColors[index % contractColors.length]}`}><span>{type.label}</span><strong>{type.contractCount}</strong></span>)}</div> : <EmptyPanel message="Aucun contrat actif." />}
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="font-semibold text-slate-900">Échéances à venir</h2><p className="mt-1 text-sm text-slate-500">Contrats qui se terminent dans les 30 jours</p></div><span className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-blue-50 px-2 text-sm font-bold text-blue-700">{overview?.summary.expiringContracts ?? "—"}</span></div>
          {loading && !overview ? <ListSkeleton /> : overview?.expiringContracts.length ? <div className="divide-y divide-slate-100">{overview.expiringContracts.map((contract) => <div key={contract.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{contract.employeeName}</p><p className="mt-0.5 truncate text-xs text-slate-500">{contract.number} · {contract.contractType}</p></div><span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{contract.endDate ? formatShortDate(contract.endDate) : "—"}</span></div>)}</div> : <EmptyPanel message="Aucun contrat n’arrive à échéance prochainement." />}
        </div>
      </section>

      <section className="grid shrink-0 gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-3"><div><h2 className="font-semibold text-slate-900">Évolution des embauches</h2><p className="mt-1 text-sm text-slate-500">Nouveaux dossiers enregistrés sur les six derniers mois</p></div><ArrowUpRight className="h-5 w-5 text-slate-400" /></div>
          {loading && !overview ? <ChartSkeleton /> : overview?.monthlyHires.length ? <MonthlyHiresChart rows={overview.monthlyHires} /> : <EmptyPanel message="Aucune embauche enregistrée sur cette période." />}
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-3"><div><h2 className="font-semibold text-slate-900">Situation des effectifs</h2><p className="mt-1 text-sm text-slate-500">Répartition actuelle des dossiers employés</p></div><UsersRound className="h-5 w-5 text-slate-400" /></div>
          {loading && !overview ? <ListSkeleton /> : overview?.employeeStatuses.length ? <StatusBreakdown rows={overview.employeeStatuses} /> : <EmptyPanel message="Aucune donnée d’effectif." />}
        </div>
      </section>

      <section className="grid shrink-0 gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="font-semibold text-slate-900">Dernières embauches</h2><p className="mt-1 text-sm text-slate-500">Les dossiers récemment ajoutés</p></div><Link href="/employees" className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-800">Voir les employés <ArrowRight className="h-4 w-4" /></Link></div>
          {loading && !overview ? <ListSkeleton /> : overview?.recentHires.length ? <div className="divide-y divide-slate-100">{overview.recentHires.map((employee) => <div key={employee.id} className="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-0"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{employee.employeeName}</p><p className="mt-1 truncate text-xs text-slate-500">{employee.badgeNumber} · {employee.departmentName}</p></div><span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{formatShortDate(employee.hireDate)}</span></div>)}</div> : <EmptyPanel message="Aucun employé enregistré." />}
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-3"><div><h2 className="font-semibold text-slate-900">Suivi des congés</h2><p className="mt-1 text-sm text-slate-500">Demandes par statut</p></div><Link href="/leave-management/requests" className="text-sm font-medium text-blue-700 hover:text-blue-800">Gérer les demandes</Link></div>
          {loading && !overview ? <ListSkeleton /> : overview?.leaveStatuses.length ? <StatusBreakdown rows={overview.leaveStatuses} /> : <EmptyPanel message="Aucune demande de congé." />}
        </div>
      </section>

      <div className="flex justify-end pb-2"><Link href="/dashboard/analytics" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700">Ouvrir les analyses RH <ArrowRight className="h-4 w-4" /></Link></div>
    </div>
  );
}

function InsightCard({ label, value, hint, loading, icon }: { label: string; value?: number; hint: string; loading: boolean; icon: ReactNode }) {
  return <article className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">{icon}</span><div className="min-w-0 flex-1"><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-0.5 text-xl font-bold text-slate-900">{loading && value === undefined ? "…" : value ?? "—"}</p><p className="truncate text-xs text-slate-500">{hint}</p></div></article>;
}

function MonthlyHiresChart({ rows }: { rows: Overview["monthlyHires"] }) {
  const max = Math.max(...rows.map((row) => row.count), 1);
  return <div className="flex h-[210px] items-end gap-2 border-b border-slate-100 px-1 pt-4 sm:gap-4">{rows.map((row) => <div key={row.month} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"><span className="text-xs font-semibold text-slate-600">{row.count}</span><div className="flex w-full flex-1 items-end"><div className="mx-auto w-full max-w-12 rounded-t-lg bg-blue-500 transition-all" style={{ height: `${Math.max((row.count / max) * 100, 3)}%` }} /></div><span className="mb-2 text-[11px] capitalize text-slate-500">{formatMonth(row.month)}</span></div>)}</div>;
}

function StatusBreakdown({ rows }: { rows: Array<{ status: string; count: number }> }) {
  const colors: Record<string, string> = { ACTIVE: "bg-emerald-500", INACTIVE: "bg-slate-400", SUSPENDED: "bg-amber-500", DEPARTED: "bg-blue-400", PENDING: "bg-amber-500", APPROVED: "bg-emerald-500", REJECTED: "bg-slate-400", CANCELLED: "bg-slate-300" };
  const max = Math.max(...rows.map((row) => row.count), 1);
  return <div className="space-y-4">{rows.map((row) => <div key={row.status}><div className="mb-1.5 flex items-center justify-between text-sm"><span className="font-medium text-slate-700">{statusLabel(row.status)}</span><span className="font-semibold text-slate-600">{row.count}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${colors[row.status] ?? "bg-blue-500"}`} style={{ width: `${Math.max((row.count / max) * 100, row.count ? 2 : 0)}%` }} /></div></div>)}</div>;
}

function MetricCard({ title, value, detail, icon, tone, loading }: { title: string; value?: number; detail: string; icon: ReactNode; tone: "emerald" | "blue" | "violet" | "amber"; loading: boolean }) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    violet: "bg-violet-50 text-violet-600",
    amber: "bg-amber-50 text-amber-700",
  };
  return <article className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><span className="text-sm font-medium text-slate-500">{title}</span><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}>{icon}</span></div><p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{loading && value === undefined ? <span className="inline-block h-8 w-12 animate-pulse rounded-md bg-slate-100" /> : value ?? "—"}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></article>;
}

function AttendanceChart({ rows }: { rows: Overview["attendanceTrend"] }) {
  const width = 640;
  const height = 210;
  const paddingX = 28;
  const paddingY = 22;
  const max = Math.max(...rows.map(({ count }) => count), 1);
  const points = rows.map((row, index) => ({ ...row, x: paddingX + (index * (width - paddingX * 2)) / Math.max(rows.length - 1, 1), y: height - paddingY - (row.count / max) * (height - paddingY * 2) }));
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
  return <div className="w-full overflow-hidden"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Nombre d’employés pointés par jour sur les sept derniers jours" className="h-[210px] w-full overflow-visible">
    {[0, 1, 2, 3].map((step) => { const y = paddingY + (step * (height - paddingY * 2)) / 3; return <line key={step} x1={paddingX} x2={width - paddingX} y1={y} y2={y} stroke="#e9eef5" strokeDasharray="4 6" />; })}
    <path d={path} fill="none" stroke="#238be6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    {points.map((point) => <g key={point.date}><circle cx={point.x} cy={point.y} r="5" fill="white" stroke="#238be6" strokeWidth="3"><title>{formatWeekday(point.date)} : {point.count} employé(s)</title></circle><text x={point.x} y={height - 2} textAnchor="middle" fontSize="11" fill="#64748b">{formatWeekday(point.date)}</text></g>)}
  </svg></div>;
}

function ChartSkeleton() { return <div className="h-[210px] animate-pulse rounded-xl bg-slate-50" />; }
function ListSkeleton() { return <div className="space-y-4">{[0, 1, 2, 3].map((item) => <div key={item} className="h-10 animate-pulse rounded-lg bg-slate-50" />)}</div>; }
function EmptyPanel({ message }: { message: string }) { return <div className="flex min-h-28 items-center justify-center rounded-xl border border-dashed border-slate-200 px-4 text-center text-sm text-slate-500">{message}</div>; }

function formatDateRange(start: string, end: string) {
  const format = (date: string) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "Africa/Nairobi" }).format(new Date(date));
  return start.slice(0, 10) === end.slice(0, 10) ? format(start) : `${format(start)} – ${format(end)}`;
}

function formatDays(days: number) { return `${days} jour${days > 1 ? "s" : ""}`; }
function formatTime(date: string) { return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Nairobi" }).format(new Date(date)); }
function formatShortDate(date: string) { return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", timeZone: "Africa/Nairobi" }).format(new Date(date)); }
function formatWeekday(date: string) { return new Intl.DateTimeFormat("fr-FR", { weekday: "short", timeZone: "Africa/Nairobi" }).format(new Date(`${date}T12:00:00+03:00`)); }
function formatMonth(month: string) { return new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "Africa/Nairobi" }).format(new Date(`${month}-01T12:00:00+03:00`)); }
function statusLabel(status: string) { return ({ ACTIVE: "Actif", INACTIVE: "Inactif", SUSPENDED: "Suspendu", DEPARTED: "Parti", PENDING: "En attente", APPROVED: "Approuvé", REJECTED: "Refusé", CANCELLED: "Annulé" } as Record<string, string>)[status] ?? status; }
