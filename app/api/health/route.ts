import { NextResponse } from "next/server"
import { GameEngine } from "@/lib/game-engine"
import { CryptoService } from "@/lib/crypto-service"

export async function GET() {
  const startTime = Date.now()

  try {
    // Check game engine health
    const gameEngineHealth = {
      status: "healthy",
      activeGames: GameEngine.getActiveGameCount(),
      memoryUsage: process.memoryUsage(),
    }

    // Check crypto service health
    let cryptoServiceHealth
    try {
      const testData = await CryptoService.getRandomCryptoData()
      cryptoServiceHealth = {
        status: "healthy",
        lastUpdate: testData.timestamp,
        symbol: testData.symbol,
      }
    } catch (error) {
      cryptoServiceHealth = {
        status: "degraded",
        error: "Using fallback data",
        message: (error as Error).message,
      }
    }

    const responseTime = Date.now() - startTime

    return NextResponse.json({
      status: "healthy",
      timestamp: Date.now(),
      responseTime: `${responseTime}ms`,
      services: {
        gameEngine: gameEngineHealth,
        cryptoService: cryptoServiceHealth,
      },
      uptime: process.uptime(),
      version: "1.0.0",
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: (error as Error).message,
        timestamp: Date.now(),
      },
      { status: 500 },
    )
  }
}
