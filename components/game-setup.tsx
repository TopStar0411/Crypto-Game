"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ApiClient, ApiError } from "@/lib/api-client"
import type { GameState } from "@/types/game"
import { Play, TrendingUp, Sword, Shield } from "lucide-react"

interface GameSetupProps {
  onGameStart: (gameState: GameState) => void
}

export function GameSetup({ onGameStart }: GameSetupProps) {
  const [playerName, setPlayerName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStartGame = async () => {
    if (!playerName.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const gameState = await ApiClient.createGame(playerName.trim())
      onGameStart(gameState)
    } catch (error) {
      console.error("Error creating game:", error)
      if (error instanceof ApiError) {
        setError(error.message)
      } else {
        setError("Failed to create game. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-white text-2xl">Start New Game</CardTitle>
        <CardDescription className="text-gray-300">Enter your name to begin the battle</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <Input
          placeholder="Your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleStartGame()}
          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 text-lg py-3"
        />

        {error && (
          <div className="text-red-300 text-sm text-center bg-red-500/10 border border-red-500/20 p-3 rounded">
            {error}
          </div>
        )}

        <Button
          onClick={handleStartGame}
          disabled={!playerName.trim() || isLoading}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg py-3 transition-all duration-300"
          size="lg"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Starting Game...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Play className="w-5 h-5" />
              <span>Start Game</span>
            </div>
          )}
        </Button>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
          <div className="text-center p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
            <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-xs text-gray-300">Live Crypto Data</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
            <Sword className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-xs text-gray-300">Attack Cards</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
            <Shield className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-xs text-gray-300">Defense Cards</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
