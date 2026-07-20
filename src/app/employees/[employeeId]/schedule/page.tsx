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

import { CalendarDays, Clock, Coffee, TimerOff } from "lucide-react";

import { useParams, useRouter } from "next/navigation";

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

type ScheduleTimeSlot = {
  startTime: string;
  endTime: string;
  work: boolean;
};

type ScheduleDay = {
  day: DayOfWeek;
  timeSlots: ScheduleTimeSlot[];
};

type EmployeeSchedule = {
  _id: string;
  employeeId: string;
  timezone: string;
  active: boolean;
  days: ScheduleDay[];
  createdAt?: string;
  updatedAt?: string;
};

type TooltipPosition = {
  top: number;
  left: number;
  placement: "top" | "bottom";
};

/*
 * ============================================================
 * CONFIGURATION
 * ============================================================
 */

const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: "Lundi",
  TUESDAY: "Mardi",
  WEDNESDAY: "Mercredi",
  THURSDAY: "Jeudi",
  FRIDAY: "Vendredi",
  SATURDAY: "Samedi",
  SUNDAY: "Dimanche",
};

const DAY_ORDER: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

/*
 * 1 heure = 60 px
 *
 * 24 heures = 1440 px
 */
const HOUR_WIDTH_PX = 60;

const HOURS = Array.from(
  {
    length: 25,
  },
  (_, index) => index,
);

/*
 * ============================================================
 * UTILITAIRES
 * ============================================================
 */

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
}

function timeToHour(time: string): number {
  return timeToMinutes(time) / 60;
}

function getDurationMinutes(startTime: string, endTime: string): number {
  const start = timeToMinutes(startTime);

  let end = timeToMinutes(endTime);

  /*
   * Pour les jours non travaillés :
   *
   * 00:00 -> 23:59
   *
   * On considère 23:59 comme 24:00
   * pour l'affichage.
   */
  if (endTime === "23:59") {
    end = 24 * 60;
  }

  return Math.max(0, end - start);
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);

  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} min`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}min`;
}

function isOffDay(timeSlots: ScheduleTimeSlot[]): boolean {
  if (timeSlots.length === 0) {
    return true;
  }

  return timeSlots.every((slot) => !slot.work);
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

  const [schedule, setSchedule] = useState<EmployeeSchedule | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  /*
   * ============================================================
   * CHARGEMENT DU PLANNING
   * ============================================================
   */

  const loadSchedule = useCallback(
    async (signal?: AbortSignal) => {
      if (!employeeId) {
        return;
      }

      try {
        setLoading(true);

        setError(null);

        const response = await fetch(`/api/employee-schedules/${employeeId}`, {
          method: "GET",

          cache: "no-store",

          signal,
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message ?? "Impossible de récupérer le planning.",
          );
        }

        setSchedule(data);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setError(
          error instanceof Error ? error.message : "Une erreur est survenue.",
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [employeeId],
  );

  useEffect(() => {
    const controller = new AbortController();

    void loadSchedule(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadSchedule]);

  /*
   * Toujours afficher les jours
   * dans l'ordre lundi -> dimanche.
   */
  const orderedDays = useMemo(() => {
    if (!schedule) {
      return [];
    }

    return DAY_ORDER.map((day) => {
      const existingDay = schedule.days.find(
        (scheduleDay) => scheduleDay.day === day,
      );

      return (
        existingDay ?? {
          day,
          timeSlots: [],
        }
      );
    });
  }, [schedule]);

  /*
   * ============================================================
   * ÉTATS DE LA PAGE
   * ============================================================
   */

  if (loading) {
    return <ScheduleLoader />;
  }

  if (error) {
    return (
      <ScheduleError message={error} onRetry={() => void loadSchedule()} />
    );
  }

  if (!schedule) {
    return <ScheduleEmpty />;
  }

  /*
   * ============================================================
   * RENDU PRINCIPAL
   * ============================================================
   */

  return (
    <div className="flex h-full min-h-0 flex-col p-5 lg:p-7">
      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <header className="mb-5 shrink-0">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs text-app-muted">
              Employés
              <span className="mx-2">›</span>
              Planning
            </p>

            <h1 className="mt-2 text-2xl font-bold text-app-text">
              Planning de l&apos;employé
            </h1>

            <p className="mt-1 text-sm text-app-muted">
              Horaires de travail hebdomadaires
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.back()}
            className={[
              "h-10",
              "rounded-xl",
              "border",
              "border-slate-200",
              "bg-white",
              "px-4",
              "text-sm",
              "font-medium",
              "text-slate-600",
              "transition",
              "hover:bg-slate-50",
              "hover:text-slate-900",
            ].join(" ")}
          >
            Retour
          </button>
        </div>
      </header>

      {/* ====================================================== */}
      {/* INFORMATIONS */}
      {/* ====================================================== */}

      <section className="mb-5 grid shrink-0 gap-3 md:grid-cols-3">
        <InfoCard
          icon={<CalendarDays className="h-5 w-5" />}
          label="Planning"
          value="Hebdomadaire"
          variant="blue"
        />

        <InfoCard
          icon={<Clock className="h-5 w-5" />}
          label="Fuseau horaire"
          value={schedule.timezone}
          variant="purple"
        />

        <InfoCard
          icon={<Clock className="h-5 w-5" />}
          label="Statut"
          value={schedule.active ? "Actif" : "Inactif"}
          variant={schedule.active ? "green" : "gray"}
        />
      </section>

      {/* ====================================================== */}
      {/* PLANNING */}
      {/* ====================================================== */}

      <section
        className={[
          "relative",
          "flex",
          "min-h-0",
          "flex-1",
          "flex-col",
          "overflow-hidden",
          "rounded-2xl",
          "border",
          "border-slate-200",
          "bg-white",
          "shadow-[0_8px_30px_rgba(15,23,42,0.04)]",
        ].join(" ")}
      >
        {/* ==================================================== */}
        {/* TITRE DU PLANNING */}
        {/* ==================================================== */}

        <div className="flex min-h-[70px] shrink-0 items-center px-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Horaires prévus
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Planning hebdomadaire de l&apos;employé
            </p>
          </div>
        </div>

        {/* ==================================================== */}
        {/* ZONE SCROLLABLE */}
        {/* ==================================================== */}

        <div className="relative min-h-0 flex-1 overflow-auto">
          <div className="relative min-w-[1640px]">
            {/* ================================================= */}
            {/* HEADER DES HEURES */}
            {/* ================================================= */}

            <div
              className={[
                "sticky",
                "top-0",
                "z-20",
                "flex",
                "border-y",
                "border-slate-100",
                "bg-slate-50",
              ].join(" ")}
            >
              {/* Colonne jour */}

              <div
                className={[
                  "sticky",
                  "left-0",
                  "z-30",
                  "flex",
                  "w-44",
                  "shrink-0",
                  "items-center",
                  "bg-slate-50",
                  "px-5",
                  "text-xs",
                  "font-medium",
                  "text-slate-500",
                ].join(" ")}
              >
                Jour
              </div>

              {/* Horaires */}

              <div
                className="relative h-12"
                style={{
                  width: 24 * HOUR_WIDTH_PX,
                }}
              >
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className={[
                      "absolute",
                      "top-0",
                      "flex",
                      "h-12",
                      "items-center",
                      "border-l",
                      "border-slate-200",
                      "pl-1",
                      "text-[11px]",
                      "text-slate-400",
                    ].join(" ")}
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

            {/* ================================================= */}
            {/* JOURS */}
            {/* ================================================= */}

            {orderedDays.map((scheduleDay) => (
              <ScheduleDayRow key={scheduleDay.day} scheduleDay={scheduleDay} />
            ))}
          </div>
        </div>

        {/* ==================================================== */}
        {/* LÉGENDE */}
        {/* ==================================================== */}

        <div
          className={[
            "relative",
            "z-10",
            "flex",
            "shrink-0",
            "flex-wrap",
            "items-center",
            "gap-6",
            "border-t",
            "border-slate-100",
            "bg-white",
            "px-6",
            "py-4",
          ].join(" ")}
        >
          <LegendItem
            className="border-blue-400 bg-blue-200"
            label="Temps de travail"
          />

          <LegendItem
            className="border-amber-400 bg-amber-200"
            label="Temps de pause"
          />

          <LegendItem
            className="border-slate-300 bg-slate-100"
            label="Jour non travaillé"
          />
        </div>
      </section>
    </div>
  );
}

/*
 * ============================================================
 * LIGNE D'UN JOUR
 * ============================================================
 */

type ScheduleDayRowProps = {
  scheduleDay: ScheduleDay;
};

function ScheduleDayRow({ scheduleDay }: ScheduleDayRowProps) {
  const offDay = isOffDay(scheduleDay.timeSlots);

  return (
    <div
      className={[
        "relative",
        "flex",
        "min-h-[82px]",
        "border-b",
        "border-slate-100",
        "last:border-b-0",
      ].join(" ")}
    >
      {/* ====================================================== */}
      {/* NOM DU JOUR */}
      {/* ====================================================== */}

      <div
        className={[
          "sticky",
          "left-0",
          "z-10",
          "flex",
          "w-44",
          "shrink-0",
          "items-center",
          "gap-3",
          "bg-white",
          "px-5",
        ].join(" ")}
      >
        <div
          className={[
            "flex",
            "h-9",
            "w-9",
            "shrink-0",
            "items-center",
            "justify-center",
            "rounded-xl",

            offDay ? "bg-slate-100 text-slate-400" : "bg-blue-50 text-blue-600",
          ].join(" ")}
        >
          {offDay ? (
            <TimerOff className="h-4 w-4" />
          ) : (
            <CalendarDays className="h-4 w-4" />
          )}
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-800">
            {DAY_LABELS[scheduleDay.day]}
          </p>

          <p className="mt-0.5 text-[11px] text-slate-400">
            {offDay ? "Non travaillé" : "Jour travaillé"}
          </p>
        </div>
      </div>

      {/* ====================================================== */}
      {/* TIMELINE DU JOUR */}
      {/* ====================================================== */}

      <div
        className="relative my-4 h-12"
        style={{
          width: 24 * HOUR_WIDTH_PX,
        }}
      >
        {/* Background */}

        <div className="absolute inset-0 rounded-lg bg-slate-50" />

        {/* Grille horaire */}

        {Array.from(
          {
            length: 25,
          },
          (_, index) => index,
        ).map((hour) => (
          <div
            key={hour}
            className="absolute top-0 h-full border-l border-slate-200/70"
            style={{
              left: hour * HOUR_WIDTH_PX,
            }}
          />
        ))}

        {/* Blocs horaires */}

        {scheduleDay.timeSlots.map((slot, index) => (
          <ScheduleBlock
            key={`${scheduleDay.day}-${slot.startTime}-${slot.endTime}-${index}`}
            slot={slot}
            offDay={offDay}
          />
        ))}
      </div>
    </div>
  );
}

/*
 * ============================================================
 * BLOC HORAIRE
 * ============================================================
 */

type ScheduleBlockProps = {
  slot: ScheduleTimeSlot;
  offDay: boolean;
};

function ScheduleBlock({ slot, offDay }: ScheduleBlockProps) {
  const blockRef = useRef<HTMLDivElement | null>(null);

  const [tooltipVisible, setTooltipVisible] = useState(false);

  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({
    top: 0,
    left: 0,
    placement: "top",
  });

  /*
   * ============================================================
   * CALCUL DU BLOC
   * ============================================================
   */

  const startHour = timeToHour(slot.startTime);

  let endHour = timeToHour(slot.endTime);

  /*
   * 23:59 est affiché comme 24:00.
   */
  if (slot.endTime === "23:59") {
    endHour = 24;
  }

  const startPx = startHour * HOUR_WIDTH_PX;

  const widthPx = Math.max(2, (endHour - startHour) * HOUR_WIDTH_PX);

  const duration = getDurationMinutes(slot.startTime, slot.endTime);

  /*
   * ============================================================
   * STYLE DU BLOC
   * ============================================================
   */

  let blockStyle = "";

  let label = "";

  let Icon = Clock;

  if (offDay) {
    blockStyle = "border-slate-300 bg-slate-100 text-slate-500";

    label = "Jour non travaillé";

    Icon = TimerOff;
  } else if (slot.work) {
    blockStyle = "border-blue-400 bg-blue-200 text-blue-700";

    label = "Travail";

    Icon = Clock;
  } else {
    blockStyle = "border-amber-400 bg-amber-200 text-amber-700";

    label = "Pause";

    Icon = Coffee;
  }

  /*
   * ============================================================
   * POSITIONNEMENT DU TOOLTIP
   * ============================================================
   */

  const updateTooltipPosition = useCallback(() => {
    const element = blockRef.current;

    if (!element) {
      return;
    }

    const rect = element.getBoundingClientRect();

    /*
     * Largeur du tooltip :
     *
     * w-52 = 208px
     */
    const tooltipWidth = 208;

    /*
     * Hauteur approximative.
     */
    const tooltipHeight = offDay ? 100 : 135;

    const gap = 10;

    const viewportPadding = 12;

    /*
     * Centre horizontal du bloc.
     */
    let left = rect.left + rect.width / 2;

    const halfWidth = tooltipWidth / 2;

    /*
     * Empêche le tooltip de sortir
     * à gauche de l'écran.
     */
    left = Math.max(halfWidth + viewportPadding, left);

    /*
     * Empêche le tooltip de sortir
     * à droite de l'écran.
     */
    left = Math.min(window.innerWidth - halfWidth - viewportPadding, left);

    /*
     * Vérifie si le tooltip peut
     * être affiché au-dessus.
     */
    const canDisplayAbove = rect.top > tooltipHeight + gap + viewportPadding;

    if (canDisplayAbove) {
      setTooltipPosition({
        /*
         * Le bottom du tooltip sera
         * placé juste au-dessus du bloc.
         */
        top: rect.top - gap,

        left,

        placement: "top",
      });
    } else {
      /*
       * Pas assez de place au-dessus :
       * affichage sous le bloc.
       */
      setTooltipPosition({
        top: rect.bottom + gap,

        left,

        placement: "bottom",
      });
    }
  }, [offDay]);

  /*
   * ============================================================
   * HOVER
   * ============================================================
   */

  function handleMouseEnter() {
    updateTooltipPosition();

    setTooltipVisible(true);
  }

  function handleMouseLeave() {
    setTooltipVisible(false);
  }

  /*
   * ============================================================
   * RECALCUL LORS DU SCROLL / RESIZE
   * ============================================================
   */

  useEffect(() => {
    if (!tooltipVisible) {
      return;
    }

    function handlePositionChange() {
      updateTooltipPosition();
    }

    /*
     * true permet aussi de détecter
     * le scroll des conteneurs internes.
     */
    window.addEventListener("scroll", handlePositionChange, true);

    window.addEventListener("resize", handlePositionChange);

    return () => {
      window.removeEventListener("scroll", handlePositionChange, true);

      window.removeEventListener("resize", handlePositionChange);
    };
  }, [tooltipVisible, updateTooltipPosition]);

  return (
    <>
      {/* ====================================================== */}
      {/* BLOC DU PLANNING */}
      {/* ====================================================== */}

      <div
        ref={blockRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={[
          "absolute",

          "top-1",

          "bottom-1",

          "z-10",

          "flex",

          "items-center",

          "justify-center",

          "rounded-md",

          "border",

          "transition",

          blockStyle,
        ].join(" ")}
        style={{
          left: startPx,

          width: widthPx,

          minWidth: "2px",
        }}
      >
        {/* Texte dans le bloc */}

        {widthPx > 100 && (
          <div
            className={[
              "flex",
              "items-center",
              "gap-1.5",
              "whitespace-nowrap",
              "px-2",
              "text-xs",
              "font-medium",
            ].join(" ")}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />

            <span>{label}</span>

            {!offDay && (
              <span className="opacity-70">
                {slot.startTime}

                {" - "}

                {slot.endTime}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ====================================================== */}
      {/* TOOLTIP AVEC REACT PORTAL */}
      {/* ====================================================== */}

      {tooltipVisible &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className={[
              /*
               * fixed :
               *
               * le tooltip est positionné
               * relativement au viewport.
               */
              "fixed",

              /*
               * Le tooltip passe devant
               * tous les éléments du planning.
               */
              "z-[9999]",

              "w-52",

              /*
               * Centre horizontal.
               */
              "-translate-x-1/2",

              /*
               * Si placement = top,
               * on déplace toute la hauteur
               * du tooltip vers le haut.
               */
              tooltipPosition.placement === "top" ? "-translate-y-full" : "",

              "rounded-xl",

              "border",

              "border-slate-200",

              "bg-white",

              "p-3",

              "text-left",

              "shadow-[0_12px_32px_rgba(15,23,42,0.22)]",

              /*
               * Le tooltip ne bloque pas
               * les événements souris.
               */
              "pointer-events-none",
            ].join(" ")}
            style={{
              top: tooltipPosition.top,

              left: tooltipPosition.left,
            }}
          >
            {/* Header tooltip */}

            <div className="flex items-center gap-2">
              <div
                className={[
                  "flex",

                  "h-7",

                  "w-7",

                  "shrink-0",

                  "items-center",

                  "justify-center",

                  "rounded-lg",

                  offDay
                    ? "bg-slate-100 text-slate-500"
                    : slot.work
                      ? "bg-blue-50 text-blue-600"
                      : "bg-amber-50 text-amber-600",
                ].join(" ")}
              >
                <Icon className="h-4 w-4" />
              </div>

              <p className="text-sm font-semibold text-slate-900">{label}</p>
            </div>

            {/* Informations */}

            <div className="mt-3 space-y-2 text-xs text-slate-500">
              <TooltipRow label="Début" value={slot.startTime} />

              <TooltipRow label="Fin" value={slot.endTime} />

              {!offDay && (
                <TooltipRow label="Durée" value={formatDuration(duration)} />
              )}
            </div>

            {/* ================================================== */}
            {/* FLÈCHE DU TOOLTIP */}
            {/* ================================================== */}

            <div
              className={[
                "absolute",

                "left-1/2",

                "h-2.5",

                "w-2.5",

                "-translate-x-1/2",

                "rotate-45",

                "bg-white",

                tooltipPosition.placement === "top"
                  ? [
                      /*
                       * Tooltip au-dessus :
                       * flèche vers le bas.
                       */
                      "top-full",

                      "-translate-y-1/2",

                      "border-b",

                      "border-r",

                      "border-slate-200",
                    ].join(" ")
                  : [
                      /*
                       * Tooltip en dessous :
                       * flèche vers le haut.
                       */
                      "bottom-full",

                      "translate-y-1/2",

                      "border-l",

                      "border-t",

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

/*
 * ============================================================
 * LIGNE DU TOOLTIP
 * ============================================================
 */

type TooltipRowProps = {
  label: string;
  value: string;
};

function TooltipRow({ label, value }: TooltipRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span>{label}</span>

      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}

/*
 * ============================================================
 * INFO CARD
 * ============================================================
 */

type InfoCardProps = {
  icon: ReactNode;

  label: string;

  value: string;

  variant: "blue" | "green" | "purple" | "gray";
};

const infoCardStyles = {
  blue: "bg-blue-50 text-blue-600",

  green: "bg-emerald-50 text-emerald-600",

  purple: "bg-violet-50 text-violet-600",

  gray: "bg-slate-100 text-slate-500",
};

function InfoCard({ icon, label, value, variant }: InfoCardProps) {
  return (
    <article
      className={[
        "flex",

        "min-h-[72px]",

        "items-center",

        "gap-3",

        "rounded-xl",

        "bg-white",

        "px-5",

        "shadow-[0_4px_20px_rgba(15,23,42,0.04)]",
      ].join(" ")}
    >
      <div
        className={[
          "flex",

          "h-10",

          "w-10",

          "shrink-0",

          "items-center",

          "justify-center",

          "rounded-lg",

          infoCardStyles[variant],
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

/*
 * ============================================================
 * LÉGENDE
 * ============================================================
 */

type LegendItemProps = {
  className: string;
  label: string;
};

function LegendItem({ className, label }: LegendItemProps) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-600">
      <div
        className={["h-4", "w-4", "rounded", "border", className].join(" ")}
      />

      <span>{label}</span>
    </div>
  );
}

/*
 * ============================================================
 * LOADER
 * ============================================================
 */

function ScheduleLoader() {
  return (
    <div className="flex h-full min-h-[500px] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div
          className={[
            "h-7",

            "w-7",

            "animate-spin",

            "rounded-full",

            "border-2",

            "border-slate-200",

            "border-t-[var(--color-primary)]",
          ].join(" ")}
        />

        <p className="text-sm text-slate-500">Chargement du planning...</p>
      </div>
    </div>
  );
}

/*
 * ============================================================
 * ERREUR
 * ============================================================
 */

function ScheduleError({
  message,
  onRetry,
}: {
  message: string;

  onRetry: () => void;
}) {
  return (
    <div className="flex h-full min-h-[500px] items-center justify-center">
      <div className="text-center">
        <p className="text-sm font-medium text-red-600">{message}</p>

        <button
          type="button"
          onClick={onRetry}
          className={[
            "mt-4",

            "rounded-xl",

            "bg-app-primary",

            "px-4",

            "py-2",

            "text-sm",

            "font-medium",

            "text-white",

            "transition",

            "hover:opacity-90",
          ].join(" ")}
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}

/*
 * ============================================================
 * AUCUNE DONNÉE
 * ============================================================
 */

function ScheduleEmpty() {
  return (
    <div className="flex h-full min-h-[500px] items-center justify-center">
      <div className="text-center">
        <CalendarDays className="mx-auto h-8 w-8 text-slate-300" />

        <p className="mt-3 text-sm text-slate-500">
          Aucun planning disponible pour cet employé.
        </p>
      </div>
    </div>
  );
}
