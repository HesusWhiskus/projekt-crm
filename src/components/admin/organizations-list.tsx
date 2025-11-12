"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { PlanType } from "@prisma/client"
import { Plus, Edit, Trash2, Flag } from "lucide-react"
import { OrganizationForm } from "./organization-form"
import { FeatureFlagsManager } from "./feature-flags-manager"

interface Organization {
  id: string
  name: string
  plan: PlanType
  settings: any
  _count: {
    users: number
    clients: number
    featureFlags: number
  }
}

interface OrganizationsListProps {
  organizations: Organization[]
}

const planLabels: Record<PlanType, string> = {
  BASIC: "Basic",
  PRO: "Pro",
}

export function OrganizationsList({ organizations: initialOrganizations }: OrganizationsListProps) {
  const router = useRouter()
  const [organizations, setOrganizations] = useState(initialOrganizations)
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [managingFeaturesId, setManagingFeaturesId] = useState<string | null>(null)

  const handleCreate = () => {
    setIsCreating(true)
    setEditingId(null)
    setManagingFeaturesId(null)
  }

  const handleEdit = (id: string) => {
    setEditingId(id)
    setIsCreating(false)
    setManagingFeaturesId(null)
  }

  const handleManageFeatures = (id: string) => {
    setManagingFeaturesId(id)
    setIsCreating(false)
    setEditingId(null)
  }

  const handleClose = () => {
    setIsCreating(false)
    setEditingId(null)
    setManagingFeaturesId(null)
  }

  const handleSuccess = () => {
    router.refresh()
    handleClose()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Czy na pewno chcesz usunąć tę organizację? Ta operacja jest nieodwracalna.")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/organizations/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Wystąpił błąd")
      }

      router.refresh()
    } catch (error: any) {
      alert(error.message || "Wystąpił błąd podczas usuwania organizacji")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Lista organizacji</h2>
          <p className="text-muted-foreground text-sm">
            Zarządzaj organizacjami i ich planami
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Dodaj organizację
        </Button>
      </div>

      {isCreating && (
        <OrganizationForm
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )}

      {editingId && (
        <OrganizationForm
          organization={organizations.find((o) => o.id === editingId)}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )}

      {managingFeaturesId && (
        <FeatureFlagsManager
          organizationId={managingFeaturesId}
          organizationName={organizations.find((o) => o.id === managingFeaturesId)?.name || ""}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {organizations.map((org) => (
          <Card key={org.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{org.name}</span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  org.plan === "PRO" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"
                }`}>
                  {planLabels[org.plan]}
                </span>
              </CardTitle>
              <CardDescription>
                ID: {org.id}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Użytkownicy:</span>
                  <div className="font-semibold">{org._count.users}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Klienci:</span>
                  <div className="font-semibold">{org._count.clients}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Funkcje:</span>
                  <div className="font-semibold">{org._count.featureFlags}</div>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(org.id)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edytuj
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleManageFeatures(org.id)}
                  className="flex-1"
                >
                  <Flag className="h-4 w-4 mr-1" />
                  Funkcje
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(org.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {organizations.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Brak organizacji</p>
            <Button onClick={handleCreate} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Dodaj pierwszą organizację
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

