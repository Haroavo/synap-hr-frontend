"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import {
  CalendarDays,
  IdCard,
  Mail,
  Phone,
  UserCheck,
  UserRound,
  UsersRound,
} from "lucide-react";

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

/**
 * Exemple :
 *
 * 2025-03-10T00:00:00.000Z
 *
 * devient :
 *
 * 10 mars 2025
 */
function formatDate(value?: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getInitials(firstName: string, lastName: string): string {
  const firstInitial = firstName?.charAt(0) ?? "";

  const lastInitial = lastName?.charAt(0) ?? "";

  return `${firstInitial}${lastInitial}`.toUpperCase();
}

export default function EmployeesPage() {
  const router = useRouter();

  const [employees, setEmployees] = useState<Employee[]>([]);

  const [pagination, setPagination] =
    useState<DataTablePagination>(initialPagination);

  const [page, setPage] = useState(1);

  const [limit, setLimit] = useState(10);

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

            <span className="text-sm">{employee.phone ?? "—"}</span>
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
              className="h-4 w-4 shrink-0 text-emerald-500"
              strokeWidth={1.8}
            />

            <span className="truncate text-sm text-emerald-600">
              {employee.email}
            </span>
          </div>
        ),
      },

      {
        id: "hireDate",

        header: "Date d'embauche",

        width: "190px",

        sortable: true,

        sortKey: "hireDate",

        cell: (employee) => (
          <div className="flex items-center gap-2">
            <CalendarDays
              className="h-4 w-4 shrink-0 text-violet-500"
              strokeWidth={1.8}
            />

            <span className="text-sm text-slate-700">
              {formatDate(employee.hireDate)}
            </span>
          </div>
        ),
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
    [],
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
    [page, limit, sort],
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

  return (
    <div className="flex h-full min-h-0 flex-col p-5 lg:p-7">
      <header className="mb-5 shrink-0">
        <p className="text-xs text-app-muted">
          Aperçu
          <span className="mx-2">›</span>
          Employés
        </p>

        <h1 className="mt-2 text-2xl font-bold text-app-text">Employés</h1>
      </header>

      <section className="mb-5 grid shrink-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
      </section>

      {errorMessage && (
        <div className="mb-4 shrink-0 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorMessage}
        </div>
      )}

      <div className="min-h-0 flex-1">
        <DataTable<Employee>
          title="Tous les employés"
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
        />
      </div>
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
        "rounded-xl",
        "bg-app-surface",
        "px-5",
        "shadow-[0_4px_20px_rgba(15,23,42,0.04)]",
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
