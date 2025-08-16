"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { GameState } from "@/types/game"

interface GameResultProps {
  gameState: GameState
  onRestart: () => void
  onNewGame: () => void
}

export function GameResult({ gameState, onRestart, onNewGame }: GameResultProps) {
  const isWinner = gameState.winner === "player"

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className={`border-border bg-card ${isWinner ? "ring-2 ring-primary" : "ring-2 ring-destructive"}`}>
        <CardHeader className="text-center">
          <CardTitle className={`text-3xl ${isWinner ? "text-primary" : "text-destructive"}`}>
            {isWinner ? "Victory!" : "Defeat!"}
          </CardTitle>
          <p className="text-muted-foreground">
            {isWinner ? "You have conquered the crypto arena!" : "The AI opponent has bested you this time."}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Final Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-card-foreground">{gameState.player.hp}</div>
              <div className="text-sm text-muted-foreground">Your HP</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-card-foreground">{gameState.opponent.hp}</div>
              <div className="text-sm text-muted-foreground">Opponent HP</div>
            </div>
          </div>

          {/* Game Summary */}
          <div className="text-center space-y-2">
            <Badge variant="outline" className="text-lg px-4 py-2">
              {gameState.turnHistory.length} Turns Played
            </Badge>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={onRestart}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
            >
              Play Again
            </Button>
            <Button onClick={onNewGame} variant="outline" className="flex-1 bg-transparent" size="lg">
              New Game
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Turn History Summary */}
      {gameState.turnHistory.length > 0 && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Battle Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {gameState.turnHistory.map((turn) => (
                <div key={turn.turnNumber} className="flex items-center justify-between text-sm">
                  <span>
                    Turn {turn.turnNumber}: {turn.playerCard.name}
                  </span>
                  <Badge
                    variant={turn.cryptoResult.direction === "up" ? "default" : "destructive"}
                    className={turn.cryptoResult.direction === "up" ? "bg-primary text-primary-foreground" : ""}
                  >
                    {turn.cryptoResult.symbol} {turn.cryptoResult.direction === "up" ? "↗" : "↘"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
