"use client"

import { useState, useMemo, useCallback, memo } from "react"
import dynamic from "next/dynamic"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ClientStatus, ClientPriority, UserRole } from "@prisma/client"
import { Plus, Search, Download, Mail, Phone, Building2 } from "lucide-react"
import Link from "next/link"
// Lazy load ClientForm
const ClientForm = dynamic(() => import("./client-form").then(mod => ({ default: mod.ClientForm })), {
  loading: () => <div className="p-6"><div className="h-96 bg-muted animate-pulse rounded" /></div>,
  ssr: false,
})
import { DataTable } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  clientStatusLabels,
  clientPriorityLabels,
} from "@/lib/status-config"

interface Client {
  id: string
  firstName: string | null
  lastName: string | null
  companyName?: string | null // Temporarily optional - column doesn't exist in production DB yet
  type: string
  email: string | null
  phone: string | null
  status: ClientStatus
  priority: ClientPriority | null
  source: string | null
  assignee: {
    id: string
    name: string | null
    email: string
  } | null
  sharedGroups: Array<{
    id: string
    name: string
  }>
  _count: {
    contacts: number
    tasks: number
  }
}

interface ClientsListProps {
  clients: Client[]
  users: Array<{
    id: string
    name: string | null
    email: string
  }>
  groups?: Array<{
    id: string
    name: string
  }>
  currentUser: {
    id: string
    role: UserRole
  }
  insuranceAgentsEnabled?: boolean
  total: number
  page: number
  limit: number
  totalPages: number
}


type SortField = "firstName" | "lastName" | "companyName" | "email" | "phone" | "status" | "priority" | "assignee" | null

// Helper function to get client display name
function getClientDisplayName(client: Client): string {
  if (client.type === "COMPANY") {
    return client.companyName || "Brak nazwy firmy"
  }
  const name = [client.firstName, client.lastName].filter(Boolean).join(" ")
  return name || "Brak imienia i nazwiska"
}
type SortDirection = "asc" | "desc" | null

export const ClientsList = memo(function ClientsList({ clients, users, groups, currentUser, insuranceAgentsEnabled = false, total, page, limit, totalPages }: ClientsListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isCreating, setIsCreating] = useState(false)
  
  const [filters, setFilters] = useState({
    status: searchParams.get("status") || "",
    search: searchParams.get("search") || "",
    assignedTo: searchParams.get("assignedTo") || "",
    source: searchParams.get("source") || "",
    groupId: searchParams.get("groupId") || "",
  })

  // Odczytaj aktualne sortowanie z URL
  const currentSortBy = searchParams.get("sortBy") || "updatedAt"
  const currentSortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc"

  const handleSort = (field: string, order: "asc" | "desc") => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("sortBy", field)
    params.set("sortOrder", order)
    params.delete("page")
    router.push(`/clients?${params.toString()}`)
  }

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    const params = new URLSearchParams()
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    // Resetuj stronę do 1 przy zmianie filtrów
    params.delete("page")
    router.push(`/clients?${params.toString()}`)
  }

  const handleSearchChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set("search", value)
    } else {
      params.delete("search")
    }
    // Resetuj stronę do 1 przy zmianie wyszukiwania
    params.delete("page")
    router.push(`/clients?${params.toString()}`)
  }

  const handleExport = useCallback(() => {
    const csv = [
      ["Nazwa agencji", "Imię", "Nazwisko", "Email", "Telefon", "Status", "Odpowiedzialny"].join(","),
      ...clients.map((c) =>
        [
          getClientDisplayName(c),
          c.firstName,
          c.lastName,
          c.email || "",
          c.phone || "",
          clientStatusLabels[c.status],
          c.assignee?.name || c.assignee?.email || "",
        ].map((v) => `"${v}"`).join(",")
      ),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `klienci-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }, [clients])

  // Memoized columns configuration
  const columns = useMemo(() => [
    {
      key: "name",
      header: "Kontakt",
      accessor: (client: typeof clients[0]) => `${client.firstName || ""} ${client.lastName || ""}`.trim() || "-",
      sortable: true,
      priority: "always" as const,
      width: "150px",
    },
    {
      key: "companyName",
      header: "Agencja",
      accessor: (client: typeof clients[0]) => getClientDisplayName(client),
      sortable: true,
      priority: "always" as const,
      width: "180px",
    },
    {
      key: "email",
      header: "Email",
      accessor: (client: typeof clients[0]) => client.email || "-",
      sortable: true,
      priority: "mobile-hidden" as const,
      width: "200px",
    },
    {
      key: "phone",
      header: "Telefon",
      accessor: (client: typeof clients[0]) => client.phone || "-",
      sortable: true,
      priority: "optional" as const,
      width: "120px",
    },
    {
      key: "status",
      header: "Status",
      accessor: (client: typeof clients[0]) => (
        <StatusBadge
          status={clientStatusLabels[client.status]}
          variant={
            client.status === "ACTIVE_CLIENT"
              ? "success"
              : client.status === "LOST"
              ? "error"
              : client.status === "NEGOTIATION"
              ? "warning"
              : "default"
          }
          size="sm"
        />
      ),
      sortable: true,
      priority: "always" as const,
      width: "130px",
    },
    {
      key: "priority",
      header: "Priorytet",
      accessor: (client: typeof clients[0]) =>
        client.priority ? (
          <StatusBadge
            status={clientPriorityLabels[client.priority]}
            variant={
              client.priority === "HIGH"
                ? "error"
                : client.priority === "MEDIUM"
                ? "warning"
                : "info"
            }
            size="sm"
          />
        ) : (
          "-"
        ),
      sortable: true,
      priority: "optional" as const,
      width: "110px",
    },
    {
      key: "assignee",
      header: "Odpowiedzialny",
      accessor: (client: typeof clients[0]) => client.assignee?.name || client.assignee?.email || "-",
      sortable: true,
      priority: "mobile-hidden" as const,
      width: "150px",
    },
    {
      key: "actions",
      header: "Akcje",
      accessor: (client: typeof clients[0]) => (
        <Link href={`/clients/${client.id}`}>
          <Button variant="ghost" size="sm">
            Szczegóły
          </Button>
        </Link>
      ),
      sortable: false,
      priority: "always" as const,
      width: "100px",
    },
  ], [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Klienci</h1>
          <p className="text-muted-foreground mt-2">
            Zarządzaj klientami i leadami
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Eksport CSV
          </Button>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Dodaj klienta
          </Button>
        </div>
      </div>

      {isCreating && (
        <ClientForm
          users={users}
          groups={groups}
          currentUser={currentUser}
          insuranceAgentsEnabled={insuranceAgentsEnabled}
          onClose={() => setIsCreating(false)}
          onSuccess={() => {
            setIsCreating(false)
            router.refresh()
          }}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Filtry i wyszukiwarka</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search">Wyszukaj</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nazwa, email, telefon, agencja..."
                  defaultValue={searchParams.get("search") || ""}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearchChange(e.currentTarget.value)
                    }
                  }}
                  onBlur={(e) => handleSearchChange(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => handleFilterChange("status", value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Wszystkie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Wszystkie</SelectItem>
                    {Object.entries(clientStatusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignedTo">Odpowiedzialny</Label>
                <Select
                  value={filters.assignedTo}
                  onValueChange={(value) => handleFilterChange("assignedTo", value)}
                >
                  <SelectTrigger id="assignedTo">
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
              {groups && groups.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="groupId">Grupa</Label>
                  <Select
                    value={filters.groupId}
                    onValueChange={(value) => handleFilterChange("groupId", value)}
                  >
                    <SelectTrigger id="groupId">
                      <SelectValue placeholder="Wszystkie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Wszystkie</SelectItem>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="source">Źródło</Label>
                <Input
                  id="source"
                  placeholder="Filtruj po źródle..."
                  value={filters.source}
                  onChange={(e) => handleFilterChange("source", e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Lista klientów ({clients.length} z {total})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            data={clients}
            columns={columns}
            sortable={true}
            sortBy={currentSortBy}
            sortOrder={currentSortOrder}
            onSort={handleSort}
            pagination={{
              currentPage: page,
              totalPages,
              total,
              limit,
            }}
            emptyState={{
              title: "Brak klientów spełniających kryteria",
              description: "Spróbuj zmienić filtry lub dodaj nowego klienta",
              action: {
                label: "Dodaj klienta",
                onClick: () => setIsCreating(true),
              },
            }}
            onRowClick={(client) => router.push(`/clients/${client.id}`)}
            cardView={{
              renderCard: (client) => (
                <Card key={client.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">
                            {client.firstName} {client.lastName}
                          </h3>
                          {client.type === "COMPANY" && client.companyName && (
                            <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                              <Building2 className="h-4 w-4" />
                              <span className="truncate">{client.companyName}</span>
                            </div>
                          )}
                        </div>
                        <Link href={`/clients/${client.id}`}>
                          <Button variant="ghost" size="sm" className="min-w-[80px]">
                            Szczegóły
                          </Button>
                        </Link>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        {client.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{client.email}</span>
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                        <StatusBadge
                          status={clientStatusLabels[client.status]}
                          variant={
                            client.status === "ACTIVE_CLIENT"
                              ? "success"
                              : client.status === "LOST"
                              ? "error"
                              : client.status === "NEGOTIATION"
                              ? "warning"
                              : "default"
                          }
                          size="sm"
                        />
                        {client.priority && (
                          <StatusBadge
                            status={clientPriorityLabels[client.priority]}
                            variant={
                              client.priority === "HIGH"
                                ? "error"
                                : client.priority === "MEDIUM"
                                ? "warning"
                                : "info"
                            }
                            size="sm"
                          />
                        )}
                        {client.assignee && (
                          <span className="text-xs text-muted-foreground">
                            {client.assignee.name || client.assignee.email}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                        <span>Kontakty: {client._count.contacts}</span>
                        <span>Zadania: {client._count.tasks}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ),
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
})

