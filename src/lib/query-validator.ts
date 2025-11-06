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
  assignedTo: z.string().uuid('Nieprawidłowy format ID użytkownika').optional(),
})

/**
 * Schema for validating contact query parameters
 */
export const contactQuerySchema = z.object({
  clientId: z.string().uuid('Nieprawidłowy format ID klienta').optional(),
  type: z.enum([
    'PHONE_CALL',
    'MEETING',
    'EMAIL',
    'LINKEDIN_MESSAGE',
    'OTHER',
  ]).optional(),
  userId: z.string().uuid('Nieprawidłowy format ID użytkownika').optional(),
})

/**
 * Schema for validating task query parameters
 */
export const taskQuerySchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED']).optional(),
  assignedTo: z.string().uuid('Nieprawidłowy format ID użytkownika').optional(),
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
  for (const [key, value] of searchParams.entries()) {
    params[key] = value
  }
  
  return schema.parse(params)
}

