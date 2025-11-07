"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { DateTimePicker } from "@/components/ui/datetime-picker"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DealStage, UserRole } from "@prisma/client"
import { utcDateToLocalDateTime } from "@/lib/timezone"

interface DealFormProps {
  clients: Array<{
    id: string
    firstName: string
    lastName: string
    agencyName: string | null
  }>
  groups?: Array<{
    id: string
    name: string
  }>
  currentUser?: {
    id: string
    role: UserRole
  }
  deal?: {
    id: string
    clientId: string
    value: number
    currency: string
    probability: number
    stage: DealStage
    expectedCloseDate: Date | null
    notes: string | null
    sharedGroups?: Array<{
      id: string
      name: string
    }>
  }
  onClose: () => void
  onSuccess: () => void
}

const stageOptions: Record<DealStage, string> = {
  INITIAL_CONTACT: "Pierwszy kontakt",
  PROPOSAL: "Oferta",
  NEGOTIATION: "Negocjacje",
  CLOSING: "Zamykanie",
  WON: "Wygrany",
  LOST: "Przegrany",
}

export function DealForm({ clients, groups, currentUser, deal, onClose, onSuccess }: DealFormProps) {
  const [formData, setFormData] = useState({
    clientId: deal?.clientId || "",
    value: deal?.value.toString() || "",
    currency: deal?.currency || "PLN",
    probability: deal?.probability.toString() || "50",
    stage: (deal?.stage || "INITIAL_CONTACT") as DealStage,
    expectedCloseDate: deal?.expectedCloseDate ? utcDateToLocalDateTime(deal.expectedCloseDate) : "",
    notes: deal?.notes || "",
    sharedGroupIds: deal?.sharedGroups?.map(g => g.id) || [] as string[],
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const url = deal ? `/api/deals/${deal.id}` : "/api/deals"
      const method = deal ? "PATCH" : "POST"

      const bodyData: any = {
        clientId: formData.clientId,
        value: parseFloat(formData.value),
        currency: formData.currency,
        probability: parseInt(formData.probability),
        stage: formData.stage,
      }
      
      if (formData.expectedCloseDate) {
        bodyData.expectedCloseDate = new Date(formData.expectedCloseDate).toISOString()
      }
      if (formData.notes) bodyData.notes = formData.notes
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
      setError(error.message || "Wystąpił błąd podczas zapisywania deala")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{deal ? "Edytuj deal" : "Dodaj nowy deal"}</CardTitle>
        <CardDescription>
          {deal ? "Zaktualizuj dane deala" : "Wypełnij formularz, aby dodać nowy deal"}
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
            <Label htmlFor="clientId">Klient *</Label>
            <Select
              id="clientId"
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              required
              disabled={isLoading || !!deal}
            >
              <option value="">Wybierz klienta</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.firstName} {client.lastName}
                  {client.agencyName ? ` (${client.agencyName})` : ""}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">Wartość *</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                min="0"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Waluta</Label>
              <Select
                id="currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                disabled={isLoading}
              >
                <option value="PLN">PLN</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="probability">Prawdopodobieństwo (%)</Label>
              <Input
                id="probability"
                type="number"
                min="0"
                max="100"
                value={formData.probability}
                onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage">Etap</Label>
              <Select
                id="stage"
                value={formData.stage}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value as DealStage })}
                disabled={isLoading || deal?.stage === "WON" || deal?.stage === "LOST"}
              >
                {Object.entries(stageOptions).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectedCloseDate">Oczekiwana data zamknięcia</Label>
            <DateTimePicker
              id="expectedCloseDate"
              value={formData.expectedCloseDate}
              onChange={(value) => setFormData({ ...formData, expectedCloseDate: value })}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notatki</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              disabled={isLoading}
              rows={4}
            />
          </div>

          {groups && groups.length > 0 && (
            <div className="space-y-2">
              <Label>Udostępnij grupom</Label>
              <div className="space-y-2">
                {groups.map((group) => (
                  <label key={group.id} className="flex items-center space-x-2">
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
                            sharedGroupIds: formData.sharedGroupIds.filter(id => id !== group.id),
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
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Zapisywanie..." : deal ? "Zaktualizuj" : "Dodaj"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

