export interface Player {
  id: string
  name: string
  hp: number
  maxHp: number
  armor: number
  statusEffects: StatusEffect[]
}

export interface StatusEffect {
  type: "poison" | "shield" | "strength" | "weakness"
  duration: number
  value: number
}

export interface Card {
  id: string
  name: string
  type: "attack" | "defense" | "special"
  damage?: number
  armor?: number
  statusEffect?: Omit<StatusEffect, "duration"> & { duration: number }
  description: string
}

export interface CryptoResult {
  symbol: string
  displayName: string
  direction: "up" | "down"
  changePercent: number
  price: number
  timestamp: number
  gameEffect: {
    multiplier: number
    bonusDamage: number
    description: string
  }
}

export interface GameTurn {
  turnNumber: number
  playerCard: Card
  opponentCard: Card
  cryptoResult: CryptoResult
  playerDamage: number
  opponentDamage: number
  playerHpAfter: number
  opponentHpAfter: number
  result: string
}

export interface GameState {
  id: string
  player: Player
  opponent: Player
  currentTurn: number
  gameStatus: "waiting" | "playing" | "finished"
  winner?: string
  turnHistory: GameTurn[]
  availableCards: Card[]
}

export interface CreateGameRequest {
  playerName: string
}

export interface PlayTurnRequest {
  gameId: string
  cardId: string
}
