"use client";

import { type ReactNode } from "react";

import {
  AlertCircle,
  CheckCircle2,
  Info,
  TriangleAlert,
  X,
} from "lucide-react";

import { cn } from "@/lib/cn";

export type AlertVariant = "info" | "success" | "warning" | "error";

export interface AlertProps {
  variant?: AlertVariant;

  title?: string;

  children: ReactNode;

  onClose?: () => void;

  className?: string;
}

const ALERT_STYLES: Record<
  AlertVariant,
  {
    container: string;
    icon: string;
    defaultIcon: ReactNode;
  }
> = {
  info: {
    container: "border-blue-100 bg-blue-50 text-blue-700",

    icon: "text-blue-600",

    defaultIcon: <Info className="h-4 w-4" />,
  },

  success: {
    container: "border-emerald-100 bg-emerald-50 text-emerald-700",

    icon: "text-emerald-600",

    defaultIcon: <CheckCircle2 className="h-4 w-4" />,
  },

  warning: {
    container: "border-amber-100 bg-amber-50 text-amber-700",

    icon: "text-amber-600",

    defaultIcon: <TriangleAlert className="h-4 w-4" />,
  },

  error: {
    container: "border-red-100 bg-red-50 text-red-700",

    icon: "text-red-600",

    defaultIcon: <AlertCircle className="h-4 w-4" />,
  },
};

export function Alert({
  variant = "info",
  title,
  children,
  onClose,
  className,
}: AlertProps) {
  const style = ALERT_STYLES[variant];

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3",
        "rounded-xl",
        "border",
        "px-4 py-3",
        "text-sm",
        style.container,
        className,
      )}
    >
      <span className={cn("mt-0.5 shrink-0", style.icon)}>
        {style.defaultIcon}
      </span>

      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}

        <div className={cn("leading-5", title && "mt-1 text-xs")}>
          {children}
        </div>
      </div>

      {onClose && (
        <button
          type="button"
          aria-label="Fermer"
          onClick={onClose}
          className="shrink-0 rounded-md p-1 transition hover:bg-black/5"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
