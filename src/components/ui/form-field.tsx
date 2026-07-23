import { type ReactNode } from "react";

import { AlertCircle } from "lucide-react";

import { cn } from "@/lib/cn";

export interface FormFieldProps {
  label: string;

  htmlFor?: string;

  required?: boolean;

  hint?: string;

  error?: string | null;

  children: ReactNode;

  className?: string;
}

export function FormField({
  label,
  htmlFor,
  required = false,
  hint,
  error,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("w-full", className)}>
      <label
        htmlFor={htmlFor}
        className={cn("mb-1.5 block", "text-xs font-medium", "text-slate-600")}
      >
        {label}

        {required && (
          <span className="ml-1 text-red-500" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {children}

      {error ? (
        <p
          role="alert"
          className={cn(
            "mt-1.5",
            "flex items-center gap-1.5",
            "text-xs",
            "text-red-600",
          )}
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />

          {error}
        </p>
      ) : (
        hint && (
          <p className="mt-1.5 text-[11px] leading-4 text-slate-400">{hint}</p>
        )
      )}
    </div>
  );
}
