"use client"

import { useState } from "react"
import { GameSetup } from "@/components/game-setup"
import { GameBoard } from "@/components/game-board"
import type { GameState } from "@/types/game"

export default function Home() {
  const [gameState, setGameState] = useState<GameState | null>(null)

  const handleGameStart = (newGameState: GameState) => {
    setGameState(newGameState)
  }

  const handleGameEnd = () => {
    setGameState(null)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
              Crypto Battle Arena
            </span>
          </h1>
          <p className="text-gray-300 text-lg md:text-xl mb-4">Where market movements fuel epic card battles</p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
            <span>🚀 Real-time crypto data</span>
            <span>•</span>
            <span>🤖 AI opponents</span>
            <span>•</span>
            <span>⚔️ Epic battles</span>
          </div>
        </header>

        {!gameState ? (
          <div className="max-w-md mx-auto">
            <GameSetup onGameStart={handleGameStart} />
          </div>
        ) : (
          <GameBoard gameState={gameState} onGameStateUpdate={setGameState} onGameEnd={handleGameEnd} />
        )}
      </div>
    </main>
  )
}
