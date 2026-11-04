"use client";

import { useId } from "react";

import { cn } from "@/lib/cn";

export interface SwitchProps {
  id?: string;

  checked: boolean;

  onCheckedChange: (checked: boolean) => void;

  label?: string;

  description?: string;

  disabled?: boolean;

  className?: string;
}

export function Switch({
  id,
  checked,
  onCheckedChange,
  label,
  description,
  disabled = false,
  className,
}: SwitchProps) {
  const generatedId = useId();

  const switchId = id ?? generatedId;

  return (
    <div
      className={cn("flex items-center", "justify-between", "gap-4", className)}
    >
      {(label || description) && (
        <div className="min-w-0">
          {label && (
            <label
              htmlFor={switchId}
              className={cn(
                "block text-sm",
                "font-medium",
                disabled ? "text-slate-400" : "text-slate-800",
              )}
            >
              {label}
            </label>
          )}

          {description && (
            <p
              className={cn(
                "mt-1",
                "text-xs leading-5",
                disabled ? "text-slate-300" : "text-slate-500",
              )}
            >
              {description}
            </p>
          )}
        </div>
      )}

      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label ?? "Interrupteur"}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative",
          "h-6 w-11",
          "shrink-0",
          "rounded-full",
          "outline-none",
          "transition",
          "focus-visible:ring-2",
          "focus-visible:ring-app-primary",
          "focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed",
          "disabled:opacity-50",
          checked ? "bg-app-primary" : "bg-slate-300",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5",
            "h-5 w-5",
            "rounded-full",
            "bg-white",
            "shadow-sm",
            "transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}
