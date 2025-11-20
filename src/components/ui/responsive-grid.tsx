"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

export interface ResponsiveGridProps {
  children: ReactNode
  columns?: {
    mobile?: number
    tablet?: number
    desktop?: number
    wide?: number
  }
  gap?: "xs" | "sm" | "md" | "lg" | "xl"
  className?: string
}

const defaultColumns = {
  mobile: 1,
  tablet: 2,
  desktop: 3,
  wide: 4,
}

const gapStyles = {
  xs: "gap-1",
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
}

const gridColsClasses = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
}

const gridColsMdClasses = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
  6: "md:grid-cols-6",
}

const gridColsLgClasses = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
}

const gridColsXlClasses = {
  1: "xl:grid-cols-1",
  2: "xl:grid-cols-2",
  3: "xl:grid-cols-3",
  4: "xl:grid-cols-4",
  5: "xl:grid-cols-5",
  6: "xl:grid-cols-6",
}

export function ResponsiveGrid({
  children,
  columns = defaultColumns,
  gap = "md",
  className,
}: ResponsiveGridProps) {
  const {
    mobile = defaultColumns.mobile,
    tablet = defaultColumns.tablet,
    desktop = defaultColumns.desktop,
    wide = defaultColumns.wide,
  } = columns

  return (
    <div
      className={cn(
        "grid",
        gridColsClasses[mobile as keyof typeof gridColsClasses] || "grid-cols-1",
        gridColsMdClasses[tablet as keyof typeof gridColsMdClasses] || "",
        gridColsLgClasses[desktop as keyof typeof gridColsLgClasses] || "",
        gridColsXlClasses[wide as keyof typeof gridColsXlClasses] || "",
        gapStyles[gap],
        className
      )}
    >
      {children}
    </div>
  )
}

