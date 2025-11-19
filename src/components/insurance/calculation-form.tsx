"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"

interface CalculationFormProps {
  calculation?: any
  clientId?: string
  vehicleId?: string
  onClose: () => void
  onSuccess: () => void
}

export function CalculationForm({ calculation, clientId, vehicleId, onClose, onSuccess }: CalculationFormProps) {
  const [formData, setFormData] = useState({
    // Personal data
    pesel: calculation?.pesel || "",
    firstName: calculation?.firstName || "",
    lastName: calculation?.lastName || "",
    previousLastName: calculation?.previousLastName || "",
    phone: calculation?.phone || "",
    email: calculation?.email || "",
    // Address
    postalCode: calculation?.postalCode || "",
    city: calculation?.city || "",
    street: calculation?.street || "",
    houseNumber: calculation?.houseNumber || "",
    apartmentNumber: calculation?.apartmentNumber || "",
    // Additional data
    hasDrivingLicense: calculation?.hasDrivingLicense || false,
    drivingLicenseDate: calculation?.drivingLicenseDate ? new Date(calculation.drivingLicenseDate).toISOString().split('T')[0] : "",
    occupation: calculation?.occupation || "",
    maritalStatus: calculation?.maritalStatus || "",
    hasChildUnder26: calculation?.hasChildUnder26 || false,
    // Relations
    clientId: calculation?.clientId || clientId || "",
    vehicleId: calculation?.vehicleId || vehicleId || "",
    // Business fields
    status: calculation?.status || "DRAFT",
    value: calculation?.value?.toString() || "",
    validUntil: calculation?.validUntil ? new Date(calculation.validUntil).toISOString().split('T')[0] : "",
    // Insurance form data
    variant: calculation?.variant || "",
    scopes: calculation?.scopes || [] as string[],
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleScopeChange = (scope: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, scopes: [...formData.scopes, scope] })
    } else {
      setFormData({ ...formData, scopes: formData.scopes.filter((s: string) => s !== scope) })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const url = calculation ? `/api/calculations/${calculation.id}` : "/api/calculations"
      const method = calculation ? "PUT" : "POST"

      const bodyData: any = {
        pesel: formData.pesel || null,
        firstName: formData.firstName || null,
        lastName: formData.lastName || null,
        previousLastName: formData.previousLastName || null,
        phone: formData.phone || null,
        email: formData.email || null,
        postalCode: formData.postalCode || null,
        city: formData.city || null,
        street: formData.street || null,
        houseNumber: formData.houseNumber || null,
        apartmentNumber: formData.apartmentNumber || null,
        hasDrivingLicense: formData.hasDrivingLicense,
        drivingLicenseDate: formData.drivingLicenseDate ? new Date(formData.drivingLicenseDate).toISOString() : null,
        occupation: formData.occupation || null,
        maritalStatus: formData.maritalStatus || null,
        hasChildUnder26: formData.hasChildUnder26,
        clientId: formData.clientId || null,
        vehicleId: formData.vehicleId || null,
        status: formData.status,
        value: formData.value ? parseFloat(formData.value) : null,
        validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : null,
        variant: formData.variant || null,
        scopes: formData.scopes,
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
      setError(error.message || "Wystąpił błąd podczas zapisywania kalkulacji")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{calculation ? "Edytuj kalkulację" : "Nowa kalkulacja"}</CardTitle>
        <CardDescription>
          {calculation ? "Zaktualizuj dane kalkulacji" : "Utwórz nową kalkulację ubezpieczeniową"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
              {error}
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold mb-4">Dane osobowe</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pesel">PESEL</Label>
                <Input
                  id="pesel"
                  value={formData.pesel}
                  onChange={(e) => setFormData({ ...formData, pesel: e.target.value })}
                  placeholder="Wprowadź PESEL"
                />
              </div>
              <div>
                <Label htmlFor="firstName">Imię</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Nazwisko</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="previousLastName">Poprzednie nazwisko</Label>
                <Input
                  id="previousLastName"
                  value={formData.previousLastName}
                  onChange={(e) => setFormData({ ...formData, previousLastName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Adres</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="postalCode">Kod pocztowy</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  placeholder="00-000"
                />
              </div>
              <div>
                <Label htmlFor="city">Miejscowość</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="street">Ulica</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="houseNumber">Numer domu</Label>
                <Input
                  id="houseNumber"
                  value={formData.houseNumber}
                  onChange={(e) => setFormData({ ...formData, houseNumber: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="apartmentNumber">Numer mieszkania</Label>
                <Input
                  id="apartmentNumber"
                  value={formData.apartmentNumber}
                  onChange={(e) => setFormData({ ...formData, apartmentNumber: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Dane dodatkowe</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasDrivingLicense"
                  checked={formData.hasDrivingLicense}
                  onCheckedChange={(checked) => setFormData({ ...formData, hasDrivingLicense: checked === true })}
                />
                <Label htmlFor="hasDrivingLicense" className="cursor-pointer">
                  Prawo jazdy odpowiednie dla pojazdu
                </Label>
              </div>
              {formData.hasDrivingLicense && (
                <div>
                  <Label htmlFor="drivingLicenseDate">Data uzyskania prawa jazdy</Label>
                  <Input
                    id="drivingLicenseDate"
                    type="date"
                    value={formData.drivingLicenseDate}
                    onChange={(e) => setFormData({ ...formData, drivingLicenseDate: e.target.value })}
                  />
                </div>
              )}
              <div>
                <Label htmlFor="occupation">Zawód</Label>
                <Input
                  id="occupation"
                  value={formData.occupation}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="maritalStatus">Stan cywilny</Label>
                <Input
                  id="maritalStatus"
                  value={formData.maritalStatus}
                  onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })}
                  placeholder="np. zamężna/żonaty"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasChildUnder26"
                  checked={formData.hasChildUnder26}
                  onCheckedChange={(checked) => setFormData({ ...formData, hasChildUnder26: checked === true })}
                />
                <Label htmlFor="hasChildUnder26" className="cursor-pointer">
                  Dziecko poniżej 26 roku życia
                </Label>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Dane ubezpieczenia</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="DRAFT">Szkic</option>
                  <option value="SENT">Wysłane</option>
                  <option value="ACCEPTED">Zaakceptowane</option>
                  <option value="REJECTED">Odrzucone</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="variant">Wariant</Label>
                <Select
                  id="variant"
                  value={formData.variant}
                  onChange={(e) => setFormData({ ...formData, variant: e.target.value })}
                >
                  <option value="">Wybierz wariant</option>
                  <option value="MINIMAL">Minimalny</option>
                  <option value="OPTIMAL">Optymalny</option>
                  <option value="MAXIMAL">Maksymalny</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="value">Wartość</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="validUntil">Ważna do</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                />
              </div>
            </div>

            <div className="mt-4">
              <Label>Zakres ubezpieczenia</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {['OC', 'AC', 'NNW', 'ASS'].map((scope) => (
                  <div key={scope} className="flex items-center space-x-2">
                    <Checkbox
                      id={`scope-${scope}`}
                      checked={formData.scopes.includes(scope)}
                      onCheckedChange={(checked) => handleScopeChange(scope, checked === true)}
                    />
                    <Label htmlFor={`scope-${scope}`} className="cursor-pointer">
                      {scope}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Zapisywanie..." : calculation ? "Zaktualizuj" : "Utwórz"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

