import { z } from 'zod'

/**
 * Validates phone number format
 * Accepts: digits, spaces, dashes, plus, parentheses
 * Examples: +48 123 456 789, (123) 456-7890, 123-456-7890
 */
export const phoneSchema = z
  .string()
  .max(50, 'Numer telefonu jest zbyt długi (max 50 znaków)')
  .refine(
    (val) => {
      if (!val || val.trim() === '') return true // Optional field
      // Remove common phone formatting characters
      const digitsOnly = val.replace(/[\s\-\(\)\+]/g, '')
      // Check if contains only digits (after removing formatting)
      return /^\d{7,15}$/.test(digitsOnly)
    },
    {
      message: 'Nieprawidłowy format numeru telefonu. Użyj cyfr, spacji, myślników lub nawiasów.',
    }
  )
  .transform((val) => val?.trim() || null)
  .nullable()
  .optional()

/**
 * Validates website URL
 * More flexible than strict URL validation
 */
export const websiteSchema = z
  .string()
  .max(500, 'URL jest zbyt długi (max 500 znaków)')
  .refine(
    (val) => {
      if (!val || val.trim() === '') return true // Optional field
      const trimmed = val.trim()
      // Allow URLs with or without protocol
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
      return urlPattern.test(trimmed)
    },
    {
      message: 'Nieprawidłowy format URL. Użyj pełnego adresu (np. https://example.com)',
    }
  )
  .transform((val) => {
    if (!val || val.trim() === '') return null
    const trimmed = val.trim()
    // Add https:// if no protocol specified
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return `https://${trimmed}`
    }
    return trimmed
  })
  .nullable()
  .optional()

/**
 * Validates email with better error handling
 */
export const emailSchema = z
  .string()
  .max(255, 'Email jest zbyt długi (max 255 znaków)')
  .email('Nieprawidłowy format adresu email')
  .transform((val) => val?.trim().toLowerCase() || null)
  .nullable()
  .optional()
  .or(z.literal(''))

/**
 * Validates text fields with length limits
 */
export const textFieldSchema = (maxLength: number = 500, fieldName: string = 'Pole') =>
  z
    .string()
    .max(maxLength, `${fieldName} jest zbyt długie (max ${maxLength} znaków)`)
    .transform((val) => val?.trim() || null)
    .nullable()
    .optional()

/**
 * Validates name fields (first name, last name, etc.)
 */
export const nameSchema = (fieldName: string = 'Imię', minLength: number = 1, maxLength: number = 100) =>
  z
    .string()
    .min(minLength, `${fieldName} jest wymagane`)
    .max(maxLength, `${fieldName} jest zbyt długie (max ${maxLength} znaków)`)
    .regex(
      /^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s\-'\.]+$/,
      `${fieldName} może zawierać tylko litery, spacje, myślniki i apostrofy`
    )
    .transform((val) => val.trim())

/**
 * Validates agency name (more flexible than name)
 */
export const agencyNameSchema = z
  .string()
  .max(200, 'Nazwa agencji jest zbyt długa (max 200 znaków)')
  .transform((val) => val?.trim() || null)
  .nullable()
  .optional()
  .or(z.literal(''))

