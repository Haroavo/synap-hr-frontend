"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createPortal } from "react-dom";

import {
  ArrowLeft,
  CalendarDays,
  CalendarRange,
  Clock,
  Coffee,
  Filter,
  LogIn,
  LogOut,
  RefreshCw,
  RotateCcw,
  TimerOff,
  type LucideIcon,
} from "lucide-react";

import { useParams, useRouter } from "next/navigation";
import { EmployeeScheduleFinder } from "@/components/employees/employee-schedule-finder";

/*
 * ============================================================
 * TYPES
 * ============================================================
 */

type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

type AttendanceType = "ENTER" | "EXIT";

type DailyAttendanceStatus = "NO_ATTENDANCE" | "COMPLETE" | "INCOMPLETE";

type ScheduleTimeSlot = {
  startTime: string;
  endTime: string;
  work: boolean;
};

type DailyAttendancePunch = {
  id: string;
  type: AttendanceType;
  punchedAt: string;
  time: string;
  checkpointNumber: number;
};

type DailyAttendanceInterval = {
  startAt: string;
  endAt: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
};

type AttendanceAnomaly = {
  code: string;
  label: string;
  severity: "WARNING" | "INFO";
  minutes?: number;
};

type EmployeeScheduleAttendanceDay = {
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
  anomalies?: AttendanceAnomaly[];
};

type EmployeeScheduleAttendanceResponse = {
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

type ApiErrorResponse = {
  message?: string | string[];
};

type DateRange = {
  startDate: string;
  endDate: string;
};

type TooltipPosition = {
  top: number;
  left: number;
  placement: "top" | "bottom";
};

type TimelineBlockKind =
  | "PLANNED_WORK"
  | "PLANNED_BREAK"
  | "ACTUAL_WORK"
  | "ACTUAL_BREAK"
  | "OFF";

type TimelineBlockConfiguration = {
  label: string;
  className: string;
  iconContainer: string;
  icon: LucideIcon;
};

/*
 * ============================================================
 * CONFIGURATION
 * ============================================================
 */

const MAX_HISTORY_DAYS = 366;

const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: "Lundi",
  TUESDAY: "Mardi",
  WEDNESDAY: "Mercredi",
  THURSDAY: "Jeudi",
  FRIDAY: "Vendredi",
  SATURDAY: "Samedi",
  SUNDAY: "Dimanche",
};

const HOUR_WIDTH_PX = 60;

const HOURS = Array.from(
  {
    length: 25,
  },
  (_, index) => index,
);

const TIMELINE_WIDTH = 24 * HOUR_WIDTH_PX;

/*
 * ============================================================
 * UTILITAIRES DES DATES
 * ============================================================
 */

function formatDateInput(date: Date): string {
  return [
    String(date.getFullYear()).padStart(4, "0"),

    String(date.getMonth() + 1).padStart(2, "0"),

    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function shiftDateKey(dateKey: string, numberOfDays: number): string {
  const date = parseDateKey(dateKey);

  date.setUTCDate(date.getUTCDate() + numberOfDays);

  return [
    String(date.getUTCFullYear()).padStart(4, "0"),

    String(date.getUTCMonth() + 1).padStart(2, "0"),

    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function createDefaultDateRange(): DateRange {
  const endDate = formatDateInput(new Date());

  return {
    startDate: shiftDateKey(endDate, -4),

    endDate,
  };
}

function getInclusiveDateCount(startDate: string, endDate: string): number {
  const startTimestamp = parseDateKey(startDate).getTime();

  const endTimestamp = parseDateKey(endDate).getTime();

  return Math.floor((endTimestamp - startTimestamp) / 86_400_000) + 1;
}

function formatDate(dateKey: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(parseDateKey(dateKey));
}

function formatLongDate(dateKey: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(parseDateKey(dateKey));
}

function getCurrentDateKey(timezone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());

    const values = new Map(parts.map((part) => [part.type, part.value]));

    return [values.get("year"), values.get("month"), values.get("day")].join(
      "-",
    );
  } catch {
    return formatDateInput(new Date());
  }
}

function isToday(dateKey: string, timezone: string): boolean {
  return dateKey === getCurrentDateKey(timezone);
}

/*
 * ============================================================
 * UTILITAIRES DES HORAIRES
 * ============================================================
 */

function getApiErrorMessage(
  data: ApiErrorResponse | null,
  defaultMessage: string,
): string {
  if (Array.isArray(data?.message)) {
    return data.message.join(", ");
  }

  return data?.message ?? defaultMessage;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
}

function timeToPixels(time: string): number {
  return (timeToMinutes(time) / 60) * HOUR_WIDTH_PX;
}

function getIntervalWidth(startTime: string, endTime: string): number {
  const startMinutes = timeToMinutes(startTime);

  const endMinutes = endTime === "23:59" ? 24 * 60 : timeToMinutes(endTime);

  const durationMinutes = Math.max(0, endMinutes - startMinutes);

  return Math.max(2, (durationMinutes / 60) * HOUR_WIDTH_PX);
}

function getTimeIntervalDuration(startTime: string, endTime: string): number {
  const startMinutes = timeToMinutes(startTime);

  const endMinutes = endTime === "23:59" ? 24 * 60 : timeToMinutes(endTime);

  return Math.max(0, endMinutes - startMinutes);
}

function formatDuration(minutes: number): string {
  const safeMinutes = Math.max(0, Math.round(minutes));

  const hours = Math.floor(safeMinutes / 60);

  const remainingMinutes = safeMinutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} min`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}min`;
}

/*
 * ============================================================
 * PAGE
 * ============================================================
 */

export default function EmployeeSchedulePage() {
  const params = useParams<{
    employeeId: string;
  }>();

  const router = useRouter();

  const employeeId = params.employeeId;

  const defaultDateRange = useMemo(() => createDefaultDateRange(), []);

  const [dateFilter, setDateFilter] = useState<DateRange>(defaultDateRange);

  const [appliedDateFilter, setAppliedDateFilter] =
    useState<DateRange>(defaultDateRange);

  const [filterError, setFilterError] = useState<string | null>(null);

  const [response, setResponse] =
    useState<EmployeeScheduleAttendanceResponse | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const loadPlanning = useCallback(
    async (signal?: AbortSignal): Promise<void> => {
      if (!employeeId) {
        return;
      }

      try {
        setLoading(true);

        setError(null);

        const searchParams = new URLSearchParams({
          startDate: appliedDateFilter.startDate,

          endDate: appliedDateFilter.endDate,
        });

        const apiResponse = await fetch(
          `/api/employee-schedules/${employeeId}/attendance-summary?${searchParams.toString()}`,
          {
            method: "GET",

            cache: "no-store",

            signal,
          },
        );

        const data = (await apiResponse.json().catch(() => null)) as
          | EmployeeScheduleAttendanceResponse
          | ApiErrorResponse
          | null;

        if (!apiResponse.ok) {
          throw new Error(
            getApiErrorMessage(
              data as ApiErrorResponse | null,

              "Impossible de récupérer le planning.",
            ),
          );
        }

        if (
          !data ||
          !("days" in data) ||
          !Array.isArray(data.days) ||
          !data.schedule ||
          !data.range ||
          !data.totals
        ) {
          throw new Error("La réponse du serveur est invalide.");
        }

        setResponse(data);
      } catch (loadError) {
        if (
          loadError instanceof DOMException &&
          loadError.name === "AbortError"
        ) {
          return;
        }

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
    [appliedDateFilter.endDate, appliedDateFilter.startDate, employeeId],
  );

  useEffect(() => {
    const controller = new AbortController();

    void loadPlanning(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadPlanning]);

  const displayedDays = useMemo(() => {
    if (!response) {
      return [];
    }

    return [...response.days].sort((firstDay, secondDay) =>
      firstDay.date.localeCompare(secondDay.date),
    );
  }, [response]);

  const periodLabel = useMemo(() => {
    if (!response) {
      return "";
    }

    return `${formatLongDate(response.range.startDate)} au ${formatLongDate(
      response.range.endDate,
    )}`;
  }, [response]);

  function applyDateFilter(): void {
    setFilterError(null);

    if (!dateFilter.startDate || !dateFilter.endDate) {
      setFilterError("Sélectionnez une date de début et une date de fin.");

      return;
    }

    if (dateFilter.startDate.localeCompare(dateFilter.endDate) > 0) {
      setFilterError(
        "La date de début doit être antérieure ou égale à la date de fin.",
      );

      return;
    }

    const numberOfDays = getInclusiveDateCount(
      dateFilter.startDate,
      dateFilter.endDate,
    );

    if (numberOfDays > MAX_HISTORY_DAYS) {
      setFilterError(
        `La période ne peut pas dépasser ${MAX_HISTORY_DAYS} jours.`,
      );

      return;
    }

    setAppliedDateFilter({
      ...dateFilter,
    });
  }

  function resetDateFilter(): void {
    const range = createDefaultDateRange();

    setFilterError(null);

    setDateFilter(range);

    setAppliedDateFilter(range);
  }

  if (loading && !response) {
    return <ScheduleLoader />;
  }

  if (error && !response) {
    return (
      <ScheduleError message={error} onRetry={() => void loadPlanning()} />
    );
  }

  if (!response) {
    return <ScheduleEmpty />;
  }

  return (
    <div
      className={[
        "flex h-full min-h-0",
        "flex-col",
        "overflow-y-auto",
        "p-4 sm:p-5 lg:p-7",
      ].join(" ")}
    >
      {/* En-tête */}

      <header className="mb-5 shrink-0">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs text-app-muted">
              Employés
              <span className="mx-2">›</span>
              Planning
            </p>

            <h1 className="mt-2 text-2xl font-bold text-app-text">
              Historique du planning
            </h1>

            <p className="mt-1 text-sm text-app-muted">
              Période du {periodLabel}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void loadPlanning()}
              disabled={loading}
              className={[
                "flex h-10",
                "items-center gap-2",
                "rounded-xl",
                "border border-slate-200",
                "bg-white px-4",
                "text-sm font-medium",
                "text-slate-600",
                "transition",
                "hover:bg-slate-50",
                "disabled:cursor-not-allowed",
                "disabled:opacity-50",
              ].join(" ")}
            >
              <RefreshCw
                className={["h-4 w-4", loading ? "animate-spin" : ""].join(" ")}
              />
              Actualiser
            </button>

            <button
              type="button"
              onClick={() => router.back()}
              className={[
                "flex h-10",
                "items-center gap-2",
                "rounded-xl",
                "border border-slate-200",
                "bg-white px-4",
                "text-sm font-medium",
                "text-slate-600",
                "transition",
                "hover:bg-slate-50",
              ].join(" ")}
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </button>
          </div>
        </div>
      </header>

      <div className="mb-5 shrink-0"><EmployeeScheduleFinder /></div>

      {/* Filtre */}

      <section
        className={[
          "mb-5 shrink-0",
          "rounded-2xl",
          "border border-slate-200",
          "bg-white",
          "p-4 sm:p-5",
          "shadow-[0_4px_20px_rgba(15,23,42,0.04)]",
        ].join(" ")}
      >
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-app-primary">
              <CalendarRange className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Filtrer l’historique
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Sélectionnez une date de début et une date de fin.
              </p>
            </div>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-auto xl:grid-cols-[185px_185px_auto_auto]">
            <div>
              <label
                htmlFor="history-start-date"
                className="mb-1.5 block text-xs font-medium text-slate-500"
              >
                Date de début
              </label>

              <input
                id="history-start-date"
                type="date"
                value={dateFilter.startDate}
                max={dateFilter.endDate || undefined}
                onChange={(event) => {
                  setDateFilter((currentFilter) => ({
                    ...currentFilter,

                    startDate: event.target.value,
                  }));

                  setFilterError(null);
                }}
                className={[
                  "h-10 w-full",
                  "rounded-xl",
                  "border border-slate-200",
                  "bg-white",
                  "px-3",
                  "text-sm text-slate-700",
                  "outline-none",
                  "transition",
                  "focus:border-app-primary",
                  "focus:ring-2 focus:ring-blue-100",
                ].join(" ")}
              />
            </div>

            <div>
              <label
                htmlFor="history-end-date"
                className="mb-1.5 block text-xs font-medium text-slate-500"
              >
                Date de fin
              </label>

              <input
                id="history-end-date"
                type="date"
                value={dateFilter.endDate}
                min={dateFilter.startDate || undefined}
                max={formatDateInput(new Date())}
                onChange={(event) => {
                  setDateFilter((currentFilter) => ({
                    ...currentFilter,

                    endDate: event.target.value,
                  }));

                  setFilterError(null);
                }}
                className={[
                  "h-10 w-full",
                  "rounded-xl",
                  "border border-slate-200",
                  "bg-white",
                  "px-3",
                  "text-sm text-slate-700",
                  "outline-none",
                  "transition",
                  "focus:border-app-primary",
                  "focus:ring-2 focus:ring-blue-100",
                ].join(" ")}
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={resetDateFilter}
                disabled={loading}
                className={[
                  "flex h-10 w-full",
                  "items-center",
                  "justify-center",
                  "gap-2",
                  "rounded-xl",
                  "bg-slate-100",
                  "px-4",
                  "text-sm font-medium",
                  "text-slate-600",
                  "transition",
                  "hover:bg-slate-200",
                  "disabled:opacity-50",
                ].join(" ")}
              >
                <RotateCcw className="h-4 w-4" />
                Réinitialiser
              </button>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={applyDateFilter}
                disabled={loading}
                className={[
                  "flex h-10 w-full",
                  "items-center",
                  "justify-center",
                  "gap-2",
                  "rounded-xl",
                  "bg-app-primary",
                  "px-4",
                  "text-sm font-semibold",
                  "text-white",
                  "transition",
                  "hover:opacity-90",
                  "disabled:cursor-not-allowed",
                  "disabled:opacity-60",
                ].join(" ")}
              >
                <Filter className="h-4 w-4" />
                Appliquer
              </button>
            </div>
          </div>
        </div>

        {filterError && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
          >
            {filterError}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
          >
            {error}
          </div>
        )}
      </section>

      {/* Statistiques */}

      <section className="mb-5 grid shrink-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InfoCard
          icon={<CalendarDays className="h-5 w-5" />}
          label="Période affichée"
          value={`${response.range.days} jours`}
          variant="blue"
        />

        <InfoCard
          icon={<Clock className="h-5 w-5" />}
          label="Temps travaillé"
          value={formatDuration(response.totals.workMinutes)}
          variant="green"
        />

        <InfoCard
          icon={<Coffee className="h-5 w-5" />}
          label="Temps de pause"
          value={formatDuration(response.totals.breakMinutes)}
          variant="orange"
        />

        <InfoCard
          icon={<Clock className="h-5 w-5" />}
          label="Fuseau horaire"
          value={response.schedule.timezone}
          variant="purple"
        />
      </section>

      {/* Planning */}

      <section
        className={[
          "relative",
          "flex min-h-[660px]",
          "flex-1 flex-col",
          "overflow-hidden",
          "rounded-2xl",
          "border border-slate-200",
          "bg-white",
          "shadow-[0_8px_30px_rgba(15,23,42,0.04)]",
        ].join(" ")}
      >
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Horaires prévus et présence réelle
            </h2>

            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
              Une pause correspond à une sortie suivie d&apos;une entrée pendant
              la même journée.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <LegendItem
              className="border-blue-300 bg-blue-100"
              label="Travail prévu"
            />

            <LegendItem
              className="border-violet-300 bg-violet-100"
              label="Pause prévue"
            />

            <LegendItem
              className="border-emerald-400 bg-emerald-200"
              label="Travail réel suffisant"
            />

            <LegendItem
              className="border-red-400 bg-red-200"
              label="Travail réel inférieur"
            />

            <LegendItem
              className="border-amber-400 bg-amber-200"
              label="Pause réelle"
            />
          </div>
        </div>

        <div className="relative min-h-0 flex-1 overflow-auto">
          <div
            className="relative"
            style={{
              minWidth: 240 + TIMELINE_WIDTH,
            }}
          >
            <div className="sticky top-0 z-30 flex h-12 border-y border-slate-100 bg-slate-50">
              <div className="sticky left-0 z-40 flex w-60 shrink-0 items-center border-r border-slate-100 bg-slate-50 px-5 text-xs font-semibold text-slate-500">
                Journée
              </div>

              <div
                className="relative shrink-0"
                style={{
                  width: TIMELINE_WIDTH,
                }}
              >
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="absolute top-0 flex h-12 items-center border-l border-slate-200 pl-1 text-[10px] text-slate-400"
                    style={{
                      left: hour * HOUR_WIDTH_PX,

                      width: HOUR_WIDTH_PX,
                    }}
                  >
                    {String(hour).padStart(2, "0")}
                    :00
                  </div>
                ))}
              </div>
            </div>

            {displayedDays.map((day) => (
              <ScheduleDayRow
                key={day.date}
                day={day}
                timezone={response.schedule.timezone}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

/*
 * ============================================================
 * LIGNE D'UNE JOURNÉE
 * ============================================================
 */

function ScheduleDayRow({
  day,
  timezone,
}: {
  day: EmployeeScheduleAttendanceDay;
  timezone: string;
}) {
  const today = isToday(day.date, timezone);

  const workIsBelowPlanned =
    day.schedule.plannedWorkMinutes > 0 &&
    day.totalWorkMinutes < day.schedule.plannedWorkMinutes;

  return (
    <div className="relative flex min-h-[176px] border-b border-slate-100 last:border-b-0">
      <div className="sticky left-0 z-20 w-60 shrink-0 border-r border-slate-100 bg-white px-5 py-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-slate-800">
              {DAY_LABELS[day.dayOfWeek]}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {formatDate(day.date)}
            </p>
          </div>

          {today && (
            <span className="rounded-full bg-blue-100 px-2 py-1 text-[9px] font-semibold text-blue-700">
              Aujourd&apos;hui
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <SummaryBadge
            icon={<Clock className="h-3.5 w-3.5" />}
            label={formatDuration(day.totalWorkMinutes)}
            className={
              workIsBelowPlanned
                ? "bg-red-50 text-red-700"
                : "bg-emerald-50 text-emerald-700"
            }
            title="Temps réellement travaillé"
          />

          <SummaryBadge
            icon={<Coffee className="h-3.5 w-3.5" />}
            label={formatDuration(day.totalBreakMinutes)}
            className="bg-amber-50 text-amber-700"
            title="Temps réel de pause"
          />
        </div>

        <p className="mt-4 text-[11px] text-slate-400">
          {day.attendances.length} pointage
          {day.attendances.length > 1 ? "s" : ""}
        </p>

        {day.anomalies && day.anomalies.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {day.anomalies.map((anomaly, index) => (
              <p key={`${anomaly.code}-${index}`} title={anomaly.label} className={`rounded-lg px-2 py-1 text-[10px] font-medium leading-4 ${anomaly.severity === "WARNING" ? "bg-[#FCF4E8] text-[#8A6428]" : "bg-[#F0F5F2] text-[#536A76]"}`}>
                {anomaly.label}{anomaly.minutes != null ? ` · ${formatDuration(anomaly.minutes)}` : ""}
              </p>
            ))}
          </div>
        )}
      </div>

      <div
        className="relative shrink-0"
        style={{
          width: TIMELINE_WIDTH,
        }}
      >
        {HOURS.map((hour) => (
          <div
            key={hour}
            className="absolute top-0 h-full border-l border-slate-200/60"
            style={{
              left: hour * HOUR_WIDTH_PX,
            }}
          />
        ))}

        <span className="absolute left-2 top-2 z-20 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
          Prévu
        </span>

        <div className="absolute left-0 right-0 top-7 h-8">
          <div className="absolute inset-0 rounded-md bg-slate-50" />

          {day.schedule.timeSlots.length === 0 ? (
            <div className="absolute inset-0 flex items-center px-4 text-xs text-slate-400">
              Aucun horaire prévu
            </div>
          ) : (
            day.schedule.timeSlots.map((slot, index) => (
              <TimelineBlock
                key={[
                  "planned",
                  day.date,
                  slot.startTime,
                  slot.endTime,
                  index,
                ].join("-")}
                startTime={slot.startTime}
                endTime={slot.endTime}
                durationMinutes={getTimeIntervalDuration(
                  slot.startTime,
                  slot.endTime,
                )}
                kind={
                  day.schedule.offDay
                    ? "OFF"
                    : slot.work
                      ? "PLANNED_WORK"
                      : "PLANNED_BREAK"
                }
              />
            ))
          )}
        </div>

        <span className="absolute left-2 top-[66px] z-20 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
          Réel
        </span>

        <div className="absolute left-0 right-0 top-[86px] h-8">
          <div className="absolute inset-0 rounded-md bg-slate-50/80" />

          {day.workIntervals.map((interval, index) => (
            <TimelineBlock
              key={["work", day.date, index].join("-")}
              startTime={interval.startTime}
              endTime={interval.endTime}
              durationMinutes={interval.durationMinutes}
              kind="ACTUAL_WORK"
              warning={workIsBelowPlanned}
            />
          ))}

          {day.breakIntervals.map((interval, index) => (
            <TimelineBlock
              key={["break", day.date, index].join("-")}
              startTime={interval.startTime}
              endTime={interval.endTime}
              durationMinutes={interval.durationMinutes}
              kind="ACTUAL_BREAK"
            />
          ))}

          {day.attendances.length === 0 && (
            <div className="absolute inset-0 flex items-center px-4 text-xs text-slate-400">
              Aucun pointage enregistré
            </div>
          )}
        </div>

        {day.attendances.map((attendance) => (
          <AttendanceMarker
            key={attendance.id}
            type={attendance.type}
            time={attendance.time}
            checkpointNumber={attendance.checkpointNumber}
          />
        ))}

        <div className="absolute bottom-3 left-3 flex items-center gap-5 rounded-lg border border-slate-100 bg-white/95 px-3 py-1.5 text-xs shadow-sm">
          <span
            className={[
              "font-semibold",

              workIsBelowPlanned ? "text-red-700" : "text-emerald-700",
            ].join(" ")}
          >
            Travail : {formatDuration(day.totalWorkMinutes)}
          </span>

          <span className="font-semibold text-amber-700">
            Pause : {formatDuration(day.totalBreakMinutes)}
          </span>

          <span className="text-slate-500">
            Travail prévu : {formatDuration(day.schedule.plannedWorkMinutes)}
          </span>

          {!day.schedule.offDay && (
            <span className="text-violet-600">
              Pause prévue : {formatDuration(day.schedule.plannedBreakMinutes)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/*
 * ============================================================
 * BLOC DE LA TIMELINE
 * ============================================================
 */

function TimelineBlock({
  startTime,
  endTime,
  durationMinutes,
  kind,
  warning = false,
}: {
  startTime: string;
  endTime: string;
  durationMinutes: number;
  kind: TimelineBlockKind;
  warning?: boolean;
}) {
  const blockRef = useRef<HTMLDivElement | null>(null);

  const [tooltipVisible, setTooltipVisible] = useState(false);

  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({
    top: 0,
    left: 0,
    placement: "top",
  });

  const left = timeToPixels(startTime);

  const width = getIntervalWidth(startTime, endTime);

  const configuration = getTimelineBlockConfiguration(kind, warning);

  const iconOnly = kind === "PLANNED_BREAK" || kind === "ACTUAL_BREAK";

  const updateTooltipPosition = useCallback(() => {
    const element = blockRef.current;

    if (!element) {
      return;
    }

    const rect = element.getBoundingClientRect();

    const tooltipWidth = 224;

    const tooltipHeight = 145;

    const gap = 10;

    const viewportPadding = 12;

    let tooltipLeft = rect.left + rect.width / 2;

    const halfWidth = tooltipWidth / 2;

    tooltipLeft = Math.max(halfWidth + viewportPadding, tooltipLeft);

    tooltipLeft = Math.min(
      window.innerWidth - halfWidth - viewportPadding,
      tooltipLeft,
    );

    const canDisplayAbove = rect.top > tooltipHeight + gap + viewportPadding;

    if (canDisplayAbove) {
      setTooltipPosition({
        top: rect.top - gap,

        left: tooltipLeft,

        placement: "top",
      });
    } else {
      setTooltipPosition({
        top: rect.bottom + gap,

        left: tooltipLeft,

        placement: "bottom",
      });
    }
  }, []);

  useEffect(() => {
    if (!tooltipVisible) {
      return;
    }

    function handlePositionChange() {
      updateTooltipPosition();
    }

    window.addEventListener("scroll", handlePositionChange, true);

    window.addEventListener("resize", handlePositionChange);

    return () => {
      window.removeEventListener("scroll", handlePositionChange, true);

      window.removeEventListener("resize", handlePositionChange);
    };
  }, [tooltipVisible, updateTooltipPosition]);

  const Icon = configuration.icon;

  return (
    <>
      <div
        ref={blockRef}
        onMouseEnter={() => {
          updateTooltipPosition();

          setTooltipVisible(true);
        }}
        onMouseLeave={() => setTooltipVisible(false)}
        className={[
          "absolute inset-y-0 z-10",
          "flex items-center",
          "justify-center",
          "overflow-hidden",
          "rounded-md",
          "border",
          "px-2",
          "text-[10px]",
          "font-semibold",
          "transition",
          "hover:brightness-[0.98]",
          configuration.className,
        ].join(" ")}
        style={{
          left,

          width,

          minWidth: 2,
        }}
      >
        {iconOnly ? (
          <Icon className="h-4 w-4 shrink-0" />
        ) : width >= 72 ? (
          <div className="flex min-w-0 items-center gap-1.5">
            <Icon className="h-3.5 w-3.5 shrink-0" />

            <span className="truncate">
              {configuration.label} {startTime}–{endTime}
            </span>
          </div>
        ) : (
          <Icon className="h-3.5 w-3.5 shrink-0" />
        )}
      </div>

      {tooltipVisible &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className={[
              "pointer-events-none",
              "fixed z-[9999]",
              "w-56",
              "-translate-x-1/2",

              tooltipPosition.placement === "top" ? "-translate-y-full" : "",

              "rounded-xl",
              "border border-slate-200",
              "bg-white",
              "p-3",
              "shadow-[0_12px_32px_rgba(15,23,42,0.22)]",
            ].join(" ")}
            style={{
              top: tooltipPosition.top,

              left: tooltipPosition.left,
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className={[
                  "flex h-8 w-8",
                  "items-center",
                  "justify-center",
                  "rounded-lg",
                  configuration.iconContainer,
                ].join(" ")}
              >
                <Icon className="h-4 w-4" />
              </div>

              <p className="text-sm font-semibold text-slate-900">
                {configuration.label}
              </p>
            </div>

            <div className="mt-3 space-y-2 text-xs text-slate-500">
              <TooltipRow label="Début" value={startTime} />

              <TooltipRow label="Fin" value={endTime} />

              <TooltipRow
                label="Durée"
                value={formatDuration(durationMinutes)}
              />
            </div>

            <div
              className={[
                "absolute left-1/2",
                "h-2.5 w-2.5",
                "-translate-x-1/2",
                "rotate-45",
                "bg-white",

                tooltipPosition.placement === "top"
                  ? [
                      "top-full",
                      "-translate-y-1/2",
                      "border-b border-r",
                      "border-slate-200",
                    ].join(" ")
                  : [
                      "bottom-full",
                      "translate-y-1/2",
                      "border-l border-t",
                      "border-slate-200",
                    ].join(" "),
              ].join(" ")}
            />
          </div>,

          document.body,
        )}
    </>
  );
}

function getTimelineBlockConfiguration(
  kind: TimelineBlockKind,
  warning = false,
): TimelineBlockConfiguration {
  switch (kind) {
    case "PLANNED_WORK":
      return {
        label: "Travail prévu",

        className: "border-blue-300 bg-blue-100 text-blue-700",

        iconContainer: "bg-blue-50 text-blue-600",

        icon: Clock,
      };

    case "PLANNED_BREAK":
      return {
        label: "Pause prévue",

        className: "border-violet-300 bg-violet-100 text-violet-700",

        iconContainer: "bg-violet-50 text-violet-600",

        icon: Coffee,
      };

    case "ACTUAL_WORK":
      if (warning) {
        return {
          label: "Travail réel inférieur au prévu",

          className: "border-red-400 bg-red-200 text-red-800",

          iconContainer: "bg-red-50 text-red-600",

          icon: Clock,
        };
      }

      return {
        label: "Travail réel",

        className: "border-emerald-400 bg-emerald-200 text-emerald-800",

        iconContainer: "bg-emerald-50 text-emerald-600",

        icon: Clock,
      };

    case "ACTUAL_BREAK":
      return {
        label: "Pause réelle",

        className: "border-amber-400 bg-amber-200 text-amber-800",

        iconContainer: "bg-amber-50 text-amber-600",

        icon: Coffee,
      };

    case "OFF":
    default:
      return {
        label: "Jour non travaillé",

        className: "border-slate-300 bg-slate-100 text-slate-500",

        iconContainer: "bg-slate-100 text-slate-500",

        icon: TimerOff,
      };
  }
}

function AttendanceMarker({
  type,
  time,
  checkpointNumber,
}: {
  type: AttendanceType;
  time: string;
  checkpointNumber: number;
}) {
  const left = timeToPixels(time);

  const isEntry = type === "ENTER";

  return (
    <div
      title={[
        isEntry ? "Entrée" : "Sortie",

        `à ${time}`,

        `— Point ${checkpointNumber}`,
      ].join(" ")}
      className="absolute top-[77px] z-30 -translate-x-1/2"
      style={{
        left,
      }}
    >
      <div
        className={[
          "flex h-5 w-5",
          "items-center",
          "justify-center",
          "rounded-full",
          "border-2 border-white",
          "shadow-sm",

          isEntry ? "bg-emerald-600 text-white" : "bg-orange-500 text-white",
        ].join(" ")}
      >
        {isEntry ? (
          <LogIn className="h-3 w-3" />
        ) : (
          <LogOut className="h-3 w-3" />
        )}
      </div>

      <span
        className={[
          "absolute",
          "left-1/2 top-6",
          "-translate-x-1/2",
          "whitespace-nowrap",
          "rounded",
          "bg-white/95",
          "px-1",
          "text-[9px]",
          "font-semibold",

          isEntry ? "text-emerald-700" : "text-orange-700",
        ].join(" ")}
      >
        {time}
      </span>
    </div>
  );
}

function SummaryBadge({
  icon,
  label,
  className,
  title,
}: {
  icon: ReactNode;
  label: string;
  className: string;
  title: string;
}) {
  return (
    <span
      title={title}
      className={[
        "inline-flex",
        "items-center gap-1.5",
        "rounded-lg",
        "px-2 py-1",
        "text-[11px]",
        "font-semibold",
        className,
      ].join(" ")}
    >
      {icon}

      {label}
    </span>
  );
}

function TooltipRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span>{label}</span>

      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}

type InfoCardProps = {
  icon: ReactNode;
  label: string;
  value: string;

  variant: "blue" | "green" | "orange" | "purple";
};

const INFO_CARD_STYLES = {
  blue: "bg-blue-50 text-blue-600",

  green: "bg-emerald-50 text-emerald-600",

  orange: "bg-amber-50 text-amber-600",

  purple: "bg-violet-50 text-violet-600",
};

function InfoCard({ icon, label, value, variant }: InfoCardProps) {
  return (
    <article className="flex min-h-[74px] items-center gap-3 rounded-2xl bg-white px-5 shadow-[0_4px_20px_rgba(15,23,42,0.04)]">
      <div
        className={[
          "flex h-10 w-10",
          "shrink-0",
          "items-center",
          "justify-center",
          "rounded-xl",
          INFO_CARD_STYLES[variant],
        ].join(" ")}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>

        <p className="mt-0.5 truncate text-sm font-semibold text-slate-800">
          {value}
        </p>
      </div>
    </article>
  );
}

function LegendItem({
  className,
  label,
}: {
  className: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={["h-3.5 w-3.5", "rounded border", className].join(" ")} />

      <span>{label}</span>
    </div>
  );
}

function ScheduleLoader() {
  return (
    <div className="flex h-full min-h-[500px] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-[var(--color-primary)]" />

        <p className="text-sm text-slate-500">Chargement de l’historique...</p>
      </div>
    </div>
  );
}

function ScheduleError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex h-full min-h-[500px] items-center justify-center p-5">
      <div className="text-center">
        <p className="text-sm font-medium text-red-600">{message}</p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-xl bg-app-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}

function ScheduleEmpty() {
  return (
    <div className="flex h-full min-h-[500px] items-center justify-center">
      <div className="text-center">
        <CalendarDays className="mx-auto h-9 w-9 text-slate-300" />

        <p className="mt-3 text-sm text-slate-500">
          Aucun planning disponible pour cet employé.
        </p>
      </div>
    </div>
  );
}
