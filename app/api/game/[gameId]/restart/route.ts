import { type NextRequest, NextResponse } from "next/server"
import { GameEngine } from "@/lib/game-engine"

export async function POST(request: NextRequest, { params }: { params: { gameId: string } }) {
  try {
    const gameState = GameEngine.restartGame(params.gameId)

    if (!gameState) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    return NextResponse.json(gameState)
  } catch (error) {
    console.error("Error restarting game:", error)
    return NextResponse.json({ error: "Failed to restart game" }, { status: 500 })
  }
}
