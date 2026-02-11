"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  onClear?: () => void;
  showClearButton?: boolean;
  variant?: "default" | "search";
  error?: boolean;
  containerClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      icon,
      onClear,
      showClearButton = false,
      variant = "default",
      error = false,
      containerClassName,
      value,
      ...props
    },
    ref
  ) => {
    const isSearch = variant === "search";
    const displayIcon = isSearch ? <Search className="h-4 w-4" /> : icon;
    const hasValue = value !== undefined && value !== "";
    const showClear = showClearButton && hasValue && onClear;

    return (
      <div className={cn("relative", containerClassName)}>
        {displayIcon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
            {displayIcon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            // Base styles
            "flex h-10 w-full rounded-md border bg-[var(--color-bg-primary)] px-3 py-2 text-sm",
            "transition-all duration-150 ease-out",
            // Border colors
            "border-[var(--color-border-default)]",
            "hover:border-[var(--color-border-hover)]",
            // Focus styles
            "focus:border-[var(--color-border-focus)] focus:outline-none",
            "focus:ring-2 focus:ring-[var(--color-primary-100)]",
            // Placeholder
            "placeholder:text-[var(--color-text-muted)]",
            // Disabled
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--color-bg-tertiary)]",
            // Error state
            error && [
              "border-[var(--color-error-500)]",
              "focus:border-[var(--color-error-500)] focus:ring-[var(--color-error-100)]",
            ],
            // Icon padding
            displayIcon && "pl-10",
            // Clear button padding
            showClear && "pr-10",
            className
          )}
          ref={ref}
          value={value}
          {...props}
        />
        {showClear && (
          <button
            type="button"
            onClick={onClear}
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2",
              "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]",
              "transition-colors duration-150",
              "focus:outline-none focus-visible:text-[var(--color-text-primary)]"
            )}
            tabIndex={-1}
            aria-label="Clear input"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
