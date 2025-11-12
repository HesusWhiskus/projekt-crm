"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TaskStatus, UserRole } from "@prisma/client"
import { Edit, Calendar as CalendarIcon } from "lucide-react"
import { TaskForm } from "./task-form"
import Link from "next/link"

interface TaskDetailProps {
  task: any
  users: Array<{
    id: string
    name: string | null
    email: string
  }>
  clients: Array<{
    id: string
    firstName: string | null
    lastName: string | null
    companyName: string | null
    type: string
  }>
  groups?: Array<{
    id: string
    name: string
  }>
  currentUser: {
    id: string
    role: UserRole
  }
}

const statusLabels: Record<TaskStatus, string> = {
  TODO: "Do zrobienia",
  IN_PROGRESS: "W toku",
  COMPLETED: "Zakończone",
}

export function TaskDetail({ task, users, clients, groups, currentUser }: TaskDetailProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  const handleSyncToCalendar = async () => {
    setIsSyncing(true)
    try {
      const response = await fetch("/api/calendar/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Show specific error message from API
        alert(data.error || "Błąd podczas synchronizacji")
        
        // If requires Google auth, suggest redirecting to sign in
        if (data.requiresGoogleAuth || data.requiresReauth) {
          const shouldRedirect = confirm(
            "Aby synchronizować z Google Calendar, musisz zalogować się przez Google. Przekierować do logowania?"
          )
          if (shouldRedirect) {
            window.location.href = "/signin"
          }
        }
        return
      }

      alert("Zadanie zostało zsynchronizowane z kalendarzem Google")
    } catch (error) {
      console.error(error)
      alert("Wystąpił błąd podczas synchronizacji")
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{task.title}</h1>
          <p className="text-muted-foreground mt-2">
            Status: {statusLabels[task.status as TaskStatus]}
          </p>
        </div>
        <div className="flex space-x-2">
          {task.dueDate && (
            <Button variant="outline" onClick={handleSyncToCalendar} disabled={isSyncing}>
              <CalendarIcon className="h-4 w-4 mr-2" />
              {isSyncing ? "Synchronizowanie..." : "Synchronizuj z Google Calendar"}
            </Button>
          )}
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edytuj
          </Button>
        </div>
      </div>

      {isEditing && (
        <TaskForm
          task={task}
          users={users}
          clients={clients}
          groups={groups}
          currentUser={currentUser}
          onClose={() => setIsEditing(false)}
          onSuccess={() => {
            setIsEditing(false)
            router.refresh()
          }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Szczegóły zadania</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {task.description && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Opis:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edytuj
                  </Button>
                </div>
                <p className="mt-1">{task.description}</p>
              </div>
            )}
            {!task.description && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Opis:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Dodaj opis
                  </Button>
                </div>
              </div>
            )}
            {task.dueDate && (
              <div>
                <span className="text-sm font-medium">Termin:</span>{" "}
                {new Date(task.dueDate).toLocaleString("pl-PL")}
              </div>
            )}
            <div>
              <span className="text-sm font-medium">Status:</span>{" "}
              <span className="px-2 py-1 rounded text-xs bg-muted text-muted-foreground">
                {statusLabels[task.status as TaskStatus]}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium">Przypisane do:</span>{" "}
              {task.assignee?.name || task.assignee?.email || "Nieprzypisane"}
            </div>
            {task.client && (
              <div>
                <span className="text-sm font-medium">Klient:</span>{" "}
                <Link
                  href={`/clients/${task.client.id}`}
                  className="text-primary hover:underline"
                >
                  {task.client.type === "COMPANY" ? task.client.companyName : `${task.client.firstName} ${task.client.lastName}`.trim() || "Brak nazwy"}
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informacje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm font-medium">Data utworzenia:</span>{" "}
              {new Date(task.createdAt).toLocaleDateString("pl-PL")}
            </div>
            <div>
              <span className="text-sm font-medium">Ostatnia aktualizacja:</span>{" "}
              {new Date(task.updatedAt).toLocaleDateString("pl-PL")}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

