import { type ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface FormActionsProps {
  visible?: boolean;

  message?: string;

  children: ReactNode;

  sticky?: boolean;

  className?: string;
}

export function FormActions({
  visible = true,
  message,
  children,
  sticky = true,
  className,
}: FormActionsProps) {
  if (!visible) {
    return null;
  }

  return (
    <div
      className={cn(
        sticky && "sticky bottom-4 z-40",
        "mt-6",
        "flex flex-wrap",
        "items-center",
        "justify-between",
        "gap-3",
        "rounded-2xl",
        "border border-slate-200",
        "bg-white/95",
        "px-4 py-3",
        "shadow-[0_14px_40px_rgba(15,23,42,0.16)]",
        "backdrop-blur",
        className,
      )}
    >
      <p className="text-sm font-medium text-slate-600">
        {message ?? "Des modifications ne sont pas encore enregistrées."}
      </p>

      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}
