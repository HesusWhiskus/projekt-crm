/**
 * Utility functions for parsing dates from Next.js serialized props
 * Next.js serializes Date objects as ISO strings when passing props from server to client components
 */

/**
 * Safely parse a date that can be either a Date object or ISO string
 * @param date - Date object or ISO string
 * @returns Date object
 */
export function parseDate(date: Date | string): Date {
  if (date instanceof Date) {
    return date
  }
  if (typeof date === 'string') {
    const parsed = new Date(date)
    if (isNaN(parsed.getTime())) {
      throw new Error(`Invalid date string: ${date}`)
    }
    return parsed
  }
  throw new Error(`Invalid date type: ${typeof date}`)
}

/**
 * Safely parse an optional date that can be Date, string, or null
 * @param date - Date object, ISO string, or null
 * @returns Date object or null
 */
export function parseOptionalDate(date: Date | string | null | undefined): Date | null {
  if (date === null || date === undefined) {
    return null
  }
  return parseDate(date)
}

