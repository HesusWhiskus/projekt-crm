"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { DateTimePicker } from "@/components/ui/datetime-picker"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { utcDateToLocalDateTime } from "@/lib/timezone"

interface NoteFormProps {
  clientId: string // Wymagane dla notatek - zawsze muszą być przypisane do klienta
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
  note?: {
    id?: string
    date?: Date
    notes?: string
    userId?: string
    clientId?: string
    sharedGroups?: Array<{
      id: string
      name: string
    }>
  }
  onClose: () => void
  onSuccess: () => void
}

export function NoteForm({ clientId, users, groups, currentUser, note, onClose, onSuccess }: NoteFormProps) {
  const [formData, setFormData] = useState({
    date: note && note.date
      ? utcDateToLocalDateTime(note.date)
      : utcDateToLocalDateTime(new Date()),
    notes: note?.notes || "",
    userId: note?.userId || currentUser?.id || "",
    clientId: note?.clientId || clientId || "",
    sharedGroupIds: note?.sharedGroups?.map((g) => g.id) || [] as string[],
  })
  const [files, setFiles] = useState<File[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Upewnij się, że clientId z props jest zawsze synchronizowany z formData
  useEffect(() => {
    if (clientId && clientId !== formData.clientId) {
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
      formDataToSend.append("date", new Date(formData.date).toISOString())
      formDataToSend.append("notes", formData.notes)
      formDataToSend.append("userId", formData.userId)
      
      // Upewnij się, że clientId jest zawsze ustawiony
      const finalClientId = formData.clientId || clientId || ""
      if (!finalClientId || finalClientId.trim() === "") {
        console.error("[NoteForm] Brak clientId:", { formDataClientId: formData.clientId, propClientId: clientId })
        throw new Error("Klient jest wymagany. Proszę wybrać klienta.")
      }
      console.log("[NoteForm] Wysyłanie z clientId:", finalClientId)
      formDataToSend.append("clientId", finalClientId)
      
      if (formData.sharedGroupIds.length > 0) {
        formDataToSend.append("sharedGroupIds", JSON.stringify(formData.sharedGroupIds))
      }

      files.forEach((file) => {
        formDataToSend.append("files", file)
      })

      const url = note ? `/api/contacts/${note.id}` : "/api/notes"
      const method = note ? "PATCH" : "POST"

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
      setError(error.message || "Wystąpił błąd podczas zapisywania notatki")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{note ? "Edytuj notatkę" : "Dodaj nową notatkę"}</CardTitle>
        <CardDescription>
          {note ? "Zaktualizuj treść notatki" : "Wypełnij formularz, aby dodać nową notatkę"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DateTimePicker
              id="date"
              label="Data i godzina"
              value={formData.date}
              onChange={(value) => setFormData({ ...formData, date: value })}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Treść notatki *</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              required
              disabled={isLoading}
              rows={6}
              placeholder="Wpisz treść notatki..."
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

          {!note && (
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
              {isLoading ? "Zapisywanie..." : note ? "Zapisz zmiany" : "Dodaj notatkę"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

