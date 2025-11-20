"use client"

import { useState, useMemo, ReactNode } from "react"
import { useIsMobile } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"
import { Inbox } from "lucide-react"

export interface Column<T> {
  key: string
  header: string
  accessor: (row: T) => ReactNode
  sortable?: boolean
  priority?: "always" | "mobile-hidden" | "optional"
  width?: string
  className?: string
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  sortable?: boolean
  sortBy?: string
  sortOrder?: "asc" | "desc"
  onSort?: (field: string, order: "asc" | "desc") => void
  pagination?: {
    currentPage: number
    totalPages: number
    total: number
    limit: number
    onPageChange?: (page: number) => void
  }
  emptyState?: {
    title: string
    description?: string
    action?: {
      label: string
      onClick: () => void
    }
  }
  onRowClick?: (row: T) => void
  className?: string
  cardView?: {
    renderCard: (row: T) => ReactNode
  }
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  sortable = true,
  sortBy,
  sortOrder,
  onSort,
  pagination,
  emptyState,
  onRowClick,
  className,
  cardView,
}: DataTableProps<T>) {
  const isMobile = useIsMobile()
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  const handleSort = (columnKey: string) => {
    if (!sortable || !onSort) return
    
    const column = columns.find((col) => col.key === columnKey)
    if (!column?.sortable) return

    if (sortBy === columnKey) {
      const newOrder = sortOrder === "asc" ? "desc" : "asc"
      onSort(columnKey, newOrder)
    } else {
      onSort(columnKey, "asc")
    }
  }

  const getSortIcon = (columnKey: string) => {
    if (sortBy !== columnKey) {
      return <ArrowUpDown className="h-4 w-4 ml-1 text-muted-foreground" />
    }
    if (sortOrder === "asc") {
      return <ArrowUp className="h-4 w-4 ml-1" />
    }
    return <ArrowDown className="h-4 w-4 ml-1" />
  }

  const visibleColumns = useMemo(() => {
    if (!isMobile) return columns
    
    return columns.filter((col) => col.priority !== "mobile-hidden" && col.priority !== "optional")
  }, [columns, isMobile])

  if (data.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title={emptyState?.title || "Brak danych"}
        description={emptyState?.description}
        action={emptyState?.action}
      />
    )
  }

  if (isMobile && cardView) {
    return (
      <div className={cn("space-y-4", className)}>
        {data.map((row) => (
          <div key={row.id} onClick={() => onRowClick?.(row)}>
            {cardView.renderCard(row)}
          </div>
        ))}
        {pagination && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
          />
        )}
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className={cn("w-full", className)}>
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-border" style={{ tableLayout: "fixed" }}>
            <thead className="bg-muted">
              <tr>
                {visibleColumns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider",
                      column.sortable && sortable && "cursor-pointer hover:bg-muted/80",
                      "whitespace-nowrap",
                      column.className
                    )}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.key)}
                    aria-sort={
                      sortBy === column.key
                        ? sortOrder === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <div className="flex items-center">
                      {column.header}
                      {column.sortable && sortable && getSortIcon(column.key)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {data.map((row) => {
                const rowContent = visibleColumns.map((column) => {
                  const content = column.accessor(row)
                  const contentString =
                    typeof content === "string" ? content : String(content?.toString() || "")

                  return (
                    <td
                      key={column.key}
                      className={cn(
                        "px-3 py-3 text-sm text-foreground",
                        column.className
                      )}
                      style={{ width: column.width }}
                    >
                      {contentString.length > 50 ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="truncate max-w-full" title={contentString}>
                              {content}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{contentString}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <div className="truncate max-w-full">{content}</div>
                      )}
                    </td>
                  )
                })

                return (
                  <tr
                    key={row.id}
                    className={cn(
                      "hover:bg-muted/50 transition-colors",
                      onRowClick && "cursor-pointer",
                      hoveredRow === row.id && "bg-muted/30"
                    )}
                    onClick={() => onRowClick?.(row)}
                    onMouseEnter={() => setHoveredRow(row.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    {rowContent}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {pagination && (
          <div className="mt-4">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={pagination.limit}
            />
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

