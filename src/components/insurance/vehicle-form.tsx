"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { DateTimePicker } from "@/components/ui/datetime-picker"

interface VehicleFormProps {
  vehicle?: {
    id: string
    vin: string | null
    registrationNumber: string | null
    firstRegistrationDate: Date | null
    importedFromAbroad: boolean | null
    hasValidInspection: boolean | null
    hasLpgInstallation: boolean | null
    purchaseYear: number | null
    currentMileage: number | null
  }
  clientIds?: string[]
  onClose: () => void
  onSuccess: () => void
}

export function VehicleForm({ vehicle, clientIds = [], onClose, onSuccess }: VehicleFormProps) {
  const [formData, setFormData] = useState({
    vin: vehicle?.vin || "",
    registrationNumber: vehicle?.registrationNumber || "",
    firstRegistrationDate: vehicle?.firstRegistrationDate ? new Date(vehicle.firstRegistrationDate).toISOString().split('T')[0] : "",
    importedFromAbroad: vehicle?.importedFromAbroad || false,
    hasValidInspection: vehicle?.hasValidInspection || false,
    hasLpgInstallation: vehicle?.hasLpgInstallation || false,
    purchaseYear: vehicle?.purchaseYear?.toString() || "",
    currentMileage: vehicle?.currentMileage?.toString() || "",
    clientIds: clientIds,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (!formData.vin && !formData.registrationNumber) {
        throw new Error("VIN lub numer rejestracyjny jest wymagany")
      }

      const url = vehicle ? `/api/vehicles/${vehicle.id}` : "/api/vehicles"
      const method = vehicle ? "PUT" : "POST"

      const bodyData: any = {
        vin: formData.vin || null,
        registrationNumber: formData.registrationNumber || null,
        firstRegistrationDate: formData.firstRegistrationDate ? new Date(formData.firstRegistrationDate).toISOString() : null,
        importedFromAbroad: formData.importedFromAbroad,
        hasValidInspection: formData.hasValidInspection,
        hasLpgInstallation: formData.hasLpgInstallation,
        purchaseYear: formData.purchaseYear ? parseInt(formData.purchaseYear, 10) : null,
        currentMileage: formData.currentMileage ? parseInt(formData.currentMileage, 10) : null,
        clientIds: formData.clientIds,
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
      setError(error.message || "Wystąpił błąd podczas zapisywania pojazdu")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{vehicle ? "Edytuj pojazd" : "Nowy pojazd"}</CardTitle>
        <CardDescription>
          {vehicle ? "Zaktualizuj dane pojazdu" : "Dodaj nowy pojazd do systemu"}
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
              <Label htmlFor="vin">Numer VIN</Label>
              <Input
                id="vin"
                value={formData.vin}
                onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                placeholder="Wprowadź numer VIN"
              />
            </div>

            <div>
              <Label htmlFor="registrationNumber">Numer rejestracyjny</Label>
              <Input
                id="registrationNumber"
                value={formData.registrationNumber}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                placeholder="Wprowadź numer rejestracyjny"
              />
            </div>

            <div>
              <Label htmlFor="firstRegistrationDate">Data pierwszej rejestracji</Label>
              <Input
                id="firstRegistrationDate"
                type="date"
                value={formData.firstRegistrationDate}
                onChange={(e) => setFormData({ ...formData, firstRegistrationDate: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="purchaseYear">Rok nabycia</Label>
              <Input
                id="purchaseYear"
                type="number"
                min="1900"
                max="2100"
                value={formData.purchaseYear}
                onChange={(e) => setFormData({ ...formData, purchaseYear: e.target.value })}
                placeholder="np. 2020"
              />
            </div>

            <div>
              <Label htmlFor="currentMileage">Aktualny przebieg</Label>
              <Input
                id="currentMileage"
                type="number"
                min="0"
                value={formData.currentMileage}
                onChange={(e) => setFormData({ ...formData, currentMileage: e.target.value })}
                placeholder="np. 50000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="importedFromAbroad"
                checked={formData.importedFromAbroad}
                onCheckedChange={(checked) => setFormData({ ...formData, importedFromAbroad: checked === true })}
              />
              <Label htmlFor="importedFromAbroad" className="cursor-pointer">
                Sprowadzony z zagranicy
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasValidInspection"
                checked={formData.hasValidInspection}
                onCheckedChange={(checked) => setFormData({ ...formData, hasValidInspection: checked === true })}
              />
              <Label htmlFor="hasValidInspection" className="cursor-pointer">
                Ważne badanie techniczne
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasLpgInstallation"
                checked={formData.hasLpgInstallation}
                onCheckedChange={(checked) => setFormData({ ...formData, hasLpgInstallation: checked === true })}
              />
              <Label htmlFor="hasLpgInstallation" className="cursor-pointer">
                Instalacja gazowa (LPG)
              </Label>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Zapisywanie..." : vehicle ? "Zaktualizuj" : "Utwórz"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

