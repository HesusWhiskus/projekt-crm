"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { ReactNode } from "react"

export interface ChartWidgetProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
  isLoading?: boolean
  actions?: ReactNode
}

export function ChartWidget({
  title,
  description,
  children,
  className,
  isLoading = false,
  actions,
}: ChartWidgetProps) {
  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex-1">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {description && (
            <CardDescription className="mt-1">{description}</CardDescription>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <div className="w-full">{children}</div>
        )}
      </CardContent>
    </Card>
  )
}

