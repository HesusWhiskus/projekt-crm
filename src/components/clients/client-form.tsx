"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { DateTimePicker } from "@/components/ui/datetime-picker"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClientStatus, ClientPriority, ClientType, UserRole } from "@prisma/client"
import { utcDateToLocalDateTime } from "@/lib/timezone"

interface ClientFormProps {
  users: Array<{
    id: string
    name: string | null
    email: string
  }>
  groups?: Array<{
    id: string
    name: string
  }>
  currentUser?: {
    id: string
    role: UserRole
  }
  client?: {
    id: string
    type: ClientType
    firstName: string | null
    lastName: string | null
    pesel: string | null
    companyName?: string | null
    taxId: string | null
    regon: string | null
    email: string | null
    phone: string | null
    website: string | null
    address: string | null
    source: string | null
    status: ClientStatus
    priority: ClientPriority | null
    nextFollowUpAt: Date | null
    assignedTo: string | null
    sharedGroups?: Array<{
      id: string
      name: string
    }>
  }
  onClose: () => void
  onSuccess: () => void
}

const statusOptions: Record<ClientStatus, string> = {
  NEW_LEAD: "Nowy lead",
  IN_CONTACT: "W kontakcie",
  DEMO_SENT: "Demo wysłane",
  NEGOTIATION: "Negocjacje",
  ACTIVE_CLIENT: "Klient aktywny",
  LOST: "Utracony",
}

const priorityOptions: Record<ClientPriority, string> = {
  LOW: "Niski",
  MEDIUM: "Średni",
  HIGH: "Wysoki",
}

export function ClientForm({ users, groups, currentUser, client, onClose, onSuccess }: ClientFormProps) {
  const [formData, setFormData] = useState({
    type: client?.type || ("PERSON" as ClientType),
    firstName: client?.firstName || "",
    lastName: client?.lastName || "",
    pesel: client?.pesel || "",
    companyName: client?.companyName || "",
    taxId: client?.taxId || "",
    regon: client?.regon || "",
    email: client?.email || "",
    phone: client?.phone || "",
    website: client?.website || "",
    address: client?.address || "",
    source: client?.source || "",
    status: client?.status || ("NEW_LEAD" as ClientStatus),
    priority: client?.priority || null,
    nextFollowUpAt: client?.nextFollowUpAt ? utcDateToLocalDateTime(client.nextFollowUpAt) : "",
    assignedTo: client?.assignedTo || currentUser?.id || "",
    sharedGroupIds: client?.sharedGroups?.map(g => g.id) || [] as string[],
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const url = client ? `/api/clients/${client.id}` : "/api/clients"
      const method = client ? "PATCH" : "POST"

      const bodyData: any = {
        type: formData.type,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        website: formData.website || undefined,
        address: formData.address || undefined,
        source: formData.source || undefined,
        status: formData.status,
        priority: formData.priority || undefined,
        nextFollowUpAt: formData.nextFollowUpAt || undefined,
      }

      // Add type-specific fields
      if (formData.type === "PERSON") {
        bodyData.firstName = formData.firstName || undefined
        bodyData.lastName = formData.lastName || undefined
        bodyData.pesel = formData.pesel || undefined
      } else if (formData.type === "COMPANY") {
        bodyData.companyName = formData.companyName || undefined
        bodyData.taxId = formData.taxId || undefined
        bodyData.regon = formData.regon || undefined
      }
      
      if (formData.assignedTo) bodyData.assignedTo = formData.assignedTo
      if (formData.sharedGroupIds.length > 0) bodyData.sharedGroupIds = formData.sharedGroupIds
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Wystąpił błąd")
      }

      onSuccess()
    } catch (error: any) {
      setError(error.message || "Wystąpił błąd podczas zapisywania klienta")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{client ? "Edytuj klienta" : "Dodaj nowego klienta"}</CardTitle>
        <CardDescription>
          {client ? "Zaktualizuj dane klienta" : "Wypełnij formularz, aby dodać nowego klienta"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Typ klienta *</Label>
            <Select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as ClientType })}
              disabled={isLoading}
              required
            >
              <option value="PERSON">Osoba fizyczna</option>
              <option value="COMPANY">Firma</option>
            </Select>
          </div>

          {formData.type === "PERSON" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Imię *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nazwisko *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pesel">PESEL</Label>
                <Input
                  id="pesel"
                  value={formData.pesel}
                  onChange={(e) => setFormData({ ...formData, pesel: e.target.value })}
                  disabled={isLoading}
                  placeholder="Opcjonalnie"
                  maxLength={11}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nazwa firmy *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxId">NIP</Label>
                <Input
                  id="taxId"
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  disabled={isLoading}
                  placeholder="Opcjonalnie"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="regon">REGON</Label>
                <Input
                  id="regon"
                  value={formData.regon}
                  onChange={(e) => setFormData({ ...formData, regon: e.target.value })}
                  disabled={isLoading}
                  placeholder="Opcjonalnie"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website">Strona WWW</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ClientStatus })}
                disabled={isLoading}
              >
                {Object.entries(statusOptions).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priorytet</Label>
              <Select
                id="priority"
                value={formData.priority || ""}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value ? (e.target.value as ClientPriority) : null })}
                disabled={isLoading}
              >
                <option value="">Brak priorytetu</option>
                {Object.entries(priorityOptions).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <DateTimePicker
              id="nextFollowUpAt"
              label="Następny follow-up"
              value={formData.nextFollowUpAt || ""}
              onChange={(value) => setFormData({ ...formData, nextFollowUpAt: value })}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adres</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              disabled={isLoading}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source">Źródło pozyskania</Label>
              <Input
                id="source"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                placeholder="np. Lead, Polecenie, Wydarzenie"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignedTo">Odpowiedzialny</Label>
              <Select
                id="assignedTo"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                disabled={isLoading}
              >
                <option value="">Brak przypisania</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {groups && groups.length > 0 && (
            <div className="space-y-2">
              <Label>Udostępnij grupom (opcjonalnie)</Label>
              <div className="space-y-2 border rounded p-3 max-h-40 overflow-y-auto">
                {groups.map((group) => (
                  <label key={group.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.sharedGroupIds.includes(group.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            sharedGroupIds: [...formData.sharedGroupIds, group.id],
                          })
                        } else {
                          setFormData({
                            ...formData,
                            sharedGroupIds: formData.sharedGroupIds.filter((id) => id !== group.id),
                          })
                        }
                      }}
                      disabled={isLoading}
                      className="rounded"
                    />
                    <span className="text-sm">{group.name}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Klienci udostępnieni grupom będą widoczni dla wszystkich użytkowników w tych grupach
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Zapisywanie..." : client ? "Zapisz zmiany" : "Dodaj klienta"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

