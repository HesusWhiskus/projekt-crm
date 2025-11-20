"use client"

import { cn } from "@/lib/utils"

export interface StatusBadgeProps {
  status: string
  variant?: "default" | "success" | "warning" | "error" | "info"
  size?: "sm" | "md" | "lg"
  className?: string
  children?: React.ReactNode
}

const variantStyles = {
  default: "bg-muted text-muted-foreground",
  success: "bg-success/10 text-success dark:bg-success/20 dark:text-success",
  warning: "bg-warning/10 text-warning dark:bg-warning/20 dark:text-warning",
  error: "bg-error/10 text-error dark:bg-error/20 dark:text-error",
  info: "bg-info/10 text-info dark:bg-info/20 dark:text-info",
}

const sizeStyles = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
  lg: "px-3 py-1.5 text-base",
}

export function StatusBadge({
  status,
  variant = "default",
  size = "md",
  className,
  children,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      aria-label={`Status: ${status}`}
    >
      {children || status}
    </span>
  )
}

