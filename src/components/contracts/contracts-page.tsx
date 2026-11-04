"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { CalendarClock, Eye, FileText, Plus, Search, UsersRound } from "lucide-react";
import { contractsApi } from "@/API";
import { DataTable, type DataTableColumn, type DataTablePagination } from "@/components/ui/data-table";
import { StatusBadge, type StatusBadgeVariant } from "@/components/ui/status-badge";
import { CreateContractModal } from "@/components/contracts/create-contract-modal";
import { EditContractModal } from "@/components/contracts/edit-contract-modal";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

type ContractStatus = "ACTIVE" | "DRAFT" | "SUSPENDED" | "ENDED" | "CANCELLED";
type ContractRecord = {
  _id: string;
  contractNumber: string;
  contractTypeId: string;
  startDate: string;
  endDate?: string | null;
  weeklyHours?: number | null;
  grossSalary?: number | null;
  currency?: string;
  remunerationFrequency?: "MONTHLY" | "DAILY" | "HOURLY";
  professionalCategory?: string | null;
  classificationIndex?: string | null;
  history?: Array<{ changedAt: string; reason: string; changes: Array<{ field: string; before: string | null; after: string | null }> }>;
  status: ContractStatus;
  employee: { _id: string; fullName: string; badgeNumber: string; departmentName?: string | null; positionTitle?: string | null } | null;
  contractType: { code: string; label: string } | null;
};
type ContractsResponse = {
  data: ContractRecord[];
  meta: DataTablePagination;
  summary: { totalContracts: number; activeContracts: number; expiringContracts: number; endedContracts: number };
  message?: string | string[];
};

const statuses: Array<{ value: "" | ContractStatus; label: string }> = [
  { value: "", label: "Tous les statuts" },
  { value: "ACTIVE", label: "Actif" },
  { value: "DRAFT", label: "Brouillon" },
  { value: "SUSPENDED", label: "Suspendu" },
  { value: "ENDED", label: "Terminé" },
  { value: "CANCELLED", label: "Annulé" },
];

const statusLabels: Record<ContractStatus, string> = {
  ACTIVE: "Actif",
  DRAFT: "Brouillon",
  SUSPENDED: "Suspendu",
  ENDED: "Terminé",
  CANCELLED: "Annulé",
};

const statusVariants: Record<ContractStatus, StatusBadgeVariant> = {
  ACTIVE: "success",
  DRAFT: "info",
  SUSPENDED: "warning",
  ENDED: "neutral",
  CANCELLED: "danger",
};

const emptyPagination: DataTablePagination = { page: 1, limit: 10, totalItems: 0, totalPages: 1 };

function formatDate(value?: string | null) {
  if (!value) return "Sans date de fin";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeZone: "Africa/Nairobi" }).format(date);
}

function contractTypeClass(code?: string) {
  const normalized = code?.toUpperCase();
  if (normalized === "CDI") return "border-emerald-100 bg-emerald-50 text-emerald-700";
  if (normalized === "CDD") return "border-blue-100 bg-blue-50 text-blue-700";
  if (normalized?.includes("STAGE") || normalized?.includes("STAGIAIRE")) return "border-violet-100 bg-violet-50 text-violet-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export function ContractsPage() {
  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [summary, setSummary] = useState<ContractsResponse["summary"]>({ totalContracts: 0, activeContracts: 0, expiringContracts: 0, endedContracts: 0 });
  const [pagination, setPagination] = useState(emptyPagination);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<"" | ContractStatus>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [updatingContractId, setUpdatingContractId] = useState<string | null>(null);
  const [detailsContract, setDetailsContract] = useState<ContractRecord | null>(null);
  const [editingContract, setEditingContract] = useState<ContractRecord | null>(null);
  const [pendingStatusChange, setPendingStatusChange] = useState<{ contract: ContractRecord; status: ContractStatus } | null>(null);
  const [statusReason, setStatusReason] = useState("");

  const changeStatus = useCallback(async (contract: ContractRecord, nextStatus: ContractStatus, reason: string) => {
    setUpdatingContractId(contract._id);
    setError("");
    try {
      const response = await contractsApi.update(contract._id, { status: nextStatus, reason: reason.trim() });
      const result = await response.json().catch(() => null) as { message?: string | string[] } | null;
      if (!response.ok) {
        throw new Error(Array.isArray(result?.message) ? result.message.join(", ") : result?.message ?? "La mise à jour du contrat a échoué.");
      }
      setReloadKey((current) => current + 1);
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "La mise à jour du contrat a échoué.");
      return false;
    } finally {
      setUpdatingContractId(null);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const loadContracts = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    setError("");
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (debouncedSearch) query.set("search", debouncedSearch);
    if (status) query.set("status", status);
    try {
      const response = await contractsApi.list(query, signal);
      const result = await response.json().catch(() => null) as ContractsResponse | null;
      if (!response.ok || !result || !Array.isArray(result.data)) {
        const message = Array.isArray(result?.message) ? result.message.join(", ") : result?.message;
        throw new Error(message ?? "Impossible de charger les contrats.");
      }
      setContracts(result.data);
      setPagination(result.meta ?? { ...emptyPagination, page, limit });
      setSummary(result.summary ?? { totalContracts: result.meta?.totalItems ?? 0, activeContracts: 0, expiringContracts: 0, endedContracts: 0 });
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setError(cause instanceof Error ? cause.message : "Impossible de charger les contrats.");
      setContracts([]);
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [debouncedSearch, limit, page, reloadKey, status]);

  useEffect(() => {
    const controller = new AbortController();
    void loadContracts(controller.signal);
    return () => controller.abort();
  }, [loadContracts]);

  const columns = useMemo<DataTableColumn<ContractRecord>[]>(() => [
    {
      id: "contractNumber",
      header: "N° CONTRAT",
      width: "180px",
      cell: (contract) => <span className="font-mono text-xs font-semibold tracking-wide text-slate-700">{contract.contractNumber}</span>,
    },
    {
      id: "employee",
      header: "EMPLOYÉ",
      cell: (contract) => contract.employee ? <Link href={`/employees/${encodeURIComponent(contract.employee._id)}`} className="group block min-w-48 rounded-lg py-1 hover:text-blue-700"><span className="block font-semibold text-slate-800 group-hover:text-blue-700">{contract.employee.fullName}</span><span className="mt-0.5 block text-xs text-slate-400">{contract.employee.badgeNumber}{contract.employee.departmentName ? ` · ${contract.employee.departmentName}` : ""}</span></Link> : <span className="text-slate-400">Employé introuvable</span>,
    },
    {
      id: "contractType",
      header: "TYPE",
      width: "160px",
      cell: (contract) => contract.contractType ? <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold ${contractTypeClass(contract.contractType.code)}`}>{contract.contractType.label}</span> : <span className="text-slate-400">—</span>,
    },
    {
      id: "period",
      header: "PÉRIODE",
      width: "220px",
      cell: (contract) => <span className="text-xs leading-5 text-slate-600">{formatDate(contract.startDate)} <span className="text-slate-300">→</span> {formatDate(contract.endDate)}</span>,
    },
    {
      id: "terms",
      header: "TEMPS / RÉMUNÉRATION",
      width: "190px",
      cell: (contract) => <span className="text-xs leading-5 text-slate-600">{contract.weeklyHours != null ? `${contract.weeklyHours} h / sem.` : "Heures —"}<br />{contract.grossSalary != null ? `${new Intl.NumberFormat("fr-FR").format(contract.grossSalary)} ${contract.currency ?? "MGA"} / ${contract.remunerationFrequency === "HOURLY" ? "h" : contract.remunerationFrequency === "DAILY" ? "j" : "mois"}` : "Rémunération —"}</span>,
    },
    {
      id: "position",
      header: "POSTE",
      cell: (contract) => <span className="text-sm text-slate-600">{contract.employee?.positionTitle ?? "—"}</span>,
    },
    {
      id: "status",
      header: "STATUT",
      width: "120px",
      cell: (contract) => <StatusBadge variant={statusVariants[contract.status]} dot>{statusLabels[contract.status]}</StatusBadge>,
    },
    {
      id: "actions",
      header: "ACTIONS",
      width: "165px",
      cell: (contract) => {
        const nextStatus = contract.status === "DRAFT"
          ? "ACTIVE"
          : contract.status === "ACTIVE"
            ? "ENDED"
            : contract.status === "SUSPENDED"
              ? "ACTIVE"
              : null;
        if (!nextStatus) return <button type="button" onClick={() => setDetailsContract(contract)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE8E2] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#536A76] hover:bg-[#F7FAF9]"><Eye className="h-3.5 w-3.5" />Détails</button>;
        const label = nextStatus === "ENDED" ? "Terminer" : contract.status === "SUSPENDED" ? "Réactiver" : "Activer";
        return (
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => setDetailsContract(contract)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#DCE8E2] bg-white text-[#536A76] hover:bg-[#F7FAF9]" title="Détails et historique" aria-label="Détails et historique"><Eye className="h-4 w-4" /></button>
            <button
              type="button"
              disabled={updatingContractId === contract._id}
              onClick={() => { setStatusReason(""); setError(""); setPendingStatusChange({ contract, status: nextStatus }); }}
              className="rounded-lg border border-[#DCE8E2] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#16775C] transition hover:bg-[#EAF5F1] disabled:opacity-50"
            >
              {updatingContractId === contract._id ? "Mise à jour…" : label}
            </button>
          </div>
        );
      },
    },
  ], [updatingContractId]);

  return (
    <div className="flex h-full min-h-0 flex-col p-5 lg:p-7">
      <header className="mb-5 flex shrink-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs text-app-muted">Personnel <span className="mx-2">›</span> Administration RH <span className="mx-2">›</span> Contrats</p>
          <h1 className="mt-2 text-2xl font-bold text-app-text">Gestion des contrats</h1>
          <p className="mt-1 text-sm text-app-muted">Suivez les contrats, leurs échéances et les informations contractuelles des employés.</p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-app-primary px-4 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Ajouter un contrat
        </button>
      </header>

      <section className="mb-4 grid shrink-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={<FileText className="h-5 w-5" />} value={summary.totalContracts} label="Contrats enregistrés" tone="blue" />
        <SummaryCard icon={<UsersRound className="h-5 w-5" />} value={summary.activeContracts} label="Contrats actifs" tone="green" />
        <SummaryCard icon={<CalendarClock className="h-5 w-5" />} value={summary.expiringContracts} label="Fin dans les 30 jours" tone="amber" />
        <SummaryCard icon={<FileText className="h-5 w-5" />} value={summary.endedContracts} label="Contrats terminés" tone="slate" />
      </section>

      <div className="mb-3 flex shrink-0 flex-col gap-3 rounded-xl border border-slate-100 bg-white p-3 sm:flex-row sm:items-center">
        <label className="relative block sm:w-[min(440px,60%)]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Rechercher un contrat ou un employé..." className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-app-primary focus:ring-2 focus:ring-blue-100" />
        </label>
        <div className="flex items-center gap-2 sm:ml-auto">
          <label htmlFor="contract-status" className="text-xs font-medium text-slate-500">Statut</label>
          <select id="contract-status" value={status} onChange={(event) => { setStatus(event.target.value as "" | ContractStatus); setPage(1); }} className="h-10 min-w-44 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-app-primary focus:ring-2 focus:ring-blue-100">
            {statuses.map((item) => <option key={item.value || "all"} value={item.value}>{item.label}</option>)}
          </select>
        </div>
      </div>

      {error && <div role="alert" className="mb-3 shrink-0 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      <div className="min-h-0 flex-1">
        <DataTable<ContractRecord>
          title="Tous les contrats"
          showTitle={false}
          compact
          data={contracts}
          columns={columns}
          getRowId={(contract) => contract._id}
          pagination={pagination}
          loading={loading}
          selectable={false}
          showSelectionToolbar={false}
          pageSizeOptions={[10, 15, 20, 50]}
          emptyMessage="Aucun contrat ne correspond à votre recherche."
          onPageChange={setPage}
          onPageSizeChange={(nextLimit) => { setLimit(nextLimit); setPage(1); }}
        />
      </div>
      <CreateContractModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => setReloadKey((current) => current + 1)}
      />
      <Modal open={Boolean(detailsContract)} title="Détail du contrat" description={detailsContract?.contractNumber} onClose={() => setDetailsContract(null)} size="lg">
        {detailsContract && <div className="max-h-[65vh] space-y-5 overflow-y-auto px-5 py-5 sm:px-7">
          <div className="grid gap-3 sm:grid-cols-2">
            <Detail label="Employé" value={detailsContract.employee?.fullName ?? "Employé introuvable"} />
            <Detail label="Type" value={detailsContract.contractType?.label ?? "—"} />
            <Detail label="Période" value={`${formatDate(detailsContract.startDate)} → ${formatDate(detailsContract.endDate)}`} />
            <Detail label="Statut" value={statusLabels[detailsContract.status]} />
            <Detail label="Temps hebdomadaire" value={detailsContract.weeklyHours != null ? `${detailsContract.weeklyHours} h` : "Non renseigné"} />
            <Detail label="Rémunération de référence" value={detailsContract.grossSalary != null ? `${new Intl.NumberFormat("fr-FR").format(detailsContract.grossSalary)} ${detailsContract.currency ?? "MGA"} · ${detailsContract.remunerationFrequency === "HOURLY" ? "par heure" : detailsContract.remunerationFrequency === "DAILY" ? "par jour" : "par mois"}` : "Non renseignée"} />
            <Detail label="Catégorie professionnelle" value={detailsContract.professionalCategory ?? "Non renseignée"} />
            <Detail label="Indice de classification" value={detailsContract.classificationIndex ?? "Non renseigné"} />
          </div>
          <section className="rounded-xl border border-[#E4EBE8]">
            <div className="border-b border-[#E4EBE8] px-4 py-3"><h3 className="text-sm font-bold text-[#152B3B]">Historique des modifications</h3></div>
            <div className="divide-y divide-[#E4EBE8]">
              {detailsContract.history?.length ? [...detailsContract.history].reverse().map((revision, index) => <article key={`${revision.changedAt}-${index}`} className="px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-semibold text-[#152B3B]">{new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(revision.changedAt))}</span><span className="text-xs text-[#71838D]">{revision.reason}</span></div>
                <ul className="mt-2 grid gap-1 text-xs text-[#536A76]">{revision.changes.map((change, changeIndex) => <li key={`${change.field}-${changeIndex}`}><span className="font-semibold">{contractFieldLabels[change.field] ?? change.field}</span>: {change.before ?? "—"} <span className="px-1 text-[#16775C]">→</span> {change.after ?? "—"}</li>)}</ul>
              </article>) : <p className="px-4 py-6 text-sm text-[#71838D]">Aucune modification enregistrée depuis sa création.</p>}
            </div>
          </section>
          <div className="flex justify-between gap-2"><div>{detailsContract.status !== "ENDED" && detailsContract.status !== "CANCELLED" && <Button variant="primary" onClick={() => { setEditingContract(detailsContract); setDetailsContract(null); }}>Modifier le contrat</Button>}</div><Button variant="outline" onClick={() => setDetailsContract(null)}>Fermer</Button></div>
        </div>}
      </Modal>
      <EditContractModal
        contract={editingContract}
        open={Boolean(editingContract)}
        onClose={() => setEditingContract(null)}
        onUpdated={() => setReloadKey((current) => current + 1)}
      />
      <Modal
        open={Boolean(pendingStatusChange)}
        title={pendingStatusChange?.status === "ENDED" ? "Terminer le contrat" : pendingStatusChange?.status === "CANCELLED" ? "Annuler le contrat" : "Modifier le statut du contrat"}
        description={pendingStatusChange?.contract.contractNumber}
        onClose={() => { if (!updatingContractId) setPendingStatusChange(null); }}
      >
        <div className="grid gap-4 px-5 py-5 sm:px-7">
          <p className="text-sm text-[#536A76]">Le changement sera daté et ajouté à l’historique du contrat.</p>
          <label className="grid gap-2 text-xs font-semibold text-[#536A76]">Motif obligatoire
            <textarea value={statusReason} maxLength={1000} minLength={3} rows={4} onChange={(event) => setStatusReason(event.target.value)} placeholder="Expliquez la raison du changement de statut…" className="w-full rounded-xl border border-[#DCE8E2] bg-white px-3 py-2.5 text-sm font-normal text-[#243F4E] outline-none focus:border-[#16775C] focus:ring-2 focus:ring-[#16775C]/15" />
          </label>
          {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        </div>
        <footer className="flex justify-end gap-2 border-t border-[#E4EBE8] bg-[#F7FAF9] px-5 py-4 sm:px-7">
          <Button variant="outline" disabled={Boolean(updatingContractId)} onClick={() => setPendingStatusChange(null)}>Annuler</Button>
          <Button loading={Boolean(updatingContractId)} disabled={!pendingStatusChange || statusReason.trim().length < 3} onClick={async () => {
            if (!pendingStatusChange) return;
            const succeeded = await changeStatus(pendingStatusChange.contract, pendingStatusChange.status, statusReason.trim());
            if (succeeded) setPendingStatusChange(null);
          }}>Confirmer</Button>
        </footer>
      </Modal>
    </div>
  );
}

const contractFieldLabels: Record<string, string> = {
  contractTypeId: "Type de contrat", startDate: "Date de début", endDate: "Date de fin",
  probationEndDate: "Fin de période d’essai", status: "Statut", weeklyHours: "Temps hebdomadaire",
  grossSalary: "Rémunération", currency: "Devise", remunerationFrequency: "Périodicité",
  professionalCategory: "Catégorie professionnelle", classificationIndex: "Indice de classification",
};

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-[#E4EBE8] bg-[#F7FAF9] px-3.5 py-3"><p className="text-[10px] font-bold uppercase tracking-wide text-[#71838D]">{label}</p><p className="mt-1 text-sm font-semibold text-[#152B3B]">{value}</p></div>;
}

function SummaryCard({ icon, value, label, tone }: { icon: ReactNode; value: number; label: string; tone: "blue" | "green" | "amber" | "slate" }) {
  const tones = { blue: "bg-blue-50 text-blue-600", green: "bg-emerald-50 text-emerald-600", amber: "bg-amber-50 text-amber-600", slate: "bg-slate-100 text-slate-600" };
  return <article className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>{icon}</span><div><p className="text-2xl font-bold text-slate-900">{value}</p><p className="text-xs text-slate-500">{label}</p></div></article>;
}
