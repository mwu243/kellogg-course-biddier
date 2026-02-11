"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "rounded-md font-medium",
    "transition-all duration-150 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-[0.98]",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-[var(--color-primary-600)] text-white",
          "hover:bg-[var(--color-primary-700)]",
          "focus-visible:ring-[var(--color-primary-500)]",
          "shadow-sm hover:shadow",
        ],
        secondary: [
          "bg-[var(--color-neutral-100)] text-[var(--color-text-primary)]",
          "hover:bg-[var(--color-neutral-200)]",
          "focus-visible:ring-[var(--color-neutral-400)]",
        ],
        ghost: [
          "text-[var(--color-text-secondary)]",
          "hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-text-primary)]",
          "focus-visible:ring-[var(--color-neutral-400)]",
        ],
        danger: [
          "bg-[var(--color-error-600)] text-white",
          "hover:bg-[var(--color-error-700)]",
          "focus-visible:ring-[var(--color-error-500)]",
          "shadow-sm hover:shadow",
        ],
        outline: [
          "border border-[var(--color-border-default)] bg-transparent",
          "text-[var(--color-text-primary)]",
          "hover:bg-[var(--color-neutral-50)] hover:border-[var(--color-border-hover)]",
          "focus-visible:ring-[var(--color-primary-500)]",
        ],
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || loading;

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {size !== "icon" && <span>{children}</span>}
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
