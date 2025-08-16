import { type NextRequest, NextResponse } from "next/server"
import { GameEngine } from "@/lib/game-engine"
import type { CreateGameRequest } from "@/types/game"
import { RequestLogger, ValidationService } from "@/lib/middleware"
import { GameAnalytics } from "@/lib/game-analytics"
import { RateLimiter } from "@/lib/rate-limiter"
import { BackendUtils } from "@/lib/backend-utils"

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const requestId = BackendUtils.generateRequestId()
  const context = {
    requestId,
    timestamp: startTime,
    userAgent: request.headers.get("user-agent") || undefined,
    ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
  }

  try {
    BackendUtils.logRequest("POST", "/api/game/create")
    RequestLogger.logRequest(context, "POST", "/api/game/create")

    const rateLimitInfo = RateLimiter.checkRateLimit(context.ip!, "create-game")
    if (!rateLimitInfo.allowed) {
      const responseTime = Date.now() - startTime
      BackendUtils.logResponse(429, { error: "Rate limited" }, responseTime)
      RequestLogger.logResponse(context, 429, responseTime)
      return NextResponse.json(BackendUtils.formatErrorResponse("Too many requests. Please try again later.", 429), {
        status: 429,
        headers: {
          "X-RateLimit-Remaining": rateLimitInfo.remaining.toString(),
          "X-RateLimit-Reset": rateLimitInfo.resetTime.toString(),
          "X-Request-ID": requestId,
        },
      })
    }

    const body: CreateGameRequest = await request.json()

    const validation = BackendUtils.validateGameRequest(body)
    if (!validation.isValid) {
      const responseTime = Date.now() - startTime
      BackendUtils.logResponse(400, { errors: validation.errors }, responseTime)
      return NextResponse.json(
        BackendUtils.formatErrorResponse(`Validation failed: ${validation.errors.join(", ")}`, 400),
        { status: 400, headers: { "X-Request-ID": requestId } },
      )
    }

    const playerNameValidation = ValidationService.validatePlayerName(body.playerName)
    if (!playerNameValidation.valid) {
      const responseTime = Date.now() - startTime
      BackendUtils.logResponse(400, { error: playerNameValidation.error }, responseTime)
      RequestLogger.logResponse(context, 400, responseTime)
      return NextResponse.json(BackendUtils.formatErrorResponse(playerNameValidation.error!, 400), {
        status: 400,
        headers: { "X-Request-ID": requestId },
      })
    }

    const sanitizedPlayerName = BackendUtils.sanitizeInput(body.playerName)
    const gameState = GameEngine.createGame(sanitizedPlayerName)

    GameAnalytics.recordEvent({
      type: "game_created",
      gameId: gameState.id,
      data: {
        playerName: sanitizedPlayerName,
        timestamp: Date.now(),
        requestId,
      },
    })

    const responseTime = Date.now() - startTime
    BackendUtils.logResponse(200, { gameId: gameState.id }, responseTime)
    RequestLogger.logResponse(context, 200, responseTime, { gameId: gameState.id })

    return NextResponse.json(BackendUtils.formatSuccessResponse(gameState, "Game created successfully"), {
      headers: {
        "X-Request-ID": requestId,
        "X-Response-Time": `${responseTime}ms`,
      },
    })
  } catch (error) {
    RequestLogger.logError(context, error as Error)
    const responseTime = Date.now() - startTime
    BackendUtils.logResponse(500, { error: "Internal server error" }, responseTime)
    RequestLogger.logResponse(context, 500, responseTime)

    return NextResponse.json(BackendUtils.formatErrorResponse("Failed to create game", 500), {
      status: 500,
      headers: { "X-Request-ID": requestId },
    })
  }
}
