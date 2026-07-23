"use client";

import { type ReactNode } from "react";

import { Check } from "lucide-react";

import { cn } from "@/lib/cn";

export interface ChoiceCardProps {
  selected: boolean;

  title: string;

  description?: string;

  icon?: ReactNode;

  onClick: () => void;

  disabled?: boolean;

  className?: string;
}

export function ChoiceCard({
  selected,
  title,
  description,
  icon,
  onClick,
  disabled = false,
  className,
}: ChoiceCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "relative",
        "min-h-28",
        "w-full",
        "rounded-xl",
        "border",
        "p-4",
        "text-left",
        "outline-none",
        "transition",
        "focus-visible:ring-2",
        "focus-visible:ring-app-primary",
        "focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed",
        "disabled:opacity-50",
        selected
          ? cn(
              "border-app-primary",
              "bg-blue-50/70",
              "ring-1",
              "ring-app-primary",
            )
          : cn(
              "border-slate-200",
              "bg-white",
              "hover:border-slate-300",
              "hover:bg-slate-50",
            ),
        className,
      )}
    >
      <span
        className={cn(
          "absolute right-3 top-3",
          "flex h-5 w-5",
          "items-center",
          "justify-center",
          "rounded-full",
          "border",
          selected
            ? cn("border-app-primary", "bg-app-primary", "text-white")
            : cn("border-slate-300", "bg-white", "text-transparent"),
        )}
      >
        <Check className="h-3 w-3" />
      </span>

      {icon && (
        <span
          className={cn(
            "mb-3",
            "flex h-9 w-9",
            "items-center",
            "justify-center",
            "rounded-lg",
            selected
              ? "bg-white text-app-primary"
              : "bg-slate-100 text-slate-500",
          )}
        >
          {icon}
        </span>
      )}

      <span className="block pr-7 text-sm font-semibold text-slate-800">
        {title}
      </span>

      {description && (
        <span className="mt-2 block text-xs leading-5 text-slate-500">
          {description}
        </span>
      )}
    </button>
  );
}
