import { google } from "googleapis"
import { db } from "./db"
import { getServerSession } from "next-auth"
import { authOptions } from "./auth-config"

export async function getGoogleCalendarClient(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  })

  if (!user) {
    throw new Error("User not found")
  }

  // Get session to access Google OAuth tokens
  const session = await getServerSession(authOptions)
  
  if (!session) {
    throw new Error("User not authenticated")
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXTAUTH_URL + "/api/auth/callback/google"
  )

  // Try to get tokens from session (NextAuth stores them in JWT for Google provider)
  // Note: In NextAuth v4 with JWT strategy, tokens are stored in the JWT token
  // For full OAuth token access, you might need to use PrismaAdapter or store tokens separately
  // This is a simplified implementation - for production, consider storing tokens in database
  
  // For now, we'll require users to re-authenticate with Google to get fresh tokens
  // This is a limitation of using JWT strategy without adapter
  // In production, you should:
  // 1. Use PrismaAdapter with Account model, OR
  // 2. Store tokens separately in database after initial OAuth flow
  
  // Check if we have access token in session (if using Google OAuth)
  const accessToken = (session as any).accessToken
  const refreshToken = (session as any).refreshToken

  if (accessToken) {
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
  } else {
    // If no token in session, user needs to re-authenticate with Google
    throw new Error("Google Calendar access token not found. Please sign in with Google again.")
  }

  return google.calendar({ version: "v3", auth: oauth2Client })
}

export async function createCalendarEvent(
  userId: string,
  title: string,
  description: string | null,
  startDate: Date,
  endDate?: Date
) {
  try {
    const calendar = await getGoogleCalendarClient(userId)

    const event = {
      summary: title,
      description: description || "",
      start: {
        dateTime: startDate.toISOString(),
        timeZone: "Europe/Warsaw",
      },
      end: {
        dateTime: (endDate || new Date(startDate.getTime() + 60 * 60 * 1000)).toISOString(),
        timeZone: "Europe/Warsaw",
      },
    }

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    })

    return response.data
  } catch (error) {
    console.error("Calendar event creation error:", error)
    throw error
  }
}

export async function syncTaskToCalendar(userId: string, taskId: string) {
  try {
    const task = await db.task.findUnique({
      where: { id: taskId },
      include: {
        client: true,
        assignee: true,
      },
    })

    if (!task || !task.dueDate) {
      throw new Error("Task not found or has no due date")
    }

    const title = task.client
      ? `${task.title} - ${task.client.agencyName}`
      : task.title

    const description = [
      task.description,
      task.client ? `Klient: ${task.client.agencyName}` : "",
      task.assignee ? `Przypisane do: ${task.assignee.name || task.assignee.email}` : "",
    ]
      .filter(Boolean)
      .join("\n")

    const endDate = new Date(task.dueDate)
    endDate.setHours(endDate.getHours() + 1)

    return await createCalendarEvent(userId, title, description, task.dueDate, endDate)
  } catch (error) {
    console.error("Task to calendar sync error:", error)
    throw error
  }
}

