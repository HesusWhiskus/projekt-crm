"use client"

import { useState, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Filter, X, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface Log {
  id: string
  timestamp: string
  userId: string
  email: string
  name: string | null
  action: string
  entityType: string | null
  entityId: string | null
  ip: string
  userAgent: string
  details: any
  responseTimeMs: number | null
  success: boolean
  error: string | null
  method: string | null
  path: string | null
  statusCode: number | null
}

interface AdminLogsClientProps {
  initialLogs: Log[]
  total: number
  page: number
  limit: number
  users: Array<{
    id: string
    email: string
    name: string | null
  }>
  filters: {
    action?: string
    entityType?: string
    userId?: string
    dateFrom?: string
    dateTo?: string
  }
}

export function AdminLogsClient({
  initialLogs,
  total,
  page,
  limit,
  users,
  filters: initialFilters,
}: AdminLogsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isFiltersOpen, setIsFiltersOpen] = useState(
    !!initialFilters.action || 
    !!initialFilters.entityType || 
    !!initialFilters.userId || 
    !!initialFilters.dateFrom || 
    !!initialFilters.dateTo
  )
  
  const [localFilters, setLocalFilters] = useState({
    action: initialFilters.action || "",
    entityType: initialFilters.entityType || "",
    userId: initialFilters.userId || "",
    dateFrom: initialFilters.dateFrom || "",
    dateTo: initialFilters.dateTo || "",
  })

  const totalPages = Math.ceil(total / limit)

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (localFilters.action) params.set("action", localFilters.action)
    if (localFilters.entityType) params.set("entityType", localFilters.entityType)
    if (localFilters.userId) params.set("userId", localFilters.userId)
    if (localFilters.dateFrom) params.set("dateFrom", localFilters.dateFrom)
    if (localFilters.dateTo) params.set("dateTo", localFilters.dateTo)
    params.set("page", "1")
    router.push(`/admin/logs?${params.toString()}`)
  }

  const clearFilters = () => {
    setLocalFilters({
      action: "",
      entityType: "",
      userId: "",
      dateFrom: "",
      dateTo: "",
    })
    router.push("/admin/logs?page=1")
  }

  const exportLogs = () => {
    const csv = [
      ["Data", "Użytkownik", "Akcja", "Typ encji", "ID encji", "IP", "Status", "Czas odpowiedzi (ms)", "Błąd", "Metoda", "Ścieżka", "Status HTTP"].join(","),
      ...initialLogs.map(log => [
        new Date(log.timestamp).toLocaleString("pl-PL"),
        `"${log.email}"`,
        `"${log.action}"`,
        log.entityType || "",
        log.entityId || "",
        log.ip,
        log.success ? "Sukces" : "Błąd",
        log.responseTimeMs || "",
        log.error ? `"${log.error.replace(/"/g, '""')}"` : "",
        log.method || "",
        log.path || "",
        log.statusCode || "",
      ].join(","))
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `logi_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatDetails = (details: any): string => {
    if (!details) return "-"
    try {
      const filtered = { ...details }
      delete filtered.responseTimeMs
      delete filtered.success
      delete filtered.error
      delete filtered.method
      delete filtered.path
      delete filtered.statusCode
      const keys = Object.keys(filtered)
      if (keys.length === 0) return "-"
      return JSON.stringify(filtered, null, 2)
    } catch {
      return String(details)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Logi systemowe</h1>
        <p className="text-muted-foreground mt-2">
          Szczegółowy przegląd logów autoryzacji i aktywności użytkowników
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Logi aktywności</CardTitle>
              <CardDescription>
                Łącznie: {total} wpisów | Strona {page} z {totalPages}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtry
                  </Button>
                </CollapsibleTrigger>
              </Collapsible>
              <Button variant="outline" size="sm" onClick={exportLogs}>
                <Download className="h-4 w-4 mr-2" />
                Eksportuj CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <CollapsibleContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 border rounded-lg mb-4 bg-muted/50">
                <div className="space-y-2">
                  <Label htmlFor="action">Akcja</Label>
                  <Input
                    id="action"
                    placeholder="Szukaj akcji..."
                    value={localFilters.action}
                    onChange={(e) => setLocalFilters({ ...localFilters, action: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entityType">Typ encji</Label>
                  <Select
                    value={localFilters.entityType}
                    onValueChange={(value) => setLocalFilters({ ...localFilters, entityType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Wszystkie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Wszystkie</SelectItem>
                      <SelectItem value="Client">Klient</SelectItem>
                      <SelectItem value="Task">Zadanie</SelectItem>
                      <SelectItem value="Contact">Kontakt</SelectItem>
                      <SelectItem value="Calculation">Kalkulacja</SelectItem>
                      <SelectItem value="Policy">Polisa</SelectItem>
                      <SelectItem value="Vehicle">Pojazd</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userId">Użytkownik</Label>
                  <Select
                    value={localFilters.userId}
                    onValueChange={(value) => setLocalFilters({ ...localFilters, userId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Wszyscy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Wszyscy</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFrom">Data od</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={localFilters.dateFrom}
                    onChange={(e) => setLocalFilters({ ...localFilters, dateFrom: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateTo">Data do</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={localFilters.dateTo}
                    onChange={(e) => setLocalFilters({ ...localFilters, dateTo: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 items-end">
                  <Button onClick={applyFilters} size="sm">
                    <Search className="h-4 w-4 mr-2" />
                    Zastosuj
                  </Button>
                  <Button onClick={clearFilters} variant="outline" size="sm">
                    <X className="h-4 w-4 mr-2" />
                    Wyczyść
                  </Button>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {initialLogs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Brak logów do wyświetlenia</p>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Użytkownik</TableHead>
                      <TableHead>Akcja</TableHead>
                      <TableHead>Typ encji</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Czas (ms)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Szczegóły</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {initialLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString("pl-PL")}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{log.name || log.email}</div>
                            {log.name && <div className="text-xs text-muted-foreground">{log.email}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{log.action}</div>
                          {log.method && log.path && (
                            <div className="text-xs text-muted-foreground">
                              {log.method} {log.path}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {log.entityType ? (
                            <Badge variant="outline">{log.entityType}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{log.ip}</TableCell>
                        <TableCell>
                          {log.responseTimeMs !== null ? (
                            <span className={log.responseTimeMs > 1000 ? "text-red-600 font-medium" : ""}>
                              {log.responseTimeMs}ms
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={log.success ? "default" : "destructive"}
                          >
                            {log.success ? "Sukces" : "Błąd"}
                            {log.statusCode && ` (${log.statusCode})`}
                          </Badge>
                          {log.error && (
                            <div className="text-xs text-red-600 mt-1 max-w-xs truncate" title={log.error}>
                              {log.error}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {log.details && Object.keys(log.details).length > 0 ? (
                            <details className="text-xs">
                              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                Pokaż
                              </summary>
                              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-w-md">
                                {formatDetails(log.details)}
                              </pre>
                            </details>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Wyświetlanie {(page - 1) * limit + 1} - {Math.min(page * limit, total)} z {total}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString())
                      params.set("page", String(Math.max(1, page - 1)))
                      router.push(`/admin/logs?${params.toString()}`)
                    }}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Poprzednia
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString())
                      params.set("page", String(Math.min(totalPages, page + 1)))
                      router.push(`/admin/logs?${params.toString()}`)
                    }}
                    disabled={page >= totalPages}
                  >
                    Następna
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

