import type { CryptoResult } from "@/types/game"

export interface CryptoPair {
  symbol: string
  displayName: string
  binanceSymbol: string
}

export interface CryptoData {
  symbol: string
  displayName: string
  price: number
  change24h: number
  changePercent: number
  direction: "up" | "down"
  volume: number
  timestamp: number
}

export class CryptoService {
  private static cache: Map<string, { data: CryptoData; expiry: number }> = new Map()
  private static readonly CACHE_DURATION = 30000 // 30 seconds

  private static readonly CRYPTO_PAIRS: CryptoPair[] = [
    { symbol: "BTC", displayName: "Bitcoin", binanceSymbol: "BTCUSDT" },
    { symbol: "ETH", displayName: "Ethereum", binanceSymbol: "ETHUSDT" },
    { symbol: "BNB", displayName: "Binance Coin", binanceSymbol: "BNBUSDT" },
    { symbol: "ADA", displayName: "Cardano", binanceSymbol: "ADAUSDT" },
    { symbol: "SOL", displayName: "Solana", binanceSymbol: "SOLUSDT" },
    { symbol: "MATIC", displayName: "Polygon", binanceSymbol: "MATICUSDT" },
  ]

  static async getRandomCryptoData(): Promise<CryptoData> {
    const randomPair = this.CRYPTO_PAIRS[Math.floor(Math.random() * this.CRYPTO_PAIRS.length)]
    return this.getCryptoData(randomPair)
  }

  static async getCryptoData(pair: CryptoPair): Promise<CryptoData> {
    const cacheKey = pair.binanceSymbol
    const cached = this.cache.get(cacheKey)

    if (cached && cached.expiry > Date.now()) {
      return cached.data
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${pair.binanceSymbol}`, {
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (!response.ok) {
        console.log(`[v0] Binance API unavailable (${response.status}), using fallback data for ${pair.symbol}`)
        return this.getFallbackCryptoData(pair)
      }

      const data = await response.json()

      const cryptoData: CryptoData = {
        symbol: pair.symbol,
        displayName: pair.displayName,
        price: Number.parseFloat(data.lastPrice),
        change24h: Number.parseFloat(data.priceChange),
        changePercent: Number.parseFloat(data.priceChangePercent),
        direction: Number.parseFloat(data.priceChangePercent) >= 0 ? "up" : "down",
        volume: Number.parseFloat(data.volume),
        timestamp: Date.now(),
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data: cryptoData,
        expiry: Date.now() + this.CACHE_DURATION,
      })

      return cryptoData
    } catch (error) {
      console.log(
        `[v0] Crypto API error for ${pair.symbol}, using fallback data:`,
        error instanceof Error ? error.message : "Unknown error",
      )
      return this.getFallbackCryptoData(pair)
    }
  }

  static getCryptoGameEffect(cryptoData: CryptoData): CryptoResult["gameEffect"] {
    const absChange = Math.abs(cryptoData.changePercent)

    if (absChange >= 10) {
      return {
        multiplier: 2.0,
        bonusDamage: 20,
        description: `MASSIVE ${cryptoData.direction.toUpperCase()} MOVE! ${cryptoData.changePercent.toFixed(2)}% - Double damage!`,
      }
    } else if (absChange >= 5) {
      return {
        multiplier: 1.5,
        bonusDamage: 15,
        description: `BIG ${cryptoData.direction.toUpperCase()} MOVE! ${cryptoData.changePercent.toFixed(2)}% - 1.5x damage!`,
      }
    } else if (absChange >= 2) {
      return {
        multiplier: 1.2,
        bonusDamage: 10,
        description: `${cryptoData.direction.toUpperCase()} trend! ${cryptoData.changePercent.toFixed(2)}% - Bonus damage!`,
      }
    } else {
      return {
        multiplier: 1.0,
        bonusDamage: 5,
        description: `Stable market. ${cryptoData.changePercent.toFixed(2)}% - Small bonus.`,
      }
    }
  }

  static getVolatilityBonus(cryptoData: CryptoData): number {
    const absChange = Math.abs(cryptoData.changePercent)

    if (absChange >= 15) return 30 // Extreme volatility
    if (absChange >= 10) return 25 // Very high volatility
    if (absChange >= 5) return 15 // High volatility
    if (absChange >= 2) return 10 // Medium volatility
    return 5 // Low volatility
  }

  private static getFallbackCryptoData(pair: CryptoPair): CryptoData {
    const changePercent = (Math.random() - 0.5) * 10 // -5% to +5% for more realistic daily changes
    const basePrice = this.getBasePriceForSymbol(pair.symbol)
    const price = basePrice * (1 + changePercent / 100)

    const fallbackData: CryptoData = {
      symbol: pair.symbol,
      displayName: pair.displayName,
      price: Math.round(price * 100) / 100, // Round to 2 decimal places
      change24h: Math.round(basePrice * (changePercent / 100) * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      direction: changePercent >= 0 ? "up" : "down",
      volume: Math.floor(Math.random() * 1000000) + 100000, // 100k to 1.1M volume
      timestamp: Date.now(),
    }

    // Cache fallback data for consistency
    this.cache.set(pair.binanceSymbol, {
      data: fallbackData,
      expiry: Date.now() + this.CACHE_DURATION,
    })

    return fallbackData
  }

  private static getBasePriceForSymbol(symbol: string): number {
    const basePrices: Record<string, number> = {
      BTC: 45000,
      ETH: 2500,
      BNB: 300,
      ADA: 0.5,
      SOL: 100,
      MATIC: 0.8,
    }
    return basePrices[symbol] || 1
  }

  static getAllCryptoPairs(): CryptoPair[] {
    return [...this.CRYPTO_PAIRS]
  }
}
