import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendTaskReminderEmail } from "@/lib/email"

export async function POST(request: Request) {
  try {
    // This endpoint should be called by a cron job or scheduled task
    // Check for tasks due in the next 24 hours
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const tasks = await db.task.findMany({
      where: {
        status: { not: "COMPLETED" },
        dueDate: {
          gte: new Date(),
          lte: tomorrow,
        },
        assignedTo: { not: null },
      },
      include: {
        assignee: true,
        client: true,
      },
    })

    for (const task of tasks) {
      if (task.assignee?.email) {
        try {
          await sendTaskReminderEmail(
            task.assignee.email,
            task.title,
            task.dueDate!,
            task.client?.type === "COMPANY" ? task.client.companyName : task.client ? `${task.client.firstName} ${task.client.lastName}`.trim() : undefined
          )
        } catch (error) {
          console.error(`Failed to send reminder for task ${task.id}:`, error)
        }
      }
    }

    return NextResponse.json({
      message: `Wysłano ${tasks.length} przypomnień`,
      count: tasks.length,
    })
  } catch (error) {
    console.error("Reminder sending error:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas wysyłania przypomnień" },
      { status: 500 }
    )
  }
}

