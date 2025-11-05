"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClientStatus, UserRole } from "@prisma/client"
import { Edit, Plus } from "lucide-react"
import { ContactForm } from "../contacts/contact-form"
import { ClientForm } from "./client-form"
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
}

const statusLabels: Record<ClientStatus, string> = {
  NEW_LEAD: "Nowy lead",
  IN_CONTACT: "W kontakcie",
  DEMO_SENT: "Demo wysłane",
  NEGOTIATION: "Negocjacje",
  ACTIVE_CLIENT: "Klient aktywny",
  LOST: "Utracony",
}

const contactTypeLabels: Record<string, string> = {
  PHONE_CALL: "Rozmowa telefoniczna",
  MEETING: "Spotkanie",
  EMAIL: "E-mail",
  LINKEDIN_MESSAGE: "Wiadomość LinkedIn",
  OTHER: "Inne",
}

export function ClientDetail({ client, users, groups, currentUser }: ClientDetailProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isAddingContact, setIsAddingContact] = useState(false)
  const [editingContactId, setEditingContactId] = useState<string | null>(null)

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
          <Button onClick={() => setIsAddingContact(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Dodaj kontakt
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

      {isAddingContact && (
        <ContactForm
          clientId={client.id}
          users={users}
          groups={groups}
          currentUser={currentUser}
          onClose={() => setIsAddingContact(false)}
          onSuccess={() => {
            setIsAddingContact(false)
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
              <span className="text-sm font-medium">Odpowiedzialny:</span>{" "}
              {client.assignee?.name || client.assignee?.email || "-"}
            </div>
            <div>
              <span className="text-sm font-medium">Źródło:</span>{" "}
              {client.source || "-"}
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
          <CardTitle>Kontakty ({client.contacts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {client.contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Brak kontaktów</p>
          ) : (
            <div className="space-y-4">
              {client.contacts.map((contact: any) => (
                <div key={contact.id} className="border rounded p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium">
                        {contactTypeLabels[contact.type] || contact.type}
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
    </div>
  )
}

