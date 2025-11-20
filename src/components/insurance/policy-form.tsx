"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface PolicyFormProps {
  policy?: any
  calculationId?: string
  clientId?: string
  vehicleId?: string
  onClose: () => void
  onSuccess: () => void
}

export function PolicyForm({ policy, calculationId, clientId, vehicleId, onClose, onSuccess }: PolicyFormProps) {
  const [insuranceCompanies, setInsuranceCompanies] = useState<any[]>([])
  const [formData, setFormData] = useState({
    policyNumber: policy?.policyNumber || "",
    issueDate: policy?.issueDate ? new Date(policy.issueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    validFrom: policy?.validFrom ? new Date(policy.validFrom).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    validTo: policy?.validTo ? new Date(policy.validTo).toISOString().split('T')[0] : "",
    status: policy?.status || "ACTIVE",
    calculationId: policy?.calculationId || calculationId || "",
    clientId: policy?.clientId || clientId || "",
    vehicleId: policy?.vehicleId || vehicleId || "",
    insuranceCompanyId: policy?.insuranceCompanyId || "none",
    configurationType: policy?.configurationType || "STANDARD",
    leasingCompany: policy?.leasingCompany || "",
    creditProvider: policy?.creditProvider || "",
    contractNumber: policy?.contractNumber || "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch insurance companies
    fetch('/api/insurance-companies')
      .then(res => res.json())
      .then(data => {
        if (data.companies) {
          setInsuranceCompanies(data.companies)
        }
      })
      .catch(() => {
        // Fallback - create empty array
        setInsuranceCompanies([])
      })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (!formData.policyNumber) {
        throw new Error("Numer polisy jest wymagany")
      }
      if (!formData.insuranceCompanyId || formData.insuranceCompanyId === "none") {
        throw new Error("Towarzystwo Ubezpieczeniowe jest wymagane")
      }

      const url = policy ? `/api/policies/${policy.id}` : "/api/policies"
      const method = policy ? "PUT" : "POST"

      const bodyData: any = {
        policyNumber: formData.policyNumber,
        issueDate: new Date(formData.issueDate).toISOString(),
        validFrom: new Date(formData.validFrom).toISOString(),
        validTo: new Date(formData.validTo).toISOString(),
        status: formData.status,
        calculationId: formData.calculationId || null,
        clientId: formData.clientId || null,
        vehicleId: formData.vehicleId || null,
        insuranceCompanyId: formData.insuranceCompanyId,
        configurationType: formData.configurationType === "STANDARD" ? null : formData.configurationType,
        leasingCompany: formData.configurationType === "LEASING" ? formData.leasingCompany || null : null,
        creditProvider: formData.configurationType === "CREDIT" ? formData.creditProvider || null : null,
        contractNumber: formData.contractNumber || null,
      }

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
      setError(error.message || "Wystąpił błąd podczas zapisywania polisy")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{policy ? "Edytuj polisę" : "Nowa polisa"}</CardTitle>
        <CardDescription>
          {policy ? "Zaktualizuj dane polisy" : "Utwórz nową polisę ubezpieczeniową"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="policyNumber">Numer polisy *</Label>
              <Input
                id="policyNumber"
                value={formData.policyNumber}
                onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="insuranceCompanyId">Towarzystwo Ubezpieczeniowe *</Label>
              <Select
                value={formData.insuranceCompanyId}
                onValueChange={(value) => setFormData({ ...formData, insuranceCompanyId: value })}
                required
              >
                <SelectTrigger id="insuranceCompanyId">
                  <SelectValue placeholder="Wybierz TU" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Wybierz TU</SelectItem>
                  {insuranceCompanies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="issueDate">Data wystawienia</Label>
              <Input
                id="issueDate"
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Wybierz status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Aktywna</SelectItem>
                  <SelectItem value="EXPIRED">Wygasła</SelectItem>
                  <SelectItem value="CANCELLED">Anulowana</SelectItem>
                  <SelectItem value="RENEWED">Odnowiona</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="validFrom">Ważna od</Label>
              <Input
                id="validFrom"
                type="date"
                value={formData.validFrom}
                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="validTo">Ważna do</Label>
              <Input
                id="validTo"
                type="date"
                value={formData.validTo}
                onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="configurationType">Typ konfiguracji</Label>
              <Select
                value={formData.configurationType}
                onValueChange={(value) => setFormData({ ...formData, configurationType: value })}
              >
                <SelectTrigger id="configurationType">
                  <SelectValue placeholder="Wybierz typ konfiguracji" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STANDARD">Standard</SelectItem>
                  <SelectItem value="LEASING">Leasing</SelectItem>
                  <SelectItem value="CREDIT">Kredyt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.configurationType === "LEASING" && (
              <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                <div>
                  <Label htmlFor="leasingCompany">Firma leasingowa</Label>
                  <Input
                    id="leasingCompany"
                    value={formData.leasingCompany}
                    onChange={(e) => setFormData({ ...formData, leasingCompany: e.target.value })}
                    placeholder="Nazwa firmy leasingowej"
                  />
                </div>
                <div>
                  <Label htmlFor="contractNumber">Numer umowy leasingu</Label>
                  <Input
                    id="contractNumber"
                    value={formData.contractNumber}
                    onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
                    placeholder="Numer umowy"
                  />
                </div>
              </div>
            )}

            {formData.configurationType === "CREDIT" && (
              <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                <div>
                  <Label htmlFor="creditProvider">Dostawca kredytu</Label>
                  <Input
                    id="creditProvider"
                    value={formData.creditProvider}
                    onChange={(e) => setFormData({ ...formData, creditProvider: e.target.value })}
                    placeholder="Nazwa banku/dostawcy kredytu"
                  />
                </div>
                <div>
                  <Label htmlFor="contractNumber">Numer umowy kredytu</Label>
                  <Input
                    id="contractNumber"
                    value={formData.contractNumber}
                    onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
                    placeholder="Numer umowy"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Zapisywanie..." : policy ? "Zaktualizuj" : "Utwórz"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

