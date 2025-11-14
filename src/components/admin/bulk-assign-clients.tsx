"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ClientStatus } from "@prisma/client"
import { useRouter } from "next/navigation"
import { Search, UserCheck, AlertCircle } from "lucide-react"

interface Client {
  id: string
  firstName: string | null
  lastName: string | null
  companyName: string | null
  type: "PERSON" | "COMPANY"
  status: ClientStatus
  assignedTo: string | null
  assignee: {
    id: string
    name: string | null
    email: string
  } | null
}

interface User {
  id: string
  name: string | null
  email: string
}

interface BulkAssignClientsProps {
  clients: Client[]
  users: User[]
}

const statusLabels: Record<ClientStatus, string> = {
  NEW_LEAD: "Nowy lead",
  IN_CONTACT: "W kontakcie",
  DEMO_SENT: "Demo wysłane",
  NEGOTIATION: "Negocjacje",
  ACTIVE_CLIENT: "Klient aktywny",
  LOST: "Utracony",
}

const ITEMS_PER_PAGE = 100

export function BulkAssignClients({ clients: initialClients, users }: BulkAssignClientsProps) {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set())
  const [assignedTo, setAssignedTo] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    assignedTo: "",
  })

  // Filter clients
  const filteredClients = clients.filter((client) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesSearch =
        client.firstName?.toLowerCase().includes(searchLower) ||
        client.lastName?.toLowerCase().includes(searchLower) ||
        client.companyName?.toLowerCase().includes(searchLower) ||
        false
      if (!matchesSearch) return false
    }

    if (filters.status && client.status !== filters.status) {
      return false
    }

    if (filters.assignedTo) {
      if (filters.assignedTo === "unassigned") {
        if (client.assignedTo !== null) return false
      } else {
        if (client.assignedTo !== filters.assignedTo) return false
      }
    }

    return true
  })

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE)
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(paginatedClients.map((c) => c.id))
      setSelectedClientIds(new Set([...selectedClientIds, ...allIds]))
    } else {
      const pageIds = new Set(paginatedClients.map((c) => c.id))
      const newSelected = new Set(selectedClientIds)
      pageIds.forEach((id) => newSelected.delete(id))
      setSelectedClientIds(newSelected)
    }
  }

  const handleSelectClient = (clientId: string, checked: boolean) => {
    const newSelected = new Set(selectedClientIds)
    if (checked) {
      newSelected.add(clientId)
    } else {
      newSelected.delete(clientId)
    }
    setSelectedClientIds(newSelected)
  }

  const handleBulkAssign = async () => {
    if (selectedClientIds.size === 0) {
      setError("Wybierz przynajmniej jednego klienta")
      return
    }

    if (!assignedTo) {
      setError("Wybierz użytkownika do przypisania")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/clients/bulk-assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientIds: Array.from(selectedClientIds),
          assignedTo: assignedTo || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Błąd podczas przypisywania klientów")
      }

      const data = await response.json()
      setSuccess(`Pomyślnie przypisano ${data.updated} klientów`)
      setSelectedClientIds(new Set())
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Wystąpił błąd podczas przypisywania klientów")
    } finally {
      setIsLoading(false)
    }
  }

  const allPageSelected = paginatedClients.every((c) => selectedClientIds.has(c.id))
  const somePageSelected = paginatedClients.some((c) => selectedClientIds.has(c.id))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserCheck className="h-5 w-5" />
            <span>Masowe przydzielanie klientów</span>
          </CardTitle>
          <CardDescription>
            Wybierz klientów i przypisz ich do wybranego użytkownika
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md flex items-center space-x-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-500/10 text-green-700 text-sm rounded-md">
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Wyszukaj</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nazwa, email..."
                  value={filters.search}
                  onChange={(e) => {
                    setFilters({ ...filters, search: e.target.value })
                    setCurrentPage(1)
                  }}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                value={filters.status}
                onChange={(e) => {
                  setFilters({ ...filters, status: e.target.value })
                  setCurrentPage(1)
                }}
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
              <Label htmlFor="filterAssignedTo">Przypisany do</Label>
              <Select
                id="filterAssignedTo"
                value={filters.assignedTo}
                onChange={(e) => {
                  setFilters({ ...filters, assignedTo: e.target.value })
                  setCurrentPage(1)
                }}
              >
                <option value="">Wszyscy</option>
                <option value="unassigned">Nieprzypisani</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={allPageSelected}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="select-all" className="cursor-pointer">
                    Zaznacz wszystkie na stronie
                  </Label>
                </div>
                <span className="text-sm text-muted-foreground">
                  Wybrano: {selectedClientIds.size} klientów
                </span>
              </div>

              <div className="flex items-center space-x-4">
                <div className="space-y-2">
                  <Label htmlFor="assignTo">Przypisz do</Label>
                  <Select
                    id="assignTo"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-48"
                  >
                    <option value="">Wybierz użytkownika</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name || user.email}
                      </option>
                    ))}
                  </Select>
                </div>
                <Button
                  onClick={handleBulkAssign}
                  disabled={isLoading || selectedClientIds.size === 0 || !assignedTo}
                >
                  {isLoading ? "Przypisywanie..." : "Przydziel wybranych"}
                </Button>
              </div>
            </div>

            <div className="border rounded-md">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left w-12">
                        <Checkbox
                          checked={allPageSelected}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <th className="px-4 py-2 text-left">Klient</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Przypisany do</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedClients.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                          Brak klientów spełniających kryteria
                        </td>
                      </tr>
                    ) : (
                      paginatedClients.map((client) => {
                        const clientName =
                          client.type === "COMPANY"
                            ? client.companyName || "Brak nazwy firmy"
                            : `${client.firstName || ""} ${client.lastName || ""}`.trim() ||
                              "Brak nazwy"

                        return (
                          <tr
                            key={client.id}
                            className="border-t hover:bg-muted/50"
                          >
                            <td className="px-4 py-2">
                              <Checkbox
                                checked={selectedClientIds.has(client.id)}
                                onCheckedChange={(checked) =>
                                  handleSelectClient(client.id, checked as boolean)
                                }
                              />
                            </td>
                            <td className="px-4 py-2">{clientName}</td>
                            <td className="px-4 py-2">
                              {statusLabels[client.status]}
                            </td>
                            <td className="px-4 py-2">
                              {client.assignee
                                ? client.assignee.name || client.assignee.email
                                : "Nieprzypisany"}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Strona {currentPage} z {totalPages} ({filteredClients.length} klientów)
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Poprzednia
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Następna
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

