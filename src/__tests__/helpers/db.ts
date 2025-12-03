import { PrismaClient } from '@prisma/client'

/**
 * Creates a test database client
 * Uses DATABASE_URL_TEST if available, otherwise falls back to DATABASE_URL
 */
export function createTestDb(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL or DATABASE_URL_TEST must be set for tests')
  }

  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: process.env.DEBUG ? ['query', 'error', 'warn'] : ['error'],
  })
}

/**
 * Cleans up test data from database
 */
export async function cleanupTestData(db: PrismaClient): Promise<void> {
  // Delete in reverse order of dependencies
  await db.contact.deleteMany({
    where: {
      // Add test data markers if needed
    },
  })
  
  await db.task.deleteMany({
    where: {
      // Add test data markers if needed
    },
  })

  await db.client.deleteMany({
    where: {
      // Add test data markers if needed
    },
  })

  await db.user.deleteMany({
    where: {
      email: {
        contains: 'test-',
      },
    },
  })
}

/**
 * Seeds test data for a specific test
 */
export async function seedTestData(db: PrismaClient, data: {
  users?: Array<{
    email: string
    password: string
    role: 'ADMIN' | 'USER'
    name: string
  }>
  clients?: Array<{
    name: string
    email?: string
    assignedTo?: string
  }>
}) {
  const created: { users: string[]; clients: string[] } = {
    users: [],
    clients: [],
  }

  if (data.users) {
    for (const userData of data.users) {
      const user = await db.user.create({
        data: userData,
      })
      created.users.push(user.id)
    }
  }

  if (data.clients) {
    for (const clientData of data.clients) {
      const client = await db.client.create({
        data: clientData,
      })
      created.clients.push(client.id)
    }
  }

  return created
}







