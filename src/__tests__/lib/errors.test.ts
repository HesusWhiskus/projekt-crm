/**
 * Testy jednostkowe dla custom Error classes
 * Data: 2025-12-05
 */

import { describe, it, expect } from 'vitest'
import {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  ExternalServiceError,
  LimitExceededError,
  isCustomError,
  getHttpStatusCode,
} from '@/lib/errors'

describe('Custom Error Classes', () => {
  describe('ValidationError', () => {
    it('should create error with message', () => {
      const error = new ValidationError('Invalid input')
      expect(error.message).toBe('Invalid input')
      expect(error.name).toBe('ValidationError')
      expect(error).toBeInstanceOf(Error)
    })

    it('should create error with field', () => {
      const error = new ValidationError('Invalid input', 'email')
      expect(error.field).toBe('email')
    })
  })

  describe('NotFoundError', () => {
    it('should create error without id', () => {
      const error = new NotFoundError('User')
      expect(error.message).toBe('User not found')
      expect(error.name).toBe('NotFoundError')
    })

    it('should create error with id', () => {
      const error = new NotFoundError('User', '123')
      expect(error.message).toBe('User with id 123 not found')
    })
  })

  describe('UnauthorizedError', () => {
    it('should create error with default message', () => {
      const error = new UnauthorizedError()
      expect(error.message).toBe('Unauthorized')
      expect(error.name).toBe('UnauthorizedError')
    })

    it('should create error with custom message', () => {
      const error = new UnauthorizedError('Custom message')
      expect(error.message).toBe('Custom message')
    })
  })

  describe('ForbiddenError', () => {
    it('should create error with default message', () => {
      const error = new ForbiddenError()
      expect(error.message).toBe('Forbidden')
      expect(error.name).toBe('ForbiddenError')
    })

    it('should create error with custom message', () => {
      const error = new ForbiddenError('Custom message')
      expect(error.message).toBe('Custom message')
    })
  })

  describe('ConflictError', () => {
    it('should create error with message', () => {
      const error = new ConflictError('Resource already exists')
      expect(error.message).toBe('Resource already exists')
      expect(error.name).toBe('ConflictError')
    })
  })

  describe('ExternalServiceError', () => {
    it('should create error with message', () => {
      const error = new ExternalServiceError('Service unavailable')
      expect(error.message).toBe('Service unavailable')
      expect(error.name).toBe('ExternalServiceError')
    })

    it('should create error with service name', () => {
      const error = new ExternalServiceError('Service unavailable', 'Database')
      expect(error.service).toBe('Database')
    })

    it('should create error with original error', () => {
      const originalError = new Error('Original error')
      const error = new ExternalServiceError('Service unavailable', 'Database', originalError)
      expect(error.originalError).toBe(originalError)
    })
  })

  describe('LimitExceededError', () => {
    it('should create error with message', () => {
      const error = new LimitExceededError('Rate limit exceeded')
      expect(error.message).toBe('Rate limit exceeded')
      expect(error.name).toBe('LimitExceededError')
    })

    it('should create error with limit type', () => {
      const error = new LimitExceededError('Rate limit exceeded', 'rate')
      expect(error.limitType).toBe('rate')
    })
  })

  describe('isCustomError', () => {
    it('should return true for custom errors', () => {
      expect(isCustomError(new ValidationError('test'))).toBe(true)
      expect(isCustomError(new NotFoundError('User'))).toBe(true)
      expect(isCustomError(new UnauthorizedError())).toBe(true)
    })

    it('should return true for standard Error', () => {
      expect(isCustomError(new Error('test'))).toBe(true)
    })

    it('should return false for non-Error values', () => {
      expect(isCustomError('string')).toBe(false)
      expect(isCustomError(123)).toBe(false)
      expect(isCustomError(null)).toBe(false)
      expect(isCustomError(undefined)).toBe(false)
      expect(isCustomError({})).toBe(false)
    })
  })

  describe('getHttpStatusCode', () => {
    it('should return 400 for ValidationError', () => {
      expect(getHttpStatusCode(new ValidationError('test'))).toBe(400)
    })

    it('should return 401 for UnauthorizedError', () => {
      expect(getHttpStatusCode(new UnauthorizedError())).toBe(401)
    })

    it('should return 403 for ForbiddenError', () => {
      expect(getHttpStatusCode(new ForbiddenError())).toBe(403)
    })

    it('should return 404 for NotFoundError', () => {
      expect(getHttpStatusCode(new NotFoundError('User'))).toBe(404)
    })

    it('should return 409 for ConflictError', () => {
      expect(getHttpStatusCode(new ConflictError('test'))).toBe(409)
    })

    it('should return 429 for LimitExceededError', () => {
      expect(getHttpStatusCode(new LimitExceededError('test'))).toBe(429)
    })

    it('should return 502 for ExternalServiceError', () => {
      expect(getHttpStatusCode(new ExternalServiceError('test'))).toBe(502)
    })

    it('should return 500 for unknown errors', () => {
      expect(getHttpStatusCode(new Error('test'))).toBe(500)
      expect(getHttpStatusCode('string')).toBe(500)
      expect(getHttpStatusCode(null)).toBe(500)
    })
  })
})

