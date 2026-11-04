"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Clock3, FileUp, PencilLine, RefreshCw, Search, Trash2 } from "lucide-react";

import { attendancesApi } from "@/API/attendances.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";

type AttendanceRecord = {
  _id: string;
  type: "ENTER" | "EXIT";
  punchedAt: string;
  checkpointNumber: number;
  source: "BACK_OFFICE" | "EMPLOYEE_PORTAL" | "DEVICE_IMPORT";
  revisions: Array<{ reason: string; changedAt: string }>;
  voidedAt: string | null;
  voidReason: string | null;
  employee: {
    fullName: string;
    badgeNumber: string;
  } | null;
};

type AttendanceResponse = {
  data: AttendanceRecord[];
  meta: { page: number; limit: number; totalItems: number; totalPages: number };
  message?: string | string[];
};

type DialogMode = "CORRECT" | "VOID" | null;

type ImportResponse = {
  imported: number;
  duplicates: number;
  rejected: Array<{ row: number; sourceEventId: string; reason: string }>;
  message?: string | string[];
};

const SOURCE_LABELS = {
  BACK_OFFICE: "Saisie RH",
  EMPLOYEE_PORTAL: "Portail employé",
  DEVICE_IMPORT: "Import badgeuse",
} as const;

function localInputDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 16);
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function AttendanceRecords({ refreshKey = 0 }: { refreshKey?: number }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [type, setType] = useState<"" | "ENTER" | "EXIT">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [includeVoided, setIncludeVoided] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [selected, setSelected] = useState<AttendanceRecord | null>(null);
  const [correctionTime, setCorrectionTime] = useState("");
  const [correctionType, setCorrectionType] = useState<"ENTER" | "EXIT">("ENTER");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [importing, setImporting] = useState(false);
  const [importReport, setImportReport] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const load = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (type) params.set("type", type);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (includeVoided) params.set("includeVoided", "true");
    try {
      const response = await attendancesApi.list(params, signal);
      const result = await response.json().catch(() => null) as AttendanceResponse | null;
      if (!response.ok || !result || !Array.isArray(result.data)) {
        throw new Error(Array.isArray(result?.message) ? result.message.join(", ") : result?.message ?? "Impossible de charger les pointages.");
      }
      setRecords(result.data);
      setTotalItems(result.meta?.totalItems ?? 0);
      setTotalPages(result.meta?.totalPages ?? 1);
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setRecords([]);
      setError(cause instanceof Error ? cause.message : "Impossible de charger les pointages.");
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [dateFrom, dateTo, debouncedSearch, includeVoided, limit, page, reloadToken, refreshKey, type]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const pageLabel = useMemo(() => {
    if (!totalItems) return "Aucun pointage";
    const first = (page - 1) * limit + 1;
    return `Affichage de ${first} à ${Math.min(page * limit, totalItems)} sur ${totalItems} pointages`;
  }, [limit, page, totalItems]);

  function resetPageAndRefresh() {
    setPage(1);
    setReloadToken((current) => current + 1);
  }

  function openDialog(record: AttendanceRecord, mode: Exclude<DialogMode, null>) {
    setSelected(record);
    setDialogMode(mode);
    setReason("");
    setCorrectionTime(localInputDateTime(record.punchedAt));
    setCorrectionType(record.type);
  }

  async function submitDialog() {
    if (!selected || reason.trim().length < 3) return;
    setSaving(true);
    setError("");
    try {
      const response = dialogMode === "CORRECT"
        ? await attendancesApi.correct(selected._id, {
            reason: reason.trim(),
            punchedAt: new Date(correctionTime).toISOString(),
            type: correctionType,
          })
        : await attendancesApi.void(selected._id, { reason: reason.trim() });
      const result = await response.json().catch(() => null) as { message?: string | string[] } | null;
      if (!response.ok) {
        throw new Error(Array.isArray(result?.message) ? result.message.join(", ") : result?.message ?? "La modification du pointage a échoué.");
      }
      setDialogMode(null);
      setSelected(null);
      setReloadToken((current) => current + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "La modification du pointage a échoué.");
    } finally {
      setSaving(false);
    }
  }

  async function importCsv(file?: File) {
    if (!file) return;
    setImporting(true);
    setError("");
    setImportReport("");
    try {
      const events = parseAttendanceCsv(await file.text());
      const response = await attendancesApi.import({ events });
      const result = await response.json().catch(() => null) as ImportResponse | null;
      if (!response.ok || !result) {
        throw new Error(Array.isArray(result?.message) ? result.message.join(", ") : result?.message ?? "L’import des pointages a échoué.");
      }
      setImportReport(`${result.imported} importé(s), ${result.duplicates} doublon(s) ignoré(s), ${result.rejected.length} ligne(s) rejetée(s).`);
      setReloadToken((current) => current + 1);
      if (result.rejected.length) {
        setError(result.rejected.slice(0, 5).map((item) => `Ligne ${item.row} : ${item.reason}`).join(" "));
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "L’import des pointages a échoué.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-[#E4EBE8] bg-white shadow-[0_8px_26px_rgba(21,43,59,0.04)]">
      <div className="flex flex-col gap-4 border-b border-[#E4EBE8] p-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[#16775C]">
            <Clock3 className="h-4 w-4" />
            <span className="text-[11px] font-bold uppercase tracking-[0.14em]">Journal</span>
          </div>
          <h2 className="mt-1 text-lg font-bold text-[#152B3B]">Pointages récents</h2>
          <p className="mt-1 text-xs text-[#71838D]">Les corrections et annulations restent historisées.</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => void importCsv(event.target.files?.[0])} />
          <Button variant="outline" loading={importing} onClick={() => fileInputRef.current?.click()} leftIcon={<FileUp className="h-4 w-4" />}>
            Importer un CSV
          </Button>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1.5fr)_140px_150px_150px]">
          <label className="relative sm:col-span-2 xl:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} placeholder="Employé ou matricule" className="pl-9" onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
          </label>
          <Select value={type} onChange={(event) => { setType(event.target.value as typeof type); setPage(1); }}>
            <option value="">Entrées et sorties</option>
            <option value="ENTER">Entrées</option>
            <option value="EXIT">Sorties</option>
          </Select>
          <Input type="date" aria-label="Date de début" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setPage(1); }} />
          <Input type="date" aria-label="Date de fin" value={dateTo} onChange={(event) => { setDateTo(event.target.value); setPage(1); }} />
        </div>
      </div>

      {importReport && <p role="status" className="mx-5 mt-4 rounded-xl border border-[#CFE5D9] bg-[#F1F8F4] px-4 py-3 text-sm text-[#16775C]">{importReport} Format attendu : sourceEventId, badgeNumber, type, punchedAt, checkpointNumber.</p>}

      <label className="flex items-center gap-2 border-b border-[#E4EBE8] px-5 py-3 text-xs font-medium text-[#647783]">
        <input type="checkbox" checked={includeVoided} onChange={(event) => { setIncludeVoided(event.target.checked); setPage(1); }} className="h-4 w-4 accent-[#16775C]" />
        Inclure les pointages annulés
      </label>

      {error && <p role="alert" className="mx-5 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[840px] border-collapse text-left">
          <thead className="bg-[#F7FAF9] text-[10px] font-bold uppercase tracking-[0.12em] text-[#71838D]">
            <tr>
              <th className="px-5 py-3">Employé</th>
              <th className="px-4 py-3">Événement</th>
              <th className="px-4 py-3">Date et heure</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Historique</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EDF1EF]">
            {records.map((record) => (
              <tr key={record._id} className="text-sm hover:bg-[#FCFDFD]">
                <td className="px-5 py-3.5">
                  <p className="font-semibold text-[#243F4E]">{record.employee?.fullName ?? "Employé introuvable"}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-[#84949E]">{record.employee?.badgeNumber ?? "—"}</p>
                </td>
                <td className="px-4 py-3.5">
                  <span className={record.type === "ENTER" ? "inline-flex items-center gap-1.5 rounded-full bg-[#EAF5F1] px-2.5 py-1 text-xs font-semibold text-[#16775C]" : "inline-flex items-center gap-1.5 rounded-full bg-[#F1F5F4] px-2.5 py-1 text-xs font-semibold text-[#536A76]"}>
                    {record.type === "ENTER" ? <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUp className="h-3.5 w-3.5" />}
                    {record.type === "ENTER" ? "Entrée" : "Sortie"}
                  </span>
                  {record.voidedAt && <span className="ml-2 rounded-full bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-700">Annulé</span>}
                </td>
                <td className="px-4 py-3.5 text-[#536A76]">{formatDateTime(record.punchedAt)}</td>
                <td className="px-4 py-3.5 text-xs text-[#71838D]">{SOURCE_LABELS[record.source] ?? record.source}</td>
                <td className="px-4 py-3.5 text-xs text-[#71838D]">
                  {record.revisions?.length ? `${record.revisions.length} correction(s)` : record.voidReason ? record.voidReason : "—"}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex justify-end gap-1.5">
                    {!record.voidedAt && (
                      <>
                        <IconAction label="Corriger" onClick={() => openDialog(record, "CORRECT")}><PencilLine className="h-4 w-4" /></IconAction>
                        <IconAction label="Annuler le pointage" onClick={() => openDialog(record, "VOID")}><Trash2 className="h-4 w-4" /></IconAction>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && records.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-14 text-center text-sm text-[#71838D]">Aucun pointage ne correspond aux filtres.</td></tr>
            )}
            {loading && <tr><td colSpan={6} className="px-5 py-14 text-center text-sm text-[#71838D]">Chargement des pointages…</td></tr>}
          </tbody>
        </table>
      </div>

      <footer className="flex flex-col gap-3 border-t border-[#E4EBE8] px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-[#71838D]">{pageLabel}</p>
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)} leftIcon={<ChevronLeft className="h-4 w-4" />}>Précédent</Button>
          <span className="min-w-16 text-center text-xs font-semibold text-[#536A76]">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage((current) => current + 1)} rightIcon={<ChevronRight className="h-4 w-4" />}>Suivant</Button>
          <Button variant="ghost" size="icon" aria-label="Actualiser" disabled={loading} onClick={resetPageAndRefresh}><RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} /></Button>
        </div>
      </footer>

      <Modal
        open={dialogMode !== null}
        title={dialogMode === "CORRECT" ? "Corriger un pointage" : "Annuler un pointage"}
        description={selected?.employee?.fullName}
        onClose={() => { if (!saving) setDialogMode(null); }}
      >
        <div className="grid gap-4 px-5 py-5 sm:px-7">
          {dialogMode === "CORRECT" && (
            <>
              <label className="grid gap-2 text-xs font-semibold text-[#536A76]">
                Type d’événement
                <Select value={correctionType} onChange={(event) => setCorrectionType(event.target.value as "ENTER" | "EXIT")}>
                  <option value="ENTER">Entrée</option><option value="EXIT">Sortie</option>
                </Select>
              </label>
              <label className="grid gap-2 text-xs font-semibold text-[#536A76]">
                Date et heure corrigées
                <Input type="datetime-local" required value={correctionTime} onChange={(event) => setCorrectionTime(event.target.value)} />
              </label>
            </>
          )}
          <label className="grid gap-2 text-xs font-semibold text-[#536A76]">
            Motif obligatoire
            <textarea value={reason} maxLength={1000} rows={4} onChange={(event) => setReason(event.target.value)} placeholder="Expliquez la raison de cette modification…" className="w-full rounded-xl border border-[#DCE8E2] bg-white px-3 py-2.5 text-sm font-normal text-[#243F4E] outline-none focus:border-[#16775C] focus:ring-2 focus:ring-[#16775C]/15" />
          </label>
          {dialogMode === "VOID" && <p className="text-xs leading-5 text-[#71838D]">L’événement restera dans l’historique, marqué comme annulé. Il ne sera plus utilisé dans les calculs de présence.</p>}
        </div>
        <footer className="flex justify-end gap-2 border-t border-[#E4EBE8] bg-[#F7FAF9] px-5 py-4 sm:px-7">
          <Button variant="outline" disabled={saving} onClick={() => setDialogMode(null)}>Retour</Button>
          <Button variant={dialogMode === "VOID" ? "danger" : "primary"} loading={saving} disabled={reason.trim().length < 3 || (dialogMode === "CORRECT" && !correctionTime)} onClick={() => void submitDialog()}>
            {dialogMode === "CORRECT" ? "Enregistrer la correction" : "Annuler le pointage"}
          </Button>
        </footer>
      </Modal>
    </section>
  );
}

function parseAttendanceCsv(content: string): Array<{
  sourceEventId: string;
  badgeNumber: string;
  type: "ENTER" | "EXIT";
  punchedAt: string;
  checkpointNumber?: number;
}> {
  const lines = content.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error("Le fichier CSV ne contient aucune ligne de pointage.");

  const delimiter = detectCsvDelimiter(lines[0]);
  const headers = parseCsvLine(lines[0], delimiter).map((header) => header.trim().toLowerCase().replace(/[ _-]/g, ""));
  const findIndex = (...names: string[]) => headers.findIndex((header) => names.includes(header));
  const eventIdIndex = findIndex("sourceeventid", "eventid", "id");
  const badgeIndex = findIndex("badgenumber", "badge", "matricule");
  const typeIndex = findIndex("type", "eventtype");
  const punchedAtIndex = findIndex("punchedat", "datetime", "timestamp", "dateheure");
  const checkpointIndex = findIndex("checkpointnumber", "checkpoint", "terminal");
  if (eventIdIndex < 0 || badgeIndex < 0 || typeIndex < 0 || punchedAtIndex < 0) {
    throw new Error("Colonnes CSV requises : sourceEventId, badgeNumber, type et punchedAt.");
  }

  return lines.slice(1).map((line, index) => {
    const cells = parseCsvLine(line, delimiter);
    const type = cells[typeIndex]?.trim().toUpperCase();
    const parsedDate = new Date(cells[punchedAtIndex]?.trim() ?? "");
    if (type !== "ENTER" && type !== "EXIT") throw new Error(`Ligne ${index + 2} : le type doit être ENTER ou EXIT.`);
    if (Number.isNaN(parsedDate.getTime())) throw new Error(`Ligne ${index + 2} : date et heure invalides.`);
    const checkpointNumber = checkpointIndex >= 0 ? Number(cells[checkpointIndex]) : undefined;
    return {
      sourceEventId: cells[eventIdIndex]?.trim() ?? "",
      badgeNumber: cells[badgeIndex]?.trim().toUpperCase() ?? "",
      type,
      punchedAt: parsedDate.toISOString(),
      ...(checkpointNumber && Number.isInteger(checkpointNumber) ? { checkpointNumber } : {}),
    };
  });
}

function detectCsvDelimiter(header: string): string {
  const candidates = [",", ";", "\t"];
  return candidates.reduce((best, candidate) => {
    const count = parseCsvLine(header, candidate).length;
    return count > parseCsvLine(header, best).length ? candidate : best;
  }, ",");
}

function parseCsvLine(line: string, delimiter = ","): string[] {
  const cells: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"' && quoted) {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      cells.push(value);
      value = "";
    } else {
      value += char;
    }
  }
  cells.push(value);
  return cells;
}

function IconAction({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E4EBE8] bg-white text-[#71838D] transition hover:border-[#B9D6C9] hover:bg-[#EAF5F1] hover:text-[#16775C]">
      {children}
    </button>
  );
}
