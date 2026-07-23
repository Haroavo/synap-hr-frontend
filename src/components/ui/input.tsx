"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface InputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  invalid?: boolean;

  startIcon?: ReactNode;

  endIcon?: ReactNode;

  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    invalid = false,
    startIcon,
    endIcon,
    containerClassName,
    className,
    disabled,
    ...props
  },
  ref,
) {
  return (
    <div className={cn("relative", "w-full", containerClassName)}>
      {startIcon && (
        <span
          className={cn(
            "pointer-events-none",
            "absolute inset-y-0 left-3",
            "flex items-center",
            "text-slate-400",
          )}
        >
          {startIcon}
        </span>
      )}

      <input
        ref={ref}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        className={cn(
          "h-10 w-full",
          "rounded-xl",
          "border",
          "bg-white",
          "px-3",
          "text-sm",
          "text-slate-700",
          "outline-none",
          "transition",
          "placeholder:text-slate-400",
          "focus:border-app-primary",
          "focus:ring-2",
          "focus:ring-blue-100",
          "disabled:cursor-not-allowed",
          "disabled:bg-slate-100",
          "disabled:text-slate-400",
          invalid
            ? cn("border-red-400", "focus:border-red-500", "focus:ring-red-100")
            : "border-slate-200",
          startIcon && "pl-10",
          endIcon && "pr-10",
          className,
        )}
        {...props}
      />

      {endIcon && (
        <span
          className={cn(
            "absolute inset-y-0 right-3",
            "flex items-center",
            "text-slate-400",
          )}
        >
          {endIcon}
        </span>
      )}
    </div>
  );
});

Input.displayName = "Input";
