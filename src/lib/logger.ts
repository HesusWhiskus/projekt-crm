import fs from "fs"
import path from "path"

const LOG_FILE = path.join(process.cwd(), "auth-debug.log")

/**
 * Sensitive keys that should be redacted from logs
 */
const SENSITIVE_KEYS = [
  'password',
  'token',
  'secret',
  'accessToken',
  'refreshToken',
  'email', // Email can be sensitive in some contexts
  'authorization',
  'cookie',
  'session',
]

/**
 * Sanitizes sensitive data from log objects
 */
function sanitizeLogData(data: any): any {
  if (!data || typeof data !== 'object') {
    // If it's a string, check if it contains sensitive patterns
    if (typeof data === 'string') {
      // Redact potential tokens/secrets in strings
      return data.replace(/(password|token|secret)=[^&\s]+/gi, (match) => {
        const [key] = match.split('=')
        return `${key}=[REDACTED]`
      })
    }
    return data
  }
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeLogData(item))
  }
  
  // Handle objects
  const sanitized: any = {}
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase()
    
    // Check if key contains sensitive information
    if (SENSITIVE_KEYS.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]'
    } else {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeLogData(value)
    }
  }
  
  return sanitized
}

export function logAuth(message: string, data?: any) {
  const timestamp = new Date().toISOString()
  
  // Sanitize sensitive data
  const sanitizedData = data ? sanitizeLogData(data) : null
  const dataStr = sanitizedData ? (typeof sanitizedData === "string" ? sanitizedData : JSON.stringify(sanitizedData, null, 2)) : ""
  const logEntry = `[${timestamp}] ${message}${dataStr ? ` ${dataStr}` : ""}\n`
  
  // Only log to console/file in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[AUTH-LOG] ${message}`, sanitizedData || "")
    
    // Log to file only in development
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
  } else {
    // In production, use structured logging without sensitive data
    console.log(`[AUTH] ${message}`)
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

