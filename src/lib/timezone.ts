/**
 * Timezone utilities for formatting dates according to user's timezone preference
 */

/**
 * Get user's timezone or default to browser's timezone
 */
export function getUserTimezone(timezone?: string | null): string {
  if (timezone) {
    return timezone
  }
  
  // Try to detect browser timezone
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    // Fallback to Europe/Warsaw if detection fails
    return "Europe/Warsaw"
  }
}

/**
 * Format date according to user's timezone
 */
export function formatDateInTimezone(
  date: Date | string,
  timezone?: string | null,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  const tz = getUserTimezone(timezone)
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...options,
  }
  
  return new Intl.DateTimeFormat("pl-PL", {
    ...defaultOptions,
    timeZone: tz,
  }).format(dateObj)
}

/**
 * Format date and time according to user's timezone
 */
export function formatDateTimeInTimezone(
  date: Date | string,
  timezone?: string | null,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  const tz = getUserTimezone(timezone)
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  }
  
  return new Intl.DateTimeFormat("pl-PL", {
    ...defaultOptions,
    timeZone: tz,
  }).format(dateObj)
}

/**
 * Get list of common timezones
 */
export const COMMON_TIMEZONES = [
  { value: "Europe/Warsaw", label: "Warszawa (UTC+1/+2)" },
  { value: "Europe/London", label: "Londyn (UTC+0/+1)" },
  { value: "Europe/Berlin", label: "Berlin (UTC+1/+2)" },
  { value: "Europe/Paris", label: "Paryż (UTC+1/+2)" },
  { value: "Europe/Madrid", label: "Madryt (UTC+1/+2)" },
  { value: "Europe/Rome", label: "Rzym (UTC+1/+2)" },
  { value: "Europe/Amsterdam", label: "Amsterdam (UTC+1/+2)" },
  { value: "Europe/Prague", label: "Praga (UTC+1/+2)" },
  { value: "Europe/Budapest", label: "Budapeszt (UTC+1/+2)" },
  { value: "Europe/Stockholm", label: "Sztokholm (UTC+1/+2)" },
  { value: "Europe/Copenhagen", label: "Kopenhaga (UTC+1/+2)" },
  { value: "Europe/Oslo", label: "Oslo (UTC+1/+2)" },
  { value: "Europe/Helsinki", label: "Helsinki (UTC+2/+3)" },
  { value: "Europe/Athens", label: "Ateny (UTC+2/+3)" },
  { value: "Europe/Istanbul", label: "Stambuł (UTC+3)" },
  { value: "Europe/Moscow", label: "Moskwa (UTC+3)" },
  { value: "America/New_York", label: "Nowy Jork (UTC-5/-4)" },
  { value: "America/Chicago", label: "Chicago (UTC-6/-5)" },
  { value: "America/Denver", label: "Denver (UTC-7/-6)" },
  { value: "America/Los_Angeles", label: "Los Angeles (UTC-8/-7)" },
  { value: "America/Toronto", label: "Toronto (UTC-5/-4)" },
  { value: "America/Sao_Paulo", label: "São Paulo (UTC-3)" },
  { value: "Asia/Tokyo", label: "Tokio (UTC+9)" },
  { value: "Asia/Shanghai", label: "Szanghaj (UTC+8)" },
  { value: "Asia/Hong_Kong", label: "Hongkong (UTC+8)" },
  { value: "Asia/Singapore", label: "Singapur (UTC+8)" },
  { value: "Asia/Dubai", label: "Dubaj (UTC+4)" },
  { value: "Asia/Kolkata", label: "Mumbai (UTC+5:30)" },
  { value: "Australia/Sydney", label: "Sydney (UTC+10/+11)" },
  { value: "Australia/Melbourne", label: "Melbourne (UTC+10/+11)" },
  { value: "Pacific/Auckland", label: "Auckland (UTC+12/+13)" },
] as const

/**
 * Get timezone label by value
 */
export function getTimezoneLabel(value: string): string {
  const tz = COMMON_TIMEZONES.find((tz) => tz.value === value)
  return tz ? tz.label : value
}

/**
 * Convert datetime-local string to UTC Date
 * datetime-local always returns date in browser's local timezone
 * JavaScript's Date constructor handles this automatically
 * This function is a wrapper that ensures proper conversion
 */
export function localDateTimeToUTC(dateTimeString: string, userTimezone?: string | null): Date {
  if (!dateTimeString) {
    return new Date()
  }
  
  // datetime-local format: "YYYY-MM-DDTHH:mm"
  // JavaScript's Date constructor interprets this as local time
  // and automatically converts to UTC when stored
  // This is correct behavior - we just need to create the Date object
  return new Date(dateTimeString)
}

/**
 * Convert UTC Date to datetime-local string (in browser's local timezone)
 * datetime-local always uses browser's timezone, so we convert UTC to browser's local timezone
 * This is the reverse of localDateTimeToUTC
 */
export function utcDateToLocalDateTime(date: Date | string, userTimezone?: string | null): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  
  // datetime-local uses browser's local timezone, not user preferences
  // So we format in browser's local timezone (no timeZone option = local)
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, "0")
  const day = String(dateObj.getDate()).padStart(2, "0")
  const hour = String(dateObj.getHours()).padStart(2, "0")
  const minute = String(dateObj.getMinutes()).padStart(2, "0")
  
  return `${year}-${month}-${day}T${hour}:${minute}`
}

