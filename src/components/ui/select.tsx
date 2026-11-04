"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";

import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/cn";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;

  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    {
      invalid = false,
      className,
      containerClassName,
      disabled,
      children,
      ...props
    },
    ref,
  ) {
    return (
      <div className={cn("relative", "w-full", containerClassName)}>
        <select
          ref={ref}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          className={cn(
            "h-10 w-full",
            "appearance-none",
            "rounded-xl",
            "border",
            "bg-white",
            "px-3 pr-10",
            "text-sm",
            "text-slate-700",
            "outline-none",
            "transition",
            "focus:border-app-primary",
            "focus:ring-2",
            "focus:ring-blue-100",
            "disabled:cursor-not-allowed",
            "disabled:bg-slate-100",
            "disabled:text-slate-400",
            invalid
              ? cn(
                  "border-red-400",
                  "focus:border-red-500",
                  "focus:ring-red-100",
                )
              : "border-slate-200",
            className,
          )}
          {...props}
        >
          {children}
        </select>

        <ChevronDown
          className={cn(
            "pointer-events-none",
            "absolute right-3 top-1/2",
            "h-4 w-4",
            "-translate-y-1/2",
            disabled ? "text-slate-300" : "text-slate-400",
          )}
        />
      </div>
    );
  },
);

Select.displayName = "Select";
