"use client";

import { useId } from "react";

import { Check } from "lucide-react";

import { cn } from "@/lib/cn";

export interface CheckboxProps {
  id?: string;

  checked: boolean;

  onCheckedChange: (checked: boolean) => void;

  label?: string;

  description?: string;

  disabled?: boolean;

  className?: string;
}

export function Checkbox({
  id,
  checked,
  onCheckedChange,
  label,
  description,
  disabled = false,
  className,
}: CheckboxProps) {
  const generatedId = useId();

  const checkboxId = id ?? generatedId;

  return (
    <label
      htmlFor={checkboxId}
      className={cn(
        "flex items-start gap-3",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        className,
      )}
    >
      <input
        id={checkboxId}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onCheckedChange(event.target.checked)}
        className="sr-only"
      />

      <span
        className={cn(
          "mt-0.5",
          "flex h-5 w-5",
          "shrink-0",
          "items-center",
          "justify-center",
          "rounded-md",
          "border",
          "transition",
          checked
            ? cn("border-app-primary", "bg-app-primary", "text-white")
            : cn("border-slate-300", "bg-white", "text-transparent"),
        )}
      >
        <Check className="h-3.5 w-3.5" />
      </span>

      {(label || description) && (
        <span className="min-w-0">
          {label && (
            <span className="block text-sm font-medium text-slate-800">
              {label}
            </span>
          )}

          {description && (
            <span className="mt-1 block text-xs leading-5 text-slate-500">
              {description}
            </span>
          )}
        </span>
      )}
    </label>
  );
}
