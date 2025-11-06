import { z } from 'zod'
import { ClientStatus, ContactType, TaskStatus } from '@prisma/client'

/**
 * Schema for validating client query parameters
 */
export const clientQuerySchema = z.object({
  status: z.enum([
    'NEW_LEAD',
    'IN_CONTACT',
    'DEMO_SENT',
    'NEGOTIATION',
    'ACTIVE_CLIENT',
    'LOST',
  ]).optional(),
  search: z.string().max(100, 'Wyszukiwanie jest zbyt długie (max 100 znaków)').optional(),
  assignedTo: z.string().min(1, 'Nieprawidłowy format ID użytkownika').optional().or(z.literal("")), // CUID format, not UUID
  noContactDays: z.string().optional(), // Number of days as string, will be converted to number
  followUpToday: z.string().optional(), // Boolean as string "true"/"false"
})

/**
 * Schema for validating contact query parameters
 */
export const contactQuerySchema = z.object({
  clientId: z.string().min(1, 'Nieprawidłowy format ID klienta').optional().or(z.literal("")), // CUID format, not UUID
  type: z.enum([
    'PHONE_CALL',
    'MEETING',
    'EMAIL',
    'LINKEDIN_MESSAGE',
    'OTHER',
  ]).optional(),
  userId: z.string().min(1, 'Nieprawidłowy format ID użytkownika').optional().or(z.literal("")), // CUID format, not UUID
})

/**
 * Schema for validating task query parameters
 */
export const taskQuerySchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED']).optional(),
  assignedTo: z.string().min(1, 'Nieprawidłowy format ID użytkownika').optional().or(z.literal("")), // CUID format, not UUID
})

/**
 * Schema for validating UUID path parameters
 */
export const uuidSchema = z.string().uuid('Nieprawidłowy format ID')

/**
 * Validates query parameters and returns sanitized object
 */
export function validateQueryParams<T extends z.ZodTypeAny>(
  schema: T,
  searchParams: URLSearchParams
): z.infer<T> {
  const params: Record<string, string | undefined> = {}
  
  // Extract all parameters from searchParams
  // Convert empty strings to undefined for optional fields
  for (const [key, value] of searchParams.entries()) {
    params[key] = value === "" ? undefined : value
  }
  
  return schema.parse(params)
}

