"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { PlanType } from "@prisma/client"

interface Organization {
  id: string
  name: string
  plan: PlanType
  settings: any
}

interface OrganizationFormProps {
  organization?: Organization
  onClose: () => void
  onSuccess: () => void
}

const planLabels: Record<PlanType, string> = {
  BASIC: "Basic",
  PRO: "Pro",
}

export function OrganizationForm({ organization, onClose, onSuccess }: OrganizationFormProps) {
  const [formData, setFormData] = useState({
    name: organization?.name || "",
    plan: organization?.plan || ("BASIC" as PlanType),
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const url = organization ? `/api/admin/organizations/${organization.id}` : "/api/admin/organizations"
      const method = organization ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Wystąpił błąd")
      }

      onSuccess()
    } catch (error: any) {
      setError(error.message || "Wystąpił błąd podczas zapisywania organizacji")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{organization ? "Edytuj organizację" : "Dodaj nową organizację"}</CardTitle>
        <CardDescription>
          {organization ? "Zaktualizuj dane organizacji" : "Utwórz nową organizację w systemie"}
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
            <Label htmlFor="name">Nazwa organizacji *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={isLoading}
              placeholder="np. Polskie Polisy"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan">Plan *</Label>
            <Select
              id="plan"
              value={formData.plan}
              onChange={(e) => setFormData({ ...formData, plan: e.target.value as PlanType })}
              required
              disabled={isLoading}
            >
              {Object.entries(planLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <p className="text-xs text-muted-foreground">
              Plan PRO umożliwia dostęp do zaawansowanych funkcji (integracje, raporty, multi-tenant)
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Zapisywanie..." : organization ? "Zapisz zmiany" : "Dodaj organizację"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

