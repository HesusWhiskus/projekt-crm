"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TaskStatus } from "@prisma/client"

interface TaskFormProps {
  users: Array<{
    id: string
    name: string | null
    email: string
  }>
  clients?: Array<{
    id: string
    firstName: string
    lastName: string
    agencyName: string | null
  }>
  groups?: Array<{
    id: string
    name: string
  }>
  currentUser?: {
    id: string
  }
  task?: {
    id: string
    title: string
    description: string | null
    dueDate: Date | null
    status: TaskStatus
    assignedTo: string | null
    clientId: string | null
    sharedGroups?: Array<{
      id: string
      name: string
    }>
  }
  onClose: () => void
  onSuccess: () => void
  onAddClient?: () => void
  initialDueDate?: Date
}

const statusOptions: Record<TaskStatus, string> = {
  TODO: "Do zrobienia",
  IN_PROGRESS: "W toku",
  COMPLETED: "Zakończone",
}

export function TaskForm({ users, clients, groups, currentUser, task, onClose, onSuccess, onAddClient, initialDueDate }: TaskFormProps) {
  const [formData, setFormData] = useState({
    title: task?.title || "",
    description: task?.description || "",
    dueDate: task?.dueDate
      ? new Date(task.dueDate).toISOString().slice(0, 16)
      : initialDueDate
      ? new Date(initialDueDate).toISOString().slice(0, 16)
      : "",
    status: (task?.status || "TODO") as TaskStatus,
    assignedTo: task?.assignedTo || currentUser?.id || "",
    clientId: task?.clientId || "",
    sharedGroupIds: task?.sharedGroups?.map(g => g.id) || [] as string[],
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const url = task ? `/api/tasks/${task.id}` : "/api/tasks"
      const method = task ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        const bodyData: any = {
          title: formData.title,
          description: formData.description || undefined,
          status: formData.status,
        }
        
        if (formData.dueDate) bodyData.dueDate = formData.dueDate
        if (formData.assignedTo) bodyData.assignedTo = formData.assignedTo
        if (formData.clientId) bodyData.clientId = formData.clientId
        if (formData.sharedGroupIds.length > 0) bodyData.sharedGroupIds = formData.sharedGroupIds
        
        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyData),
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Wystąpił błąd")
      }

      onSuccess()
    } catch (error: any) {
      setError(error.message || "Wystąpił błąd podczas zapisywania zadania")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{task ? "Edytuj zadanie" : "Dodaj nowe zadanie"}</CardTitle>
        <CardDescription>
          {task ? "Zaktualizuj dane zadania" : "Wypełnij formularz, aby dodać nowe zadanie"}
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
            <Label htmlFor="title">Tytuł *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Opis</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Termin</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                disabled={isLoading}
              >
                {Object.entries(statusOptions).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignedTo">Przypisane do</Label>
              <Select
                id="assignedTo"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                disabled={isLoading}
              >
                <option value="">Nieprzypisane</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email}
                  </option>
                ))}
              </Select>
            </div>
            {clients && (
              <div className="space-y-2">
                <Label htmlFor="clientId">Klient (opcjonalnie)</Label>
                <div className="flex gap-2">
                  <Select
                    id="clientId"
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    <option value="">Brak klienta</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.firstName} {client.lastName} {client.agencyName ? `(${client.agencyName})` : ""}
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
          </div>

          {groups && groups.length > 0 && (
            <div className="space-y-2">
              <Label>Udostępnij grupom (opcjonalnie)</Label>
              <div className="space-y-2 border rounded p-3 max-h-40 overflow-y-auto">
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
              <p className="text-xs text-muted-foreground">
                Zadania udostępnione grupom będą widoczne dla wszystkich użytkowników w tych grupach
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Zapisywanie..." : task ? "Zapisz zmiany" : "Dodaj zadanie"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

