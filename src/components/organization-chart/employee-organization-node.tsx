"use client";

import { memo } from "react";

import {
  BriefcaseBusiness,
  Building2,
  ChevronRight,
  IdCard,
  UsersRound,
} from "lucide-react";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";

import { useRouter } from "next/navigation";

import {
  type OrganizationEmployee,
  type OrganizationEmployeeStatus,
} from "@/types/organization-chart";

export type OrganizationDirection = "TB" | "LR";

/*
 * Ces dimensions sont aussi utilisées par Dagre.
 * La carte réelle et la disposition restent synchronisées.
 */
export const EMPLOYEE_NODE_WIDTH = 270;
export const EMPLOYEE_NODE_HEIGHT = 204;

export type EmployeeOrganizationNodeData = OrganizationEmployee & {
  direction: OrganizationDirection;
  highlighted: boolean;
  directReports: number;
  isRoot: boolean;
};

export type EmployeeOrganizationNode = Node<
  EmployeeOrganizationNodeData,
  "employee"
>;

const statusConfiguration: Record<
  OrganizationEmployeeStatus,
  {
    label: string;
    container: string;
    dot: string;
  }
> = {
  ACTIVE: {
    label: "Actif",
    container: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },

  INACTIVE: {
    label: "Inactif",
    container: "border-slate-200 bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
  },

  SUSPENDED: {
    label: "Suspendu",
    container: "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },

  DEPARTED: {
    label: "Parti",
    container: "border-red-200 bg-red-50 text-red-700",
    dot: "bg-red-500",
  },
};

function getInitials(firstName: string, lastName: string): string {
  const firstInitial = firstName?.charAt(0) ?? "";

  const lastInitial = lastName?.charAt(0) ?? "";

  return `${firstInitial}${lastInitial}`.toUpperCase();
}

function EmployeeOrganizationNodeComponent({
  data,
}: NodeProps<EmployeeOrganizationNode>) {
  const router = useRouter();

  const targetPosition = data.direction === "TB" ? Position.Top : Position.Left;

  const sourcePosition =
    data.direction === "TB" ? Position.Bottom : Position.Right;

  const status = statusConfiguration[data.status];

  return (
    <div
      className={[
        "relative",
        "overflow-visible",
        "rounded-[18px]",
        "border bg-white",
        "shadow-[0_8px_24px_rgba(15,23,42,0.08)]",
        "transition-all",

        data.isRoot
          ? "border-blue-300 ring-4 ring-blue-50"
          : "border-slate-200",

        data.highlighted
          ? [
              "border-app-primary",
              "ring-4",
              "ring-[color-mix(in_srgb,var(--color-primary)_18%,transparent)]",
              "shadow-[0_12px_35px_color-mix(in_srgb,var(--color-primary)_20%,transparent)]",
            ].join(" ")
          : "",
      ].join(" ")}
      style={{
        width: EMPLOYEE_NODE_WIDTH,
        minHeight: EMPLOYEE_NODE_HEIGHT,
      }}
    >
      {/* Pas de connecteur supérieur pour le PDG */}

      {!data.isRoot && (
        <Handle
          type="target"
          position={targetPosition}
          style={{
            width: 9,
            height: 9,
            border: "2px solid white",
            background: "var(--color-primary)",
          }}
        />
      )}

      <button
        type="button"
        aria-label={`Consulter le profil de ${data.fullName}`}
        onClick={() => router.push(`/employees/${data.id}`)}
        className={[
          "nodrag group",
          "flex min-h-[204px]",
          "w-full flex-col",
          "rounded-[18px]",
          "p-3.5",
          "text-left",
          "outline-none",
          "transition",
          "focus-visible:ring-2",
          "focus-visible:ring-app-primary",
        ].join(" ")}
      >
        {/* Identité */}

        <div className="flex items-start gap-3">
          <div
            className={[
              "flex h-12 w-12",
              "shrink-0",
              "items-center",
              "justify-center",
              "overflow-hidden",
              "rounded-xl",
              "bg-blue-50",
              "text-xs font-bold",
              "text-app-primary",
            ].join(" ")}
          >
            {data.profilePictureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.profilePictureUrl}
                alt={data.fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              getInitials(data.firstName, data.lastName)
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p
                  title={data.fullName}
                  className="truncate text-[13px] font-bold text-slate-900"
                >
                  {data.fullName}
                </p>

                <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400">
                  <IdCard className="h-3.5 w-3.5 shrink-0" />

                  <span className="truncate">{data.badgeNumber}</span>
                </div>
              </div>

              <ChevronRight
                className={[
                  "mt-0.5 h-4 w-4",
                  "shrink-0",
                  "text-slate-300",
                  "transition",
                  "group-hover:translate-x-0.5",
                  "group-hover:text-app-primary",
                ].join(" ")}
              />
            </div>

            <span
              className={[
                "mt-2 inline-flex",
                "items-center gap-1.5",
                "rounded-full border",
                "px-2 py-0.5",
                "text-[9px]",
                "font-semibold",
                status.container,
              ].join(" ")}
            >
              <span
                className={["h-1.5 w-1.5", "rounded-full", status.dot].join(
                  " ",
                )}
              />

              {status.label}
            </span>
          </div>
        </div>

        {/* Affectation */}

        <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-600">
            <BriefcaseBusiness className="h-3.5 w-3.5 shrink-0 text-violet-500" />

            <span
              title={data.position?.title ?? "Poste non attribué"}
              className="truncate font-medium"
            >
              {data.position?.title ?? "Poste non attribué"}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Building2 className="h-3.5 w-3.5 shrink-0 text-blue-500" />

            <span
              title={data.department?.name ?? "Département non attribué"}
              className="truncate"
            >
              {data.department?.name ?? "Département non attribué"}
            </span>
          </div>
        </div>

        {/* Collaborateurs */}

        <div className="mt-auto pt-3">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-2.5 py-2">
            <div className="flex min-w-0 items-center gap-1.5 text-[10px] text-slate-500">
              <UsersRound className="h-3.5 w-3.5 shrink-0 text-app-primary" />

              <span className="truncate">Collaborateurs directs</span>
            </div>

            <span className="ml-2 text-[11px] font-bold text-slate-800">
              {data.directReports}
            </span>
          </div>
        </div>
      </button>

      {/* Connecteur inférieur seulement si la personne supervise quelqu’un */}

      {data.directReports > 0 && (
        <Handle
          type="source"
          position={sourcePosition}
          style={{
            width: 9,
            height: 9,
            border: "2px solid white",
            background: "var(--color-primary)",
          }}
        />
      )}
    </div>
  );
}

export const EmployeeOrganizationNode = memo(EmployeeOrganizationNodeComponent);
