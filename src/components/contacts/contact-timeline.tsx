"use client"

import { ContactType } from "@prisma/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Phone, Mail, Users, MessageSquare, FileText } from "lucide-react"
import { contactTypeLabels } from "@/lib/status-config"
import { ContactForm } from "./contact-form"
import { EmptyState } from "@/components/ui/empty-state"
import Link from "next/link"
import { format, isToday, isYesterday, isThisWeek, isThisMonth, formatDistanceToNow } from "date-fns"
import { pl } from "date-fns/locale"

interface Contact {
  id: string
  type: ContactType | null
  date: Date | string // Next.js serializes Date as string
  notes: string
  isNote: boolean
  client: {
    id: string
    firstName: string | null
    lastName: string | null
    companyName?: string | null
    type: string
  }
  user: {
    id: string
    name: string | null
    email: string
  }
  attachments: Array<{
    id: string
    filename: string
    path: string
  }>
  sharedGroups?: Array<{
    id: string
    name: string
  }>
}

interface ContactTimelineProps {
  contacts: Contact[]
  users: Array<{
    id: string
    name: string | null
    email: string
  }>
  groups?: Array<{
    id: string
    name: string
  }>
  currentUser: {
    id: string
    role: string
  }
  onEdit?: (contactId: string) => void
  editingContactId?: string | null
}

const getContactIcon = (type: ContactType | null, isNote: boolean) => {
  if (isNote) return FileText
  switch (type) {
    case "PHONE_CALL":
      return Phone
    case "EMAIL":
      return Mail
    case "MEETING":
      return Users
    case "LINKEDIN_MESSAGE":
      return MessageSquare
    default:
      return FileText
  }
}

const groupContactsByDate = (contacts: Contact[]) => {
  const groups: Record<string, Contact[]> = {
    today: [],
    yesterday: [],
    thisWeek: [],
    thisMonth: [],
    older: [],
  }

  contacts.forEach((contact) => {
    const date = new Date(contact.date)
    if (isToday(date)) {
      groups.today.push(contact)
    } else if (isYesterday(date)) {
      groups.yesterday.push(contact)
    } else if (isThisWeek(date)) {
      groups.thisWeek.push(contact)
    } else if (isThisMonth(date)) {
      groups.thisMonth.push(contact)
    } else {
      groups.older.push(contact)
    }
  })

  return groups
}

const getGroupLabel = (group: string): string => {
  switch (group) {
    case "today":
      return "Dzisiaj"
    case "yesterday":
      return "Wczoraj"
    case "thisWeek":
      return "Ten tydzień"
    case "thisMonth":
      return "Ten miesiąc"
    case "older":
      return "Starsze"
    default:
      return group
  }
}

export function ContactTimeline({
  contacts,
  users,
  groups,
  currentUser,
  onEdit,
  editingContactId,
}: ContactTimelineProps) {
  const groupedContacts = groupContactsByDate(contacts)

  const getClientDisplayName = (client: Contact["client"]): string => {
    if (client.type === "COMPANY") {
      return client.companyName || "Brak nazwy firmy"
    }
    const name = [client.firstName, client.lastName].filter(Boolean).join(" ")
    return name || "Brak nazwy"
  }

  if (contacts.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Brak kontaktów"
        description="Historia kontaktów pojawi się tutaj"
      />
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedContacts).map(([group, groupContacts]) => {
        if (groupContacts.length === 0) return null

        return (
          <div key={group}>
            <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
              {getGroupLabel(group)}
            </h3>
            <div className="space-y-4">
              {groupContacts.map((contact) => {
                const Icon = getContactIcon(contact.type, contact.isNote)
                return (
                  <div key={contact.id} className="relative pl-8">
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-border" />
                    <div className="absolute left-0 top-2 w-4 h-4 rounded-full bg-primary border-2 border-background" />
                    <Card className="ml-4">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {contact.isNote
                                  ? "📝 Notatka"
                                  : contact.type
                                  ? contactTypeLabels[contact.type]
                                  : "Inne"}
                              </span>
                              {contact.isNote && (
                                <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                  Notatka
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground mb-2">
                              {format(new Date(contact.date), "d MMMM yyyy, HH:mm", { locale: pl })}
                            </div>
                            <div className="text-sm mb-2">{contact.notes}</div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <Link
                                href={`/clients/${contact.client.id}`}
                                className="text-primary hover:underline"
                              >
                                {getClientDisplayName(contact.client)}
                              </Link>
                              <span>•</span>
                              <span>Dodane przez: {contact.user.name || contact.user.email}</span>
                            </div>
                            {contact.attachments.length > 0 && (
                              <div className="mt-2">
                                <span className="text-xs font-medium">Załączniki:</span>
                                {contact.attachments.map((att) => (
                                  <a
                                    key={att.id}
                                    href={att.path}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary hover:underline ml-2"
                                  >
                                    {att.filename}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                          {onEdit && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onEdit(contact.id)}
                              aria-label="Edytuj kontakt"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        {editingContactId === contact.id && (
                          <div className="mt-4 pt-4 border-t">
                            <ContactForm
                              contact={{
                                id: contact.id,
                                type: contact.type,
                                date: contact.date,
                                notes: contact.notes,
                                isNote: contact.isNote,
                                userId: contact.user.id,
                                clientId: contact.client.id,
                                sharedGroups: contact.sharedGroups || [],
                              }}
                              users={users}
                              groups={groups}
                              currentUser={currentUser}
                              onClose={() => onEdit?.(contact.id)}
                              onSuccess={() => {
                                onEdit?.(contact.id)
                              }}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

