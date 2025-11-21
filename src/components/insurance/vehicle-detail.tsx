"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, ArrowLeft } from "lucide-react"
import { VehicleForm } from "./vehicle-form"
import Link from "next/link"

interface VehicleDetailProps {
  vehicle: {
    id: string
    vin: string | null
    registrationNumber: string | null
    firstRegistrationDate: Date | null
    brand: string | null
    model: string | null
    productionYear: number | null
    infoEkspertId: string | null
    eurotaxId: string | null
    importedFromAbroad: boolean | null
    hasValidInspection: boolean | null
    hasLpgInstallation: boolean | null
    purchaseYear: number | null
    currentMileage: number | null
    eurotaxData: any
    infoEkspertData: any
    owners: Array<{
      client: {
        id: string
        firstName: string | null
        lastName: string | null
        companyName: string | null
        type: string
        email: string | null
        phone: string | null
      }
      isPrimary: boolean
    }>
  }
}

export function VehicleDetail({ vehicle }: VehicleDetailProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)

  if (isEditing) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => setIsEditing(false)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Anuluj edycję
        </Button>
        <VehicleForm
          vehicle={vehicle}
          clientIds={vehicle.owners.map((o) => o.client.id)}
          onClose={() => setIsEditing(false)}
          onSuccess={() => {
            setIsEditing(false)
            router.refresh()
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            {vehicle.registrationNumber || vehicle.vin || "Pojazd"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {vehicle.vin && `VIN: ${vehicle.vin}`}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edytuj
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Podstawowe informacje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {vehicle.brand && (
              <div>
                <p className="text-sm text-muted-foreground">Marka</p>
                <p className="font-medium">{vehicle.brand}</p>
              </div>
            )}
            {vehicle.model && (
              <div>
                <p className="text-sm text-muted-foreground">Model</p>
                <p className="font-medium">{vehicle.model}</p>
              </div>
            )}
            {vehicle.productionYear && (
              <div>
                <p className="text-sm text-muted-foreground">Rok produkcji</p>
                <p className="font-medium">{vehicle.productionYear}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Numer rejestracyjny</p>
              <p className="font-medium">{vehicle.registrationNumber || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">VIN</p>
              <p className="font-medium">{vehicle.vin || "-"}</p>
            </div>
            {vehicle.firstRegistrationDate && (
              <div>
                <p className="text-sm text-muted-foreground">Data pierwszej rejestracji</p>
                <p className="font-medium">
                  {new Date(vehicle.firstRegistrationDate).toLocaleDateString("pl-PL")}
                </p>
              </div>
            )}
            {vehicle.purchaseYear && (
              <div>
                <p className="text-sm text-muted-foreground">Rok nabycia</p>
                <p className="font-medium">{vehicle.purchaseYear}</p>
              </div>
            )}
            {vehicle.currentMileage !== null && (
              <div>
                <p className="text-sm text-muted-foreground">Przebieg</p>
                <p className="font-medium">{vehicle.currentMileage.toLocaleString("pl-PL")} km</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dodatkowe informacje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {vehicle.infoEkspertId && (
              <div>
                <p className="text-sm text-muted-foreground">ID Info-Ekspert</p>
                <p className="font-medium">{vehicle.infoEkspertId}</p>
              </div>
            )}
            {vehicle.eurotaxId && (
              <div>
                <p className="text-sm text-muted-foreground">ID Eurotax</p>
                <p className="font-medium">{vehicle.eurotaxId}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Sprowadzony z zagranicy</p>
              <p className="font-medium">{vehicle.importedFromAbroad ? "Tak" : "Nie"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ważne badanie techniczne</p>
              <p className="font-medium">{vehicle.hasValidInspection ? "Tak" : "Nie"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Instalacja gazowa</p>
              <p className="font-medium">{vehicle.hasLpgInstallation ? "Tak" : "Nie"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Właściciele</CardTitle>
          </CardHeader>
          <CardContent>
            {vehicle.owners.length === 0 ? (
              <p className="text-sm text-muted-foreground">Brak właścicieli</p>
            ) : (
              <div className="space-y-2">
                {vehicle.owners.map((owner) => (
                  <Link
                    key={owner.client.id}
                    href={`/clients/${owner.client.id}`}
                    className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">
                        {owner.client.type === "COMPANY"
                          ? owner.client.companyName || "Brak nazwy"
                          : `${owner.client.firstName || ""} ${owner.client.lastName || ""}`.trim() || "Brak nazwy"}
                      </p>
                      {owner.client.email && (
                        <p className="text-sm text-muted-foreground">{owner.client.email}</p>
                      )}
                      {owner.client.phone && (
                        <p className="text-sm text-muted-foreground">{owner.client.phone}</p>
                      )}
                    </div>
                    {owner.isPrimary && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-primary text-primary-foreground">
                        Główny
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

