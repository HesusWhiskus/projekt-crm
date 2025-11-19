"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, ArrowLeft, Download } from "lucide-react"
import { PolicyForm } from "./policy-form"
import Link from "next/link"

interface PolicyDetailProps {
  policy: {
    id: string
    policyNumber: string
    issueDate: Date
    validFrom: Date
    validTo: Date
    status: string
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
    insuranceCompany: {
      id: string
      name: string
      logoUrl: string | null
    } | null
    calculation: {
      id: string
      status: string
      value: any
    } | null
    documents: Array<{
      id: string
      filename: string
      path: string
      createdAt: Date
    }>
    createdAt: Date
  }
}

const statusLabels: Record<string, string> = {
  ACTIVE: "Aktywna",
  EXPIRED: "Wygasła",
  CANCELLED: "Anulowana",
  RENEWED: "Odnowiona",
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  EXPIRED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
  RENEWED: "bg-blue-100 text-blue-800",
}

export function PolicyDetail({ policy }: PolicyDetailProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)

  const handleDownloadDocument = async (docId: string, filename: string) => {
    try {
      const response = await fetch(`/api/policies/${policy.id}/documents/${docId}/download`)
      if (!response.ok) {
        throw new Error("Błąd podczas pobierania dokumentu")
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error(error)
      alert("Wystąpił błąd podczas pobierania dokumentu")
    }
  }

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
        <PolicyForm
          policy={policy}
          onClose={() => setIsEditing(false)}
          onSuccess={() => {
            setIsEditing(false)
            router.refresh()
          }}
        />
      </div>
    )
  }

  const isExpiringSoon =
    policy.status === "ACTIVE" &&
    new Date(policy.validTo) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) &&
    new Date(policy.validTo) >= new Date()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Polisa {policy.policyNumber}</h1>
          <p className="text-muted-foreground mt-2">
            {policy.client?.type === "COMPANY"
              ? policy.client.companyName || "Brak nazwy"
              : `${policy.client?.firstName || ""} ${policy.client?.lastName || ""}`.trim() || "Brak nazwy"}
          </p>
        </div>
        <div className="flex space-x-2">
          <span className={`px-3 py-1 rounded text-sm font-medium ${statusColors[policy.status] || "bg-gray-100 text-gray-800"}`}>
            {statusLabels[policy.status] || policy.status}
          </span>
          {isExpiringSoon && (
            <span className="px-3 py-1 rounded text-sm font-medium bg-orange-100 text-orange-800">
              Wygasa wkrótce
            </span>
          )}
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edytuj
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informacje o polisie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Numer polisy</p>
              <p className="font-medium">{policy.policyNumber}</p>
            </div>
            {policy.insuranceCompany && (
              <div>
                <p className="text-sm text-muted-foreground">Towarzystwo ubezpieczeniowe</p>
                <div className="flex items-center gap-2 mt-1">
                  {policy.insuranceCompany.logoUrl && (
                    <img
                      src={policy.insuranceCompany.logoUrl}
                      alt={policy.insuranceCompany.name}
                      className="h-6 w-auto"
                    />
                  )}
                  <p className="font-medium">{policy.insuranceCompany.name}</p>
                </div>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Data wystawienia</p>
              <p className="font-medium">{new Date(policy.issueDate).toLocaleDateString("pl-PL")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ważna od</p>
              <p className="font-medium">{new Date(policy.validFrom).toLocaleDateString("pl-PL")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ważna do</p>
              <p className={`font-medium ${isExpiringSoon ? "text-orange-600" : ""}`}>
                {new Date(policy.validTo).toLocaleDateString("pl-PL")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Utworzona</p>
              <p className="font-medium">{new Date(policy.createdAt).toLocaleDateString("pl-PL")}</p>
            </div>
          </CardContent>
        </Card>

        {policy.client && (
          <Card>
            <CardHeader>
              <CardTitle>Klient</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/clients/${policy.client.id}`}
                className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="font-medium">
                    {policy.client.type === "COMPANY"
                      ? policy.client.companyName || "Brak nazwy"
                      : `${policy.client.firstName || ""} ${policy.client.lastName || ""}`.trim() || "Brak nazwy"}
                  </p>
                  {policy.client.email && (
                    <p className="text-sm text-muted-foreground">{policy.client.email}</p>
                  )}
                  {policy.client.phone && (
                    <p className="text-sm text-muted-foreground">{policy.client.phone}</p>
                  )}
                </div>
              </Link>
            </CardContent>
          </Card>
        )}

        {policy.vehicle && (
          <Card>
            <CardHeader>
              <CardTitle>Pojazd</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/insurance-agent/vehicles/${policy.vehicle.id}`}
                className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="font-medium">
                    {policy.vehicle.registrationNumber || policy.vehicle.vin || "Brak numeru"}
                  </p>
                  {policy.vehicle.vin && (
                    <p className="text-sm text-muted-foreground">VIN: {policy.vehicle.vin}</p>
                  )}
                </div>
              </Link>
            </CardContent>
          </Card>
        )}

        {policy.calculation && (
          <Card>
            <CardHeader>
              <CardTitle>Kalkulacja</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/insurance-agent/calculations/${policy.calculation.id}`}
                className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="font-medium">Kalkulacja #{policy.calculation.id.slice(0, 8)}</p>
                  <p className="text-sm text-muted-foreground">
                    Status: {policy.calculation.status}
                    {policy.calculation.value && (
                      <> | Wartość: {typeof policy.calculation.value === "number" ? policy.calculation.value.toFixed(2) : Number(policy.calculation.value).toFixed(2)} zł</>
                    )}
                  </p>
                </div>
              </Link>
            </CardContent>
          </Card>
        )}

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Dokumenty</CardTitle>
          </CardHeader>
          <CardContent>
            {policy.documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Brak dokumentów</p>
            ) : (
              <div className="space-y-2">
                {policy.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border rounded"
                  >
                    <div>
                      <p className="font-medium">{doc.filename}</p>
                      <p className="text-sm text-muted-foreground">
                        Dodano: {new Date(doc.createdAt).toLocaleDateString("pl-PL")}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadDocument(doc.id, doc.filename)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Pobierz
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

