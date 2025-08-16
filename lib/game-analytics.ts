export interface GameMetrics {
  totalGames: number
  activeGames: number
  completedGames: number
  averageGameDuration: number
  popularCards: Record<string, number>
  winRates: {
    player: number
    opponent: number
  }
}

export interface GameEvent {
  type: "game_created" | "turn_played" | "game_finished" | "card_used"
  gameId: string
  timestamp: number
  data: any
}

export class GameAnalytics {
  private static events: GameEvent[] = []
  private static readonly MAX_EVENTS = 1000 // Keep last 1000 events in memory

  static recordEvent(event: Omit<GameEvent, "timestamp">) {
    const fullEvent: GameEvent = {
      ...event,
      timestamp: Date.now(),
    }

    this.events.push(fullEvent)

    // Keep only recent events to prevent memory issues
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS)
    }

    console.log(`[ANALYTICS] ${event.type}:`, event.data)
  }

  static getMetrics(): GameMetrics {
    const gameCreatedEvents = this.events.filter((e) => e.type === "game_created")
    const gameFinishedEvents = this.events.filter((e) => e.type === "game_finished")
    const cardUsedEvents = this.events.filter((e) => e.type === "card_used")

    // Calculate popular cards
    const cardUsage: Record<string, number> = {}
    cardUsedEvents.forEach((event) => {
      const cardId = event.data.cardId
      cardUsage[cardId] = (cardUsage[cardId] || 0) + 1
    })

    // Calculate win rates
    const playerWins = gameFinishedEvents.filter((e) => e.data.winner === "player").length
    const opponentWins = gameFinishedEvents.filter((e) => e.data.winner === "opponent").length
    const totalFinished = gameFinishedEvents.length

    // Calculate average game duration
    const gameDurations = gameFinishedEvents
      .map((finishEvent) => {
        const startEvent = gameCreatedEvents.find((e) => e.gameId === finishEvent.gameId)
        return startEvent ? finishEvent.timestamp - startEvent.timestamp : 0
      })
      .filter((duration) => duration > 0)

    const averageGameDuration =
      gameDurations.length > 0 ? gameDurations.reduce((sum, duration) => sum + duration, 0) / gameDurations.length : 0

    return {
      totalGames: gameCreatedEvents.length,
      activeGames: gameCreatedEvents.length - gameFinishedEvents.length,
      completedGames: gameFinishedEvents.length,
      averageGameDuration: Math.round(averageGameDuration / 1000), // Convert to seconds
      popularCards: cardUsage,
      winRates: {
        player: totalFinished > 0 ? Math.round((playerWins / totalFinished) * 100) : 0,
        opponent: totalFinished > 0 ? Math.round((opponentWins / totalFinished) * 100) : 0,
      },
    }
  }

  static getRecentEvents(limit = 50): GameEvent[] {
    return this.events.slice(-limit).reverse()
  }
}
