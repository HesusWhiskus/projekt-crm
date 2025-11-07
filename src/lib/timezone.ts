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

