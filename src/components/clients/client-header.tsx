"use client"

import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { Edit, Plus } from "lucide-react"
import { ClientStatus, ClientPriority } from "@prisma/client"
import {
  clientStatusLabels,
  clientPriorityLabels,
} from "@/lib/status-config"

interface ClientHeaderProps {
  client: {
    id: string
    firstName: string | null
    lastName: string | null
    companyName?: string | null
    type: string
    status: ClientStatus
    priority: ClientPriority | null
    assignee?: {
      name: string | null
      email: string
    } | null
  }
  onEdit?: () => void
  onAddContact?: () => void
  onAddNote?: () => void
}

export function ClientHeader({
  client,
  onEdit,
  onAddContact,
  onAddNote,
}: ClientHeaderProps) {
  const displayName =
    client.type === "COMPANY"
      ? client.companyName || "Brak nazwy firmy"
      : `${client.firstName || ""} ${client.lastName || ""}`.trim() || "Brak nazwy"

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b">
      <div className="flex-1">
        <h1 className="text-3xl font-bold mb-2">{displayName}</h1>
        {client.type === "PERSON" && client.firstName && client.lastName && (
          <p className="text-muted-foreground">
            {client.firstName} {client.lastName}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <StatusBadge
            status={clientStatusLabels[client.status]}
            variant={
              client.status === "ACTIVE_CLIENT"
                ? "success"
                : client.status === "LOST"
                ? "error"
                : client.status === "NEGOTIATION"
                ? "warning"
                : "default"
            }
            size="md"
          />
          {client.priority && (
            <StatusBadge
              status={clientPriorityLabels[client.priority]}
              variant={
                client.priority === "HIGH"
                  ? "error"
                  : client.priority === "MEDIUM"
                  ? "warning"
                  : "info"
              }
              size="md"
            />
          )}
          {client.assignee && (
            <span className="text-sm text-muted-foreground">
              Odpowiedzialny: {client.assignee.name || client.assignee.email}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {onEdit && (
          <Button variant="outline" onClick={onEdit} aria-label="Edytuj klienta">
            <Edit className="h-4 w-4 mr-2" />
            Edytuj
          </Button>
        )}
        {onAddContact && (
          <Button variant="outline" onClick={onAddContact} aria-label="Dodaj kontakt">
            <Plus className="h-4 w-4 mr-2" />
            Dodaj kontakt
          </Button>
        )}
        {onAddNote && (
          <Button variant="outline" onClick={onAddNote} aria-label="Dodaj notatkę">
            <Plus className="h-4 w-4 mr-2" />
            Dodaj notatkę
          </Button>
        )}
      </div>
    </div>
  )
}

