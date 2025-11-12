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
  const accessToken = (session as any).accessToken
  const refreshToken = (session as any).refreshToken
  const expiresAt = (session as any).expiresAt

  if (!accessToken) {
    throw new Error("Google Calendar access token not found. Please sign in with Google to enable calendar sync.")
  }

  // Check if token is expired and refresh if needed
  const now = Math.floor(Date.now() / 1000)
  const isExpired = expiresAt && expiresAt < now

  if (isExpired && refreshToken) {
    try {
      console.log("[Calendar] Access token expired, refreshing...")
      oauth2Client.setCredentials({
        refresh_token: refreshToken,
      })
      const { credentials } = await oauth2Client.refreshAccessToken()
      oauth2Client.setCredentials(credentials)
      console.log("[Calendar] Token refreshed successfully")
    } catch (error: any) {
      console.error("[Calendar] Token refresh failed:", error)
      throw new Error("Failed to refresh Google Calendar access token. Please sign in with Google again.")
    }
  } else {
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
      expiry_date: expiresAt ? expiresAt * 1000 : undefined,
    })
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

    const clientName = task.client 
      ? (`${task.client.firstName} ${task.client.lastName}`.trim() || "Brak nazwy")
      : null
    
    const title = clientName
      ? `${task.title} - ${clientName}`
      : task.title

    const description = [
      task.description,
      clientName ? `Klient: ${clientName}` : "",
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
