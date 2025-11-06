"use client"

import { useState, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ClientStatus, ClientPriority, UserRole } from "@prisma/client"
import { Plus, Search, Download, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import Link from "next/link"
import { ClientForm } from "./client-form"

interface Client {
  id: string
  firstName: string
  lastName: string
  agencyName: string | null
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
}

const statusLabels: Record<ClientStatus, string> = {
  NEW_LEAD: "Nowy lead",
  IN_CONTACT: "W kontakcie",
  DEMO_SENT: "Demo wysłane",
  NEGOTIATION: "Negocjacje",
  ACTIVE_CLIENT: "Klient aktywny",
  LOST: "Utracony",
}

const statusColors: Record<ClientStatus, string> = {
  NEW_LEAD: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
  IN_CONTACT: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
  DEMO_SENT: "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200",
  NEGOTIATION: "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200",
  ACTIVE_CLIENT: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
  LOST: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
}

const priorityLabels: Record<ClientPriority, string> = {
  LOW: "Niski",
  MEDIUM: "Średni",
  HIGH: "Wysoki",
}

const priorityColors: Record<ClientPriority, string> = {
  LOW: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
  MEDIUM: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
  HIGH: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
}

type SortField = "firstName" | "lastName" | "agencyName" | "email" | "phone" | "status" | "priority" | "assignee" | null
type SortDirection = "asc" | "desc" | null

export function ClientsList({ clients, users, groups, currentUser }: ClientsListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isCreating, setIsCreating] = useState(false)
  const [localSearch, setLocalSearch] = useState(searchParams.get("search") || "")
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  
  const [filters, setFilters] = useState({
    status: searchParams.get("status") || "",
    search: searchParams.get("search") || "",
    assignedTo: searchParams.get("assignedTo") || "",
    source: searchParams.get("source") || "",
    groupId: searchParams.get("groupId") || "",
  })

  // Filtrowanie i sortowanie po stronie klienta
  const filteredAndSortedClients = useMemo(() => {
    let result = [...clients]

    // Filtrowanie po wyszukiwarce (lokalne)
    if (localSearch) {
      const searchLower = localSearch.toLowerCase()
      result = result.filter((client) => {
        return (
          (client.firstName?.toLowerCase().includes(searchLower) ||
            client.lastName?.toLowerCase().includes(searchLower) ||
            client.agencyName?.toLowerCase().includes(searchLower) ||
            client.email?.toLowerCase().includes(searchLower) ||
            client.phone?.toLowerCase().includes(searchLower)) ||
          false
        )
      })
    }

    // Filtrowanie po źródle
    if (filters.source) {
      result = result.filter((client) => client.source === filters.source)
    }

    // Filtrowanie po grupie
    if (filters.groupId) {
      result = result.filter((client) =>
        client.sharedGroups.some((g) => g.id === filters.groupId)
      )
    }

    // Sortowanie
    if (sortField && sortDirection) {
      result.sort((a, b) => {
        let aValue: any
        let bValue: any

        switch (sortField) {
          case "firstName":
            aValue = a.firstName || ""
            bValue = b.firstName || ""
            break
          case "lastName":
            aValue = a.lastName || ""
            bValue = b.lastName || ""
            break
          case "agencyName":
            aValue = a.agencyName || ""
            bValue = b.agencyName || ""
            break
          case "email":
            aValue = a.email || ""
            bValue = b.email || ""
            break
          case "phone":
            aValue = a.phone || ""
            bValue = b.phone || ""
            break
          case "status":
            aValue = a.status
            bValue = b.status
            break
          case "priority":
            aValue = a.priority || ""
            bValue = b.priority || ""
            break
          case "assignee":
            aValue = a.assignee?.name || a.assignee?.email || ""
            bValue = b.assignee?.name || b.assignee?.email || ""
            break
          default:
            return 0
        }

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
        return 0
      })
    }

    return result
  }, [clients, localSearch, filters.source, filters.groupId, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc")
      } else if (sortDirection === "desc") {
        setSortField(null)
        setSortDirection(null)
      } else {
        setSortDirection("asc")
      }
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 text-muted-foreground" />
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="h-4 w-4 ml-1" />
    }
    return <ArrowDown className="h-4 w-4 ml-1" />
  }

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    const params = new URLSearchParams()
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    router.push(`/clients?${params.toString()}`)
  }

  const handleExport = () => {
    const csv = [
      ["Nazwa agencji", "Imię", "Nazwisko", "Email", "Telefon", "Status", "Odpowiedzialny"].join(","),
      ...clients.map((c) =>
        [
          c.agencyName,
          c.firstName,
          c.lastName,
          c.email || "",
          c.phone || "",
          statusLabels[c.status],
          c.assignee?.name || c.assignee?.email || "",
        ].map((v) => `"${v}"`).join(",")
      ),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `klienci-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

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
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  id="status"
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                >
                  <option value="">Wszystkie</option>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignedTo">Odpowiedzialny</Label>
                <Select
                  id="assignedTo"
                  value={filters.assignedTo}
                  onChange={(e) => handleFilterChange("assignedTo", e.target.value)}
                >
                  <option value="">Wszyscy</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email}
                    </option>
                  ))}
                </Select>
              </div>
              {groups && groups.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="groupId">Grupa</Label>
                  <Select
                    id="groupId"
                    value={filters.groupId}
                    onChange={(e) => handleFilterChange("groupId", e.target.value)}
                  >
                    <option value="">Wszystkie</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
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
            Lista klientów ({filteredAndSortedClients.length} z {clients.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAndSortedClients.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Brak klientów spełniających kryteria
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th
                      className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/80 whitespace-nowrap"
                      onClick={() => handleSort("firstName")}
                    >
                      <div className="flex items-center">
                        Kontakt
                        {getSortIcon("firstName")}
                      </div>
                    </th>
                    <th
                      className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/80 whitespace-nowrap"
                      onClick={() => handleSort("agencyName")}
                    >
                      <div className="flex items-center">
                        Agencja
                        {getSortIcon("agencyName")}
                      </div>
                    </th>
                    <th
                      className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/80 whitespace-nowrap"
                      onClick={() => handleSort("email")}
                    >
                      <div className="flex items-center">
                        Email
                        {getSortIcon("email")}
                      </div>
                    </th>
                    <th
                      className="px-2 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/80 whitespace-nowrap w-24"
                      onClick={() => handleSort("phone")}
                    >
                      <div className="flex items-center">
                        Telefon
                        {getSortIcon("phone")}
                      </div>
                    </th>
                    <th
                      className="px-2 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/80 whitespace-nowrap w-28"
                      onClick={() => handleSort("status")}
                    >
                      <div className="flex items-center">
                        Status
                        {getSortIcon("status")}
                      </div>
                    </th>
                    <th
                      className="px-2 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/80 whitespace-nowrap w-24"
                      onClick={() => handleSort("priority")}
                    >
                      <div className="flex items-center">
                        Priorytet
                        {getSortIcon("priority")}
                      </div>
                    </th>
                    <th
                      className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/80 whitespace-nowrap"
                      onClick={() => handleSort("assignee")}
                    >
                      <div className="flex items-center">
                        Odpowiedzialny
                        {getSortIcon("assignee")}
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                      Akcje
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {filteredAndSortedClients.map((client) => (
                    <tr key={client.id} className="hover:bg-muted/50">
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="font-medium text-foreground">
                          {client.firstName} {client.lastName}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-sm text-foreground truncate max-w-[200px]" title={client.agencyName || undefined}>
                          {client.agencyName || "-"}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm text-foreground truncate max-w-[200px]" title={client.email || undefined}>
                          {client.email || "-"}
                        </div>
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-foreground">
                        {client.phone || "-"}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full min-w-[120px] justify-center ${statusColors[client.status]}`}>
                          {statusLabels[client.status]}
                        </span>
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap">
                        {client.priority ? (
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${priorityColors[client.priority]}`}>
                            {priorityLabels[client.priority]}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-foreground">
                        <div className="truncate max-w-[150px]" title={client.assignee?.name || client.assignee?.email || undefined}>
                          {client.assignee?.name || client.assignee?.email || "-"}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm font-medium">
                        <Link href={`/clients/${client.id}`}>
                          <Button variant="ghost" size="sm">
                            Szczegóły
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

