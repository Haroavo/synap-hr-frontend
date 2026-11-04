"use client";

import {
  Ban,
  CalendarCheck2,
  CalendarClock,
  CalendarX2,
  Check,
  ClipboardList,
  Eye,
  IdCard,
  Loader2,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import type { ReactNode } from "react";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  DataTable,
  type DataTableColumn,
  type DataTablePagination,
} from "@/components/ui/data-table";

import {
  formatDate,
  formatDateTime,
  formatDays,
  getEmployee,
  getEmployeeInitials,
  getEmployeeName,
  getReviewerName,
  LEAVE_PERIOD_LABELS,
} from "@/lib/backoffice-leave-requests";

import type {
  BackOfficeLeaveRequest,
  BackOfficeLeaveRequestListResponse,
  LeaveDayPeriod,
  LeaveRequestStatus,
} from "@/types/backoffice-leave-request";

import { LeaveStatusBadge } from "./leave-status-badge";

import { leaveRequestsApi } from "@/API/leave-requests.api";

type StatusFilter = "ALL" | LeaveRequestStatus;

type ActionMode = "DETAILS" | "APPROVE" | "REJECT" | null;

type ApiErrorResponse = {
  message?: string | string[];
};

const DEFAULT_PAGINATION: DataTablePagination = {
  page: 1,
  limit: 10,
  totalItems: 0,
  totalPages: 1,
};

export function AdminLeaveRequestsPage() {
  const [page, setPage] = useState(1);

  const [limit, setLimit] = useState(10);

  const [status, setStatus] = useState<StatusFilter>("PENDING");

  const [departureFrom, setDepartureFrom] = useState("");

  const [departureTo, setDepartureTo] = useState("");

  const [search, setSearch] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [data, setData] = useState<BackOfficeLeaveRequestListResponse | null>(
    null,
  );

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [success, setSuccess] = useState<string | null>(null);

  const [selectedRequest, setSelectedRequest] =
    useState<BackOfficeLeaveRequest | null>(null);

  const [actionMode, setActionMode] = useState<ActionMode>(null);

  const [rejectionReason, setRejectionReason] = useState("");

  const [actionLoading, setActionLoading] = useState(false);

  const [actionError, setActionError] = useState<string | null>(null);

  const loadRequests = useCallback(
    async (signal?: AbortSignal): Promise<void> => {
      setLoading(true);

      setError(null);

      const params = new URLSearchParams({
        page: String(page),

        limit: String(limit),
      });

      if (status !== "ALL") {
        params.set("status", status);
      }

      if (departureFrom) {
        params.set("departureFrom", departureFrom);
      }

      if (departureTo) {
        params.set("departureTo", departureTo);
      }

      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      }

      try {
        const response = await leaveRequestsApi.list(params, signal);

        const responseData = (await response.json().catch(() => null)) as
          | BackOfficeLeaveRequestListResponse
          | ApiErrorResponse
          | null;

        if (response.status === 401 || response.status === 403) {
          window.location.href = "/authentication";

          return;
        }

        if (!response.ok) {
          throw new Error(
            getResponseMessage(
              responseData,
              "Impossible de charger les demandes de congé.",
            ),
          );
        }

        if (
          !responseData ||
          !("items" in responseData) ||
          !Array.isArray(responseData.items)
        ) {
          throw new Error("La réponse du serveur est invalide.");
        }

        setData(responseData);
      } catch (loadError) {
        if (
          loadError instanceof DOMException &&
          loadError.name === "AbortError"
        ) {
          return;
        }

        setData(null);

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Une erreur est survenue.",
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [departureFrom, departureTo, debouncedSearch, limit, page, status],
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();

    void loadRequests(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadRequests]);

  const tablePagination = useMemo<DataTablePagination>(
    () => ({
      page: data?.pagination.page ?? page,

      limit: data?.pagination.limit ?? limit,

      totalItems: data?.pagination.total ?? 0,

      totalPages: data?.pagination.totalPages ?? 1,
    }),
    [
      data?.pagination.limit,
      data?.pagination.page,
      data?.pagination.total,
      data?.pagination.totalPages,
      limit,
      page,
    ],
  );

  const openAction = useCallback(
    (
      request: BackOfficeLeaveRequest,

      mode: Exclude<ActionMode, null>,
    ): void => {
      setSelectedRequest(request);

      setActionMode(mode);

      setRejectionReason("");

      setActionError(null);

      setSuccess(null);
    },
    [],
  );

  function closeAction(): void {
    if (actionLoading) {
      return;
    }

    setSelectedRequest(null);

    setActionMode(null);

    setRejectionReason("");

    setActionError(null);
  }

  function closeActionAfterRequest(): void {
    setSelectedRequest(null);

    setActionMode(null);

    setRejectionReason("");

    setActionError(null);
  }

  async function approveRequest(): Promise<void> {
    if (!selectedRequest) {
      return;
    }

    try {
      setActionLoading(true);

      setActionError(null);

      const response = await leaveRequestsApi.approve(selectedRequest._id);

      const responseData = (await response
        .json()
        .catch(() => null)) as ApiErrorResponse | null;

      if (!response.ok) {
        throw new Error(
          getResponseMessage(
            responseData,
            "Impossible d’approuver la demande.",
          ),
        );
      }

      const employeeName = getEmployeeName(selectedRequest);

      closeActionAfterRequest();

      setSuccess(`La demande de ${employeeName} a été approuvée.`);

      await loadRequests();
    } catch (approveError) {
      setActionError(
        approveError instanceof Error
          ? approveError.message
          : "Une erreur est survenue.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function rejectRequest(): Promise<void> {
    if (!selectedRequest) {
      return;
    }

    const reason = rejectionReason.trim();

    if (reason.length < 3) {
      setActionError("Le motif du refus doit contenir au moins 3 caractères.");

      return;
    }

    try {
      setActionLoading(true);

      setActionError(null);

      const response = await leaveRequestsApi.reject(selectedRequest._id, {
        rejectionReason: reason,
      });

      const responseData = (await response
        .json()
        .catch(() => null)) as ApiErrorResponse | null;

      if (!response.ok) {
        throw new Error(
          getResponseMessage(responseData, "Impossible de refuser la demande."),
        );
      }

      const employeeName = getEmployeeName(selectedRequest);

      closeActionAfterRequest();

      setSuccess(`La demande de ${employeeName} a été refusée.`);

      await loadRequests();
    } catch (rejectError) {
      setActionError(
        rejectError instanceof Error
          ? rejectError.message
          : "Une erreur est survenue.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  function resetFilters(): void {
    setStatus("ALL");

    setDepartureFrom("");

    setDepartureTo("");

    setSearch("");

    setPage(1);
  }

  const columns = useMemo<DataTableColumn<BackOfficeLeaveRequest>[]>(
    () => [
      {
        id: "employee",

        header: "Employé",

        width: "260px",

        cell: (request) => <EmployeeCell request={request} />,
      },

      {
        id: "departure",

        header: "Départ",

        width: "170px",

        cell: (request) => (
          <DatePeriod
            date={request.departureDate}
            period={request.departurePeriod}
          />
        ),
      },

      {
        id: "return",

        header: "Retour",

        width: "170px",

        cell: (request) => (
          <DatePeriod date={request.returnDate} period={request.returnPeriod} />
        ),
      },

      {
        id: "requestedDays",

        header: "Durée",

        width: "115px",

        cell: (request) => (
          <strong className="font-semibold text-slate-950">
            {formatDays(request.requestedDays)}
          </strong>
        ),
      },

      {
        id: "createdAt",

        header: "Envoyée le",

        width: "175px",

        cell: (request) => (
          <span className="text-sm text-slate-600">
            {formatDateTime(request.createdAt)}
          </span>
        ),
      },

      {
        id: "status",

        header: "Statut",

        width: "130px",

        cell: (request) => <LeaveStatusBadge status={request.status} />,
      },

      {
        id: "treatment",

        header: "Validation",

        width: "220px",

        cell: (request) => <TreatmentCell request={request} />,
      },

      {
        id: "actions",

        header: "Actions",

        width: "165px",

        cell: (request) => (
          <ActionButtons
            request={request}
            onDetails={() => openAction(request, "DETAILS")}
            onApprove={() => openAction(request, "APPROVE")}
            onReject={() => openAction(request, "REJECT")}
          />
        ),
      },
    ],
    [openAction],
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 p-4 sm:p-6">
      <PageHeader />

      {success && (
        <Alert type="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert type="error">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{error}</span>

            <button
              type="button"
              className="inline-flex items-center gap-2 font-semibold underline"
              onClick={() => void loadRequests()}
            >
              <RefreshCw className="h-4 w-4" />
              Réessayer
            </button>
          </div>
        </Alert>
      )}

      <Statistics
        total={data?.summary.total ?? 0}
        pending={data?.summary.pending ?? 0}
        approved={data?.summary.approved ?? 0}
        rejected={data?.summary.rejected ?? 0}
        cancelled={data?.summary.cancelled ?? 0}
      />

      <section className="shrink-0 rounded-2xl border border-slate-200 bg-white">
        <Filters
          status={status}
          departureFrom={departureFrom}
          departureTo={departureTo}
          search={search}
          onStatusChange={(value) => {
            setStatus(value);

            setPage(1);
          }}
          onDepartureFromChange={(value) => {
            setDepartureFrom(value);

            setPage(1);
          }}
          onDepartureToChange={(value) => {
            setDepartureTo(value);

            setPage(1);
          }}
          onSearchChange={(value) => {
            setSearch(value);

            setPage(1);
          }}
          onReset={resetFilters}
          onRefresh={() => void loadRequests()}
          loading={loading}
        />
      </section>

      <div className="min-h-0 flex-1">
        <DataTable<BackOfficeLeaveRequest>
          title="Liste des demandes"
          columns={columns}
          data={data?.items ?? []}
          getRowId={(request) => request._id}
          pagination={data ? tablePagination : DEFAULT_PAGINATION}
          loading={loading}
          tableHeight={540}
          selectable={false}
          showSelectionToolbar={false}
          pageSizeOptions={[10, 20, 50]}
          onPageChange={(newPage) => {
            setPage(newPage);
          }}
          onPageSizeChange={(newLimit) => {
            setLimit(newLimit);

            setPage(1);
          }}
          emptyMessage="Aucune demande ne correspond aux filtres sélectionnés."
        />
      </div>

      <RequestModal
        mode={actionMode}
        request={selectedRequest}
        rejectionReason={rejectionReason}
        loading={actionLoading}
        error={actionError}
        onClose={closeAction}
        onReasonChange={setRejectionReason}
        onApprove={() => void approveRequest()}
        onReject={() => void rejectRequest()}
      />
    </div>
  );
}

function PageHeader() {
  return (
    <section className="shrink-0">
      <p className="text-sm font-semibold text-cyan-700">Gestion des congés</p>

      <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
        Demandes des employés
      </h1>

      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
        Consultez les demandes reçues, vérifiez les périodes et approuvez ou
        refusez chaque demande.
      </p>
    </section>
  );
}

function Statistics({
  total,
  pending,
  approved,
  rejected,
  cancelled,
}: {
  total: number;

  pending: number;

  approved: number;

  rejected: number;

  cancelled: number;
}) {
  const cards = [
    {
      label: "Demandes au total",

      value: total,

      icon: <ClipboardList className="h-5 w-5" />,

      className: "bg-blue-50 text-blue-700",
    },
    {
      label: "En attente",

      value: pending,

      icon: <CalendarClock className="h-5 w-5" />,

      className: "bg-amber-50 text-amber-700",
    },
    {
      label: "Approuvées",

      value: approved,

      icon: <CalendarCheck2 className="h-5 w-5" />,

      className: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Refusées",

      value: rejected,

      icon: <CalendarX2 className="h-5 w-5" />,

      className: "bg-red-50 text-red-700",
    },
    {
      label: "Annulées",

      value: cancelled,

      icon: <Ban className="h-5 w-5" />,

      className: "bg-slate-100 text-slate-700",
    },
  ];

  return (
    <section className="shrink-0">
      <p className="mb-3 text-xs text-slate-500">
        Indicateurs calculés sur l’ensemble des résultats de la recherche et des dates choisies.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <article
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <span
              className={[
                "grid h-10 w-10 place-items-center rounded-xl",
                card.className,
              ].join(" ")}
            >
              {card.icon}
            </span>

            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {card.label}
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-950">
              {card.value}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Filters({
  status,
  departureFrom,
  departureTo,
  search,
  loading,
  onStatusChange,
  onDepartureFromChange,
  onDepartureToChange,
  onSearchChange,
  onReset,
  onRefresh,
}: {
  status: StatusFilter;

  departureFrom: string;

  departureTo: string;

  search: string;

  loading: boolean;

  onStatusChange: (value: StatusFilter) => void;

  onDepartureFromChange: (value: string) => void;

  onDepartureToChange: (value: string) => void;

  onSearchChange: (value: string) => void;

  onReset: () => void;

  onRefresh: () => void;
}) {
  return (
    <div className="grid gap-4 p-5 lg:grid-cols-[minmax(220px,1fr)_180px_170px_170px_auto] lg:items-end">
      <label className="grid gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Rechercher un employé
        </span>

        <span className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            type="search"
            value={search}
            maxLength={100}
            placeholder="Nom, e-mail ou matricule"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </span>
      </label>

      <FieldLabel label="Statut">
        <select
          value={status}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
          onChange={(event) =>
            onStatusChange(event.target.value as StatusFilter)
          }
        >
          <option value="ALL">Tous</option>

          <option value="PENDING">En attente</option>

          <option value="APPROVED">Approuvée</option>

          <option value="REJECTED">Refusée</option>

          <option value="CANCELLED">Annulée</option>
        </select>
      </FieldLabel>

      <FieldLabel label="Départ à partir du">
        <input
          type="date"
          value={departureFrom}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
          onChange={(event) => onDepartureFromChange(event.target.value)}
        />
      </FieldLabel>

      <FieldLabel label="Départ jusqu’au">
        <input
          type="date"
          value={departureTo}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
          onChange={(event) => onDepartureToChange(event.target.value)}
        />
      </FieldLabel>

      <div className="flex gap-2">
        <button
          type="button"
          className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          onClick={onReset}
        >
          Réinitialiser
        </button>

        <button
          type="button"
          aria-label="Actualiser"
          disabled={loading}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-950 text-white transition hover:bg-slate-800 disabled:opacity-50"
          onClick={onRefresh}
        >
          <RefreshCw
            className={["h-4 w-4", loading ? "animate-spin" : ""].join(" ")}
          />
        </button>
      </div>
    </div>
  );
}

function EmployeeCell({ request }: { request: BackOfficeLeaveRequest }) {
  const employee = getEmployee(request);

  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-cyan-100 text-xs font-bold text-cyan-800">
        {employee?.profilePictureUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={employee.profilePictureUrl}
            alt={getEmployeeName(request)}
            className="h-full w-full object-cover"
          />
        ) : (
          getEmployeeInitials(request)
        )}
      </span>

      <div className="min-w-0">
        <p className="truncate font-semibold text-slate-950">
          {getEmployeeName(request)}
        </p>

        <p className="mt-1 flex items-center gap-1 truncate text-xs text-slate-500">
          <IdCard className="h-3 w-3 shrink-0" />

          {employee?.badgeNumber ??
            employee?.email ??
            "Identifiant indisponible"}
        </p>
      </div>
    </div>
  );
}

function DatePeriod({
  date,
  period,
}: {
  date: string;

  period: LeaveDayPeriod;
}) {
  return (
    <div>
      <p className="font-semibold text-slate-950">{formatDate(date)}</p>

      <p className="mt-1 text-xs text-slate-500">
        {LEAVE_PERIOD_LABELS[period]}
      </p>
    </div>
  );
}

function TreatmentCell({ request }: { request: BackOfficeLeaveRequest }) {
  if (request.status === "PENDING") {
    return <span className="text-sm text-slate-400">Non traitée</span>;
  }

  if (request.status === "CANCELLED") {
    return (
      <span className="text-sm text-slate-500">Annulée par l’employé</span>
    );
  }

  return (
    <div className="max-w-52">
      <p className="truncate text-sm font-medium text-slate-700">
        {getReviewerName(request.reviewedBy)}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {formatDateTime(request.reviewedAt)}
      </p>

      {request.status === "REJECTED" && request.rejectionReason && (
        <p
          title={request.rejectionReason}
          className="mt-2 line-clamp-2 text-xs leading-5 text-red-600"
        >
          {request.rejectionReason}
        </p>
      )}
    </div>
  );
}

function ActionButtons({
  request,
  onDetails,
  onApprove,
  onReject,
}: {
  request: BackOfficeLeaveRequest;

  onDetails: () => void;

  onApprove: () => void;

  onReject: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <IconButton
        label="Détails"
        icon={<Eye className="h-4 w-4" />}
        onClick={onDetails}
      />

      {request.status === "PENDING" && (
        <>
          <IconButton
            label="Approuver"
            icon={<Check className="h-4 w-4" />}
            tone="success"
            onClick={onApprove}
          />

          <IconButton
            label="Refuser"
            icon={<X className="h-4 w-4" />}
            tone="danger"
            onClick={onReject}
          />
        </>
      )}
    </div>
  );
}

function IconButton({
  label,
  icon,
  tone = "default",
  onClick,
}: {
  label: string;

  icon: ReactNode;

  tone?: "default" | "success" | "danger";

  onClick: () => void;
}) {
  const styles = {
    default: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",

    success:
      "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",

    danger: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
  };

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={[
        "inline-flex h-9 w-9 items-center justify-center rounded-lg border transition",
        styles[tone],
      ].join(" ")}
      onClick={(event) => {
        event.stopPropagation();

        onClick();
      }}
    >
      {icon}
    </button>
  );
}

function RequestModal({
  mode,
  request,
  rejectionReason,
  loading,
  error,
  onClose,
  onReasonChange,
  onApprove,
  onReject,
}: {
  mode: ActionMode;

  request: BackOfficeLeaveRequest | null;

  rejectionReason: string;

  loading: boolean;

  error: string | null;

  onClose: () => void;

  onReasonChange: (value: string) => void;

  onApprove: () => void;

  onReject: () => void;
}) {
  if (!mode || !request) {
    return null;
  }

  const title =
    mode === "DETAILS"
      ? "Détail de la demande"
      : mode === "APPROVE"
        ? "Approuver la demande"
        : "Refuser la demande";

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950">{title}</h2>

            <p className="mt-2 text-sm text-slate-500">
              {getEmployeeName(request)}
            </p>
          </div>

          <button
            type="button"
            aria-label="Fermer"
            disabled={loading}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <RequestSummary request={request} />

        {error && (
          <div className="mt-5">
            <Alert type="error">{error}</Alert>
          </div>
        )}

        {mode === "DETAILS" && <DetailsContent request={request} />}

        {mode === "APPROVE" && (
          <div className="mt-6">
            <Alert type="info">
              Le backend recalculera le solde disponible avant l’approbation. La
              demande ne sera validée que si les règles de congé sont
              respectées.
            </Alert>
          </div>
        )}

        {mode === "REJECT" && (
          <label className="mt-6 grid gap-2">
            <span className="text-sm font-semibold text-slate-700">
              Motif du refus *
            </span>

            <textarea
              value={rejectionReason}
              maxLength={1000}
              rows={5}
              placeholder="Expliquez clairement pourquoi cette demande est refusée."
              className="w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-100"
              onChange={(event) => onReasonChange(event.target.value)}
            />

            <span className="text-right text-xs text-slate-400">
              {rejectionReason.length}
              /1000
            </span>
          </label>
        )}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            onClick={onClose}
          >
            {mode === "DETAILS" ? "Fermer" : "Annuler"}
          </button>

          {mode === "APPROVE" && (
            <button
              type="button"
              disabled={loading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              onClick={onApprove}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Confirmer l’approbation
            </button>
          )}

          {mode === "REJECT" && (
            <button
              type="button"
              disabled={loading || rejectionReason.trim().length < 3}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={onReject}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
              Confirmer le refus
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function RequestSummary({ request }: { request: BackOfficeLeaveRequest }) {
  return (
    <div className="mt-6 grid gap-4 rounded-2xl bg-slate-50 p-5 sm:grid-cols-3">
      <SummaryItem
        label="Départ"
        value={`${formatDate(request.departureDate)} · ${LEAVE_PERIOD_LABELS[request.departurePeriod]}`}
      />

      <SummaryItem
        label="Retour"
        value={`${formatDate(request.returnDate)} · ${LEAVE_PERIOD_LABELS[request.returnPeriod]}`}
      />

      <SummaryItem label="Durée" value={formatDays(request.requestedDays)} />
    </div>
  );
}

function DetailsContent({ request }: { request: BackOfficeLeaveRequest }) {
  const employee = getEmployee(request);

  return (
    <div className="mt-6 grid gap-5">
      <DetailSection title="Employé">
        <DetailRow label="Nom" value={getEmployeeName(request)} />

        <DetailRow label="Matricule" value={employee?.badgeNumber ?? "—"} />

        <DetailRow label="E-mail" value={employee?.email ?? "—"} />
      </DetailSection>

      <DetailSection title="Demande">
        <DetailRow
          label="Statut"
          value={<LeaveStatusBadge status={request.status} />}
        />

        <DetailRow
          label="Envoyée le"
          value={formatDateTime(request.createdAt)}
        />

        <DetailRow
          label="Commentaire"
          value={request.employeeComment ?? "Aucun commentaire"}
        />
      </DetailSection>

      {request.status !== "PENDING" && (
        <DetailSection title="Décision">
          <DetailRow
            label="Traité par"
            value={getReviewerName(request.reviewedBy)}
          />

          <DetailRow
            label="Traité le"
            value={formatDateTime(request.reviewedAt)}
          />

          {request.status === "REJECTED" && (
            <DetailRow
              label="Motif du refus"
              value={request.rejectionReason ?? "Non renseigné"}
            />
          )}
        </DetailSection>
      )}
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;

  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 p-5">
      <h3 className="font-bold text-slate-950">{title}</h3>

      <div className="mt-4 grid gap-3">{children}</div>
    </section>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;

  value: ReactNode;
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[150px_1fr] sm:gap-4">
      <span className="text-sm text-slate-500">{label}</span>

      <div className="text-sm font-medium text-slate-800">{value}</div>
    </div>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-sm font-bold text-slate-950">{value}</p>
    </div>
  );
}

function FieldLabel({
  label,
  children,
}: {
  label: string;

  children: ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </span>

      {children}
    </label>
  );
}

function Alert({
  type,
  children,
  onClose,
}: {
  type: "success" | "error" | "info";

  children: ReactNode;

  onClose?: () => void;
}) {
  const styles = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",

    error: "border-red-200 bg-red-50 text-red-800",

    info: "border-blue-200 bg-blue-50 text-blue-800",
  };

  return (
    <div
      className={[
        "flex shrink-0 items-start justify-between gap-4 rounded-xl border px-4 py-3 text-sm leading-6",
        styles[type],
      ].join(" ")}
    >
      <div>{children}</div>

      {onClose && (
        <button
          type="button"
          aria-label="Fermer"
          className="mt-0.5 shrink-0"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function getResponseMessage(
  data: unknown,

  fallback: string,
): string {
  if (typeof data !== "object" || data === null || !("message" in data)) {
    return fallback;
  }

  const message = (
    data as {
      message?: string | string[];
    }
  ).message;

  if (Array.isArray(message)) {
    return message.join(", ");
  }

  if (typeof message === "string") {
    return message;
  }

  return fallback;
}
