"use client"

import { useState, useMemo, useCallback } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClientStatus, ClientPriority, UserRole } from "@prisma/client"
import { Edit } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

// Lazy load forms
const ContactForm = dynamic(() => import("../contacts/contact-form").then(mod => ({ default: mod.ContactForm })), {
  loading: () => <Skeleton className="h-96 w-full" />,
  ssr: false,
})

const NoteForm = dynamic(() => import("../notes/note-form").then(mod => ({ default: mod.NoteForm })), {
  loading: () => <Skeleton className="h-96 w-full" />,
  ssr: false,
})

const ClientForm = dynamic(() => import("./client-form").then(mod => ({ default: mod.ClientForm })), {
  loading: () => <Skeleton className="h-96 w-full" />,
  ssr: false,
})
import { IntegrationTabs } from "./integration-tabs"
import { ClientHeader } from "./client-header"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { FileText, History, Users, CheckSquare, Shield, Car, FileCheck } from "lucide-react"
import {
  clientStatusLabels,
  clientPriorityLabels,
  contactTypeLabels as contactTypeLabelsConfig,
} from "@/lib/status-config"
import { ContactType } from "@prisma/client"
import Link from "next/link"
import { maskPhoneIfNeeded, maskEmailIfNeeded } from "@/lib/pii-masking"

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
  insuranceAgentsEnabled?: boolean
  vehicles?: any[]
  calculations?: any[]
  policies?: any[]
}


export function ClientDetail({ 
  client, 
  users, 
  groups, 
  currentUser, 
  integrationTabsEnabled = false,
  insuranceAgentsEnabled = false,
  vehicles = [],
  calculations = [],
  policies = [],
}: ClientDetailProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isAddingContact, setIsAddingContact] = useState(false)
  const [addingNote, setAddingNote] = useState(false)
  const [editingContactId, setEditingContactId] = useState<string | null>(null)
  const [contactFilter, setContactFilter] = useState<"all" | "contacts" | "notes">("all")
  const [activeInsuranceTab, setActiveInsuranceTab] = useState<"vehicles" | "calculations" | "policies">("vehicles")
  const [activeMainTab, setActiveMainTab] = useState("general")
  
  // Memoized filtered contacts
  const filteredContacts = useMemo(() => {
    return client.contacts.filter((contact: any) => {
      if (contactFilter === "contacts") return !contact.isNote
      if (contactFilter === "notes") return contact.isNote
      return true
    })
  }, [client.contacts, contactFilter])
  
  // Memoized counts
  const contactsCount = useMemo(() => {
    return client.contacts.filter((c: any) => !c.isNote).length
  }, [client.contacts])
  
  const notesCount = useMemo(() => {
    return client.contacts.filter((c: any) => c.isNote).length
  }, [client.contacts])

  // Memoized handlers
  const handleEdit = useCallback(() => {
    setIsEditing(true)
  }, [])

  const handleAddContact = useCallback(() => {
    setIsAddingContact(true)
    setAddingNote(false)
  }, [])

  const handleAddNote = useCallback(() => {
    setIsAddingContact(true)
    setAddingNote(true)
  }, [])

  const handleCloseEdit = useCallback(() => {
    setIsEditing(false)
  }, [])

  const handleEditSuccess = useCallback(() => {
    setIsEditing(false)
    router.refresh()
  }, [router])

  const handleCloseContact = useCallback(() => {
    setIsAddingContact(false)
    setAddingNote(false)
  }, [])

  const handleContactSuccess = useCallback(() => {
    setIsAddingContact(false)
    setAddingNote(false)
    router.refresh()
  }, [router])


  return (
    <div className="space-y-6">
      <ClientHeader
        client={{
          id: client.id,
          firstName: client.firstName,
          lastName: client.lastName,
          companyName: client.companyName,
          type: client.type,
          status: client.status,
          priority: client.priority,
          assignee: client.assignee,
        }}
        onEdit={handleEdit}
        onAddContact={handleAddContact}
        onAddNote={handleAddNote}
      />

      {isEditing && (
        <ClientForm
          client={client}
          users={users}
          groups={groups}
          currentUser={currentUser}
          insuranceAgentsEnabled={insuranceAgentsEnabled}
          onClose={handleCloseEdit}
          onSuccess={handleEditSuccess}
        />
      )}

      {isAddingContact && !addingNote && (
        <ContactForm
          clientId={client.id}
          users={users}
          groups={groups}
          currentUser={currentUser}
          onClose={handleCloseContact}
          onSuccess={handleContactSuccess}
        />
      )}
      {isAddingContact && addingNote && (
        <NoteForm
          clientId={client.id}
          users={users}
          groups={groups}
          currentUser={currentUser}
          onClose={handleCloseContact}
          onSuccess={handleContactSuccess}
        />
      )}

      <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="general">
            <FileText className="h-4 w-4 mr-2" />
            Ogólne
          </TabsTrigger>
          <TabsTrigger value="contacts">
            <Users className="h-4 w-4 mr-2" />
            Kontakty ({contactsCount})
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <CheckSquare className="h-4 w-4 mr-2" />
            Zadania ({client.tasks.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Historia
          </TabsTrigger>
          {insuranceAgentsEnabled && (
            <TabsTrigger value="insurance">
              <Shield className="h-4 w-4 mr-2" />
              Ubezpieczenia
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="general" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Dane kontaktowe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="text-sm font-medium">Email:</span>{" "}
                  {/* SECURITY-FIX: [PII-14] Maskowanie email w UI */}
                  {/* Data: 2025-01-27 */}
                  {client.email ? maskEmailIfNeeded(client.email, currentUser.role) : "-"}
                </div>
                <div>
                  <span className="text-sm font-medium">Telefon:</span>{" "}
                  {/* SECURITY-FIX: [PII-14] Maskowanie telefonu w UI */}
                  {/* Data: 2025-01-27 */}
                  {client.phone ? maskPhoneIfNeeded(client.phone, currentUser.role) : "-"}
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
                  <StatusBadge
                    status={clientStatusLabels[client.status as ClientStatus]}
                    variant={
                      client.status === "ACTIVE_CLIENT"
                        ? "success"
                        : client.status === "LOST"
                        ? "error"
                        : client.status === "NEGOTIATION"
                        ? "warning"
                        : "default"
                    }
                    size="sm"
                  />
                </div>
                <div>
                  <span className="text-sm font-medium">Priorytet:</span>{" "}
                  {client.priority ? (
                    <StatusBadge
                      status={clientPriorityLabels[client.priority as ClientPriority]}
                      variant={
                        client.priority === "HIGH"
                          ? "error"
                          : client.priority === "MEDIUM"
                          ? "warning"
                          : "info"
                      }
                      size="sm"
                    />
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

          {integrationTabsEnabled && (
            <IntegrationTabs clientId={client.id} enabled={integrationTabsEnabled} />
          )}
        </TabsContent>

        <TabsContent value="contacts" className="mt-6">
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
                <EmptyState
                  icon={FileText}
                  title={
                    contactFilter === "all"
                      ? "Brak kontaktów"
                      : contactFilter === "contacts"
                      ? "Brak kontaktów"
                      : "Brak notatek"
                  }
                />
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
                                contactTypeLabelsConfig[contact.type as ContactType || "OTHER"] || contact.type || "Inne"
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
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Zadania ({client.tasks.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {client.tasks.length === 0 ? (
                <EmptyState
                  icon={CheckSquare}
                  title="Brak zadań"
                  description="Ten klient nie ma jeszcze przypisanych zadań"
                />
              ) : (
                <div className="space-y-2">
                  {client.tasks.map((task: any) => (
                    <Link key={task.id} href={`/tasks/${task.id}`}>
                      <div className="border rounded p-3 hover:bg-muted/50 cursor-pointer transition-colors">
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
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Historia zmian statusu</CardTitle>
            </CardHeader>
            <CardContent>
              {client.statusHistory.length === 0 ? (
                <EmptyState
                  icon={History}
                  title="Brak historii zmian"
                  description="Historia zmian statusu pojawi się tutaj"
                />
              ) : (
                <div className="space-y-2">
                  {client.statusHistory.map((history: any) => (
                    <div key={history.id} className="border-l-2 pl-4 py-2">
                      <div className="flex justify-between">
                        <StatusBadge
                          status={clientStatusLabels[history.status as ClientStatus] || history.status}
                          variant={
                            history.status === "ACTIVE_CLIENT"
                              ? "success"
                              : history.status === "LOST"
                              ? "error"
                              : "default"
                          }
                          size="sm"
                        />
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
        </TabsContent>

        {insuranceAgentsEnabled && (
          <TabsContent value="insurance" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Ubezpieczenia</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeInsuranceTab} onValueChange={(v) => setActiveInsuranceTab(v as typeof activeInsuranceTab)}>
                  <TabsList>
                    <TabsTrigger value="vehicles">
                      <Car className="h-4 w-4 mr-2" />
                      Pojazdy ({vehicles.length})
                    </TabsTrigger>
                    <TabsTrigger value="calculations">
                      <FileCheck className="h-4 w-4 mr-2" />
                      Kalkulacje ({calculations.length})
                    </TabsTrigger>
                    <TabsTrigger value="policies">
                      <Shield className="h-4 w-4 mr-2" />
                      Polisy ({policies.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="vehicles" className="mt-4">
                    {vehicles.length === 0 ? (
                      <EmptyState
                        icon={Car}
                        title="Brak pojazdów"
                        description="Ten klient nie ma jeszcze przypisanych pojazdów"
                      />
                    ) : (
                      <div className="space-y-2">
                        {vehicles.map((vehicle) => (
                          <Link
                            key={vehicle.id}
                            href={`/insurance-agent/vehicles/${vehicle.id}`}
                            className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 transition-colors"
                          >
                            <div>
                              <p className="font-medium">
                                {vehicle.registrationNumber || vehicle.vin || 'Brak numeru'}
                              </p>
                              {vehicle.vin && (
                                <p className="text-sm text-muted-foreground">VIN: {vehicle.vin}</p>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="calculations" className="mt-4">
                    {calculations.length === 0 ? (
                      <EmptyState
                        icon={FileCheck}
                        title="Brak kalkulacji"
                        description="Ten klient nie ma jeszcze kalkulacji"
                      />
                    ) : (
                      <div className="space-y-2">
                        {calculations.map((calculation) => (
                          <Link
                            key={calculation.id}
                            href={`/insurance-agent/calculations/${calculation.id}`}
                            className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 transition-colors"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">
                                  Kalkulacja #{calculation.id.slice(-8)}
                                </p>
                                <StatusBadge
                                  status={calculation.status}
                                  variant={
                                    calculation.status === 'ACCEPTED'
                                      ? "success"
                                      : calculation.status === 'REJECTED'
                                      ? "error"
                                      : calculation.status === 'SENT'
                                      ? "info"
                                      : "default"
                                  }
                                  size="sm"
                                />
                              </div>
                              {calculation.vehicle && (
                                <p className="text-sm text-muted-foreground">
                                  Pojazd: {calculation.vehicle.registrationNumber || calculation.vehicle.vin || 'Brak'}
                                </p>
                              )}
                              {calculation.value && (
                                <p className="text-sm text-muted-foreground">
                                  Wartość: {typeof calculation.value === "number" ? calculation.value.toFixed(2) : Number(calculation.value).toFixed(2)} zł
                                </p>
                              )}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {new Date(calculation.createdAt).toLocaleDateString('pl-PL')}
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="policies" className="mt-4">
                    {policies.length === 0 ? (
                      <EmptyState
                        icon={Shield}
                        title="Brak polis"
                        description="Ten klient nie ma jeszcze polis"
                      />
                    ) : (
                      <div className="space-y-2">
                        {policies.map((policy) => (
                          <Link
                            key={policy.id}
                            href={`/insurance-agent/policies/${policy.id}`}
                            className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 transition-colors"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">
                                  Polisa: {policy.policyNumber}
                                </p>
                                <StatusBadge
                                  status={policy.status}
                                  variant={
                                    policy.status === 'ACTIVE'
                                      ? "success"
                                      : policy.status === 'EXPIRED' || policy.status === 'CANCELLED'
                                      ? "error"
                                      : "default"
                                  }
                                  size="sm"
                                />
                              </div>
                              {policy.insuranceCompany && (
                                <p className="text-sm text-muted-foreground">
                                  TU: {policy.insuranceCompany.name}
                                </p>
                              )}
                              <p className="text-sm text-muted-foreground">
                                Ważna do: {new Date(policy.validTo).toLocaleDateString('pl-PL')}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

