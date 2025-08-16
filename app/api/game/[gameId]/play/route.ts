import { type NextRequest, NextResponse } from "next/server"
import { GameEngine } from "@/lib/game-engine"
import type { PlayTurnRequest } from "@/types/game"

export async function POST(request: NextRequest, { params }: { params: { gameId: string } }) {
  try {
    const body: PlayTurnRequest = await request.json()

    if (!body.cardId) {
      return NextResponse.json({ error: "Card ID is required" }, { status: 400 })
    }

    const gameState = await GameEngine.playTurn(params.gameId, body.cardId)

    if (!gameState) {
      return NextResponse.json({ error: "Game not found or invalid move" }, { status: 404 })
    }

    return NextResponse.json(gameState)
  } catch (error) {
    console.error("Error playing turn:", error)
    return NextResponse.json({ error: "Failed to play turn" }, { status: 500 })
  }
}
