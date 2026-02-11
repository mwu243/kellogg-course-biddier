"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    { className, icon, title, description, action, size = "md", ...props },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center text-center",
          size === "sm" && "py-8",
          size === "md" && "py-12",
          size === "lg" && "py-16",
          className
        )}
        {...props}
      >
        {icon && (
          <div
            className={cn(
              "flex items-center justify-center rounded-full",
              "bg-[var(--color-neutral-100)]",
              "text-[var(--color-text-muted)]",
              "mb-4",
              size === "sm" && "h-10 w-10",
              size === "md" && "h-12 w-12",
              size === "lg" && "h-16 w-16"
            )}
          >
            {React.isValidElement(icon) &&
              React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
                className: cn(
                  (icon as React.ReactElement<{ className?: string }>).props.className,
                  size === "sm" && "h-5 w-5",
                  size === "md" && "h-6 w-6",
                  size === "lg" && "h-8 w-8"
                ),
              })}
          </div>
        )}
        <h3
          className={cn(
            "font-semibold text-[var(--color-text-primary)]",
            size === "sm" && "text-sm",
            size === "md" && "text-base",
            size === "lg" && "text-lg"
          )}
        >
          {title}
        </h3>
        {description && (
          <p
            className={cn(
              "mt-1 max-w-sm text-[var(--color-text-secondary)]",
              size === "sm" && "text-xs",
              size === "md" && "text-sm",
              size === "lg" && "text-base"
            )}
          >
            {description}
          </p>
        )}
        {action && <div className="mt-4">{action}</div>}
      </div>
    );
  }
);

EmptyState.displayName = "EmptyState";

export { EmptyState };
