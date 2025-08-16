import type { Player, Card, GameState, CryptoResult, GameTurn } from "@/types/game"
import { CryptoService } from "./crypto-service"

export class GameEngine {
  private static games: Map<string, GameState> = new Map()
  private static gameCache: Map<string, { data: GameState; timestamp: number }> = new Map()
  private static eventListeners: Map<string, Function[]> = new Map()
  private static performanceMetrics: Map<string, number[]> = new Map()

  static addEventListener(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  static emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event) || []
    listeners.forEach((callback) => {
      try {
        callback(data)
      } catch (error) {
        console.error(`[v0] Event listener error for ${event}:`, error)
      }
    })
  }

  private static withPerformanceTracking<T extends any[], R>(
    methodName: string,
    fn: (...args: T) => R,
  ): (...args: T) => R {
    return (...args: T): R => {
      const startTime = performance.now()
      try {
        const result = fn(...args)
        const duration = performance.now() - startTime

        if (!this.performanceMetrics.has(methodName)) {
          this.performanceMetrics.set(methodName, [])
        }
        this.performanceMetrics.get(methodName)!.push(duration)

        console.log(`[v0] ${methodName} executed in ${duration.toFixed(2)}ms`)
        return result
      } catch (error) {
        const duration = performance.now() - startTime
        console.error(`[v0] ${methodName} failed after ${duration.toFixed(2)}ms:`, error)
        throw error
      }
    }
  }

  static createGame(playerName: string): GameState {
    return this.withPerformanceTracking("createGame", (playerName: string) => {
      try {
        console.log("[v0] GameEngine.createGame called with:", playerName)
        const gameId = this.generateSecureId()
        console.log("[v0] Generated gameId:", gameId)

        const player: Player = this.createPlayer("player", playerName)
        const opponent: Player = this.createPlayer("opponent", "AI Opponent")

        console.log("[v0] Getting available cards...")
        const availableCards = this.getAvailableCards()

        const gameState: GameState = {
          id: gameId,
          player,
          opponent,
          currentTurn: 1,
          gameStatus: "playing",
          turnHistory: [],
          availableCards,
          createdAt: Date.now(),
        } as GameState & { createdAt: number }

        this.cacheGame(gameId, gameState)
        this.games.set(gameId, gameState)

        this.emit("gameCreated", { gameId, playerName, timestamp: Date.now() })

        console.log("[v0] Stored game in map, total games:", this.games.size)
        return gameState
      } catch (error) {
        console.error("[v0] Error in GameEngine.createGame:", error)
        this.emit("gameCreationError", { playerName, error: error.message })
        throw error
      }
    })(playerName)
  }

  private static generateSecureId(): string {
    const timestamp = Date.now().toString(36)
    const randomPart = Math.random().toString(36).substring(2, 15)
    const entropy = Math.random().toString(36).substring(2, 8)
    return `${timestamp}${randomPart}${entropy}`
  }

  private static createPlayer(id: string, name: string): Player {
    return {
      id,
      name,
      hp: 100,
      maxHp: 100,
      armor: 0,
      statusEffects: [],
    }
  }

  static getGame(gameId: string): GameState | null {
    return this.withPerformanceTracking("getGame", (gameId: string) => {
      const cached = this.gameCache.get(gameId)
      if (cached && Date.now() - cached.timestamp < 30000) {
        console.log("[v0] Returning cached game:", gameId)
        return cached.data
      }

      const game = this.games.get(gameId) || null
      if (game) {
        this.cacheGame(gameId, game)
      }
      return game
    })(gameId)
  }

  private static cacheGame(gameId: string, gameState: GameState): void {
    this.gameCache.set(gameId, {
      data: { ...gameState },
      timestamp: Date.now(),
    })
  }

  static async playTurn(gameId: string, playerCardId: string): Promise<GameState | null> {
    return this.withPerformanceTracking("playTurn", async (gameId: string, playerCardId: string) => {
      try {
        const game = this.games.get(gameId)
        if (!game || game.gameStatus !== "playing") {
          this.emit("invalidTurn", { gameId, reason: "Game not found or not playing" })
          return null
        }

        const playerCard = game.availableCards.find((card) => card.id === playerCardId)
        if (!playerCard) {
          this.emit("invalidTurn", { gameId, reason: "Invalid card selected" })
          return null
        }

        const opponentCard = this.getAICardChoice(game, playerCard)
        const cryptoResult = await this.getCryptoResult()

        const battleResult = this.executeBattle(game, playerCard, opponentCard, cryptoResult)

        this.emit("turnCompleted", {
          gameId,
          turnNumber: game.currentTurn,
          playerCard: playerCard.name,
          opponentCard: opponentCard.name,
          result: battleResult,
        })

        this.cacheGame(gameId, game)
        return game
      } catch (error) {
        console.error("[v0] Error in playTurn:", error)
        this.emit("turnError", { gameId, error: error.message })
        throw error
      }
    })(gameId, playerCardId)
  }

  private static getAICardChoice(game: GameState, playerCard: Card): Card {
    const availableCards = game.availableCards

    if (playerCard.type === "attack") {
      const defenseCards = availableCards.filter((card) => card.type === "defense")
      if (defenseCards.length > 0 && Math.random() > 0.3) {
        return defenseCards[Math.floor(Math.random() * defenseCards.length)]
      }
    }

    return availableCards[Math.floor(Math.random() * availableCards.length)]
  }

  private static executeBattle(
    game: GameState,
    playerCard: Card,
    opponentCard: Card,
    cryptoResult: CryptoResult,
  ): string {
    const { playerDamage, opponentDamage } = this.calculateDamage(
      playerCard,
      opponentCard,
      cryptoResult,
      game.player,
      game.opponent,
    )

    this.applyTurnEffects(game.player, game.opponent, playerCard, opponentCard, playerDamage, opponentDamage)

    const turn: GameTurn = {
      turnNumber: game.currentTurn,
      playerCard,
      opponentCard,
      cryptoResult,
      playerDamage: opponentDamage,
      opponentDamage: playerDamage,
      playerHpAfter: game.player.hp,
      opponentHpAfter: game.opponent.hp,
      result: this.getTurnResult(playerCard, opponentCard, cryptoResult),
    }

    game.turnHistory.push(turn)
    game.currentTurn++

    this.checkWinCondition(game)
    this.processStatusEffects(game.player)
    this.processStatusEffects(game.opponent)

    return turn.result
  }

  private static checkWinCondition(game: GameState): void {
    if (game.player.hp <= 0) {
      game.gameStatus = "finished"
      game.winner = "opponent"
      this.emit("gameFinished", {
        gameId: game.id,
        winner: "opponent",
        totalTurns: game.currentTurn,
      })
    } else if (game.opponent.hp <= 0) {
      game.gameStatus = "finished"
      game.winner = "player"
      this.emit("gameFinished", {
        gameId: game.id,
        winner: "player",
        totalTurns: game.currentTurn,
      })
    }
  }

  static getPerformanceMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const metrics: Record<string, { avg: number; min: number; max: number; count: number }> = {}

    for (const [method, times] of this.performanceMetrics.entries()) {
      if (times.length > 0) {
        metrics[method] = {
          avg: times.reduce((a, b) => a + b, 0) / times.length,
          min: Math.min(...times),
          max: Math.max(...times),
          count: times.length,
        }
      }
    }

    return metrics
  }

  static cleanup(): void {
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours

    for (const [gameId, game] of this.games.entries()) {
      if (now - (game as any).createdAt > maxAge) {
        this.games.delete(gameId)
        this.gameCache.delete(gameId)
      }
    }

    for (const [gameId, cached] of this.gameCache.entries()) {
      if (now - cached.timestamp > 300000) {
        // 5 minutes
        this.gameCache.delete(gameId)
      }
    }

    console.log(`[v0] Cleanup completed. Active games: ${this.games.size}`)
  }

  static restartGame(gameId: string): GameState | null {
    const game = this.games.get(gameId)
    if (!game) return null

    game.player.hp = game.player.maxHp
    game.player.armor = 0
    game.player.statusEffects = []
    game.opponent.hp = game.opponent.maxHp
    game.opponent.armor = 0
    game.opponent.statusEffects = []
    game.currentTurn = 1
    game.gameStatus = "playing"
    game.winner = undefined
    game.turnHistory = []

    this.games.set(gameId, game)
    return game
  }

  private static calculateDamage(
    playerCard: Card,
    opponentCard: Card,
    cryptoResult: CryptoResult,
    player: Player,
    opponent: Player,
  ): { playerDamage: number; opponentDamage: number } {
    let playerDamage = playerCard.damage || 0
    let opponentDamage = opponentCard.damage || 0

    const cryptoEffect = cryptoResult.gameEffect

    if (playerCard.type === "attack") {
      playerDamage = Math.floor(playerDamage * cryptoEffect.multiplier)
      if (cryptoResult.direction === "up") {
        playerDamage += cryptoEffect.bonusDamage
      }
    }

    if (opponentCard.type === "attack") {
      opponentDamage = Math.floor(opponentDamage * cryptoEffect.multiplier)
      if (cryptoResult.direction === "up") {
        opponentDamage += cryptoEffect.bonusDamage
      }
    }

    if (cryptoResult.direction === "down" && Math.abs(cryptoResult.changePercent) > 5) {
      if (playerCard.type === "defense") playerDamage += 10
      if (opponentCard.type === "defense") opponentDamage += 10
    }

    const playerStrength = player.statusEffects.find((e) => e.type === "strength")
    const playerWeakness = player.statusEffects.find((e) => e.type === "weakness")
    const opponentStrength = opponent.statusEffects.find((e) => e.type === "strength")
    const opponentWeakness = opponent.statusEffects.find((e) => e.type === "weakness")

    if (playerStrength) playerDamage += playerStrength.value
    if (playerWeakness) playerDamage = Math.max(0, playerDamage - playerWeakness.value)
    if (opponentStrength) opponentDamage += opponentStrength.value
    if (opponentWeakness) opponentDamage = Math.max(0, opponentDamage - opponentWeakness.value)

    return { playerDamage, opponentDamage }
  }

  private static applyTurnEffects(
    player: Player,
    opponent: Player,
    playerCard: Card,
    opponentCard: Card,
    playerDamage: number,
    opponentDamage: number,
  ) {
    if (playerCard.armor) player.armor += playerCard.armor
    if (opponentCard.armor) opponent.armor += opponentCard.armor

    if (playerCard.statusEffect) {
      opponent.statusEffects.push({
        type: playerCard.statusEffect.type,
        duration: playerCard.statusEffect.duration,
        value: playerCard.statusEffect.value,
      })
    }
    if (opponentCard.statusEffect) {
      player.statusEffects.push({
        type: opponentCard.statusEffect.type,
        duration: opponentCard.statusEffect.duration,
        value: opponentCard.statusEffect.value,
      })
    }

    const playerDamageTaken = Math.max(0, opponentDamage - player.armor)
    const opponentDamageTaken = Math.max(0, playerDamage - opponent.armor)

    player.hp = Math.max(0, player.hp - playerDamageTaken)
    opponent.hp = Math.max(0, opponent.hp - opponentDamageTaken)

    player.armor = Math.max(0, player.armor - opponentDamage)
    opponent.armor = Math.max(0, opponent.armor - playerDamage)
  }

  private static processStatusEffects(player: Player) {
    player.statusEffects = player.statusEffects.filter((effect) => {
      if (effect.type === "poison") {
        player.hp = Math.max(0, player.hp - effect.value)
      }
      effect.duration--
      return effect.duration > 0
    })
  }

  private static getTurnResult(playerCard: Card, opponentCard: Card, cryptoResult: CryptoResult): string {
    return `${playerCard.name} vs ${opponentCard.name} - ${cryptoResult.gameEffect.description}`
  }

  private static async getCryptoResult(): Promise<CryptoResult> {
    try {
      const cryptoData = await CryptoService.getRandomCryptoData()
      const gameEffect = CryptoService.getCryptoGameEffect(cryptoData)

      return {
        symbol: cryptoData.symbol,
        displayName: cryptoData.displayName,
        direction: cryptoData.direction,
        changePercent: cryptoData.changePercent,
        price: cryptoData.price,
        timestamp: cryptoData.timestamp,
        gameEffect,
      }
    } catch (error) {
      console.error("Error getting crypto result:", error)
      const changePercent = (Math.random() - 0.5) * 10
      return {
        symbol: "BTC",
        displayName: "Bitcoin",
        direction: changePercent >= 0 ? "up" : "down",
        changePercent,
        price: 45000,
        timestamp: Date.now(),
        gameEffect: {
          multiplier: 1.0,
          bonusDamage: 5,
          description: `Market ${changePercent >= 0 ? "up" : "down"} ${changePercent.toFixed(2)}%`,
        },
      }
    }
  }

  private static getAvailableCards(): Card[] {
    return [
      {
        id: "fire-strike",
        name: "Fire Strike",
        type: "attack",
        damage: 25,
        description: "Deal 25 damage. Gets +10 damage if crypto goes up.",
      },
      {
        id: "ice-shard",
        name: "Ice Shard",
        type: "attack",
        damage: 20,
        statusEffect: { type: "weakness", value: 5, duration: 2 },
        description: "Deal 20 damage and apply weakness (-5 damage) for 2 turns.",
      },
      {
        id: "shield-wall",
        name: "Shield Wall",
        type: "defense",
        armor: 15,
        description: "Gain 15 armor to block incoming damage.",
      },
      {
        id: "poison-dart",
        name: "Poison Dart",
        type: "special",
        damage: 10,
        statusEffect: { type: "poison", value: 8, duration: 3 },
        description: "Deal 10 damage and poison for 8 damage per turn for 3 turns.",
      },
      {
        id: "berserker-rage",
        name: "Berserker Rage",
        type: "special",
        damage: 15,
        statusEffect: { type: "strength", value: 10, duration: 2 },
        description: "Deal 15 damage and gain +10 attack damage for 2 turns.",
      },
      {
        id: "healing-potion",
        name: "Healing Potion",
        type: "defense",
        armor: 5,
        description: "Gain 5 armor and remove all negative status effects.",
      },
    ]
  }

  static getActiveGameCount(): number {
    return Array.from(this.games.values()).filter((game) => game.gameStatus === "playing").length
  }
}

setInterval(() => {
  GameEngine.cleanup()
}, 60000)
