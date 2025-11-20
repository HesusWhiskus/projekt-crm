"use client"

import { TaskStatus } from "@prisma/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { CheckSquare, Clock, CheckCircle2 } from "lucide-react"
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
    companyName?: string | null
    type: string
  } | null
}

interface TasksKanbanProps {
  tasks: Task[]
}

const statusColumns: Array<{
  status: TaskStatus
  label: string
  icon: any
  color: "default" | "success" | "warning" | "error" | "info"
}> = [
  { status: "TODO", label: "Do zrobienia", icon: CheckSquare, color: "default" },
  { status: "IN_PROGRESS", label: "W toku", icon: Clock, color: "info" },
  { status: "COMPLETED", label: "Zakończone", icon: CheckCircle2, color: "success" },
]

export function TasksKanban({ tasks }: TasksKanbanProps) {
  const isOverdue = (task: Task): boolean => {
    if (!task.dueDate || task.status === "COMPLETED") {
      return false
    }
    return new Date(task.dueDate) < new Date()
  }

  const getClientDisplayName = (client: Task["client"]): string => {
    if (!client) return "-"
    if (client.type === "COMPANY") {
      return client.companyName || "Brak nazwy firmy"
    }
    const name = [client.firstName, client.lastName].filter(Boolean).join(" ")
    return name || "Brak nazwy"
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {statusColumns.map((column) => {
        const columnTasks = tasks.filter((task) => task.status === column.status)
        const Icon = column.icon

        return (
          <div key={column.status} className="flex flex-col">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Icon className="h-4 w-4" />
                  {column.label} ({columnTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 min-h-[200px]">
                {columnTasks.length === 0 ? (
                  <EmptyState
                    icon={Icon}
                    title="Brak zadań"
                    description={`Brak zadań w statusie "${column.label}"`}
                    className="py-8"
                  />
                ) : (
                  columnTasks.map((task) => {
                    const overdue = isOverdue(task)
                    return (
                      <Link key={task.id} href={`/tasks/${task.id}`}>
                        <Card
                          className={`cursor-pointer hover:shadow-md transition-all ${
                            overdue ? "border-red-500 bg-red-50/50 dark:bg-red-950/20" : ""
                          }`}
                        >
                          <CardContent className="p-3">
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <h4
                                  className={`font-medium text-sm ${
                                    overdue ? "text-red-700 dark:text-red-400" : ""
                                  }`}
                                >
                                  {task.title}
                                </h4>
                              </div>
                              {task.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                              {task.dueDate && (
                                <div
                                  className={`text-xs ${
                                    overdue
                                      ? "text-red-600 dark:text-red-400 font-medium"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {new Date(task.dueDate).toLocaleDateString("pl-PL")}
                                </div>
                              )}
                              {task.client && (
                                <div className="text-xs text-muted-foreground">
                                  Klient: {getClientDisplayName(task.client)}
                                </div>
                              )}
                              {task.assignee && (
                                <div className="text-xs text-muted-foreground">
                                  {task.assignee.name || task.assignee.email}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </div>
        )
      })}
    </div>
  )
}

