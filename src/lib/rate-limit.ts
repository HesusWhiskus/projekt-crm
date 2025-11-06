import { LRUCache } from 'lru-cache'

// Rate limit cache - stores IP addresses and their request counts
const rateLimit = new LRUCache<string, number>({
  max: 500, // Max 500 unique IPs
  ttl: 60000, // 1 minute default TTL
})

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

export interface RateLimitOptions {
  interval: number // Time window in ms
  uniqueTokenPerInterval: number // Max requests per interval
}

/**
 * Rate limiter function
 * @param options Rate limit configuration
 * @returns Function that checks rate limit for a request
 */
export function rateLimiter(options: RateLimitOptions) {
  return async (req: Request): Promise<RateLimitResult> => {
    // Get identifier (IP address)
    const identifier = 
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      req.headers.get('cf-connecting-ip') || // Cloudflare
      'anonymous'
    
    const key = `${identifier}:${options.interval}`
    const count = (rateLimit.get(key) as number) || 0
    
    if (count >= options.uniqueTokenPerInterval) {
      return {
        success: false,
        limit: options.uniqueTokenPerInterval,
        remaining: 0,
        reset: Date.now() + options.interval,
      }
    }
    
    // Increment count
    rateLimit.set(key, count + 1, { ttl: options.interval })
    
    return {
      success: true,
      limit: options.uniqueTokenPerInterval,
      remaining: options.uniqueTokenPerInterval - (count + 1),
      reset: Date.now() + options.interval,
    }
  }
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const rateLimiters = {
  // Strict rate limiter for authentication endpoints
  auth: rateLimiter({
    interval: 15 * 60 * 1000, // 15 minutes
    uniqueTokenPerInterval: 5, // 5 requests per 15 minutes
  }),
  
  // Moderate rate limiter for API endpoints
  api: rateLimiter({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 60, // 60 requests per minute
  }),
  
  // Lenient rate limiter for general endpoints
  general: rateLimiter({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 100, // 100 requests per minute
  }),
}

