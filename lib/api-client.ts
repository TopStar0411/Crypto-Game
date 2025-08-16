export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export class ApiClient {
  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage: string

      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.error || errorJson.message || "An error occurred"
      } catch {
        errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`
      }

      throw new ApiError(response.status, errorMessage)
    }

    return response.json()
  }

  static async createGame(playerName: string) {
    const response = await fetch("/api/game/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName }),
    })

    return this.handleResponse(response)
  }

  static async getGameState(gameId: string) {
    const response = await fetch(`/api/game/${gameId}`)
    return this.handleResponse(response)
  }

  static async playTurn(gameId: string, cardId: string) {
    const response = await fetch(`/api/game/${gameId}/play`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId }),
    })

    return this.handleResponse(response)
  }

  static async restartGame(gameId: string) {
    const response = await fetch(`/api/game/${gameId}/restart`, {
      method: "POST",
    })

    return this.handleResponse(response)
  }

  static async getCurrentCrypto() {
    const response = await fetch("/api/crypto/current")
    return this.handleResponse(response)
  }

  static async getCryptoPairs() {
    const response = await fetch("/api/crypto/pairs")
    return this.handleResponse(response)
  }
}
