import { unstable_cache } from 'next/cache'
import { db } from '@/lib/db'

/**
 * Cached function to get all users
 * Cache revalidates every 60 seconds (dev) or 300 seconds (production)
 */
export const getCachedUsers = unstable_cache(
  async () => {
    return db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: 'asc',
      },
    })
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
 */
export const getCachedGroups = unstable_cache(
  async () => {
    return db.group.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    })
  },
  ['groups'],
  {
    revalidate: process.env.NODE_ENV === 'production' ? 300 : 60, // 5 min prod, 1 min dev
    tags: ['groups'],
  }
)

