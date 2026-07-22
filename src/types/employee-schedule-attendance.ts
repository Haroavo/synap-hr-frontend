export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export type AttendanceType = "ENTER" | "EXIT";

export type DailyAttendanceStatus = "NO_ATTENDANCE" | "COMPLETE" | "INCOMPLETE";

export type ScheduleTimeSlot = {
  startTime: string;

  endTime: string;

  work: boolean;
};

export type DailyAttendancePunch = {
  id: string;

  type: AttendanceType;

  punchedAt: string;

  time: string;

  checkpointNumber: number;
};

export type DailyAttendanceInterval = {
  startAt: string;

  endAt: string;

  startTime: string;

  endTime: string;

  durationMinutes: number;
};

export type EmployeeScheduleAttendanceDay = {
  date: string;

  dayOfWeek: DayOfWeek;

  schedule: {
    timeSlots: ScheduleTimeSlot[];

    plannedWorkMinutes: number;

    plannedBreakMinutes: number;

    offDay: boolean;
  };

  attendances: DailyAttendancePunch[];

  workIntervals: DailyAttendanceInterval[];

  breakIntervals: DailyAttendanceInterval[];

  totalWorkMinutes: number;

  totalBreakMinutes: number;

  status: DailyAttendanceStatus;
};

export type EmployeeScheduleAttendanceResponse = {
  employeeId: string;

  schedule: {
    id: string;

    timezone: string;

    active: boolean;
  };

  range: {
    startDate: string;

    endDate: string;

    days: number;
  };

  totals: {
    workMinutes: number;

    breakMinutes: number;
  };

  days: EmployeeScheduleAttendanceDay[];
};

export type ApiErrorResponse = {
  message?: string | string[];
};
