"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;

  resize?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { invalid = false, resize = true, className, disabled, ...props },
    ref,
  ) {
    return (
      <textarea
        ref={ref}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        className={cn(
          "min-h-28 w-full",
          "rounded-xl",
          "border",
          "bg-white",
          "px-3 py-2.5",
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
          resize ? "resize-y" : "resize-none",
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";
