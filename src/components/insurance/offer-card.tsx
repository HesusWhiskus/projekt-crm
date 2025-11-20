"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, AlertCircle } from "lucide-react"
import Image from "next/image"
import { InsuranceScope } from "@prisma/client"

interface OfferCardProps {
  offer: {
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
  }
  onSelect?: (offerId: string) => void
  showSelectButton?: boolean
}

const scopeLabels: Record<InsuranceScope, string> = {
  OC: "OC",
  AC: "AC",
  NNW: "NNW",
  ASS: "ASS",
  SZYBY: "Szyby",
  OC_DISCOUNT_PROTECTION: "Ochrona zniżki OC",
  ASSISTANCE_ACCIDENT: "Assistance - wypadek",
  ASSISTANCE_BREAKDOWN: "Assistance - awaria",
  AC_MINI: "AC Mini",
  AC_ACCIDENT: "AC - wypadek",
}

export function OfferCard({ offer, onSelect, showSelectButton = true }: OfferCardProps) {
  const price = typeof offer.price === "number" ? offer.price : Number(offer.price)
  const installmentAmount = offer.installmentAmount 
    ? (typeof offer.installmentAmount === "number" ? offer.installmentAmount : Number(offer.installmentAmount))
    : null

  return (
    <Card className={`relative ${offer.isSelected ? "ring-2 ring-primary" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {offer.insuranceCompany.logoUrl ? (
              <div className="relative h-12 w-12">
                <Image
                  src={offer.insuranceCompany.logoUrl}
                  alt={offer.insuranceCompany.name}
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="h-12 w-12 bg-muted rounded flex items-center justify-center">
                <span className="text-xs font-semibold">
                  {offer.insuranceCompany.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <CardTitle className="text-lg">{offer.insuranceCompany.name}</CardTitle>
              {offer.packageType && (
                <p className="text-sm text-muted-foreground">{offer.packageType}</p>
              )}
            </div>
          </div>
          {offer.isSelected && (
            <Badge variant="default" className="bg-primary">
              <Check className="h-3 w-3 mr-1" />
              Wybrana
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-primary">
            {price.toFixed(2)} zł
          </span>
          {offer.installments && offer.installments > 1 && installmentAmount && (
            <span className="text-sm text-muted-foreground">
              / {installmentAmount.toFixed(2)} zł × {offer.installments} rat
            </span>
          )}
        </div>

        {offer.scopes.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Zakres ubezpieczenia:</p>
            <div className="flex flex-wrap gap-2">
              {offer.scopes.map((scope) => (
                <Badge key={scope} variant="outline">
                  {scopeLabels[scope] || scope}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {offer.validUntil && (
          <p className="text-sm text-muted-foreground">
            Ważna do: {new Date(offer.validUntil).toLocaleDateString("pl-PL")}
          </p>
        )}

        {offer.status && offer.status !== "dostępna" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>Status: {offer.status}</span>
          </div>
        )}

        {showSelectButton && onSelect && !offer.isSelected && (
          <Button
            onClick={() => onSelect(offer.id)}
            className="w-full"
            variant="default"
          >
            Wybierz ofertę
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

