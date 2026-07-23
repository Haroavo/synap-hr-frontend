"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import { Loader2 } from "lucide-react";

import { cn } from "@/lib/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "success";

export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;

  size?: ButtonSize;

  loading?: boolean;

  fullWidth?: boolean;

  leftIcon?: ReactNode;

  rightIcon?: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: cn(
    "bg-app-primary",
    "text-white",
    "hover:opacity-90",
    "focus-visible:ring-app-primary",
  ),

  secondary: cn(
    "bg-slate-100",
    "text-slate-700",
    "hover:bg-slate-200",
    "focus-visible:ring-slate-300",
  ),

  outline: cn(
    "border border-slate-200",
    "bg-white",
    "text-slate-700",
    "hover:bg-slate-50",
    "focus-visible:ring-slate-300",
  ),

  ghost: cn(
    "bg-transparent",
    "text-slate-600",
    "hover:bg-slate-100",
    "focus-visible:ring-slate-300",
  ),

  danger: cn(
    "bg-red-600",
    "text-white",
    "hover:bg-red-700",
    "focus-visible:ring-red-300",
  ),

  success: cn(
    "bg-emerald-600",
    "text-white",
    "hover:bg-emerald-700",
    "focus-visible:ring-emerald-300",
  ),
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-8 rounded-lg px-3 text-xs",

  md: "h-10 rounded-xl px-4 text-sm",

  lg: "h-12 rounded-xl px-5 text-sm",

  icon: "h-10 w-10 rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      type = "button",
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={cn(
          "inline-flex",
          "items-center",
          "justify-center",
          "gap-2",
          "font-medium",
          "transition",
          "outline-none",
          "focus-visible:ring-2",
          "focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed",
          "disabled:opacity-50",
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : leftIcon}

        {children}

        {!loading && rightIcon}
      </button>
    );
  },
);

Button.displayName = "Button";
