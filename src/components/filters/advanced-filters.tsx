"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp, X, Filter } from "lucide-react"
import { cn } from "@/lib/utils"

export interface FilterOption {
  id: string
  label: string
  type: "text" | "select" | "date" | "number" | "boolean"
  options?: Array<{ value: string; label: string }>
  placeholder?: string
}

export interface AdvancedFiltersProps {
  filters: FilterOption[]
  values: Record<string, any>
  onChange: (values: Record<string, any>) => void
  onReset?: () => void
  className?: string
  defaultOpen?: boolean
}

export function AdvancedFilters({
  filters,
  values,
  onChange,
  onReset,
  className,
  defaultOpen = false,
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [localValues, setLocalValues] = useState<Record<string, any>>(values)

  const activeFiltersCount = Object.values(localValues).filter(
    (v) => v !== undefined && v !== null && v !== "" && v !== "all"
  ).length

  const handleChange = (id: string, value: any) => {
    const newValues = { ...localValues, [id]: value }
    setLocalValues(newValues)
    onChange(newValues)
  }

  const handleReset = () => {
    const emptyValues: Record<string, any> = {}
    filters.forEach((filter) => {
      emptyValues[filter.id] = undefined
    })
    setLocalValues(emptyValues)
    onChange(emptyValues)
    onReset?.()
  }

  const handleRemoveFilter = (id: string) => {
    const newValues = { ...localValues, [id]: undefined }
    setLocalValues(newValues)
    onChange(newValues)
  }

  return (
    <Card className={cn("w-full", className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Zaawansowane filtry
                {activeFiltersCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </CardTitle>
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            <div className="space-y-4">
              {/* Active filters */}
              {activeFiltersCount > 0 && (
                <div className="flex flex-wrap gap-2 pb-4 border-b">
                  {filters.map((filter) => {
                    const value = localValues[filter.id]
                    if (value === undefined || value === null || value === "" || value === "all") return null

                    const displayValue =
                      filter.type === "select"
                        ? filter.options?.find((opt) => opt.value === value)?.label || value
                        : value

                    return (
                      <div
                        key={filter.id}
                        className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-sm"
                      >
                        <span className="font-medium">{filter.label}:</span>
                        <span>{displayValue}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0"
                          onClick={() => handleRemoveFilter(filter.id)}
                          aria-label={`Usuń filtr ${filter.label}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Filter inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filters.map((filter) => {
                  switch (filter.type) {
                    case "text":
                      return (
                        <div key={filter.id} className="space-y-2">
                          <Label htmlFor={filter.id}>{filter.label}</Label>
                          <Input
                            id={filter.id}
                            placeholder={filter.placeholder}
                            value={localValues[filter.id] || ""}
                            onChange={(e) => handleChange(filter.id, e.target.value)}
                          />
                        </div>
                      )

                    case "select":
                      return (
                        <div key={filter.id} className="space-y-2">
                          <Label htmlFor={filter.id}>{filter.label}</Label>
                          <Select
                            value={localValues[filter.id] || "all"}
                            onValueChange={(value) => handleChange(filter.id, value === "all" ? undefined : value)}
                          >
                            <SelectTrigger id={filter.id}>
                              <SelectValue placeholder="Wszystkie" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Wszystkie</SelectItem>
                              {filter.options?.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )

                    case "date":
                      return (
                        <div key={filter.id} className="space-y-2">
                          <Label htmlFor={filter.id}>{filter.label}</Label>
                          <Input
                            id={filter.id}
                            type="date"
                            value={localValues[filter.id] || ""}
                            onChange={(e) => handleChange(filter.id, e.target.value)}
                          />
                        </div>
                      )

                    case "number":
                      return (
                        <div key={filter.id} className="space-y-2">
                          <Label htmlFor={filter.id}>{filter.label}</Label>
                          <Input
                            id={filter.id}
                            type="number"
                            placeholder={filter.placeholder}
                            value={localValues[filter.id] || ""}
                            onChange={(e) =>
                              handleChange(filter.id, e.target.value ? Number(e.target.value) : undefined)
                            }
                          />
                        </div>
                      )

                    case "boolean":
                      return (
                        <div key={filter.id} className="space-y-2">
                          <Label htmlFor={filter.id}>{filter.label}</Label>
                          <Select
                            value={localValues[filter.id] === undefined ? "all" : String(localValues[filter.id])}
                            onValueChange={(value) =>
                              handleChange(
                                filter.id,
                                value === "all" ? undefined : value === "true"
                              )
                            }
                          >
                            <SelectTrigger id={filter.id}>
                              <SelectValue placeholder="Wszystkie" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Wszystkie</SelectItem>
                              <SelectItem value="true">Tak</SelectItem>
                              <SelectItem value="false">Nie</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )

                    default:
                      return null
                  }
                })}
              </div>

              {/* Actions */}
              {activeFiltersCount > 0 && (
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={handleReset}>
                    Wyczyść filtry
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

