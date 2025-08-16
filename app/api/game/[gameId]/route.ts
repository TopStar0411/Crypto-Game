import { type NextRequest, NextResponse } from "next/server"
import { GameEngine } from "@/lib/game-engine"

export async function GET(request: NextRequest, { params }: { params: { gameId: string } }) {
  try {
    const gameState = GameEngine.getGame(params.gameId)

    if (!gameState) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    return NextResponse.json(gameState)
  } catch (error) {
    console.error("Error getting game state:", error)
    return NextResponse.json({ error: "Failed to get game state" }, { status: 500 })
  }
}
