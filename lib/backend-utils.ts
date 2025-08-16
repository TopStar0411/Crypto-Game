export class BackendUtils {
  // Request validation utilities
  static validateGameRequest(body: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!body) {
      errors.push("Request body is required")
      return { isValid: false, errors }
    }

    if (body.playerName && typeof body.playerName !== "string") {
      errors.push("Player name must be a string")
    }

    if (body.playerName && body.playerName.length > 50) {
      errors.push("Player name must be less than 50 characters")
    }

    return { isValid: errors.length === 0, errors }
  }

  // Response formatting utilities
  static formatSuccessResponse<T>(
    data: T,
    message?: string,
  ): {
    success: boolean
    data: T
    message?: string
    timestamp: number
  } {
    return {
      success: true,
      data,
      message,
      timestamp: Date.now(),
    }
  }

  static formatErrorResponse(
    error: string,
    code?: number,
  ): {
    success: boolean
    error: string
    code?: number
    timestamp: number
  } {
    return {
      success: false,
      error,
      code,
      timestamp: Date.now(),
    }
  }

  // Logging utilities
  static logRequest(method: string, url: string, body?: any): void {
    console.log(`[v0] ${method} ${url}`, body ? { body } : "")
  }

  static logResponse(status: number, data: any, duration: number): void {
    console.log(`[v0] Response ${status} (${duration.toFixed(2)}ms)`, { data })
  }

  // Security utilities
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, "") // Remove potential HTML tags
      .trim()
      .substring(0, 100) // Limit length
  }

  static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  }
}
