"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ParticleSystem } from "./particle-system"
import type { Player } from "@/types/game"

interface EnhancedPlayerStatsProps {
  player: Player
  isCurrentPlayer?: boolean
  lastDamage?: number
}

export function EnhancedPlayerStats({ player, isCurrentPlayer, lastDamage }: EnhancedPlayerStatsProps) {
  const [damageAnimation, setDamageAnimation] = useState(false)
  const [prevHp, setPrevHp] = useState(player.hp)

  useEffect(() => {
    if (player.hp < prevHp) {
      setDamageAnimation(true)
      setTimeout(() => setDamageAnimation(false), 500)
    }
    setPrevHp(player.hp)
  }, [player.hp, prevHp])

  const hpPercentage = (player.hp / player.maxHp) * 100
  const getHpColor = () => {
    if (hpPercentage > 60) return "bg-accent"
    if (hpPercentage > 30) return "bg-chart-1"
    return "bg-destructive"
  }

  return (
    <div className="relative">
      <Card
        className={`
        glass-card transition-all duration-300
        ${isCurrentPlayer ? "ring-2 ring-primary animate-pulse-glow" : ""}
        ${damageAnimation ? "animate-damage-shake" : ""}
      `}
      >
        <div className="p-4 space-y-4">
          {/* Player Name and Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isCurrentPlayer ? "bg-primary animate-ping" : "bg-muted"}`} />
              <h3 className="font-bold text-lg">{player.name}</h3>
            </div>
            {player.hp <= 0 && (
              <Badge variant="destructive" className="animate-pulse">
                💀 DEFEATED
              </Badge>
            )}
          </div>

          {/* HP Bar with Glow Effect */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Health</span>
              <span className="font-semibold">
                {player.hp} / {player.maxHp}
              </span>
            </div>
            <div className="relative">
              <Progress value={hpPercentage} className={`h-3 ${getHpColor()} transition-all duration-500`} />
              {hpPercentage > 0 && (
                <div className={`absolute inset-0 ${getHpColor()} opacity-50 animate-pulse rounded-full`} />
              )}
            </div>
          </div>

          {/* Armor Display */}
          {player.armor > 0 && (
            <div className="flex items-center gap-2 text-primary">
              <span className="text-xl animate-float">🛡️</span>
              <span className="font-semibold">{player.armor} Armor</span>
              <div className="flex-1 bg-primary/20 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary animate-pulse"
                  style={{ width: `${Math.min(player.armor * 10, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Status Effects */}
          {player.statusEffects && player.statusEffects.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Status Effects</span>
              <div className="flex flex-wrap gap-2">
                {player.statusEffects.map((effect, index) => (
                  <Badge key={index} variant="outline" className="animate-pulse glass-effect">
                    {effect.type === "weakness" && "🔻"}
                    {effect.type === "strength" && "🔺"}
                    {effect.type === "poison" && "☠️"}
                    {effect.type === "regeneration" && "💚"}
                    <span className="ml-1">
                      {effect.type} ({effect.duration})
                    </span>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Damage Number Animation */}
          {lastDamage && damageAnimation && (
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 animate-bounce">
              <span className="text-2xl font-bold text-destructive drop-shadow-lg">-{lastDamage}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Particle Effects for Damage */}
      <ParticleSystem trigger={damageAnimation} type="damage" intensity={lastDamage ? Math.min(lastDamage, 20) : 10} />
    </div>
  )
}
