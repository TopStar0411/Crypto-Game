export interface RequestContext {
  requestId: string
  timestamp: number
  userAgent?: string
  ip?: string
}

export class RequestLogger {
  static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  static logRequest(context: RequestContext, method: string, path: string, body?: any) {
    console.log(`[${context.requestId}] ${method} ${path} - ${new Date(context.timestamp).toISOString()}`)
    if (body) {
      console.log(`[${context.requestId}] Request body:`, JSON.stringify(body, null, 2))
    }
  }

  static logResponse(context: RequestContext, status: number, responseTime: number, data?: any) {
    console.log(`[${context.requestId}] Response: ${status} - ${responseTime}ms`)
    if (data && process.env.NODE_ENV === "development") {
      console.log(`[${context.requestId}] Response data:`, JSON.stringify(data, null, 2))
    }
  }

  static logError(context: RequestContext, error: Error) {
    console.error(`[${context.requestId}] ERROR:`, {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    })
  }
}

export class ValidationService {
  static validatePlayerName(name: string): { valid: boolean; error?: string } {
    if (!name || typeof name !== "string") {
      return { valid: false, error: "Player name is required and must be a string" }
    }

    const trimmed = name.trim()
    if (trimmed.length === 0) {
      return { valid: false, error: "Player name cannot be empty" }
    }

    if (trimmed.length > 50) {
      return { valid: false, error: "Player name must be 50 characters or less" }
    }

    if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmed)) {
      return { valid: false, error: "Player name can only contain letters, numbers, spaces, hyphens, and underscores" }
    }

    return { valid: true }
  }

  static validateGameId(gameId: string): { valid: boolean; error?: string } {
    if (!gameId || typeof gameId !== "string") {
      return { valid: false, error: "Game ID is required" }
    }

    if (!/^[a-z0-9]{10,15}$/.test(gameId)) {
      return { valid: false, error: "Invalid game ID format" }
    }

    return { valid: true }
  }

  static validateCardId(cardId: string): { valid: boolean; error?: string } {
    if (!cardId || typeof cardId !== "string") {
      return { valid: false, error: "Card ID is required" }
    }

    const validCardIds = ["fire-strike", "ice-shard", "shield-wall", "poison-dart", "berserker-rage", "healing-potion"]

    if (!validCardIds.includes(cardId)) {
      return { valid: false, error: "Invalid card ID" }
    }

    return { valid: true }
  }
}
