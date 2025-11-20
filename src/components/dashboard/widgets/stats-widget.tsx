"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

export interface StatsWidgetProps {
  title: string
  value: string | number
  icon?: LucideIcon
  trend?: {
    value: number
    label: string
    isPositive?: boolean
  }
  description?: string
  className?: string
  isLoading?: boolean
  href?: string
  onClick?: () => void
}

export function StatsWidget({
  title,
  value,
  icon: Icon,
  trend,
  description,
  className,
  isLoading = false,
  href,
  onClick,
}: StatsWidgetProps) {
  const isClickable = !!href || !!onClick
  const cardClassName = cn(
    "hover:shadow-md transition-shadow",
    isClickable && "cursor-pointer",
    className
  )

  const cardContent = (
    <Card className={cardClassName} onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <div className="h-4 w-4 text-muted-foreground">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p
            className={cn(
              "text-xs mt-1",
              trend.isPositive ? "text-success" : "text-error"
            )}
          >
            {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
          </p>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            <Skeleton className="h-4 w-24" />
          </CardTitle>
          {Icon && <Skeleton className="h-4 w-4 rounded" />}
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-2" />
          {description && <Skeleton className="h-4 w-full" />}
        </CardContent>
      </Card>
    )
  }

  if (href) {
    return (
      <Link href={href} className="block">
        {cardContent}
      </Link>
    )
  }

  return cardContent
}

