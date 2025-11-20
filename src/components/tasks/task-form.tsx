"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SearchableClientSelect } from "@/components/ui/client-select"
import { DateTimePicker } from "@/components/ui/datetime-picker"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TaskStatus } from "@prisma/client"
import { utcDateToLocalDateTime } from "@/lib/timezone"

interface TaskFormProps {
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

export function TaskForm({ users, groups, currentUser, task, onClose, onSuccess, onAddClient, initialDueDate }: TaskFormProps) {
  const [formData, setFormData] = useState({
    title: task?.title || "",
    description: task?.description || "",
    dueDate: task?.dueDate
      ? utcDateToLocalDateTime(task.dueDate)
      : initialDueDate
      ? utcDateToLocalDateTime(initialDueDate)
      : "",
    status: (task?.status || "TODO") as TaskStatus,
    assignedTo: task?.assignedTo || currentUser?.id || "unassigned",
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

      const bodyData: any = {
        title: formData.title,
        description: formData.description || undefined,
        status: formData.status,
      }
      
      if (formData.dueDate) bodyData.dueDate = formData.dueDate
      if (formData.assignedTo && formData.assignedTo !== "unassigned") bodyData.assignedTo = formData.assignedTo
      else if (formData.assignedTo === "unassigned") bodyData.assignedTo = null
      if (formData.clientId) bodyData.clientId = formData.clientId
      if (formData.sharedGroupIds.length > 0) bodyData.sharedGroupIds = formData.sharedGroupIds
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
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
            <DateTimePicker
              id="dueDate"
              label="Termin"
              value={formData.dueDate || ""}
              onChange={(value) => setFormData({ ...formData, dueDate: value })}
              disabled={isLoading}
            />
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as TaskStatus })}
                disabled={isLoading}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Wybierz status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusOptions).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignedTo">Przypisane do</Label>
              <Select
                value={formData.assignedTo}
                onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}
                disabled={isLoading}
              >
                <SelectTrigger id="assignedTo">
                  <SelectValue placeholder="Nieprzypisane" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Nieprzypisane</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientId">Klient (opcjonalnie)</Label>
              <SearchableClientSelect
                value={formData.clientId || ""}
                onValueChange={(value) => setFormData({ ...formData, clientId: value || "" })}
                placeholder="Wyszukaj klienta (opcjonalnie)..."
                disabled={isLoading}
              />
              {onAddClient && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onAddClient}
                  disabled={isLoading}
                  className="w-full sm:w-auto mt-2"
                >
                  + Dodaj klienta
                </Button>
              )}
            </div>
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

