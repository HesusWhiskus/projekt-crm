"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { DateTimePicker } from "@/components/ui/datetime-picker"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ContactType } from "@prisma/client"
import { utcDateToLocalDateTime } from "@/lib/timezone"

interface ContactFormProps {
  clientId?: string
  clients?: Array<{
    id: string
    firstName: string | null
    lastName: string | null
    type: string
  }>
  users: Array<{
    id: string
    name: string | null
    email: string
  }>
  groups?: Array<{
    id: string
    name: string
  }>
  currentUser?: {
    id: string
  }
  contact?: {
    id?: string
    type?: ContactType | null
    date?: Date
    notes?: string
    isNote?: boolean
    userId?: string
    clientId?: string
    sharedGroups?: Array<{
      id: string
      name: string
    }>
  }
  onClose: () => void
  onSuccess: () => void
  onAddClient?: () => void
}

const contactTypeOptions: Record<ContactType, string> = {
  PHONE_CALL: "Rozmowa telefoniczna",
  MEETING: "Spotkanie",
  EMAIL: "E-mail",
  LINKEDIN_MESSAGE: "Wiadomość LinkedIn",
  OTHER: "Inne",
}

export function ContactForm({ clientId, clients, users, groups, currentUser, contact, onClose, onSuccess, onAddClient }: ContactFormProps) {
  const isNoteMode = contact?.isNote || (contact && Object.keys(contact).length === 1 && contact.isNote)
  // Upewnij się, że clientId jest zawsze ustawiony - priorytet: contact.clientId > clientId z props > ""
  const initialClientId = contact?.clientId || clientId || ""
  const [formData, setFormData] = useState({
    type: isNoteMode ? null : (contact?.type || "PHONE_CALL") as ContactType | null,
    date: contact && contact.date
      ? utcDateToLocalDateTime(contact.date)
      : utcDateToLocalDateTime(new Date()),
    notes: contact?.notes || "",
    isNote: isNoteMode || false,
    userId: contact?.userId || currentUser?.id || "",
    clientId: initialClientId,
    sharedGroupIds: contact?.sharedGroups?.map((g) => g.id) || [] as string[],
  })
  const [files, setFiles] = useState<File[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Upewnij się, że clientId z props jest zawsze synchronizowany z formData
  useEffect(() => {
    if (clientId && !formData.clientId) {
      setFormData(prev => ({ ...prev, clientId: clientId }))
    }
  }, [clientId, formData.clientId])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const formDataToSend = new FormData()
      // Only append type if it's not a note
      if (!formData.isNote && formData.type) {
        formDataToSend.append("type", formData.type)
      }
      formDataToSend.append("date", new Date(formData.date).toISOString())
      formDataToSend.append("notes", formData.notes)
      formDataToSend.append("isNote", formData.isNote ? "true" : "false")
      formDataToSend.append("userId", formData.userId)
      // Upewnij się, że clientId jest zawsze ustawiony - użyj formData.clientId lub fallback do clientId z props
      const finalClientId = formData.clientId || clientId || ""
      if (!finalClientId || finalClientId.trim() === "") {
        console.error("[ContactForm] Brak clientId:", { formDataClientId: formData.clientId, propClientId: clientId })
        throw new Error("Klient jest wymagany. Proszę wybrać klienta.")
      }
      console.log("[ContactForm] Wysyłanie z clientId:", finalClientId)
      formDataToSend.append("clientId", finalClientId)
      
      if (formData.sharedGroupIds.length > 0) {
        formDataToSend.append("sharedGroupIds", JSON.stringify(formData.sharedGroupIds))
      }

      files.forEach((file) => {
        formDataToSend.append("files", file)
      })

      const url = contact ? `/api/contacts/${contact.id}` : "/api/contacts"
      const method = contact ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        body: formDataToSend,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Wystąpił błąd")
      }

      onSuccess()
    } catch (error: any) {
      setError(error.message || "Wystąpił błąd podczas zapisywania kontaktu")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{contact ? "Edytuj kontakt" : "Dodaj nowy kontakt"}</CardTitle>
        <CardDescription>
          {contact ? "Zaktualizuj dane kontaktu" : "Wypełnij formularz, aby dodać nowy kontakt"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isNote}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    isNote: e.target.checked,
                    type: e.target.checked ? null : (formData.type || "PHONE_CALL" as ContactType),
                    // Upewnij się, że clientId nie jest tracony przy zmianie checkboxa
                    clientId: formData.clientId || clientId || "",
                  })
                }}
                disabled={isLoading}
                className="rounded"
              />
              <span className="text-sm font-medium">To jest notatka</span>
            </label>
            <p className="text-xs text-muted-foreground">
              Notatki nie wymagają typu kontaktu i nie aktualizują daty ostatniego kontaktu
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!formData.isNote && (
              <div className="space-y-2">
                <Label htmlFor="type">Typ kontaktu *</Label>
                <Select
                  id="type"
                  value={formData.type || "PHONE_CALL"}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as ContactType })}
                  required
                  disabled={isLoading}
                >
                  {Object.entries(contactTypeOptions).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            {formData.isNote && <div></div>}
            <DateTimePicker
              id="date"
              label="Data i godzina"
              value={formData.date}
              onChange={(value) => setFormData({ ...formData, date: value })}
              required
              disabled={isLoading}
            />
          </div>

          {clients && (
            <div className="space-y-2">
              <Label htmlFor="clientId">Klient *</Label>
              <div className="flex gap-2">
                <Select
                  id="clientId"
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  required
                  disabled={isLoading}
                  className="flex-1"
                >
                  <option value="">Wybierz klienta</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {`${client.firstName} ${client.lastName}`.trim() || "Brak nazwy"}
                    </option>
                  ))}
                </Select>
                {onAddClient && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onAddClient}
                    disabled={isLoading}
                  >
                    + Dodaj klienta
                  </Button>
                )}
              </div>
              {clients.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Brak dostępnych klientów. {onAddClient ? "Dodaj nowego klienta." : "Dodaj najpierw klienta w sekcji Klienci."}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notatka / Podsumowanie *</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              required
              disabled={isLoading}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="userId">Dodane przez</Label>
            <Select
              id="userId"
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              required
              disabled={isLoading}
            >
              <option value="">Wybierz użytkownika</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email}
                </option>
              ))}
            </Select>
          </div>

          {groups && groups.length > 0 && (
            <div className="space-y-2">
              <Label>Udostępnij grupom (opcjonalnie)</Label>
              <div className="space-y-2 border rounded p-3 max-h-48 overflow-y-auto">
                {groups.map((group) => (
                  <label key={group.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.sharedGroupIds.includes(group.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            sharedGroupIds: [...formData.sharedGroupIds, group.id],
                          })
                        } else {
                          setFormData({
                            ...formData,
                            sharedGroupIds: formData.sharedGroupIds.filter((id) => id !== group.id),
                          })
                        }
                      }}
                      disabled={isLoading}
                      className="rounded"
                    />
                    <span className="text-sm">{group.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {!contact && (
            <div className="space-y-2">
              <Label htmlFor="files">Załączniki (opcjonalnie)</Label>
              <Input
                id="files"
                type="file"
                multiple
                onChange={handleFileChange}
                disabled={isLoading}
              />
              {files.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Wybrano {files.length} plik(ów)
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Zapisywanie..." : contact ? "Zapisz zmiany" : "Dodaj kontakt"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

