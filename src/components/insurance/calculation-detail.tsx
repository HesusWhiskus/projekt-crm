"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, ArrowLeft } from "lucide-react"
import { CalculationForm } from "./calculation-form"
import { OffersList } from "./offers-list"
import Link from "next/link"
import { InsuranceScope } from "@prisma/client"

interface CalculationDetailProps {
  calculation: {
    id: string
    pesel: string | null
    firstName: string | null
    lastName: string | null
    previousLastName: string | null
    phone: string | null
    email: string | null
    postalCode: string | null
    city: string | null
    street: string | null
    houseNumber: string | null
    apartmentNumber: string | null
    hasDrivingLicense: boolean | null
    drivingLicenseDate: Date | null
    occupation: string | null
    maritalStatus: string | null
    hasChildUnder26: boolean | null
    status: string
    value: any
    validUntil: Date | null
    variant: string | null
    scopes: string[]
    installments: number | null
    offers?: Array<{
      id: string
      insuranceCompany: {
        id: string
        name: string
        logoUrl: string | null
      }
      price: number | string
      packageType: string | null
      scopes: InsuranceScope[]
      installments: number | null
      installmentAmount: number | string | null
      validUntil: Date | string | null
      isSelected: boolean
      status?: string | null
    }>
    client: {
      id: string
      firstName: string | null
      lastName: string | null
      companyName: string | null
      type: string
      email: string | null
      phone: string | null
    } | null
    vehicle: {
      id: string
      vin: string | null
      registrationNumber: string | null
    } | null
    createdAt: Date
  }
}

const statusLabels: Record<string, string> = {
  DRAFT: "Szkic",
  SENT: "Wysłane",
  ACCEPTED: "Zaakceptowane",
  REJECTED: "Odrzucone",
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SENT: "bg-blue-100 text-blue-800",
  ACCEPTED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
}

const variantLabels: Record<string, string> = {
  MINIMAL: "Minimalny",
  OPTIMAL: "Optymalny",
  MAXIMAL: "Maksymalny",
}

const scopeLabels: Record<string, string> = {
  OC: "OC",
  AC: "AC",
  NNW: "NNW",
  ASS: "ASS",
}

export function CalculationDetail({ calculation }: CalculationDetailProps) {
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
        <CalculationForm
          calculation={calculation}
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
          <h1 className="text-3xl font-bold">Kalkulacja</h1>
          <p className="text-muted-foreground mt-2">
            {calculation.firstName} {calculation.lastName}
          </p>
        </div>
        <div className="flex space-x-2">
          <span className={`px-3 py-1 rounded text-sm font-medium ${statusColors[calculation.status] || "bg-gray-100 text-gray-800"}`}>
            {statusLabels[calculation.status] || calculation.status}
          </span>
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edytuj
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Dane osobowe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Imię</p>
              <p className="font-medium">{calculation.firstName || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nazwisko</p>
              <p className="font-medium">{calculation.lastName || "-"}</p>
            </div>
            {calculation.previousLastName && (
              <div>
                <p className="text-sm text-muted-foreground">Poprzednie nazwisko</p>
                <p className="font-medium">{calculation.previousLastName}</p>
              </div>
            )}
            {calculation.pesel && (
              <div>
                <p className="text-sm text-muted-foreground">PESEL</p>
                <p className="font-medium">{calculation.pesel}</p>
              </div>
            )}
            {calculation.phone && (
              <div>
                <p className="text-sm text-muted-foreground">Telefon</p>
                <p className="font-medium">{calculation.phone}</p>
              </div>
            )}
            {calculation.email && (
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{calculation.email}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Adres</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {calculation.postalCode && (
              <div>
                <p className="text-sm text-muted-foreground">Kod pocztowy</p>
                <p className="font-medium">{calculation.postalCode}</p>
              </div>
            )}
            {calculation.city && (
              <div>
                <p className="text-sm text-muted-foreground">Miejscowość</p>
                <p className="font-medium">{calculation.city}</p>
              </div>
            )}
            {(calculation.street || calculation.houseNumber) && (
              <div>
                <p className="text-sm text-muted-foreground">Ulica</p>
                <p className="font-medium">
                  {calculation.street || ""} {calculation.houseNumber || ""} {calculation.apartmentNumber || ""}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dane dodatkowe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {calculation.occupation && (
              <div>
                <p className="text-sm text-muted-foreground">Zawód</p>
                <p className="font-medium">{calculation.occupation}</p>
              </div>
            )}
            {calculation.maritalStatus && (
              <div>
                <p className="text-sm text-muted-foreground">Stan cywilny</p>
                <p className="font-medium">{calculation.maritalStatus}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Prawo jazdy</p>
              <p className="font-medium">{calculation.hasDrivingLicense ? "Tak" : "Nie"}</p>
            </div>
            {calculation.drivingLicenseDate && (
              <div>
                <p className="text-sm text-muted-foreground">Data uzyskania prawa jazdy</p>
                <p className="font-medium">
                  {new Date(calculation.drivingLicenseDate).toLocaleDateString("pl-PL")}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Dziecko poniżej 26 lat</p>
              <p className="font-medium">{calculation.hasChildUnder26 ? "Tak" : "Nie"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informacje biznesowe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {calculation.variant && (
              <div>
                <p className="text-sm text-muted-foreground">Wariant</p>
                <p className="font-medium">{variantLabels[calculation.variant] || calculation.variant}</p>
              </div>
            )}
            {calculation.scopes && calculation.scopes.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground">Zakres</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {calculation.scopes.map((scope) => (
                    <span
                      key={scope}
                      className="px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary"
                    >
                      {scopeLabels[scope] || scope}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {calculation.value && (
              <div>
                <p className="text-sm text-muted-foreground">Wartość</p>
                <p className="font-medium">
                  {typeof calculation.value === "number"
                    ? calculation.value.toFixed(2)
                    : Number(calculation.value).toFixed(2)}{" "}
                  zł
                </p>
              </div>
            )}
            {calculation.validUntil && (
              <div>
                <p className="text-sm text-muted-foreground">Ważna do</p>
                <p className="font-medium">
                  {new Date(calculation.validUntil).toLocaleDateString("pl-PL")}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Utworzona</p>
              <p className="font-medium">
                {new Date(calculation.createdAt).toLocaleDateString("pl-PL")}
              </p>
            </div>
          </CardContent>
        </Card>

        {calculation.client && (
          <Card>
            <CardHeader>
              <CardTitle>Klient</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/clients/${calculation.client.id}`}
                className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="font-medium">
                    {calculation.client.type === "PERSON"
                      ? `${calculation.client.firstName || ""} ${calculation.client.lastName || ""}`.trim() || "Brak nazwy"
                      : calculation.client.companyName || "Brak nazwy"}
                  </p>
                  {calculation.client.email && (
                    <p className="text-sm text-muted-foreground">{calculation.client.email}</p>
                  )}
                </div>
              </Link>
            </CardContent>
          </Card>
        )}

        {calculation.vehicle && (
          <Card>
            <CardHeader>
              <CardTitle>Pojazd</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/insurance-agent/vehicles/${calculation.vehicle.id}`}
                className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="font-medium">
                    {calculation.vehicle.registrationNumber || calculation.vehicle.vin || "Brak numeru"}
                  </p>
                  {calculation.vehicle.vin && (
                    <p className="text-sm text-muted-foreground">VIN: {calculation.vehicle.vin}</p>
                  )}
                </div>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {calculation.offers && calculation.offers.length > 0 && (
        <div className="mt-6">
          <OffersList
            offers={calculation.offers}
            showSelectButton={true}
            onSelectOffer={async (offerId) => {
              // TODO: Implementacja wyboru oferty
              const response = await fetch(`/api/offers/${offerId}/select`, {
                method: "PUT",
              })
              if (response.ok) {
                router.refresh()
              }
            }}
          />
        </div>
      )}
    </div>
  )
}


