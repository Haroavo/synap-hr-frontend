export type LeaveDayPeriod =
  | "MORNING"
  | "AFTERNOON";

export type LeaveRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export type LeaveRequestEmployee = {
  _id: string;
  badgeNumber?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profilePictureUrl?: string | null;
  departmentId?: string | {
    _id: string;
    name?: string;
    code?: string;
  };
  positionId?: string | {
    _id: string;
    title?: string;
    code?: string;
  };
};

export type LeaveRequestReviewer = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

export type BackOfficeLeaveRequest = {
  _id: string;
  employeeId: string | LeaveRequestEmployee;
  departureDate: string;
  departurePeriod: LeaveDayPeriod;
  returnDate: string;
  returnPeriod: LeaveDayPeriod;
  requestedDays: number;
  status: LeaveRequestStatus;
  employeeComment: string | null;
  rejectionReason: string | null;
  reviewedBy: string | LeaveRequestReviewer | null;
  reviewedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BackOfficeLeaveRequestListResponse = {
  items: BackOfficeLeaveRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    cancelled: number;
  };
};

export type BackOfficeLeaveRequestFilters = {
  status: "ALL" | LeaveRequestStatus;
  departureFrom: string;
  departureTo: string;
  search: string;
};
