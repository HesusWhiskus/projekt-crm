"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ContactType, UserRole } from "@prisma/client"
import { Plus } from "lucide-react"
import { ContactForm } from "./contact-form"
import { ContactTimeline } from "./contact-timeline"
import { contactTypeLabels } from "@/lib/status-config"

interface Contact {
  id: string
  type: ContactType | null // Optional for notes
  date: Date
  notes: string
  isNote: boolean
  client: {
    id: string
    firstName: string | null
    lastName: string | null
    companyName?: string | null // Temporarily optional - column doesn't exist in production DB yet
    type: string
  }
  user: {
    id: string
    name: string | null
    email: string
  }
  attachments: Array<{
    id: string
    filename: string
    path: string
  }>
  sharedGroups?: Array<{
    id: string
    name: string
  }>
}

interface ContactsListProps {
  contacts: Contact[]
  clients: Array<{
    id: string
    firstName: string | null
    lastName: string | null
    companyName?: string | null // Temporarily optional - column doesn't exist in production DB yet
    type: string
  }>
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


export function ContactsList({
  contacts,
  clients,
  users,
  groups,
  currentUser,
}: ContactsListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isCreating, setIsCreating] = useState(false)
  const [editingContactId, setEditingContactId] = useState<string | null>(null)
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [filters, setFilters] = useState({
    type: searchParams.get("type") || "",
    clientId: searchParams.get("clientId") || "",
    userId: searchParams.get("userId") || "",
  })

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    const params = new URLSearchParams()
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    router.push(`/contacts?${params.toString()}`)
  }

  const handleCreateClick = () => {
    setIsCreating(true)
  }

  const handleAddClient = () => {
    setIsCreating(false)
    router.push("/clients")
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Kontakty</h1>
          <p className="text-muted-foreground mt-2">
            Historia interakcji z klientami
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Dodaj kontakt
        </Button>
      </div>

      {isCreating && (
        <ContactForm
          users={users}
          groups={groups}
          currentUser={currentUser}
          onClose={() => {
            setIsCreating(false)
            setSelectedClientId("")
          }}
          onSuccess={() => {
            setIsCreating(false)
            setSelectedClientId("")
            router.refresh()
          }}
          onAddClient={handleAddClient}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Filtry</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Typ kontaktu</Label>
              <Select
                id="type"
                value={filters.type}
                onChange={(e) => handleFilterChange("type", e.target.value)}
              >
                <option value="">Wszystkie</option>
                {Object.entries(contactTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientId">Klient</Label>
              <Select
                id="clientId"
                value={filters.clientId}
                onChange={(e) => handleFilterChange("clientId", e.target.value)}
              >
                <option value="">Wszyscy</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.type === "COMPANY" ? (client.companyName || "Brak nazwy firmy") : `${client.firstName} ${client.lastName}`.trim() || "Brak nazwy"}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="userId">Użytkownik</Label>
              <Select
                id="userId"
                value={filters.userId}
                onChange={(e) => handleFilterChange("userId", e.target.value)}
              >
                <option value="">Wszyscy</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista kontaktów ({contacts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ContactTimeline
            contacts={contacts}
            users={users}
            groups={groups}
            currentUser={currentUser}
            onEdit={(contactId) => setEditingContactId(contactId)}
            editingContactId={editingContactId}
          />
        </CardContent>
      </Card>
    </div>
  )
}

