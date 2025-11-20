"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateTimePicker } from "@/components/ui/datetime-picker"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClientStatus, ClientPriority, ClientType, UserRole } from "@prisma/client"
import { utcDateToLocalDateTime } from "@/lib/timezone"
import { FileText, Shield, Car, Plus } from "lucide-react"
import Link from "next/link"

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
  insuranceAgentsEnabled?: boolean
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

export function ClientForm({ users, groups, currentUser, insuranceAgentsEnabled = false, client, onClose, onSuccess }: ClientFormProps) {
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
    assignedTo: client?.assignedTo || currentUser?.id || null,
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
      } else if (formData.type === "COMPANY" || formData.type === "SOLE_PROPRIETORSHIP" || 
                 formData.type === "LIMITED_LIABILITY_COMPANY" || formData.type === "JOINT_STOCK_COMPANY" ||
                 formData.type === "CIVIL_PARTNERSHIP") {
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
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as ClientType })}
              disabled={isLoading}
              required
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Wybierz typ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PERSON">Osoba fizyczna</SelectItem>
                <SelectItem value="SOLE_PROPRIETORSHIP">JDG - Jednoosobowa działalność gospodarcza</SelectItem>
                <SelectItem value="LIMITED_LIABILITY_COMPANY">Spółka z ograniczoną odpowiedzialnością (sp. z o.o.)</SelectItem>
                <SelectItem value="JOINT_STOCK_COMPANY">Spółka akcyjna (SA)</SelectItem>
                <SelectItem value="CIVIL_PARTNERSHIP">Spółka cywilna</SelectItem>
                <SelectItem value="COMPANY">Firma (ogólne)</SelectItem>
              </SelectContent>
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
                <Label htmlFor="companyName">
                  {formData.type === "SOLE_PROPRIETORSHIP" ? "Nazwa działalności *" :
                   formData.type === "LIMITED_LIABILITY_COMPANY" ? "Nazwa spółki z o.o. *" :
                   formData.type === "JOINT_STOCK_COMPANY" ? "Nazwa spółki akcyjnej *" :
                   formData.type === "CIVIL_PARTNERSHIP" ? "Nazwa spółki cywilnej *" :
                   "Nazwa firmy *"}
                </Label>
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
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as ClientStatus })}
                disabled={isLoading}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Wybierz status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusOptions).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priorytet</Label>
              <Select
                value={formData.priority || "none"}
                onValueChange={(value) => setFormData({ ...formData, priority: value === "none" ? null : (value as ClientPriority) })}
                disabled={isLoading}
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Brak priorytetu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Brak priorytetu</SelectItem>
                  {Object.entries(priorityOptions).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
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
                value={formData.assignedTo ?? "none"}
                onValueChange={(value) => setFormData({ ...formData, assignedTo: value === "none" ? null : value })}
                disabled={isLoading}
              >
                <SelectTrigger id="assignedTo">
                  <SelectValue placeholder="Brak przypisania" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Brak przypisania</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
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

          {insuranceAgentsEnabled && (
            <div className="pt-4 border-t">
              <div className="space-y-3">
                <div>
                  <Label className="text-base font-semibold">Powiązania ubezpieczeniowe</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Utwórz powiązane rekordy ubezpieczeniowe dla tego klienta
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {client ? (
                    <>
                      <Link
                        href={`/insurance-agent/calculations/new?clientId=${client.id}`}
                        className="flex items-center space-x-2 p-3 border rounded hover:bg-muted/50 transition-colors"
                      >
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">Dodaj kalkulację</span>
                      </Link>
                      <Link
                        href={`/insurance-agent/policies/new?clientId=${client.id}`}
                        className="flex items-center space-x-2 p-3 border rounded hover:bg-muted/50 transition-colors"
                      >
                        <Shield className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">Dodaj polisę</span>
                      </Link>
                      <Link
                        href={`/insurance-agent/vehicles/new?clientId=${client.id}`}
                        className="flex items-center space-x-2 p-3 border rounded hover:bg-muted/50 transition-colors"
                      >
                        <Car className="h-4 w-4 text-purple-500" />
                        <span className="text-sm font-medium">Dodaj pojazd</span>
                      </Link>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center space-x-2 p-3 border rounded bg-muted/30 opacity-60">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Zapisz klienta, aby dodać kalkulację</span>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded bg-muted/30 opacity-60">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Zapisz klienta, aby dodać polisę</span>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded bg-muted/30 opacity-60">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Zapisz klienta, aby dodać pojazd</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
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

