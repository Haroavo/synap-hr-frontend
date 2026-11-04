import type { ReactNode } from "react";

export type StatusBadgeVariant =
  | "success"
  | "warning"
  | "info"
  | "danger"
  | "neutral"
  | "purple"
  | "pink";

type StatusBadgeProps = {
  children: ReactNode;
  variant?: StatusBadgeVariant;
  dot?: boolean;
};

const variantStyles: Record<StatusBadgeVariant, string> = {
  success: "bg-emerald-50 text-emerald-600",

  warning: "bg-amber-50 text-amber-600",

  info: "bg-blue-50 text-blue-600",

  danger: "bg-red-50 text-red-600",

  neutral: "bg-slate-100 text-slate-600",

  purple: "bg-violet-50 text-violet-600",

  pink: "bg-pink-50 text-pink-600",
};

export function StatusBadge({
  children,
  variant = "neutral",
  dot = false,
}: StatusBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5",
        "rounded-md px-2 py-1",
        "text-[11px] font-semibold",
        variantStyles[variant],
      ].join(" ")}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}

      {children}
    </span>
  );
}
