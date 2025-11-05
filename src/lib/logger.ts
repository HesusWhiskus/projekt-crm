import fs from "fs"
import path from "path"

const LOG_FILE = path.join(process.cwd(), "auth-debug.log")

export function logAuth(message: string, data?: any) {
  const timestamp = new Date().toISOString()
  const dataStr = data ? (typeof data === "string" ? data : JSON.stringify(data, null, 2)) : ""
  const logEntry = `[${timestamp}] ${message}${dataStr ? ` ${dataStr}` : ""}\n`
  
  // Log to console
  console.log(`[AUTH-LOG] ${message}`, data || "")
  
  // Log to file
  try {
    // Ensure directory exists
    const logDir = path.dirname(LOG_FILE)
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }
    fs.appendFileSync(LOG_FILE, logEntry, "utf8")
  } catch (error: any) {
    console.error("Failed to write to log file:", error?.message || error)
  }
}

export function clearAuthLogs() {
  try {
    if (fs.existsSync(LOG_FILE)) {
      fs.writeFileSync(LOG_FILE, "", "utf8")
    }
  } catch (error) {
    console.error("Failed to clear log file:", error)
  }
}

export function getAuthLogs() {
  try {
    if (fs.existsSync(LOG_FILE)) {
      return fs.readFileSync(LOG_FILE, "utf8")
    }
    return "No logs yet"
  } catch (error) {
    return `Error reading logs: ${error}`
  }
}

