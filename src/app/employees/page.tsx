"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import {
  Building2,
  Download,
  IdCard,
  Mail,
  Phone,
  UserCheck,
  UserRound,
  UsersRound,
} from "lucide-react";

import { Filter, Plus, Search, X } from "lucide-react";
import { employeesApi } from "@/API";
import { Button } from "@/components/ui/button";
import { CreateEmployeeModal } from "@/components/employees/create-employee-modal";

import {
  DataTable,
  type DataTableColumn,
  type DataTablePagination,
  type DataTableSort,
} from "@/components/ui/data-table";

import {
  StatusBadge,
  type StatusBadgeVariant,
} from "@/components/ui/status-badge";

type EmployeeStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DEPARTED";

type Employee = {
  _id: string;

  badgeNumber: string;

  firstName: string;

  lastName: string;

  fullName: string;

  email: string;

  phone?: string | null;

  profilePictureUrl?: string | null;

  departmentId?: string | null;

  positionId?: string | null;

  departmentName?: string | null;

  contractTypeLabel?: string | null;

  contractTypeCode?: string | null;

  managerId?: string | null;

  hireDate?: string | null;

  status: EmployeeStatus;

  createdAt: string;

  updatedAt: string;
};

type EmployeesApiResponse = {
  data: Employee[];

  meta: DataTablePagination;
};

type ApiErrorResponse = {
  message?: string | string[];
};

const initialPagination: DataTablePagination = {
  page: 1,
  limit: 10,
  totalItems: 0,
  totalPages: 1,
};

const statusVariants: Record<EmployeeStatus, StatusBadgeVariant> = {
  ACTIVE: "success",

  INACTIVE: "neutral",

  SUSPENDED: "warning",

  DEPARTED: "danger",
};

const statusLabels: Record<EmployeeStatus, string> = {
  ACTIVE: "Actif",

  INACTIVE: "Inactif",

  SUSPENDED: "Suspendu",

  DEPARTED: "Parti",
};

function getApiErrorMessage(data: ApiErrorResponse | null): string {
  if (Array.isArray(data?.message)) {
    return data.message.join(", ");
  }

  return data?.message ?? "Impossible de charger les employés.";
}

function getInitials(firstName: string, lastName: string): string {
  const firstInitial = firstName?.charAt(0) ?? "";

  const lastInitial = lastName?.charAt(0) ?? "";

  return `${firstInitial}${lastInitial}`.toUpperCase();
}

function formatMadagascarPhone(phone?: string | null): string {
  if (!phone) return "—";

  const digits = phone.replace(/\D/g, "");
  const nationalNumber = digits.startsWith("261")
    ? digits.slice(3)
    : digits.startsWith("0")
      ? digits.slice(1)
      : digits;

  if (nationalNumber.length !== 9) return phone;

  return `+261 ${nationalNumber.slice(0, 2)} ${nationalNumber.slice(2, 4)} ${nationalNumber.slice(4, 7)} ${nationalNumber.slice(7)}`;
}

function getContractTypeBadge(employee: Employee): { label: string; className: string } | null {
  const rawType = employee.contractTypeCode || employee.contractTypeLabel;
  if (!rawType) return null;

  const normalizedType = rawType
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalizedType.includes("cdi") || normalizedType.includes("indetermine")) {
    return { label: "CDI", className: "bg-emerald-50 text-emerald-700" };
  }
  if (normalizedType.includes("cdd") || normalizedType.includes("determine")) {
    return { label: "CDD", className: "bg-blue-50 text-blue-700" };
  }
  if (normalizedType.includes("stage") || normalizedType.includes("stagiaire")) {
    return { label: "Stagiaire", className: "bg-orange-50 text-orange-700" };
  }
  if (normalizedType.includes("alternance") || normalizedType.includes("apprentissage")) {
    return { label: "Alternance", className: "bg-amber-50 text-amber-700" };
  }

  return {
    label: employee.contractTypeLabel || employee.contractTypeCode || "Autre",
    className: "bg-slate-100 text-slate-700",
  };
}

function getDepartmentBadgeClass(departmentName: string): string {
  const colors = [
    "bg-sky-50 text-sky-700",
    "bg-emerald-50 text-emerald-700",
    "bg-violet-50 text-violet-700",
    "bg-cyan-50 text-cyan-700",
    "bg-indigo-50 text-indigo-700",
    "bg-teal-50 text-teal-700",
    "bg-blue-50 text-blue-700",
  ];
  const hash = [...departmentName].reduce((value, character) => value + character.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export default function EmployeesPage() {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [employees, setEmployees] = useState<Employee[]>([]);

  const [pagination, setPagination] =
    useState<DataTablePagination>(initialPagination);

  const [page, setPage] = useState(1);

  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<EmployeeStatus[]>([]);
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([]);
  const [selectedContractTypeIds, setSelectedContractTypeIds] = useState<string[]>([]);
  const [departments, setDepartments] = useState<Array<{ _id: string; name: string }>>([]);
  const [contractTypes, setContractTypes] = useState<Array<{ _id: string; code: string; label: string }>>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  /*
   * Tri backend.
   *
   * Par défaut :
   * les plus récents en premier.
   */
  const [sort, setSort] = useState<DataTableSort>({
    key: "createdAt",
    direction: "desc",
  });

  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void employeesApi.creationOptions(controller.signal).then(async (response) => {
      if (!response.ok) return;
      const data = (await response.json().catch(() => null)) as {
        departments?: Array<{ _id: string; name: string }>;
        contractTypes?: Array<{ _id: string; code: string; label: string }>;
      } | null;
      setDepartments(data?.departments ?? []);
      setContractTypes(data?.contractTypes ?? []);
    }).catch(() => undefined);
    return () => controller.abort();
  }, []);

  const columns = useMemo<DataTableColumn<Employee>[]>(
    () => [
      {
        id: "badgeNumber",

        header: "Matricule",

        width: "155px",

        sortable: true,

        sortKey: "badgeNumber",

        cell: (employee) => (
          <div className="flex items-center gap-2">
            <div
              className={[
                "flex h-8 w-8",
                "shrink-0",
                "items-center",
                "justify-center",
                "rounded-lg",
                "bg-blue-50",
                "text-blue-500",
              ].join(" ")}
            >
              <IdCard className="h-4 w-4" strokeWidth={1.8} />
            </div>

            <span className="font-medium text-slate-800">
              {employee.badgeNumber}
            </span>
          </div>
        ),
      },

      {
        id: "employee",

        header: "Nom & prénom",

        width: "260px",

        sortable: true,

        /*
         * On trie sur lastName
         * côté backend.
         */
        sortKey: "lastName",

        cell: (employee) => (
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={[
                "flex h-9 w-9",
                "shrink-0",
                "items-center",
                "justify-center",
                "overflow-hidden",
                "rounded-full",
                "bg-emerald-50",
                "text-[11px]",
                "font-bold",
                "text-emerald-600",
              ].join(" ")}
            >
              {employee.profilePictureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={employee.profilePictureUrl}
                  alt={employee.fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                getInitials(employee.firstName, employee.lastName)
              )}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {employee.fullName}
              </p>

              <p className="mt-0.5 truncate text-[11px] text-slate-400">
                {employee.firstName}
              </p>
            </div>
          </div>
        ),
      },

      {
        id: "phone",

        header: "Téléphone",

        width: "190px",

        sortable: true,

        sortKey: "phone",

        cell: (employee) => (
          <div className="flex items-center gap-2 text-slate-600">
            <Phone
              className="h-4 w-4 shrink-0 text-slate-400"
              strokeWidth={1.8}
            />

            <span className="text-sm">{formatMadagascarPhone(employee.phone)}</span>
          </div>
        ),
      },

      {
        id: "email",

        header: "E-mail",

        width: "260px",

        sortable: true,

        sortKey: "email",

        cell: (employee) => (
          <div className="flex min-w-0 items-center gap-2">
            <Mail
              className="h-4 w-4 shrink-0 text-blue-500"
              strokeWidth={1.8}
            />

            <span className="truncate text-sm text-blue-600">
              {employee.email}
            </span>
          </div>
        ),
      },

      {
        id: "department",
        header: "Département",
        width: "180px",
        cell: (employee) => {
          const departmentName = employee.departmentName ?? departments.find((department) => department._id === employee.departmentId)?.name;
          return departmentName ? (
            <span className={`inline-flex max-w-full truncate rounded-md px-2 py-1 text-[11px] font-semibold ${getDepartmentBadgeClass(departmentName)}`}>
              {departmentName}
            </span>
          ) : <span className="text-xs text-slate-400">—</span>;
        },
      },
      {
        id: "contractType",
        header: "Type de contrat",
        width: "150px",
        cell: (employee) => {
          const contractType = getContractTypeBadge(employee);
          return (
            <div className="flex items-center gap-2">
              {contractType ? (
                <span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${contractType.className}`}>
                  {contractType.label}
                </span>
              ) : <span className="text-xs text-slate-400">—</span>}
            </div>
          );
        },
      },

      {
        id: "status",

        header: "Statut",

        width: "140px",

        sortable: true,

        sortKey: "status",

        cell: (employee) => (
          <StatusBadge variant={statusVariants[employee.status]} dot>
            {statusLabels[employee.status]}
          </StatusBadge>
        ),
      },
    ],
    [departments],
  );

  const loadEmployees = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);

      setErrorMessage("");

      try {
        const searchParams = new URLSearchParams({
          page: String(page),

          limit: String(limit),

          sortBy: sort.key,

          sortOrder: sort.direction,
        });
        if (search.trim()) searchParams.set("search", search.trim());
        if (selectedStatuses.length) searchParams.set("status", selectedStatuses.join(","));
        if (selectedDepartmentIds.length) searchParams.set("departmentId", selectedDepartmentIds.join(","));
        if (selectedContractTypeIds.length) searchParams.set("contractTypeId", selectedContractTypeIds.join(","));

        /*
         * Exemple :
         *
         * /api/employees
         * ?page=1
         * &limit=10
         * &sortBy=hireDate
         * &sortOrder=asc
         */
        const response = await fetch(
          `/api/employees?${searchParams.toString()}`,
          {
            method: "GET",

            cache: "no-store",

            signal,
          },
        );

        const data = (await response.json().catch(() => null)) as
          | EmployeesApiResponse
          | ApiErrorResponse
          | null;

        if (!response.ok) {
          throw new Error(getApiErrorMessage(data as ApiErrorResponse | null));
        }

        if (
          !data ||
          !("data" in data) ||
          !Array.isArray(data.data) ||
          !data.meta
        ) {
          throw new Error("La réponse du serveur est invalide.");
        }

        setEmployees(data.data);

        setPagination(data.meta);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setEmployees([]);

        setPagination({
          page,

          limit,

          totalItems: 0,

          totalPages: 1,
        });

        setErrorMessage(
          error instanceof Error ? error.message : "Une erreur est survenue.",
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [page, limit, sort, search, selectedStatuses, selectedDepartmentIds, selectedContractTypeIds],
  );

  useEffect(() => {
    const controller = new AbortController();

    void loadEmployees(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadEmployees]);

  const currentPageActiveEmployees = useMemo(
    () => employees.filter((employee) => employee.status === "ACTIVE").length,
    [employees],
  );

  const currentPageNewEmployees = useMemo(() => {
    const now = new Date();

    return employees.filter((employee) => {
      const hireDate = new Date(employee.hireDate ?? "");

      if (Number.isNaN(hireDate.getTime())) {
        return false;
      }

      return (
        hireDate.getMonth() === now.getMonth() &&
        hireDate.getFullYear() === now.getFullYear()
      );
    }).length;
  }, [employees]);

  function exportEmployeesCsv() {
    const rows = [
      ["Matricule", "Nom", "Téléphone", "E-mail", "Date d'embauche", "Statut"],
      ...employees.map((employee) => [employee.badgeNumber, employee.fullName, employee.phone ?? "", employee.email, employee.hireDate ?? "", statusLabels[employee.status]]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "employes.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex h-full min-h-0 flex-col p-5 lg:p-7">
      <header className="mb-5 shrink-0">
        <p className="w-full text-xs text-app-muted">
          Aperçu
          <span className="mx-2">›</span>
          Employés
        </p>

        <div>
          <h1 className="mt-2 text-2xl font-bold text-app-text">Employés</h1>
          <p className="mt-1 text-sm text-app-muted">Consultez et gérez les membres de votre équipe.</p>
        </div>
      </header>

      <section className="mb-4 grid shrink-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<UsersRound className="h-5 w-5" />}
          value={pagination.totalItems}
          label="Effectif total"
          variant="green"
        />

        <StatCard
          icon={<UserCheck className="h-5 w-5" />}
          value={currentPageActiveEmployees}
          label="Actifs sur cette page"
          variant="blue"
        />

        <StatCard
          icon={<UserRound className="h-5 w-5" />}
          value={currentPageNewEmployees}
          label="Embauches ce mois sur cette page"
          variant="purple"
        />

        <StatCard
          icon={<Building2 className="h-5 w-5" />}
          value={departments.length}
          label="Départements actifs"
          variant="blue"
        />
      </section>

      <div className="mb-3 flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-3 sm:flex-row sm:items-center">
          <label className="relative block sm:w-[min(420px,45%)]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Rechercher un employé..." className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-app-primary focus:ring-2 focus:ring-blue-100" />
          </label>
          <div className="ml-auto flex items-center gap-2">
          <button type="button" onClick={exportEmployeesCsv} disabled={!isHydrated || employees.length === 0} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"><Download className="h-3.5 w-3.5" />Exporter</button>
          <div className="relative">
            <button type="button" onClick={() => setFiltersOpen((open) => !open)} aria-expanded={filtersOpen} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:w-auto">
              <Filter className="h-4 w-4" /> Filtres
              {(selectedStatuses.length + selectedDepartmentIds.length + selectedContractTypeIds.length) > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-50 px-1 text-[11px] font-semibold text-emerald-700">{selectedStatuses.length + selectedDepartmentIds.length + selectedContractTypeIds.length}</span>}
            </button>
            {filtersOpen && <div className="absolute right-0 z-30 mt-2 flex max-h-[min(78vh,560px)] w-[min(760px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
              <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="text-sm font-semibold text-slate-900">Filtres employés</h2><p className="mt-0.5 text-xs text-slate-500">Affinez la liste selon le statut, le département ou le contrat.</p></div><button type="button" onClick={() => setFiltersOpen(false)} aria-label="Fermer les filtres" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><X className="h-4 w-4" /></button></div>
              <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-5 md:grid-cols-3 md:gap-0">
              <fieldset className="min-w-0 md:pr-5"><legend className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Statut</legend><div className="grid grid-cols-2 gap-1">
                {Object.entries(statusLabels).map(([value, label]) => <label key={value} className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"><input type="checkbox" checked={selectedStatuses.includes(value as EmployeeStatus)} onChange={(event) => { setSelectedStatuses((current) => event.target.checked ? [...current, value as EmployeeStatus] : current.filter((item) => item !== value)); setPage(1); }} className="h-4 w-4 rounded border-slate-300 accent-emerald-600" />{label}</label>)}
              </div></fieldset>
              <fieldset className="min-w-0 border-t border-slate-100 pt-4 md:border-l md:border-t-0 md:px-5 md:pt-0"><legend className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Département</legend><div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                {departments.map((department) => <label key={department._id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"><input type="checkbox" checked={selectedDepartmentIds.includes(department._id)} onChange={(event) => { setSelectedDepartmentIds((current) => event.target.checked ? [...current, department._id] : current.filter((id) => id !== department._id)); setPage(1); }} className="h-4 w-4 rounded border-slate-300 accent-emerald-600" />{department.name}</label>)}
                {departments.length === 0 && <p className="px-2 py-2 text-sm text-slate-400">Aucun département disponible</p>}
              </div></fieldset>
              <fieldset className="min-w-0 border-t border-slate-100 pt-4 md:border-l md:pt-0 md:pl-5"><legend className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Type de contrat</legend><div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                {contractTypes.map((type) => <label key={type._id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"><input type="checkbox" checked={selectedContractTypeIds.includes(type._id)} onChange={(event) => { setSelectedContractTypeIds((current) => event.target.checked ? [...current, type._id] : current.filter((id) => id !== type._id)); setPage(1); }} className="h-4 w-4 rounded border-slate-300 accent-emerald-600" />{type.label}</label>)}
                {contractTypes.length === 0 && <p className="px-2 py-2 text-sm text-slate-400">Aucun type de contrat disponible</p>}
              </div></fieldset>
              </div>
              <div className="flex shrink-0 items-center justify-between border-t border-slate-100 bg-slate-50/70 px-5 py-3"><button type="button" onClick={() => { setSelectedStatuses([]); setSelectedDepartmentIds([]); setSelectedContractTypeIds([]); setPage(1); }} className="text-sm font-medium text-slate-500 hover:text-slate-800">Tout effacer</button><button type="button" onClick={() => setFiltersOpen(false)} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700">Terminé</button></div>
            </div>}
          </div>
          <Button onClick={() => setCreateModalOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>
            Ajouter un employé
          </Button>
          </div>
        </div>


      {errorMessage && (
        <div className="mb-4 shrink-0 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorMessage}
        </div>
      )}

      <div className="min-h-0 flex-1">
        {isHydrated ? <DataTable<Employee>
          title="Tous les employés"
          showTitle={false}
          compact
          columns={columns}
          data={employees}
          getRowId={(employee) => employee._id}
          pagination={pagination}
          loading={loading}
          tableHeight={520}
          sort={sort}
          selectedRowIds={selectedEmployeeIds}
          pageSizeOptions={[10, 15, 20, 50]}
          onSortChange={(newSort) => {
            setSort(newSort);
            setPage(1);
            setSelectedEmployeeIds([]);
          }}
          onSelectionChange={setSelectedEmployeeIds}
          onPageChange={(newPage) => {
            setPage(newPage);

            setSelectedEmployeeIds([]);
          }}
          onPageSizeChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
            setSelectedEmployeeIds([]);
          }}
          onRowClick={(employee) => {
            router.push(`/employees/${employee._id}`);
          }}
          onDuplicateSelected={(ids) => {
            console.log("Duplicate:", ids);
          }}
          onPrintSelected={(ids) => {
            console.log("Print:", ids);
          }}
          onDeleteSelected={(ids) => {
            console.log("Delete:", ids);
          }}
          onClearSelection={() => {
            setSelectedEmployeeIds([]);
          }}
          emptyMessage="Aucun employé trouvé."
        /> : <div className="h-full min-h-[320px] rounded-2xl border border-slate-100 bg-white" aria-hidden="true" />}
      </div>
      <CreateEmployeeModal open={createModalOpen} onClose={() => setCreateModalOpen(false)} onCreated={() => { void loadEmployees(); }} />
    </div>
  );
}

type StatCardProps = {
  icon: React.ReactNode;

  value: string | number;

  label: string;

  variant: "green" | "blue" | "purple";
};

const statStyles = {
  green: "bg-emerald-50 text-emerald-600",

  blue: "bg-blue-50 text-blue-600",

  purple: "bg-violet-50 text-violet-600",
};

function StatCard({ icon, value, label, variant }: StatCardProps) {
  return (
    <article
      className={[
        "flex min-h-[72px]",
        "items-center",
        "gap-3",
        "rounded-xl border border-slate-100",
        "bg-white",
        "px-4",
      ].join(" ")}
    >
      <div
        className={[
          "flex h-10 w-10",
          "shrink-0",
          "items-center",
          "justify-center",
          "rounded-lg",
          statStyles[variant],
        ].join(" ")}
      >
        {icon}
      </div>

      <div>
        <p className="text-lg font-bold text-app-text">{value}</p>

        <p className="text-xs text-app-muted">{label}</p>
      </div>
    </article>
  );
}
