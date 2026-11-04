"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Building2, BriefcaseBusiness, FileText, LoaderCircle, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { companyStructureApi, type CompanyStructureResource } from "@/API";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";

type StructureItem = {
  _id: string;
  code: string;
  name?: string;
  title?: string;
  label?: string;
  active: boolean;
  parentDepartmentId?: string | null;
  parentDepartmentName?: string | null;
  departmentId?: string;
  departmentName?: string | null;
  level?: number;
  requiresEndDate?: boolean;
  positionCount?: number;
  employeeCount?: number;
  childCount?: number;
  contractCount?: number;
};

type Field = { key: string; label: string; kind?: "text" | "number" | "select" | "checkbox"; required?: boolean; options?: Array<{ value: string; label: string }>; hint?: string };
type FormValues = Record<string, string | boolean | null>;

const config: Record<CompanyStructureResource, { title: string; singular: string; description: string; icon: ReactNode; fields: Field[]; columns: (edit: (item: StructureItem) => void, remove: (item: StructureItem) => void) => DataTableColumn<StructureItem>[] }> = {
  departments: {
    title: "Départements", singular: "département", description: "Organisez les équipes et les unités de votre entreprise.", icon: <Building2 className="h-5 w-5" />,
    fields: [
      { key: "code", label: "Code", required: true, hint: "Code unique, par exemple RH ou FIN." },
      { key: "name", label: "Nom du département", required: true },
      { key: "parentDepartmentId", label: "Département parent", kind: "select", options: [{ value: "", label: "Aucun département parent" }] },
      { key: "active", label: "Département actif", kind: "checkbox" },
    ],
    columns: (edit, remove) => [
      { id: "code", header: "Code", width: "120px", cell: (item) => <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{item.code}</span> },
      { id: "name", header: "Département", cell: (item) => <span className="font-medium text-slate-900">{item.name}</span> },
      { id: "parent", header: "Rattaché à", cell: (item) => item.parentDepartmentName ?? <span className="text-slate-400">Structure principale</span> },
      { id: "positions", header: "Postes", align: "center", cell: (item) => item.positionCount ?? 0 },
      { id: "employees", header: "Employés", align: "center", cell: (item) => item.employeeCount ?? 0 },
      { id: "status", header: "Statut", cell: (item) => <ActiveBadge active={item.active} /> },
      { id: "actions", header: "Actions", align: "right", cell: (item) => <RowActions item={item} edit={edit} remove={remove} /> },
    ],
  },
  positions: {
    title: "Postes", singular: "poste", description: "Définissez les fonctions et leur niveau hiérarchique dans chaque département.", icon: <BriefcaseBusiness className="h-5 w-5" />,
    fields: [
      { key: "code", label: "Code", required: true, hint: "Code unique du poste." },
      { key: "title", label: "Intitulé du poste", required: true },
      { key: "departmentId", label: "Département", kind: "select", required: true },
      { key: "level", label: "Niveau hiérarchique", kind: "number", required: true, hint: "1 correspond au niveau le plus élevé." },
      { key: "active", label: "Poste actif", kind: "checkbox" },
    ],
    columns: (edit, remove) => [
      { id: "code", header: "Code", width: "190px", cell: (item) => <code className="inline-flex whitespace-nowrap rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wide text-slate-700 shadow-sm">{item.code}</code> },
      { id: "title", header: "Poste", cell: (item) => <span className="font-medium text-slate-900">{item.title}</span> },
      { id: "department", header: "Département", cell: (item) => item.departmentName ? <span className="rounded-md bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700">{item.departmentName}</span> : "—" },
      { id: "level", header: "Niveau", align: "center", cell: (item) => <span className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">{item.level}</span> },
      { id: "employees", header: "Employés", align: "center", cell: (item) => item.employeeCount ?? 0 },
      { id: "status", header: "Statut", cell: (item) => <ActiveBadge active={item.active} /> },
      { id: "actions", header: "Actions", align: "right", cell: (item) => <RowActions item={item} edit={edit} remove={remove} /> },
    ],
  },
  "contract-types": {
    title: "Natures de contrat", singular: "nature de contrat", description: "Gérez les types de contrat proposés aux employés.", icon: <FileText className="h-5 w-5" />,
    fields: [
      { key: "code", label: "Code", required: true, hint: "Exemples : CDI, CDD, STAGE." },
      { key: "label", label: "Libellé", required: true },
      { key: "requiresEndDate", label: "Date de fin obligatoire", kind: "checkbox" },
      { key: "active", label: "Nature de contrat active", kind: "checkbox" },
    ],
    columns: (edit, remove) => [
      { id: "code", header: "Code", width: "120px", cell: (item) => <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">{item.code}</span> },
      { id: "label", header: "Nature de contrat", cell: (item) => <span className="font-medium text-slate-900">{item.label}</span> },
      { id: "endDate", header: "Date de fin", cell: (item) => item.requiresEndDate ? <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">Obligatoire</span> : <span className="text-slate-500">Facultative</span> },
      { id: "contracts", header: "Contrats", align: "center", cell: (item) => item.contractCount ?? 0 },
      { id: "status", header: "Statut", cell: (item) => <ActiveBadge active={item.active} /> },
      { id: "actions", header: "Actions", align: "right", cell: (item) => <RowActions item={item} edit={edit} remove={remove} /> },
    ],
  },
};

export function StructureCrudPage({ resource }: { resource: CompanyStructureResource }) {
  const router = useRouter();
  const pageConfig = config[resource];
  const itemLabel = resource === "departments" ? "département" : resource === "positions" ? "poste" : "nature de contrat";
  const createLabel = resource === "departments" ? "un département" : resource === "positions" ? "un poste" : "une nature de contrat";
  const searchLabel = resource === "departments" ? "un département" : resource === "positions" ? "un poste" : "une nature de contrat";
  const [items, setItems] = useState<StructureItem[]>([]);
  const [departments, setDepartments] = useState<Array<{ _id: string; name: string }>>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalItems: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StructureItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadItems = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (debouncedSearch) query.set("search", debouncedSearch);
      const response = await companyStructureApi.list(resource, query, signal);
      const result = await response.json().catch(() => null) as { data?: StructureItem[]; meta?: typeof pagination; message?: string } | null;
      if (!response.ok) throw new Error(result?.message ?? "Impossible de charger la liste.");
      setItems(result?.data ?? []);
      setPagination(result?.meta ?? { page, limit, totalItems: 0, totalPages: 1 });
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setError(cause instanceof Error ? cause.message : "Impossible de charger la liste.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, limit, page, resource]);

  useEffect(() => {
    const controller = new AbortController();
    void loadItems(controller.signal);
    return () => controller.abort();
  }, [loadItems]);

  useEffect(() => {
    if (resource !== "positions" && resource !== "departments") return;
    const controller = new AbortController();
    void companyStructureApi.list("departments", new URLSearchParams({ page: "1", limit: "100" }), controller.signal)
      .then(async (response) => {
        if (!response.ok) return;
        const result = await response.json() as { data?: Array<{ _id: string; name: string }> };
        setDepartments(result.data ?? []);
      }).catch(() => undefined);
    return () => controller.abort();
  }, [resource]);

  const formFields = useMemo(() => pageConfig.fields.map((field) => {
    if (field.key === "parentDepartmentId") return { ...field, options: [{ value: "", label: "Aucun département parent" }, ...departments.filter((item) => item._id !== editing?._id).map((item) => ({ value: item._id, label: item.name }))] };
    if (field.key === "departmentId") return { ...field, options: [{ value: "", label: "Choisir un département" }, ...departments.map((item) => ({ value: item._id, label: item.name }))] };
    return field;
  }), [departments, editing?._id, pageConfig.fields]);

  const closeModal = useCallback(() => { setModalOpen(false); setEditing(null); setFormError(""); }, []);
  const openCreate = () => { setEditing(null); setFormError(""); setModalOpen(true); };
  const openEdit = (item: StructureItem) => { setEditing(item); setFormError(""); setModalOpen(true); };

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setFormError("");
    const formData = new FormData(event.currentTarget);
    const payload: FormValues = {};
    for (const field of pageConfig.fields) {
      if (field.kind === "checkbox") payload[field.key] = formData.get(field.key) === "on";
      else if (field.kind === "number") payload[field.key] = Number(formData.get(field.key));
      else {
        const value = String(formData.get(field.key) ?? "").trim();
        payload[field.key] = field.key === "parentDepartmentId" && !value ? null : field.kind === "select" && !value ? "" : value;
      }
    }
    try {
      const response = editing
        ? await companyStructureApi.update(resource, editing._id, payload)
        : await companyStructureApi.create(resource, payload);
      const data = await response.json().catch(() => null) as { message?: string } | null;
      if (!response.ok) throw new Error(data?.message ?? "L’enregistrement a échoué.");
      closeModal();
      await loadItems();
      router.refresh();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : "L’enregistrement a échoué.");
    } finally { setSaving(false); }
  }

  async function remove(item: StructureItem) {
    const label = item.name ?? item.title ?? item.label ?? item.code;
    if (!window.confirm(`Supprimer « ${label} » ?`)) return;
    setError("");
    try {
      const response = await companyStructureApi.remove(resource, item._id);
      const data = await response.json().catch(() => null) as { message?: string } | null;
      if (!response.ok) throw new Error(data?.message ?? "La suppression a échoué.");
      if (items.length === 1 && page > 1) setPage((current) => current - 1);
      else await loadItems();
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "La suppression a échoué."); }
  }

  const columns = pageConfig.columns(openEdit, remove);
  const activeCount = items.filter(({ active }) => active).length;
  const relatedCount = items.reduce((total, item) => total + (item.employeeCount ?? item.contractCount ?? 0), 0);

  return (
    <div className="flex h-full min-h-0 flex-col p-5 lg:p-7">
      <header className="mb-5 shrink-0">
        <p className="text-xs text-app-muted">Aperçu <span className="mx-2">›</span> Structure de l’entreprise <span className="mx-2">›</span> {pageConfig.title}</p>
        <h1 className="mt-2 text-2xl font-bold text-app-text">{pageConfig.title}</h1>
        <p className="mt-1 text-sm text-app-muted">{pageConfig.description}</p>
      </header>

      <section className="mb-4 grid shrink-0 gap-3 sm:grid-cols-3">
        <StatCard icon={pageConfig.icon} value={pagination.totalItems} label={`Total ${pageConfig.title.toLowerCase()}`} color="emerald" />
        <StatCard icon={<Building2 className="h-5 w-5" />} value={activeCount} label="Actifs sur cette page" color="blue" />
        <StatCard icon={<BriefcaseBusiness className="h-5 w-5" />} value={relatedCount} label={resource === "contract-types" ? "Contrats associés" : "Employés associés"} color="violet" />
      </section>

      <div className="mb-3 flex shrink-0 flex-col gap-3 rounded-xl border border-slate-100 bg-white p-3 sm:flex-row sm:items-center">
        <label className="relative block sm:w-[min(420px,55%)]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={`Rechercher ${searchLabel}...`} className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-app-primary focus:ring-2 focus:ring-blue-100" />
        </label>
        <Button className="ml-auto" onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>Ajouter {createLabel}</Button>
      </div>

      {error && <div className="mb-3 shrink-0 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <div className="min-h-0 flex-1">
        <DataTable<StructureItem> title={pageConfig.title} compact data={items} columns={columns} getRowId={(item) => item._id} pagination={pagination} loading={loading} tableHeight={520} pageSizeOptions={[10, 15, 20, 50]} onPageChange={setPage} onPageSizeChange={(size) => { setLimit(size); setPage(1); }} emptyMessage={`Aucun ${pageConfig.singular} trouvé.`} />
      </div>

      <Modal open={modalOpen} onClose={closeModal} title={`${editing ? "Modifier" : "Ajouter"} ${editing ? `le ${itemLabel}` : createLabel}`} description="Renseignez les informations nécessaires à la structure de votre entreprise.">
        <form onSubmit={save} className="flex min-h-0 flex-col">
          <div className="space-y-4 overflow-y-auto px-5 py-5 sm:px-7">
            {formFields.map((field) => <FormField key={field.key} field={field} value={editing?.[field.key as keyof StructureItem]} />)}
            {formError && <p role="alert" className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-7">
            <button type="button" onClick={closeModal} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Annuler</button>
            <Button type="submit" disabled={saving} leftIcon={saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : undefined}>{saving ? "Enregistrement..." : editing ? "Enregistrer" : "Créer"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function FormField({ field, value }: { field: Field; value: unknown }) {
  if (field.kind === "checkbox") return <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700"><input name={field.key} type="checkbox" defaultChecked={typeof value === "boolean" ? value : field.key === "active"} className="h-4 w-4 accent-emerald-600" />{field.label}</label>;
  return <label className="block text-sm font-medium text-slate-700">{field.label}
    {field.kind === "select" ? <select name={field.key} required={field.required} defaultValue={typeof value === "string" ? value : ""} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-app-primary focus:ring-2 focus:ring-blue-100">{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> :
      <input name={field.key} type={field.kind === "number" ? "number" : "text"} min={field.kind === "number" ? 1 : undefined} max={field.kind === "number" ? 20 : undefined} required={field.required} defaultValue={value == null ? field.key === "level" ? 1 : "" : String(value)} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-app-primary focus:ring-2 focus:ring-blue-100" />}
    {field.hint && <span className="mt-1 block text-xs font-normal text-slate-500">{field.hint}</span>}
  </label>;
}

function ActiveBadge({ active }: { active: boolean }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{active ? "Actif" : "Inactif"}</span>;
}

function RowActions({ item, edit, remove }: { item: StructureItem; edit: (item: StructureItem) => void; remove: (item: StructureItem) => void }) {
  return <div className="flex justify-end gap-1"><button type="button" onClick={() => edit(item)} aria-label="Modifier" title="Modifier" className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700"><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => remove(item)} aria-label="Supprimer" title="Supprimer" className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-700"><Trash2 className="h-4 w-4" /></button></div>;
}

function StatCard({ icon, value, label, color }: { icon: ReactNode; value: number; label: string; color: "emerald" | "blue" | "violet" }) {
  const colors = { emerald: "bg-emerald-50 text-emerald-600", blue: "bg-blue-50 text-blue-600", violet: "bg-violet-50 text-violet-600" };
  return <div className="flex min-h-[72px] items-center gap-3 rounded-xl border border-slate-100 bg-white px-4"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[color]}`}>{icon}</span><span><strong className="block text-lg leading-5 text-slate-900">{value}</strong><span className="text-xs text-slate-500">{label}</span></span></div>;
}
