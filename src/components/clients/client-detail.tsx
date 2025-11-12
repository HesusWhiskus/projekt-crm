"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClientStatus, ClientPriority, UserRole } from "@prisma/client"
import { Edit, Plus } from "lucide-react"
import { ContactForm } from "../contacts/contact-form"
import { NoteForm } from "../notes/note-form"
import { ClientForm } from "./client-form"
import { IntegrationTabs } from "./integration-tabs"
import Link from "next/link"

interface ClientDetailProps {
  client: any
  users: Array<{
    id: string
    name: string | null
    email: string
  }>
  groups: Array<{
    id: string
    name: string
  }>
  currentUser: {
    id: string
    role: UserRole
  }
  integrationTabsEnabled?: boolean
}

const statusLabels: Record<ClientStatus, string> = {
  NEW_LEAD: "Nowy lead",
  IN_CONTACT: "W kontakcie",
  DEMO_SENT: "Demo wysłane",
  NEGOTIATION: "Negocjacje",
  ACTIVE_CLIENT: "Klient aktywny",
  LOST: "Utracony",
}

const priorityLabels: Record<ClientPriority, string> = {
  LOW: "Niski",
  MEDIUM: "Średni",
  HIGH: "Wysoki",
}

const contactTypeLabels: Record<string, string> = {
  PHONE_CALL: "Rozmowa telefoniczna",
  MEETING: "Spotkanie",
  EMAIL: "E-mail",
  LINKEDIN_MESSAGE: "Wiadomość LinkedIn",
  OTHER: "Inne",
}

export function ClientDetail({ client, users, groups, currentUser, integrationTabsEnabled = false }: ClientDetailProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isAddingContact, setIsAddingContact] = useState(false)
  const [addingNote, setAddingNote] = useState(false)
  const [editingContactId, setEditingContactId] = useState<string | null>(null)
  const [contactFilter, setContactFilter] = useState<"all" | "contacts" | "notes">("all")
  
  // Filtruj kontakty
  const filteredContacts = client.contacts.filter((contact: any) => {
    if (contactFilter === "contacts") return !contact.isNote
    if (contactFilter === "notes") return contact.isNote
    return true
  })
  
  const contactsCount = client.contacts.filter((c: any) => !c.isNote).length
  const notesCount = client.contacts.filter((c: any) => c.isNote).length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{client.agencyName}</h1>
          <p className="text-muted-foreground mt-2">
            {client.firstName} {client.lastName}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edytuj
          </Button>
          <Button variant="outline" onClick={() => {
            setIsAddingContact(true)
            setAddingNote(false)
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Dodaj kontakt
          </Button>
          <Button variant="outline" onClick={() => {
            setIsAddingContact(true)
            setAddingNote(true)
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Dodaj notatkę
          </Button>
        </div>
      </div>

      {isEditing && (
        <ClientForm
          client={client}
          users={users}
          groups={groups}
          currentUser={currentUser}
          onClose={() => setIsEditing(false)}
          onSuccess={() => {
            setIsEditing(false)
            router.refresh()
          }}
        />
      )}

      {isAddingContact && !addingNote && (
        <ContactForm
          clientId={client.id}
          users={users}
          groups={groups}
          currentUser={currentUser}
          onClose={() => {
            setIsAddingContact(false)
            setAddingNote(false)
          }}
          onSuccess={() => {
            setIsAddingContact(false)
            setAddingNote(false)
            router.refresh()
          }}
        />
      )}
      {isAddingContact && addingNote && (
        <NoteForm
          clientId={client.id}
          users={users}
          groups={groups}
          currentUser={currentUser}
          onClose={() => {
            setIsAddingContact(false)
            setAddingNote(false)
          }}
          onSuccess={() => {
            setIsAddingContact(false)
            setAddingNote(false)
            router.refresh()
          }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Dane kontaktowe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm font-medium">Email:</span>{" "}
              {client.email || "-"}
            </div>
            <div>
              <span className="text-sm font-medium">Telefon:</span>{" "}
              {client.phone || "-"}
            </div>
            <div>
              <span className="text-sm font-medium">Strona WWW:</span>{" "}
              {client.website ? (
                <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {client.website}
                </a>
              ) : (
                "-"
              )}
            </div>
            <div>
              <span className="text-sm font-medium">Adres:</span>{" "}
              {client.address || "-"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informacje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm font-medium">Status:</span>{" "}
              <span className="px-2 py-1 rounded text-xs bg-gray-100">
                {statusLabels[client.status as ClientStatus]}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium">Priorytet:</span>{" "}
              {client.priority ? (
                <span className={`px-2 py-1 rounded text-xs ${
                  client.priority === "HIGH" ? "bg-red-100 text-red-800" :
                  client.priority === "MEDIUM" ? "bg-yellow-100 text-yellow-800" :
                  "bg-blue-100 text-blue-800"
                }`}>
                  {priorityLabels[client.priority as ClientPriority]}
                </span>
              ) : (
                "-"
              )}
            </div>
            <div>
              <span className="text-sm font-medium">Odpowiedzialny:</span>{" "}
              {client.assignee?.name || client.assignee?.email || "-"}
            </div>
            <div>
              <span className="text-sm font-medium">Źródło:</span>{" "}
              {client.source || "-"}
            </div>
            <div>
              <span className="text-sm font-medium">Ostatni kontakt:</span>{" "}
              {client.lastContactAt ? new Date(client.lastContactAt).toLocaleDateString("pl-PL") : "Nigdy"}
            </div>
            <div>
              <span className="text-sm font-medium">Następny follow-up:</span>{" "}
              {client.nextFollowUpAt ? new Date(client.nextFollowUpAt).toLocaleDateString("pl-PL") : "-"}
            </div>
            <div>
              <span className="text-sm font-medium">Data utworzenia:</span>{" "}
              {new Date(client.createdAt).toLocaleDateString("pl-PL")}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historia zmian statusu</CardTitle>
        </CardHeader>
        <CardContent>
          {client.statusHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">Brak historii zmian</p>
          ) : (
            <div className="space-y-2">
              {client.statusHistory.map((history: any) => (
                <div key={history.id} className="border-l-2 pl-4 py-2">
                  <div className="flex justify-between">
                    <span className="font-medium">
                      {statusLabels[history.status as ClientStatus]}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(history.changedAt).toLocaleString("pl-PL")}
                    </span>
                  </div>
                  {history.notes && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {history.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              Kontakty ({contactsCount}) / Notatki ({notesCount})
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={contactFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setContactFilter("all")}
              >
                Wszystkie
              </Button>
              <Button
                variant={contactFilter === "contacts" ? "default" : "outline"}
                size="sm"
                onClick={() => setContactFilter("contacts")}
              >
                Kontakty
              </Button>
              <Button
                variant={contactFilter === "notes" ? "default" : "outline"}
                size="sm"
                onClick={() => setContactFilter("notes")}
              >
                Notatki
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredContacts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {contactFilter === "all" ? "Brak kontaktów" : 
               contactFilter === "contacts" ? "Brak kontaktów" : "Brak notatek"}
            </p>
          ) : (
            <div className="space-y-4">
              {filteredContacts.map((contact: any) => (
                <div key={contact.id} className="border rounded p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium">
                          {contact.isNote ? (
                            <span className="text-purple-600">📝 Notatka</span>
                          ) : (
                            contactTypeLabels[contact.type || "OTHER"] || contact.type || "Inne"
                          )}
                        </div>
                        {contact.isNote && (
                          <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-800">
                            Notatka
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {new Date(contact.date).toLocaleString("pl-PL")}
                      </div>
                      <div className="text-sm mt-2">{contact.notes}</div>
                      <div className="text-xs text-muted-foreground mt-2">
                        Dodane przez: {contact.user.name || contact.user.email}
                      </div>
                      {contact.attachments.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs font-medium">Załączniki:</span>
                          {contact.attachments.map((att: any) => (
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingContactId(contact.id)}
                      className="ml-2"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edytuj
                    </Button>
                  </div>
                  {editingContactId === contact.id && (
                    <div className="mt-4">
                      <ContactForm
                        contact={{
                          id: contact.id,
                          type: contact.type,
                          date: contact.date,
                          notes: contact.notes,
                          isNote: contact.isNote,
                          userId: contact.user.id,
                          sharedGroups: contact.sharedGroups || [],
                        }}
                        clientId={client.id}
                        users={users}
                        groups={groups}
                        currentUser={currentUser}
                        onClose={() => setEditingContactId(null)}
                        onSuccess={() => {
                          setEditingContactId(null)
                          router.refresh()
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Zadania ({client.tasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {client.tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Brak zadań</p>
          ) : (
            <div className="space-y-2">
              {client.tasks.map((task: any) => (
                <Link key={task.id} href={`/tasks/${task.id}`}>
                  <div className="border rounded p-3 hover:bg-gray-50 cursor-pointer">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{task.title}</div>
                        {task.description && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {task.description}
                          </div>
                        )}
                        {task.dueDate && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Termin: {new Date(task.dueDate).toLocaleDateString("pl-PL")}
                          </div>
                        )}
                      </div>
                      <div className="text-sm">
                        {task.assignee?.name || task.assignee?.email || "Nieprzypisane"}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {integrationTabsEnabled && (
        <IntegrationTabs clientId={client.id} enabled={integrationTabsEnabled} />
      )}
    </div>
  )
}

