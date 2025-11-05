"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from "date-fns"
import { pl } from "date-fns/locale"
import { TaskStatus } from "@prisma/client"

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
    agencyName: string | null
  } | null
}

interface TasksCalendarProps {
  tasks: Task[]
  users?: Array<{
    id: string
    name: string | null
    email: string
  }>
  currentUser?: {
    id: string
    role: string
  }
}

export function TasksCalendar({ tasks, users, currentUser }: TasksCalendarProps) {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const getTasksForDay = (day: Date) => {
    return tasks.filter(
      (task) => task.dueDate && isSameDay(new Date(task.dueDate), day)
    )
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <button onClick={prevMonth} className="px-4 py-2 border rounded hover:bg-gray-100">
            ← Poprzedni
          </button>
          <h2 className="text-xl font-semibold">
            {format(currentMonth, "LLLL yyyy", { locale: pl })}
          </h2>
          <button onClick={nextMonth} className="px-4 py-2 border rounded hover:bg-gray-100">
            Następny →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"].map((day) => (
            <div key={day} className="text-center font-medium text-sm p-2">
              {day}
            </div>
          ))}
          {days.map((day) => {
            const dayTasks = getTasksForDay(day)
            const isToday = isSameDay(day, today)
            const isCurrentMonth = isSameMonth(day, currentMonth)

            return (
              <div
                key={day.toISOString()}
                className={`border rounded p-2 min-h-[100px] ${
                  isToday ? "bg-blue-50 border-blue-300" : ""
                } ${!isCurrentMonth ? "opacity-50" : ""}`}
              >
                <div className="text-sm font-medium mb-1">
                  {format(day, "d")}
                </div>
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className="text-xs bg-primary/10 text-primary p-1 rounded truncate"
                      title={task.title}
                    >
                      {task.title}
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{dayTasks.length - 3} więcej
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

