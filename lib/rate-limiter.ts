export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
}

export interface RateLimitInfo {
  allowed: boolean
  remaining: number
  resetTime: number
}

export class RateLimiter {
  private static requests: Map<string, number[]> = new Map()

  private static readonly configs: Record<string, RateLimitConfig> = {
    "create-game": { windowMs: 60000, maxRequests: 10 }, // 10 games per minute
    "play-turn": { windowMs: 10000, maxRequests: 20 }, // 20 turns per 10 seconds
    "crypto-data": { windowMs: 30000, maxRequests: 100 }, // 100 crypto requests per 30 seconds
    default: { windowMs: 60000, maxRequests: 100 }, // Default limit
  }

  static checkRateLimit(identifier: string, endpoint: string): RateLimitInfo {
    const config = this.configs[endpoint] || this.configs.default
    const now = Date.now()
    const windowStart = now - config.windowMs

    // Get or create request history for this identifier
    let requestTimes = this.requests.get(identifier) || []

    // Remove old requests outside the window
    requestTimes = requestTimes.filter((time) => time > windowStart)

    // Check if limit exceeded
    const allowed = requestTimes.length < config.maxRequests

    if (allowed) {
      // Add current request
      requestTimes.push(now)
      this.requests.set(identifier, requestTimes)
    }

    return {
      allowed,
      remaining: Math.max(0, config.maxRequests - requestTimes.length),
      resetTime: windowStart + config.windowMs,
    }
  }

  static cleanup() {
    // Clean up old entries to prevent memory leaks
    const cutoff = Date.now() - Math.max(...Object.values(this.configs).map((c) => c.windowMs))

    for (const [identifier, times] of this.requests.entries()) {
      const validTimes = times.filter((time) => time > cutoff)
      if (validTimes.length === 0) {
        this.requests.delete(identifier)
      } else {
        this.requests.set(identifier, validTimes)
      }
    }
  }
}

// Clean up rate limiter every 5 minutes
setInterval(() => RateLimiter.cleanup(), 5 * 60 * 1000)
