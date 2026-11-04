import { type HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "purple";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const BADGE_CLASSES: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-600",

  primary: "bg-blue-50 text-app-primary",

  success: "bg-emerald-50 text-emerald-700",

  warning: "bg-amber-50 text-amber-700",

  danger: "bg-red-50 text-red-700",

  purple: "bg-violet-50 text-violet-700",
};

export function Badge({
  variant = "default",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex",
        "items-center",
        "rounded-full",
        "px-2.5 py-1",
        "text-[11px]",
        "font-semibold",
        BADGE_CLASSES[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
