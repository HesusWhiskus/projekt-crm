import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { PrismaClient } from '@prisma/client'

// Setup test environment
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test'
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL || ''
  process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'test-secret-key-min-32-chars-long'
  process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'
})

afterAll(async () => {
  // Cleanup after all tests
})

beforeEach(async () => {
  // Setup before each test
})

afterEach(async () => {
  // Cleanup after each test
})

