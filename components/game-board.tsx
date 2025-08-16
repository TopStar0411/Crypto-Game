"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PlayerStats } from "@/components/player-stats"
import { GameCard } from "@/components/game-card"
import { CryptoTicker } from "@/components/crypto-ticker"
import { TurnLog } from "@/components/turn-log"
import { GameResult } from "@/components/game-result"
import { ApiClient, ApiError } from "@/lib/api-client"
import type { GameState } from "@/types/game"
import { Sword, Play } from "lucide-react"

interface GameBoardProps {
  gameState: GameState
  onGameStateUpdate: (gameState: GameState) => void
  onGameEnd: () => void
}

export function GameBoard({ gameState, onGameStateUpdate, onGameEnd }: GameBoardProps) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [isPlayingTurn, setIsPlayingTurn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAttackEffect, setShowAttackEffect] = useState(false)
  const [damageNumbers, setDamageNumbers] = useState<Array<{ id: number; damage: number; x: number; y: number }>>([])
  const [mouseTrails, setMouseTrails] = useState<Array<{ id: number; x: number; y: number }>>([])
  const [attackAlert, setAttackAlert] = useState<{
    show: boolean
    cardName: string
    damage: number
    effects: string[]
    cryptoBonus: boolean
    opponentHp: number
  } | null>(null)

  useEffect(() => {
    let trailId = 0
    const handleMouseMove = (e: MouseEvent) => {
      const newTrail = { id: trailId++, x: e.clientX, y: e.clientY }
      setMouseTrails((prev) => [...prev.slice(-3), newTrail])

      setTimeout(() => {
        setMouseTrails((prev) => prev.filter((trail) => trail.id !== newTrail.id))
      }, 600)
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  const handlePlayTurn = async () => {
    if (!selectedCardId || isPlayingTurn) return

    setIsPlayingTurn(true)
    setError(null)

    setShowAttackEffect(true)
    const selectedCard = gameState.availableCards?.find((card) => card.id === selectedCardId)

    const initialOpponentHp = gameState.opponent.hp

    if (selectedCard?.damage) {
      const damageId = Date.now()
      setDamageNumbers((prev) => [
        ...prev,
        {
          id: damageId,
          damage: selectedCard.damage!,
          x: Math.random() * 200 + 100,
          y: Math.random() * 100 + 50,
        },
      ])

      setTimeout(() => {
        setDamageNumbers((prev) => prev.filter((num) => num.id !== damageId))
      }, 2000)
    }

    setTimeout(() => setShowAttackEffect(false), 800)

    try {
      const updatedGameState = await ApiClient.playTurn(gameState.id, selectedCardId)

      if (selectedCard) {
        const actualDamage = initialOpponentHp - updatedGameState.opponent.hp
        const effects = []

        if (selectedCard.statusEffect) {
          effects.push(
            `Applied ${selectedCard.statusEffect.type} (${selectedCard.statusEffect.value} for ${selectedCard.statusEffect.duration} turns)`,
          )
        }
        if (selectedCard.armor) {
          effects.push(`Gained ${selectedCard.armor} armor`)
        }

        const cryptoBonus = selectedCard.damage ? actualDamage > selectedCard.damage : false
        if (cryptoBonus) {
          effects.push("Crypto market bonus applied!")
        }

        setAttackAlert({
          show: true,
          cardName: selectedCard.name,
          damage: actualDamage,
          effects,
          cryptoBonus,
          opponentHp: updatedGameState.opponent.hp,
        })

        setTimeout(() => {
          setAttackAlert(null)
        }, 4000)
      }

      onGameStateUpdate(updatedGameState)
      setSelectedCardId(null)
    } catch (error) {
      console.error("Error playing turn:", error)
      if (error instanceof ApiError) {
        setError(error.message)
      } else {
        setError("Failed to play turn. Please try again.")
      }
    } finally {
      setIsPlayingTurn(false)
    }
  }

  const handleRestart = async () => {
    setError(null)

    try {
      const restartedGameState = await ApiClient.restartGame(gameState.id)
      onGameStateUpdate(restartedGameState)
    } catch (error) {
      console.error("Error restarting game:", error)
      if (error instanceof ApiError) {
        setError(error.message)
      } else {
        setError("Failed to restart game. Please try again.")
      }
    }
  }

  if (gameState.gameStatus === "finished") {
    return <GameResult gameState={gameState} onRestart={handleRestart} onNewGame={onGameEnd} />
  }

  const selectedCard = gameState.availableCards?.find((card) => card.id === selectedCardId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white p-4 relative">
      {mouseTrails.map((trail) => (
        <div
          key={trail.id}
          className="mouse-trail-dot animate-mouse-trail"
          style={{ left: trail.x - 4, top: trail.y - 4 }}
        />
      ))}

      {damageNumbers.map((num) => (
        <div
          key={num.id}
          className="fixed text-2xl font-bold text-destructive pointer-events-none z-50 animate-bounce-in"
          style={{
            left: num.x,
            top: num.y,
            animation: "bounce-in 0.6s ease-out, float 2s ease-out",
          }}
        >
          -{num.damage}
        </div>
      ))}

      {showAttackEffect && <div className="fixed inset-0 bg-primary/20 pointer-events-none z-50 animate-pulse" />}

      {attackAlert?.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-bounce-in">
          <Card className="bg-card border-border shadow-2xl max-w-md mx-4 animate-slide-in">
            <CardHeader className="text-center">
              <CardTitle className="text-foreground flex items-center justify-center space-x-2">
                <Sword className="w-6 h-6 text-primary animate-pulse" />
                <span>Attack Results!</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground mb-2">{attackAlert.cardName}</h3>
                <div className="text-3xl font-bold text-destructive animate-pulse">-{attackAlert.damage} HP</div>
                <p className="text-muted-foreground mt-2">Opponent HP: {attackAlert.opponentHp}/100</p>
              </div>

              {attackAlert.effects.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">Effects Applied:</h4>
                  {attackAlert.effects.map((effect, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      <span className="text-sm text-muted-foreground">{effect}</span>
                    </div>
                  ))}
                </div>
              )}

              <Button
                onClick={() => setAttackAlert(null)}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Continue Battle
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center animate-slide-in">
          <Badge
            variant="outline"
            className="text-lg px-4 py-2 bg-card border-border text-foreground interactive-button"
          >
            Turn {gameState.currentTurn}
          </Badge>
        </div>

        <div className="animate-slide-in" style={{ animationDelay: "0.1s" }}>
          <CryptoTicker />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-in" style={{ animationDelay: "0.2s" }}>
          <PlayerStats player={gameState.player} title="You" isCurrentPlayer={true} />
          <PlayerStats player={gameState.opponent} title="AI Opponent" isCurrentPlayer={false} />
        </div>

        <Card className="bg-card border-border shadow-lg animate-slide-in" style={{ animationDelay: "0.3s" }}>
          <CardHeader>
            <CardTitle className="text-foreground flex items-center space-x-2">
              <Sword className="w-5 h-5 transition-transform duration-300 hover:scale-125" />
              <span>Choose Your Card</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {gameState.availableCards?.map((card, index) => (
                <div
                  key={card.id}
                  className="animate-slide-in interactive-card"
                  style={{ animationDelay: `${0.4 + index * 0.1}s` }}
                >
                  <GameCard
                    card={card}
                    isSelected={selectedCardId === card.id}
                    onClick={() => setSelectedCardId(card.id)}
                  />
                </div>
              )) || <div className="text-muted-foreground">No cards available</div>}
            </div>

            {selectedCard && (
              <div className="bg-muted p-4 rounded-lg border border-border animate-bounce-in">
                <h4 className="text-foreground font-semibold mb-2">Selected: {selectedCard.name}</h4>
                <p className="text-muted-foreground text-sm">{selectedCard.description}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm">
                  {selectedCard.damage && (
                    <span className="text-destructive animate-pulse">Damage: {selectedCard.damage}</span>
                  )}
                  {selectedCard.armor && (
                    <span className="text-secondary animate-pulse">Armor: {selectedCard.armor}</span>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="text-destructive-foreground text-sm text-center bg-destructive/10 border border-destructive/20 p-3 rounded animate-bounce-in">
                {error}
              </div>
            )}

            <Button
              onClick={handlePlayTurn}
              disabled={!selectedCardId || isPlayingTurn}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground premium-button interactive-button"
              size="lg"
            >
              {isPlayingTurn ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                  <span>Playing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Play className="w-4 h-4 transition-transform duration-300 hover:scale-125" />
                  <span>Play Card</span>
                </div>
              )}
            </Button>
          </CardContent>
        </Card>

        {gameState.turnHistory && gameState.turnHistory.length > 0 && (
          <div className="animate-slide-in" style={{ animationDelay: "0.5s" }}>
            <TurnLog turns={gameState.turnHistory} />
          </div>
        )}
      </div>
    </div>
  )
}
