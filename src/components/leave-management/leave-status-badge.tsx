import type {
  LeaveRequestStatus,
} from "@/types/backoffice-leave-request";

import {
  LEAVE_STATUS_LABELS,
} from "@/lib/backoffice-leave-requests";

const STATUS_STYLES: Record<
  LeaveRequestStatus,
  string
> = {
  PENDING:
    "bg-amber-100 text-amber-800",
  APPROVED:
    "bg-emerald-100 text-emerald-800",
  REJECTED:
    "bg-red-100 text-red-800",
  CANCELLED:
    "bg-slate-200 text-slate-700",
};

export function LeaveStatusBadge({
  status,
}: {
  status: LeaveRequestStatus;
}) {
  return (
    <span
      className={[
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        STATUS_STYLES[status],
      ].join(" ")}
    >
      {LEAVE_STATUS_LABELS[status]}
    </span>
  );
}
