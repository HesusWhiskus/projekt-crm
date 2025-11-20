"use client"

import { cn } from "@/lib/utils"

export interface SkeletonProps {
  className?: string
  variant?: "text" | "circular" | "rectangular"
  width?: string | number
  height?: string | number
  animation?: "pulse" | "wave" | "none"
}

export function Skeleton({
  className,
  variant = "rectangular",
  width,
  height,
  animation = "pulse",
}: SkeletonProps) {
  const baseStyles = "bg-muted rounded"
  
  const variantStyles = {
    text: "h-4 rounded",
    circular: "rounded-full",
    rectangular: "rounded",
  }
  
  const animationStyles = {
    pulse: "animate-pulse",
    wave: "animate-[wave_1.6s_ease-in-out_0.5s_infinite]",
    none: "",
  }
  
  const style: React.CSSProperties = {}
  if (width) style.width = typeof width === "number" ? `${width}px` : width
  if (height) style.height = typeof height === "number" ? `${height}px` : height

  return (
    <div
      className={cn(
        baseStyles,
        variantStyles[variant],
        animationStyles[animation],
        className
      )}
      style={style}
      aria-hidden="true"
    />
  )
}

