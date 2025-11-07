"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DealStage, UserRole } from "@prisma/client"
import { Edit, Trash2, TrendingUp, ArrowLeft, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { DealForm } from "./deal-form"

interface DealDetailProps {
  deal: {
    id: string
    clientId: string
    value: number
    currency: string
    probability: number
    stage: DealStage
    expectedCloseDate: Date | null
    notes: string | null
    createdAt: Date
    updatedAt: Date
    client: {
      id: string
      firstName: string
      lastName: string
      agencyName: string | null
      status: string
    }
    sharedGroups: Array<{
      id: string
      name: string
    }>
  }
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
  currentUser: {
    id: string
    role: UserRole
  }
}

const stageLabels: Record<DealStage, string> = {
  INITIAL_CONTACT: "Pierwszy kontakt",
  PROPOSAL: "Oferta",
  NEGOTIATION: "Negocjacje",
  CLOSING: "Zamykanie",
  WON: "Wygrany",
  LOST: "Przegrany",
}

const stageColors: Record<DealStage, string> = {
  INITIAL_CONTACT: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  PROPOSAL: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  NEGOTIATION: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  CLOSING: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  WON: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  LOST: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

export function DealDetail({ deal, clients, groups, currentUser }: DealDetailProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleClose = async (won: boolean) => {
    setIsClosing(true)
    try {
      const response = await fetch(`/api/deals/${deal.id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ won }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Wystąpił błąd")
      }

      router.refresh()
    } catch (error: any) {
      alert(error.message || "Wystąpił błąd podczas zamykania deala")
    } finally {
      setIsClosing(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Czy na pewno chcesz usunąć ten deal?")) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/deals/${deal.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Wystąpił błąd")
      }

      router.push("/deals")
    } catch (error: any) {
      alert(error.message || "Wystąpił błąd podczas usuwania deala")
      setIsDeleting(false)
    }
  }

  const isClosed = deal.stage === "WON" || deal.stage === "LOST"

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link href="/deals">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Powrót
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Deal</h1>
            <p className="text-muted-foreground mt-2">
              <Link
                href={`/clients/${deal.client.id}`}
                className="text-primary hover:underline"
              >
                {deal.client.firstName} {deal.client.lastName}
                {deal.client.agencyName ? ` (${deal.client.agencyName})` : ""}
              </Link>
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          {!isClosed && (
            <>
              <Button
                variant="outline"
                onClick={() => handleClose(true)}
                disabled={isClosing || isDeleting}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Oznacz jako wygrany
              </Button>
              <Button
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={isClosing || isDeleting}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Oznacz jako przegrany
              </Button>
            </>
          )}
          {!isClosed && (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edytuj
            </Button>
          )}
          <Button variant="outline" onClick={handleDelete} disabled={isDeleting}>
            <Trash2 className="h-4 w-4 mr-2" />
            {isDeleting ? "Usuwanie..." : "Usuń"}
          </Button>
        </div>
      </div>

      {isEditing && (
        <DealForm
          clients={clients}
          groups={groups}
          currentUser={currentUser}
          deal={deal}
          onClose={() => setIsEditing(false)}
          onSuccess={() => {
            setIsEditing(false)
            router.refresh()
          }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Szczegóły</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Wartość</div>
              <div className="text-2xl font-bold">
                {deal.value.toLocaleString("pl-PL", {
                  style: "currency",
                  currency: deal.currency || "PLN",
                })}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Prawdopodobieństwo</div>
              <div className="text-xl font-semibold">{deal.probability}%</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Etap</div>
              <span
                className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${stageColors[deal.stage]}`}
              >
                {stageLabels[deal.stage]}
              </span>
            </div>
            {deal.expectedCloseDate && (
              <div>
                <div className="text-sm text-muted-foreground">Oczekiwana data zamknięcia</div>
                <div className="text-lg font-semibold">
                  {new Date(deal.expectedCloseDate).toLocaleDateString("pl-PL", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
            )}
            {deal.notes && (
              <div>
                <div className="text-sm text-muted-foreground">Notatki</div>
                <div className="text-sm whitespace-pre-wrap">{deal.notes}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informacje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Klient</div>
              <Link
                href={`/clients/${deal.client.id}`}
                className="text-primary hover:underline font-medium"
              >
                {deal.client.firstName} {deal.client.lastName}
                {deal.client.agencyName ? ` (${deal.client.agencyName})` : ""}
              </Link>
            </div>
            {deal.sharedGroups.length > 0 && (
              <div>
                <div className="text-sm text-muted-foreground">Udostępnione grupom</div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {deal.sharedGroups.map((group) => (
                    <span
                      key={group.id}
                      className="px-2 py-1 bg-muted rounded text-sm"
                    >
                      {group.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div>
              <div className="text-sm text-muted-foreground">Utworzono</div>
              <div className="text-sm">
                {new Date(deal.createdAt).toLocaleString("pl-PL")}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Ostatnia aktualizacja</div>
              <div className="text-sm">
                {new Date(deal.updatedAt).toLocaleString("pl-PL")}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

