import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { PrismaClient } from '@prisma/client'

// Setup test environment
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test'
  // Only set DATABASE_URL if it's actually available (not localhost:5432)
  const dbUrl = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL
  if (dbUrl && !dbUrl.includes('localhost:5432')) {
    process.env.DATABASE_URL = dbUrl
  }
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







