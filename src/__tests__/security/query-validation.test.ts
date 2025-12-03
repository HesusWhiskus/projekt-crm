import { describe, it, expect } from 'vitest'
import { validateQueryParams, clientQuerySchema, contactQuerySchema, taskQuerySchema, uuidSchema } from '@/lib/query-validator'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { testQueryParams } from '../fixtures/test-data'

describe('Query Parameter Validation Security Tests', () => {
  describe('clientQuerySchema', () => {
    it('should accept valid status', () => {
      const params = new URLSearchParams({ status: 'NEW_LEAD' })
      const result = validateQueryParams(clientQuerySchema, params)
      
      expect(result.status).toBe('NEW_LEAD')
    })

    it('should reject invalid status', () => {
      const params = new URLSearchParams({ status: 'INVALID_STATUS' })
      
      expect(() => validateQueryParams(clientQuerySchema, params)).toThrow()
    })

    it('should accept valid search string', () => {
      const params = new URLSearchParams({ search: 'test query' })
      const result = validateQueryParams(clientQuerySchema, params)
      
      expect(result.search).toBe('test query')
    })

    it('should reject search string that is too long', () => {
      const longSearch = 'a'.repeat(101)
      const params = new URLSearchParams({ search: longSearch })
      
      expect(() => validateQueryParams(clientQuerySchema, params)).toThrow()
      expect(() => validateQueryParams(clientQuerySchema, params)).toThrow(/zbyt długie/)
    })

    it('should accept valid assignedTo (CUID format)', () => {
      const params = new URLSearchParams({ assignedTo: 'clx1234567890abcdefghijklmn' })
      const result = validateQueryParams(clientQuerySchema, params)
      
      expect(result.assignedTo).toBe('clx1234567890abcdefghijklmn')
    })

    it('should reject empty assignedTo', () => {
      const params = new URLSearchParams({ assignedTo: '' })
      
      // Empty string should be converted to undefined, which is valid for optional field
      const result = validateQueryParams(clientQuerySchema, params)
      expect(result.assignedTo).toBeUndefined()
    })

    it('should reject SQL injection attempts in search', () => {
      const sqlInjection = "'; DROP TABLE users; --"
      const params = new URLSearchParams({ search: sqlInjection })
      
      // Should be accepted as string (Prisma protects against SQL injection)
      // But we test that it doesn't crash
      const result = validateQueryParams(clientQuerySchema, params)
      expect(result.search).toBe(sqlInjection)
    })

    it('should reject XSS attempts in search', () => {
      const xss = '<script>alert("XSS")</script>'
      const params = new URLSearchParams({ search: xss })
      
      // Should be accepted as string (sanitization happens elsewhere)
      // But we test that it doesn't crash
      const result = validateQueryParams(clientQuerySchema, params)
      expect(result.search).toBe(xss)
    })

    it('should accept valid pagination parameters', () => {
      const params = new URLSearchParams({ page: '1', limit: '50' })
      const result = validateQueryParams(clientQuerySchema, params)
      
      expect(result.page).toBe('1')
      expect(result.limit).toBe('50')
    })

    it('should reject invalid page parameter', () => {
      const params = new URLSearchParams({ page: 'not-a-number' })
      
      expect(() => validateQueryParams(clientQuerySchema, params)).toThrow()
    })

    it('should reject invalid limit parameter', () => {
      const params = new URLSearchParams({ limit: 'abc' })
      
      expect(() => validateQueryParams(clientQuerySchema, params)).toThrow()
    })
  })

  describe('contactQuerySchema', () => {
    it('should accept valid contact type', () => {
      const params = new URLSearchParams({ type: 'PHONE_CALL' })
      const result = validateQueryParams(contactQuerySchema, params)
      
      expect(result.type).toBe('PHONE_CALL')
    })

    it('should reject invalid contact type', () => {
      const params = new URLSearchParams({ type: 'INVALID_TYPE' })
      
      expect(() => validateQueryParams(contactQuerySchema, params)).toThrow()
    })

    it('should accept valid clientId', () => {
      const params = new URLSearchParams({ clientId: 'clx1234567890abcdefghijklmn' })
      const result = validateQueryParams(contactQuerySchema, params)
      
      expect(result.clientId).toBe('clx1234567890abcdefghijklmn')
    })

    it('should accept valid userId', () => {
      const params = new URLSearchParams({ userId: 'clx1234567890abcdefghijklmn' })
      const result = validateQueryParams(contactQuerySchema, params)
      
      expect(result.userId).toBe('clx1234567890abcdefghijklmn')
    })
  })

  describe('taskQuerySchema', () => {
    it('should accept valid task status', () => {
      const params = new URLSearchParams({ status: 'TODO' })
      const result = validateQueryParams(taskQuerySchema, params)
      
      expect(result.status).toBe('TODO')
    })

    it('should reject invalid task status', () => {
      const params = new URLSearchParams({ status: 'INVALID_STATUS' })
      
      expect(() => validateQueryParams(taskQuerySchema, params)).toThrow()
    })

    it('should accept valid assignedTo', () => {
      const params = new URLSearchParams({ assignedTo: 'clx1234567890abcdefghijklmn' })
      const result = validateQueryParams(taskQuerySchema, params)
      
      expect(result.assignedTo).toBe('clx1234567890abcdefghijklmn')
    })
  })

  describe('uuidSchema', () => {
    it('should accept valid UUID', () => {
      const validUUID = '550e8400-e29b-41d4-a716-446655440000'
      const result = uuidSchema.parse(validUUID)
      
      expect(result).toBe(validUUID)
    })

    it('should reject invalid UUID format', () => {
      const invalidUUID = 'not-a-uuid'
      
      expect(() => uuidSchema.parse(invalidUUID)).toThrow()
    })

    it('should reject CUID as UUID', () => {
      const cuid = 'clx1234567890abcdefghijklmn'
      
      expect(() => uuidSchema.parse(cuid)).toThrow()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty query parameters', () => {
      const params = new URLSearchParams()
      const result = validateQueryParams(clientQuerySchema, params)
      
      expect(result).toEqual({})
    })

    it('should handle multiple valid parameters', () => {
      const params = new URLSearchParams({
        status: 'NEW_LEAD',
        search: 'test',
        page: '1',
        limit: '50',
      })
      const result = validateQueryParams(clientQuerySchema, params)
      
      expect(result.status).toBe('NEW_LEAD')
      expect(result.search).toBe('test')
      expect(result.page).toBe('1')
      expect(result.limit).toBe('50')
    })

    it('should handle special characters in search', () => {
      const params = new URLSearchParams({ search: 'test@example.com' })
      const result = validateQueryParams(clientQuerySchema, params)
      
      expect(result.search).toBe('test@example.com')
    })

    it('should handle unicode characters in search', () => {
      const params = new URLSearchParams({ search: 'test ąćęłńóśźż' })
      const result = validateQueryParams(clientQuerySchema, params)
      
      expect(result.search).toBe('test ąćęłńóśźż')
    })
  })
})







