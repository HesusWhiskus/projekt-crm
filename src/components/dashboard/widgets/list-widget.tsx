"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "@/lib/utils"
import { LucideIcon, Plus } from "lucide-react"
import Link from "next/link"

export interface ListWidgetItem {
  id: string
  title: string
  description?: string
  href?: string
  metadata?: React.ReactNode
  onClick?: () => void
}

export interface ListWidgetProps {
  title: string
  description?: string
  items: ListWidgetItem[]
  emptyState?: {
    title: string
    description?: string
    action?: {
      label: string
      onClick: () => void
    }
  }
  icon?: LucideIcon
  className?: string
  isLoading?: boolean
  maxItems?: number
  showViewAll?: boolean
  viewAllHref?: string
}

export function ListWidget({
  title,
  description,
  items,
  emptyState,
  icon: Icon,
  className,
  isLoading = false,
  maxItems = 5,
  showViewAll = false,
  viewAllHref,
}: ListWidgetProps) {
  const displayItems = items.slice(0, maxItems)

  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />}
          <div>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            {description && (
              <CardDescription className="mt-1">{description}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: maxItems }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : displayItems.length === 0 ? (
          <EmptyState
            icon={Icon}
            title={emptyState?.title || "Brak danych"}
            description={emptyState?.description}
            action={emptyState?.action}
          />
        ) : (
          <div className="space-y-3">
            {displayItems.map((item) => {
              const content = (
                <div
                  className={cn(
                    "flex items-start justify-between p-3 rounded-md border border-primary/20 transition-colors",
                    (item.href || item.onClick) && "hover:bg-muted/50 cursor-pointer"
                  )}
                  onClick={item.onClick}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{item.title}</div>
                    {item.description && (
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {item.description}
                      </div>
                    )}
                    {item.metadata && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {item.metadata}
                      </div>
                    )}
                  </div>
                </div>
              )

              if (item.href) {
                return (
                  <Link key={item.id} href={item.href}>
                    {content}
                  </Link>
                )
              }

              return <div key={item.id}>{content}</div>
            })}
            {showViewAll && items.length > maxItems && viewAllHref && (
              <div className="pt-2 border-t border-primary/20">
                <Link href={viewAllHref}>
                  <Button variant="ghost" size="sm" className="w-full">
                    Zobacz wszystkie ({items.length})
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

