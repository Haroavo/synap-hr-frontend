"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, BarChart3, CalendarClock, FileText, RefreshCw, UsersRound } from "lucide-react";
import { dashboardApi } from "@/API";

type Analytics = {
  generatedAt: string;
  periodMonths: number;
  summary: {
    totalEmployees: number;
    activeEmployees: number;
    newHires: number;
    departedEmployees: number;
    pendingLeaveRequests: number;
    activeContracts: number;
    expiringContracts: number;
    entryPunches: number;
  };
  hiresByMonth: Array<{ month: string; count: number }>;
  attendanceByMonth: Array<{ month: string; employeesWithEntry: number }>;
  employeesByStatus: Array<{ status: string; count: number }>;
  employeesByDepartment: Array<{ id: string; name: string; count: number }>;
  contractsByType: Array<{ id: string; label: string; count: number }>;
  leaveRequestsByStatus: Array<{ status: string; count: number }>;
};

export function HrAnalyticsPage() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [months, setMonths] = useState(12);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    setError("");
    try {
      const response = await dashboardApi.analytics(months, signal);
      const data = await response.json().catch(() => null) as (Analytics & { message?: string | string[] }) | null;
      if (!response.ok || !data?.summary) {
        const message = Array.isArray(data?.message) ? data.message.join(", ") : data?.message;
        throw new Error(message ?? "Impossible de charger les analyses RH.");
      }
      setAnalytics(data);
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setError(cause instanceof Error ? cause.message : "Impossible de charger les analyses RH.");
    } finally {
      setLoading(false);
    }
  }, [months]);

  useEffect(() => {
    setIsHydrated(true);
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, reloadKey]);

  return (
    <main className="flex h-full min-h-0 flex-col gap-5 overflow-y-auto bg-[#f5f8fc] p-5 lg:p-7">
      <header className="flex shrink-0 flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-700"><ArrowLeft className="h-3.5 w-3.5" /> Tableau de bord</Link>
          <p className="mt-3 text-xs font-medium text-slate-500">Pilotage <span className="mx-2">›</span> Analyses RH</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 lg:text-3xl">Analyses RH</h1>
          <p className="mt-1 text-sm text-slate-500">Suivez l’évolution des effectifs, des contrats et des demandes de congé.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="analytics-period">Période d’analyse</label>
          <select id="analytics-period" value={months} onChange={(event) => setMonths(Number(event.target.value))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
            <option value={6}>6 derniers mois</option><option value={12}>12 derniers mois</option><option value={24}>24 derniers mois</option>
          </select>
          <button type="button" onClick={() => setReloadKey((key) => key + 1)} disabled={Boolean(isHydrated && loading)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Actualiser</button>
        </div>
      </header>

      {error && <div role="alert" className="flex shrink-0 items-center justify-between rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"><span>{error}</span><button type="button" onClick={() => setReloadKey((key) => key + 1)} className="font-semibold underline">Réessayer</button></div>}

      <section className="grid shrink-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Effectif total" value={analytics?.summary.totalEmployees} hint="Tous les dossiers employés" icon={<UsersRound className="h-5 w-5" />} loading={loading} tone="blue" />
        <Metric title="Employés actifs" value={analytics?.summary.activeEmployees} hint="Effectif actuellement actif" icon={<UsersRound className="h-5 w-5" />} loading={loading} tone="green" />
        <Metric title={`Embauches · ${months} mois`} value={analytics?.summary.newHires} hint="Selon la date d’embauche" icon={<BarChart3 className="h-5 w-5" />} loading={loading} tone="violet" />
        <Metric title="Départs enregistrés" value={analytics?.summary.departedEmployees} hint="Dossiers au statut parti" icon={<CalendarClock className="h-5 w-5" />} loading={loading} tone="slate" />
      </section>

      <section className="grid shrink-0 gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
        <Panel title="Évolution des embauches" subtitle={`Nouveaux employés par mois · ${months} derniers mois`} icon={<BarChart3 className="h-5 w-5" />}>
          {loading && !analytics ? <Skeleton /> : analytics?.hiresByMonth.length ? <MonthlyChart rows={analytics.hiresByMonth} /> : <Empty message="Aucune embauche sur la période sélectionnée." />}
        </Panel>
        <Panel title="Répartition des effectifs" subtitle="Statut des dossiers employés" icon={<UsersRound className="h-5 w-5" />}>
          {loading && !analytics ? <Skeleton /> : analytics?.employeesByStatus.length ? <Breakdown rows={analytics.employeesByStatus} /> : <Empty message="Aucun dossier employé trouvé." />}
        </Panel>
      </section>

      <section className="grid shrink-0 gap-5 xl:grid-cols-2">
        <Panel title="Effectifs par département" subtitle="Employés actifs regroupés par département" icon={<UsersRound className="h-5 w-5" />}>
          {loading && !analytics ? <Skeleton /> : analytics?.employeesByDepartment.length ? <Breakdown rows={analytics.employeesByDepartment.map((item) => ({ status: item.name, count: item.count }))} /> : <Empty message="Aucun effectif actif par département." />}
        </Panel>
        <Panel title="Contrats actifs" subtitle={`${analytics?.summary.activeContracts ?? "—"} contrats · échéances à 30 jours : ${analytics?.summary.expiringContracts ?? "—"}`} icon={<FileText className="h-5 w-5" />}>
          {loading && !analytics ? <Skeleton /> : analytics?.contractsByType.length ? <Breakdown rows={analytics.contractsByType.map((item) => ({ status: item.label, count: item.count }))} /> : <Empty message="Aucun contrat actif enregistré." />}
        </Panel>
      </section>

      <section className="grid shrink-0 gap-5 xl:grid-cols-2">
        <Panel title="Présence mensuelle" subtitle="Employés ayant pointé au moins une fois sur le mois" icon={<CalendarClock className="h-5 w-5" />}>
          {loading && !analytics ? <Skeleton /> : analytics?.attendanceByMonth.length ? <AttendanceMonthChart rows={analytics.attendanceByMonth} /> : <Empty message="Aucun pointage sur la période sélectionnée." />}
        </Panel>
        <Panel title="Demandes de congé" subtitle={`Statuts des demandes créées sur les ${months} derniers mois`} icon={<CalendarClock className="h-5 w-5" />}>
          {loading && !analytics ? <Skeleton /> : analytics?.leaveRequestsByStatus.length ? <Breakdown rows={analytics.leaveRequestsByStatus} /> : <Empty message="Aucune demande de congé sur la période." />}
        </Panel>
      </section>

      <section className="grid shrink-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SmallMetric title="Pointages d’entrée" value={analytics?.summary.entryPunches} hint={`Total sur les ${months} derniers mois`} loading={loading} />
        <SmallMetric title="Demandes à valider" value={analytics?.summary.pendingLeaveRequests} hint="Toutes les demandes en attente" loading={loading} />
        <SmallMetric title="Contrats actifs" value={analytics?.summary.activeContracts} hint="Contrats en cours" loading={loading} />
        <Link href="/employees" className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-5 py-4 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700">Consulter les employés <ArrowLeft className="h-4 w-4 rotate-180" /></Link>
      </section>
    </main>
  );
}

function Metric({ title, value, hint, icon, loading, tone }: { title: string; value?: number; hint: string; icon: ReactNode; loading: boolean; tone: "blue" | "green" | "violet" | "slate" }) {
  const colors = { blue: "bg-blue-50 text-blue-600", green: "bg-emerald-50 text-emerald-600", violet: "bg-violet-50 text-violet-600", slate: "bg-slate-100 text-slate-600" };
  return <article className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><span className="text-sm font-medium text-slate-500">{title}</span><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[tone]}`}>{icon}</span></div><p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{loading && value === undefined ? "—" : value ?? "—"}</p><p className="mt-1 text-xs text-slate-500">{hint}</p></article>;
}

function SmallMetric({ title, value, hint, loading }: { title: string; value?: number; hint: string; loading: boolean }) {
  return <article className="rounded-2xl border border-slate-100 bg-white p-5"><p className="text-sm font-medium text-slate-500">{title}</p><p className="mt-2 text-2xl font-bold text-slate-900">{loading && value === undefined ? "—" : value ?? "—"}</p><p className="mt-1 text-xs text-slate-500">{hint}</p></article>;
}

function Panel({ title, subtitle, icon, children }: { title: string; subtitle: string; icon: ReactNode; children: ReactNode }) {
  return <section className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6"><div className="mb-5 flex items-start justify-between gap-3"><div><h2 className="font-semibold text-slate-900">{title}</h2><p className="mt-1 text-sm text-slate-500">{subtitle}</p></div><span className="text-slate-400">{icon}</span></div>{children}</section>;
}

function MonthlyChart({ rows }: { rows: Analytics["hiresByMonth"] }) {
  const max = Math.max(...rows.map((row) => row.count), 1);
  return <div className="flex h-60 items-end gap-1.5 border-b border-slate-100 px-1 pt-4 sm:gap-3">{rows.map((row) => <div key={row.month} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"><span className="text-[11px] font-semibold text-slate-600">{row.count}</span><div className="flex w-full flex-1 items-end"><div className="mx-auto w-full max-w-10 rounded-t-lg bg-blue-500" style={{ height: `${Math.max((row.count / max) * 100, row.count ? 5 : 2)}%` }} /></div><span className="mb-2 text-[10px] capitalize text-slate-500 sm:text-xs">{monthLabel(row.month)}</span></div>)}</div>;
}

function AttendanceMonthChart({ rows }: { rows: Analytics["attendanceByMonth"] }) {
  const max = Math.max(...rows.map((row) => row.employeesWithEntry), 1);
  return <div className="flex h-56 items-end gap-1.5 border-b border-slate-100 px-1 pt-4 sm:gap-3">{rows.map((row) => <div key={row.month} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"><span className="text-[11px] font-semibold text-slate-600">{row.employeesWithEntry}</span><div className="flex w-full flex-1 items-end"><div className="mx-auto w-full max-w-10 rounded-t-lg bg-emerald-500" style={{ height: `${Math.max((row.employeesWithEntry / max) * 100, row.employeesWithEntry ? 5 : 2)}%` }} /></div><span className="mb-2 text-[10px] capitalize text-slate-500 sm:text-xs">{monthLabel(row.month, rows.length > 12)}</span></div>)}</div>;
}

function Breakdown({ rows }: { rows: Array<{ status: string; count: number }> }) {
  const max = Math.max(...rows.map((row) => row.count), 1);
  return <div className="max-h-72 space-y-4 overflow-y-auto pr-1">{rows.map((row, index) => <div key={row.status}><div className="mb-1.5 flex items-center justify-between gap-3 text-sm"><span className="truncate font-medium text-slate-700">{label(row.status)}</span><span className="shrink-0 font-semibold text-slate-600">{row.count}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${barColors[index % barColors.length]}`} style={{ width: `${Math.max((row.count / max) * 100, row.count ? 2 : 0)}%` }} /></div></div>)}</div>;
}

function Skeleton() { return <div className="h-56 animate-pulse rounded-xl bg-slate-50" />; }
function Empty({ message }: { message: string }) { return <div className="flex min-h-36 items-center justify-center rounded-xl border border-dashed border-slate-200 px-4 text-center text-sm text-slate-500">{message}</div>; }
const barColors = ["bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-cyan-500", "bg-indigo-500", "bg-teal-500"];
function monthLabel(month: string, includeYear = false) { return new Intl.DateTimeFormat("fr-FR", { month: "short", ...(includeYear ? { year: "2-digit" as const } : {}), timeZone: "Africa/Nairobi" }).format(new Date(`${month}-01T12:00:00+03:00`)); }
function label(value: string) { return ({ ACTIVE: "Actif", INACTIVE: "Inactif", SUSPENDED: "Suspendu", DEPARTED: "Parti", PENDING: "En attente", APPROVED: "Approuvé", REJECTED: "Refusé", CANCELLED: "Annulé" } as Record<string, string>)[value] ?? value; }
