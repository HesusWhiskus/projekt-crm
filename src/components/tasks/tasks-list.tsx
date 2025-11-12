"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { TaskStatus, UserRole } from "@prisma/client"
import { Plus, List, Calendar, AlertCircle } from "lucide-react"
import { TaskForm } from "./task-form"
import { TasksCalendar } from "./tasks-calendar"
import { ClientForm } from "@/components/clients/client-form"
import Link from "next/link"

interface Task {
  id: string
  title: string
  description: string | null
  dueDate: Date | null
  status: TaskStatus
  assignee: {
    id: string
    name: string | null
    email: string
  } | null
  client: {
    id: string
    firstName: string | null
    lastName: string | null
    type: string
  } | null
}

interface TasksListProps {
  tasks: Task[]
  users: Array<{
    id: string
    name: string | null
    email: string
  }>
  clients: Array<{
    id: string
    firstName: string | null
    lastName: string | null
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
  view: string
  onAddClient?: () => void
}

const statusLabels: Record<TaskStatus, string> = {
  TODO: "Do zrobienia",
  IN_PROGRESS: "W toku",
  COMPLETED: "Zakończone",
}

export function TasksList({
  tasks,
  users,
  clients,
  groups,
  currentUser,
  view: initialView,
  onAddClient,
}: TasksListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [view, setView] = useState(initialView)
  const [isCreating, setIsCreating] = useState(false)
  const [isCreatingClient, setIsCreatingClient] = useState(false)
  const [filters, setFilters] = useState({
    status: searchParams.get("status") || "",
    assignedTo: searchParams.get("assignedTo") || "",
  })

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    const params = new URLSearchParams()
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    params.set("view", view)
    router.push(`/tasks?${params.toString()}`)
  }

  const handleViewChange = (newView: string) => {
    setView(newView)
    const params = new URLSearchParams(searchParams.toString())
    params.set("view", newView)
    router.push(`/tasks?${params.toString()}`)
  }

  const filteredTasks = tasks.filter((task) => {
    if (filters.status && task.status !== filters.status) return false
    if (filters.assignedTo && task.assignee?.id !== filters.assignedTo) return false
    return true
  })

  const isOverdue = (task: Task): boolean => {
    if (!task.dueDate || task.status === "COMPLETED") {
      return false
    }
    return new Date(task.dueDate) < new Date()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Zadania</h1>
          <p className="text-muted-foreground mt-2">
            Zarządzaj zadaniami i terminami
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant={view === "list" ? "default" : "outline"}
            onClick={() => handleViewChange("list")}
          >
            <List className="h-4 w-4 mr-2" />
            Lista
          </Button>
          <Button
            variant={view === "calendar" ? "default" : "outline"}
            onClick={() => handleViewChange("calendar")}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Kalendarz
          </Button>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Dodaj zadanie
          </Button>
        </div>
      </div>

      {isCreatingClient && (
        <ClientForm
          users={users}
          currentUser={currentUser}
          onClose={() => setIsCreatingClient(false)}
          onSuccess={() => {
            setIsCreatingClient(false)
            router.refresh()
          }}
        />
      )}

      {isCreating && (
        <TaskForm
          users={users}
          clients={clients}
          groups={groups}
          currentUser={currentUser}
          onClose={() => setIsCreating(false)}
          onSuccess={() => {
            setIsCreating(false)
            router.refresh()
          }}
          onAddClient={() => setIsCreatingClient(true)}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Filtry</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <option value="">Wszystkie</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignedTo">Przypisane do</Label>
              <Select
                id="assignedTo"
                value={filters.assignedTo}
                onChange={(e) => handleFilterChange("assignedTo", e.target.value)}
              >
                <option value="">Wszyscy</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {view === "calendar" ? (
        <TasksCalendar tasks={filteredTasks} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Lista zadań ({filteredTasks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTasks.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Brak zadań spełniających kryteria
              </p>
            ) : (
              <div className="space-y-2">
                {filteredTasks.map((task) => {
                  const overdue = isOverdue(task)
                  return (
                  <Link key={task.id} href={`/tasks/${task.id}`}>
                    <div className={`border rounded p-4 hover:bg-muted/50 cursor-pointer ${
                      overdue ? "border-red-500 bg-red-50 dark:bg-red-950/20" : "border-border"
                    }`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className={`font-medium ${overdue ? "text-red-700 dark:text-red-400" : ""}`}>
                              {task.title}
                            </h3>
                            {overdue && (
                              <span className="px-2 py-1 rounded text-xs bg-red-500 text-white flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Przeterminowane
                              </span>
                            )}
                            <span className="px-2 py-1 rounded text-xs bg-muted text-muted-foreground">
                              {statusLabels[task.status]}
                            </span>
                          </div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                            {task.dueDate && (
                              <span className={overdue ? "text-red-600 dark:text-red-400 font-medium" : ""}>
                                Termin: {new Date(task.dueDate).toLocaleDateString("pl-PL")}
                              </span>
                            )}
                            {task.assignee && (
                              <span>
                                Przypisane do: {task.assignee.name || task.assignee.email}
                              </span>
                            )}
                            {task.client && (
                              <span>
                                Klient: {`${task.client.firstName} ${task.client.lastName}`.trim() || "Brak nazwy"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

