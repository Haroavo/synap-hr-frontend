import { type ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface SettingsSectionProps {
  title: string;

  description?: string;

  icon?: ReactNode;

  children: ReactNode;

  footer?: ReactNode;

  className?: string;

  contentClassName?: string;
}

export function SettingsSection({
  title,
  description,
  icon,
  children,
  footer,
  className,
  contentClassName,
}: SettingsSectionProps) {
  return (
    <section
      className={cn(
        "overflow-hidden",
        "rounded-2xl",
        "border border-slate-200",
        "bg-white",
        "shadow-[0_6px_24px_rgba(15,23,42,0.04)]",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-start gap-3",
          "border-b border-slate-100",
          "px-5 py-4",
          "sm:px-6",
        )}
      >
        {icon && (
          <div
            className={cn(
              "flex h-10 w-10",
              "shrink-0",
              "items-center",
              "justify-center",
              "rounded-xl",
              "bg-blue-50",
              "text-app-primary",
            )}
          >
            {icon}
          </div>
        )}

        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>

          {description && (
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className={cn("p-5 sm:p-6", contentClassName)}>{children}</div>

      {footer && (
        <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
          {footer}
        </div>
      )}
    </section>
  );
}
