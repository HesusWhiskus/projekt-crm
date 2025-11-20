"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { TaskStatus, UserRole } from "@prisma/client"
import { Plus, List, Calendar, LayoutGrid } from "lucide-react"
import { TaskForm } from "./task-form"
import { TasksCalendar } from "./tasks-calendar"
import { TasksKanban } from "./tasks-kanban"
import { ClientForm } from "@/components/clients/client-form"
import { DataTable } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { taskStatusLabels } from "@/lib/status-config"
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
    companyName?: string | null // Temporarily optional - column doesn't exist in production DB yet
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
    companyName?: string | null // Temporarily optional - column doesn't exist in production DB yet
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
        <div className="flex flex-wrap gap-2">
          <Button
            variant={view === "list" ? "default" : "outline"}
            onClick={() => handleViewChange("list")}
            aria-label="Widok listy"
          >
            <List className="h-4 w-4 mr-2" />
            Lista
          </Button>
          <Button
            variant={view === "kanban" ? "default" : "outline"}
            onClick={() => handleViewChange("kanban")}
            aria-label="Widok kanban"
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            Kanban
          </Button>
          <Button
            variant={view === "calendar" ? "default" : "outline"}
            onClick={() => handleViewChange("calendar")}
            aria-label="Widok kalendarza"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Kalendarz
          </Button>
          <Button onClick={() => setIsCreating(true)} aria-label="Dodaj zadanie">
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
                {Object.entries(taskStatusLabels).map(([value, label]) => (
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
        <div className="w-full">
          <TasksCalendar 
            tasks={filteredTasks} 
            users={users}
            groups={groups}
            currentUser={currentUser}
          />
        </div>
      ) : view === "kanban" ? (
        <TasksKanban tasks={filteredTasks} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Lista zadań ({filteredTasks.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              data={filteredTasks}
              columns={[
                {
                  key: "title",
                  header: "Tytuł",
                  accessor: (task) => {
                    const overdue = isOverdue(task)
                    return (
                      <div className="flex items-center gap-2">
                        <span className={overdue ? "text-red-700 dark:text-red-400 font-medium" : ""}>
                          {task.title}
                        </span>
                        {overdue && (
                          <StatusBadge
                            status="Przeterminowane"
                            variant="error"
                            size="sm"
                          />
                        )}
                      </div>
                    )
                  },
                  sortable: true,
                  priority: "always",
                  width: "25%",
                },
                {
                  key: "description",
                  header: "Opis",
                  accessor: (task) => task.description || "-",
                  sortable: false,
                  priority: "mobile-hidden",
                  width: "30%",
                },
                {
                  key: "status",
                  header: "Status",
                  accessor: (task) => (
                    <StatusBadge
                      status={taskStatusLabels[task.status]}
                      variant={
                        task.status === "COMPLETED"
                          ? "success"
                          : task.status === "IN_PROGRESS"
                          ? "info"
                          : "default"
                      }
                      size="sm"
                    />
                  ),
                  sortable: true,
                  priority: "always",
                  width: "15%",
                },
                {
                  key: "dueDate",
                  header: "Termin",
                  accessor: (task) => {
                    if (!task.dueDate) return "-"
                    const overdue = isOverdue(task)
                    return (
                      <span className={overdue ? "text-red-600 dark:text-red-400 font-medium" : ""}>
                        {new Date(task.dueDate).toLocaleDateString("pl-PL")}
                      </span>
                    )
                  },
                  sortable: true,
                  priority: "always",
                  width: "15%",
                },
                {
                  key: "assignee",
                  header: "Przypisane do",
                  accessor: (task) => task.assignee?.name || task.assignee?.email || "Nieprzypisane",
                  sortable: true,
                  priority: "optional",
                  width: "15%",
                },
                {
                  key: "client",
                  header: "Klient",
                  accessor: (task) => {
                    if (!task.client) return "-"
                    return task.client.type === "COMPANY"
                      ? task.client.companyName || "Brak nazwy firmy"
                      : `${task.client.firstName || ""} ${task.client.lastName || ""}`.trim() || "Brak nazwy"
                  },
                  sortable: false,
                  priority: "mobile-hidden",
                  width: "20%",
                },
              ]}
              emptyState={{
                title: "Brak zadań spełniających kryteria",
                description: "Spróbuj zmienić filtry lub dodaj nowe zadanie",
                action: {
                  label: "Dodaj zadanie",
                  onClick: () => setIsCreating(true),
                },
              }}
              onRowClick={(task) => router.push(`/tasks/${task.id}`)}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

