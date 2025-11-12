import { unstable_cache } from 'next/cache'
import { db } from '@/lib/db'

/**
 * Cached function to get all users
 * Cache revalidates every 60 seconds (dev) or 300 seconds (production)
 * Note: This will only execute at runtime, not during build
 */
export const getCachedUsers = unstable_cache(
  async () => {
    // Skip if no database connection (during build)
    if (!process.env.DATABASE_URL) {
      return []
    }
    try {
      return await db.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
        },
        orderBy: {
          name: 'asc',
        },
      })
    } catch (error) {
      // During build, database might not be available
      console.warn('getCachedUsers: Database not available, returning empty array')
      return []
    }
  },
  ['users'],
  {
    revalidate: process.env.NODE_ENV === 'production' ? 300 : 60, // 5 min prod, 1 min dev
    tags: ['users'],
  }
)

/**
 * Cached function to get all groups
 * Cache revalidates every 60 seconds (dev) or 300 seconds (production)
 * Note: This will only execute at runtime, not during build
 */
export const getCachedGroups = unstable_cache(
  async () => {
    // Skip if no database connection (during build)
    if (!process.env.DATABASE_URL) {
      return []
    }
    try {
      return await db.group.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: 'asc',
        },
      })
    } catch (error) {
      // During build, database might not be available
      console.warn('getCachedGroups: Database not available, returning empty array')
      return []
    }
  },
  ['groups'],
  {
    revalidate: process.env.NODE_ENV === 'production' ? 300 : 60, // 5 min prod, 1 min dev
    tags: ['groups'],
  }
)

