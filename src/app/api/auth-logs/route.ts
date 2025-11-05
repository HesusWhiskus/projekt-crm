import { NextResponse } from "next/server"
import { getAuthLogs, clearAuthLogs } from "@/lib/logger"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clear = searchParams.get("clear") === "true"
  
  if (clear) {
    clearAuthLogs()
    return NextResponse.json({ message: "Logs cleared" })
  }
  
  const logs = getAuthLogs()
  return NextResponse.json({ logs }, { status: 200 })
}
