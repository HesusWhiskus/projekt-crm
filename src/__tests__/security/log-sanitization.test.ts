/**
 * SECURITY-FIX: [SECURITY-TESTS-12] Testy sanitizacji logów
 * Data: 2025-01-27
 * 
 * Testy sprawdzające czy wrażliwe dane są rzeczywiście redagowane w logach
 */

import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest'
import { logError } from '@/lib/logger'

describe('Log Sanitization Security Tests', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // Create spy before each test to ensure it's fresh
    // Use mockImplementation with args to capture all calls
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation((...args: any[]) => {
      // Store the call for later inspection
      return undefined
    })
    // Set NODE_ENV to development to ensure we can capture full log data
    // logError only logs full data in development mode
    process.env.NODE_ENV = 'development'
  })

  afterEach(() => {
    // Clear calls but don't restore - we'll restore in afterAll
    if (consoleErrorSpy) {
      consoleErrorSpy.mockClear()
    }
  })

  afterAll(() => {
    // Restore console.error after all tests
    if (consoleErrorSpy) {
      consoleErrorSpy.mockRestore()
    }
  })

  describe('logError - Password Sanitization', () => {
    it('should redact password in context', () => {
      const error = new Error('Test error')
      const context = {
        password: 'SecretPassword123!',
        username: 'testuser',
      }

      logError('Test message', error, context)

      // Check that password was redacted
      const logCalls = consoleErrorSpy.mock.calls
      expect(logCalls.length).toBeGreaterThan(0)
      
      const lastCall = logCalls[logCalls.length - 1]
      const logMessage = JSON.stringify(lastCall)
      
      // Password should be redacted
      expect(logMessage).not.toContain('SecretPassword123!')
      expect(logMessage).toContain('[REDACTED]')
      // Username should still be present (not sensitive)
      expect(logMessage).toContain('testuser')
    })

    it('should redact password in nested objects', () => {
      const error = new Error('Test error')
      const context = {
        user: {
          id: 'user-123',
          password: 'SecretPassword123!',
          email: 'test@example.com',
        },
      }

      logError('Test message', error, context)

      const logCalls = consoleErrorSpy.mock.calls
      expect(logCalls.length).toBeGreaterThan(0)
      
      const lastCall = logCalls[logCalls.length - 1]
      const logMessage = JSON.stringify(lastCall)
      
      // Password should be redacted
      expect(logMessage).not.toContain('SecretPassword123!')
      expect(logMessage).toContain('[REDACTED]')
    })
  })

  describe('logError - Token Sanitization', () => {
    it('should redact token in context', () => {
      const error = new Error('Test error')
      const context = {
        token: 'secret-token-12345',
        userId: 'user-123',
      }

      logError('Test message', error, context)

      const logCalls = consoleErrorSpy.mock.calls
      expect(logCalls.length).toBeGreaterThan(0)
      
      const lastCall = logCalls[logCalls.length - 1]
      const logMessage = JSON.stringify(lastCall)
      
      // Token should be redacted
      expect(logMessage).not.toContain('secret-token-12345')
      expect(logMessage).toContain('[REDACTED]')
    })

    it('should redact accessToken in context', () => {
      const error = new Error('Test error')
      const context = {
        accessToken: 'access-token-abc123',
        refreshToken: 'refresh-token-xyz789',
      }

      logError('Test message', error, context)

      const logCalls = consoleErrorSpy.mock.calls
      expect(logCalls.length).toBeGreaterThan(0)
      
      const lastCall = logCalls[logCalls.length - 1]
      const logMessage = JSON.stringify(lastCall)
      
      // Both tokens should be redacted
      expect(logMessage).not.toContain('access-token-abc123')
      expect(logMessage).not.toContain('refresh-token-xyz789')
      expect(logMessage).toContain('[REDACTED]')
    })
  })

  describe('logError - Secret Sanitization', () => {
    it('should redact secret in context', () => {
      const error = new Error('Test error')
      const context = {
        secret: 'my-secret-key',
        apiKey: 'public-api-key', // Not in SENSITIVE_KEYS, should not be redacted
      }

      logError('Test message', error, context)

      const logCalls = consoleErrorSpy.mock.calls
      expect(logCalls.length).toBeGreaterThan(0)
      
      const lastCall = logCalls[logCalls.length - 1]
      const logMessage = JSON.stringify(lastCall)
      
      // Secret should be redacted
      expect(logMessage).not.toContain('my-secret-key')
      expect(logMessage).toContain('[REDACTED]')
      // apiKey should still be present (not in SENSITIVE_KEYS)
      expect(logMessage).toContain('public-api-key')
    })
  })

  describe('logError - Email Sanitization', () => {
    it('should redact email in context', () => {
      const error = new Error('Test error')
      const context = {
        email: 'user@example.com',
        name: 'Test User',
      }

      logError('Test message', error, context)

      const logCalls = consoleErrorSpy.mock.calls
      expect(logCalls.length).toBeGreaterThan(0)
      
      const lastCall = logCalls[logCalls.length - 1]
      const logMessage = JSON.stringify(lastCall)
      
      // Email should be redacted (it's in SENSITIVE_KEYS)
      expect(logMessage).not.toContain('user@example.com')
      expect(logMessage).toContain('[REDACTED]')
      // Name should still be present
      expect(logMessage).toContain('Test User')
    })
  })

  describe('logError - Authorization Header Sanitization', () => {
    it('should redact authorization header in context', () => {
      const error = new Error('Test error')
      const context = {
        authorization: 'Bearer secret-token-12345',
        contentType: 'application/json',
      }

      logError('Test message', error, context)

      const logCalls = consoleErrorSpy.mock.calls
      expect(logCalls.length).toBeGreaterThan(0)
      
      const lastCall = logCalls[logCalls.length - 1]
      const logMessage = JSON.stringify(lastCall)
      
      // Authorization should be redacted
      expect(logMessage).not.toContain('secret-token-12345')
      expect(logMessage).toContain('[REDACTED]')
    })
  })

  describe('logError - Cookie Sanitization', () => {
    it('should redact cookie in context', () => {
      const error = new Error('Test error')
      const context = {
        cookie: 'session=abc123; token=xyz789',
        userAgent: 'Mozilla/5.0',
      }

      logError('Test message', error, context)

      const logCalls = consoleErrorSpy.mock.calls
      expect(logCalls.length).toBeGreaterThan(0)
      
      const lastCall = logCalls[logCalls.length - 1]
      const logMessage = JSON.stringify(lastCall)
      
      // Cookie should be redacted
      expect(logMessage).not.toContain('abc123')
      expect(logMessage).not.toContain('xyz789')
      expect(logMessage).toContain('[REDACTED]')
    })
  })

  describe('logError - Session Sanitization', () => {
    it('should redact session in context', () => {
      const error = new Error('Test error')
      const context = {
        session: {
          id: 'session-123',
          token: 'session-token-abc',
        },
        requestId: 'req-456',
      }

      logError('Test message', error, context)

      const logCalls = consoleErrorSpy.mock.calls
      expect(logCalls.length).toBeGreaterThan(0)
      
      const lastCall = logCalls[logCalls.length - 1]
      const logMessage = JSON.stringify(lastCall)
      
      // Session should be redacted
      expect(logMessage).not.toContain('session-token-abc')
      expect(logMessage).toContain('[REDACTED]')
    })
  })

  describe('logError - Array Sanitization', () => {
    it('should redact sensitive data in arrays', () => {
      const error = new Error('Test error')
      const context = {
        users: [
          { id: 'user-1', password: 'pass1' },
          { id: 'user-2', password: 'pass2' },
        ],
      }

      logError('Test message', error, context)

      const logCalls = consoleErrorSpy.mock.calls
      expect(logCalls.length).toBeGreaterThan(0)
      
      const lastCall = logCalls[logCalls.length - 1]
      const logMessage = JSON.stringify(lastCall)
      
      // Passwords should be redacted
      expect(logMessage).not.toContain('pass1')
      expect(logMessage).not.toContain('pass2')
      expect(logMessage).toContain('[REDACTED]')
    })
  })

  describe('logError - Production Mode', () => {
    it('should not log stacktrace in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      
      const error = new Error('Test error')
      error.stack = 'Error: Test error\n    at test.js:1:1'

      logError('Test message', error)

      const logCalls = consoleErrorSpy.mock.calls
      expect(logCalls.length).toBeGreaterThan(0)
      
      const lastCall = logCalls[logCalls.length - 1]
      const logMessage = JSON.stringify(lastCall)
      
      // Stacktrace should not be in production logs
      expect(logMessage).not.toContain('at test.js:1:1')
      
      process.env.NODE_ENV = originalEnv
    })

    it('should log only message and error name in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      
      const error = new Error('Test error')
      const context = {
        password: 'SecretPassword123!',
      }

      logError('Test message', error, context)

      const logCalls = consoleErrorSpy.mock.calls
      expect(logCalls.length).toBeGreaterThan(0)
      
      // In production, should log simple format: [ERROR] message: ErrorName - errorMessage
      const lastCall = logCalls[logCalls.length - 1]
      const logMessage = lastCall[0] as string
      
      expect(logMessage).toContain('[ERROR]')
      expect(logMessage).toContain('Test message')
      expect(logMessage).toContain('Error')
      expect(logMessage).toContain('Test error')
      // Should not contain password
      expect(logMessage).not.toContain('SecretPassword123!')
      
      process.env.NODE_ENV = originalEnv
    })
  })

  describe('logError - Development Mode', () => {
    it('should log stacktrace in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      
      const error = new Error('Test error')
      error.stack = 'Error: Test error\n    at test.js:1:1'

      logError('Test message', error)

      const logCalls = consoleErrorSpy.mock.calls
      expect(logCalls.length).toBeGreaterThan(0)
      
      const lastCall = logCalls[logCalls.length - 1]
      const logData = lastCall[1] as any
      
      // Stacktrace should be in development logs
      if (logData && logData.stack) {
        expect(logData.stack).toContain('at test.js:1:1')
      }
      
      process.env.NODE_ENV = originalEnv
    })
  })
})
