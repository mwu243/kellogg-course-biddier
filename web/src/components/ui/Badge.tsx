"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  [
    "inline-flex items-center justify-center",
    "rounded-full font-medium",
    "transition-colors duration-150",
  ],
  {
    variants: {
      variant: {
        default: [
          "bg-[var(--color-neutral-100)] text-[var(--color-text-secondary)]",
        ],
        primary: [
          "bg-[var(--color-primary-100)] text-[var(--color-primary-700)]",
        ],
        success: [
          "bg-[var(--color-success-100)] text-[var(--color-success-700)]",
        ],
        warning: [
          "bg-[var(--color-warning-100)] text-[var(--color-warning-700)]",
        ],
        error: [
          "bg-[var(--color-error-100)] text-[var(--color-error-700)]",
        ],
        info: [
          "bg-[var(--color-info-100)] text-[var(--color-info-700)]",
        ],
        outline: [
          "border border-[var(--color-border-default)] bg-transparent",
          "text-[var(--color-text-secondary)]",
        ],
      },
      size: {
        sm: "h-5 px-2 text-xs",
        md: "h-6 px-2.5 text-xs",
        lg: "h-7 px-3 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  icon?: React.ReactNode;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, dot, icon, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size, className }))}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              "mr-1.5 h-1.5 w-1.5 rounded-full",
              variant === "success" && "bg-[var(--color-success-500)]",
              variant === "warning" && "bg-[var(--color-warning-500)]",
              variant === "error" && "bg-[var(--color-error-500)]",
              variant === "info" && "bg-[var(--color-info-500)]",
              variant === "primary" && "bg-[var(--color-primary-500)]",
              (variant === "default" || variant === "outline" || !variant) &&
                "bg-[var(--color-neutral-500)]"
            )}
          />
        )}
        {icon && <span className="mr-1 shrink-0">{icon}</span>}
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

export { Badge, badgeVariants };
