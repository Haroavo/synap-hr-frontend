import { LeaveRequestStatus, LeaveDayPeriod, BackOfficeLeaveRequest, LeaveRequestEmployee, LeaveRequestReviewer } from "@/types/backoffice-leave-request";


export const LEAVE_STATUS_LABELS: Record<
  LeaveRequestStatus,
  string
> = {
  PENDING: "En attente",
  APPROVED: "Approuvée",
  REJECTED: "Refusée",
  CANCELLED: "Annulée",
};

export const LEAVE_PERIOD_LABELS: Record<
  LeaveDayPeriod,
  string
> = {
  MORNING: "Matin",
  AFTERNOON: "Après-midi",
};

export function formatDate(
  value: string | Date | null,
): string {
  if (!value) {
    return "—";
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date invalide";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatDateTime(
  value: string | Date | null,
): string {
  if (!value) {
    return "—";
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date invalide";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Indian/Antananarivo",
  }).format(date);
}

export function formatDays(
  value: number,
): string {
  const rounded =
    Math.round(
      (value + Number.EPSILON) * 100,
    ) / 100;

  return `${rounded} jour${rounded > 1 ? "s" : ""}`;
}

export function getEmployee(
  request: BackOfficeLeaveRequest,
): LeaveRequestEmployee | null {
  if (
    typeof request.employeeId === "object" &&
    request.employeeId !== null
  ) {
    return request.employeeId;
  }

  return null;
}

export function getEmployeeName(
  request: BackOfficeLeaveRequest,
): string {
  const employee = getEmployee(request);

  if (!employee) {
    return "Employé non renseigné";
  }

  const fullName = [
    employee.firstName,
    employee.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    fullName ||
    employee.email ||
    employee.badgeNumber ||
    "Employé"
  );
}

export function getEmployeeInitials(
  request: BackOfficeLeaveRequest,
): string {
  const employee = getEmployee(request);

  if (!employee) {
    return "EM";
  }

  const initials = [
    employee.firstName?.charAt(0),
    employee.lastName?.charAt(0),
  ]
    .filter(Boolean)
    .join("")
    .toUpperCase();

  return initials || "EM";
}

export function getReviewerName(
  reviewer:
    | string
    | LeaveRequestReviewer
    | null,
): string {
  if (!reviewer) {
    return "—";
  }

  if (typeof reviewer === "string") {
    return reviewer;
  }

  const fullName = [
    reviewer.firstName,
    reviewer.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || reviewer.email || "Utilisateur RH";
}

export function matchesLocalSearch(
  request: BackOfficeLeaveRequest,
  query: string,
): boolean {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  const employee = getEmployee(request);

  return [
    getEmployeeName(request),
    employee?.email,
    employee?.badgeNumber,
  ]
    .filter(Boolean)
    .some((value) =>
      String(value).toLowerCase().includes(normalized),
    );
}
