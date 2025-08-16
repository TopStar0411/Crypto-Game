"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ParticleSystem } from "./particle-system"
import type { GameCard } from "@/types/game"

interface EnhancedGameCardProps {
  card: GameCard
  onSelect: (cardId: string) => void
  disabled?: boolean
  selected?: boolean
}

export function EnhancedGameCard({ card, onSelect, disabled, selected }: EnhancedGameCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const handleClick = () => {
    if (disabled) return
    setIsPlaying(true)
    setTimeout(() => setIsPlaying(false), 600)
    onSelect(card.id)
  }

  const getCardTypeColor = (type: string) => {
    switch (type) {
      case "attack":
        return "bg-destructive text-destructive-foreground"
      case "defense":
        return "bg-primary text-primary-foreground"
      case "special":
        return "bg-accent text-accent-foreground"
      default:
        return "bg-secondary text-secondary-foreground"
    }
  }

  const getCardTypeIcon = (type: string) => {
    switch (type) {
      case "attack":
        return "⚔️"
      case "defense":
        return "🛡️"
      case "special":
        return "✨"
      default:
        return "🎯"
    }
  }

  return (
    <div className="relative">
      <Card
        className={`
          relative overflow-hidden cursor-pointer transition-all duration-300 transform
          glass-card holographic-card premium-button
          ${selected ? "ring-2 ring-primary animate-pulse-glow" : ""}
          ${isHovered ? "scale-105 animate-glow" : ""}
          ${isPlaying ? "animate-card-flip" : ""}
          ${disabled ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}
        `}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="p-4 space-y-3">
          {/* Card Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl animate-float">{getCardTypeIcon(card.type)}</span>
              <h3 className="font-bold text-lg text-card-foreground">{card.name}</h3>
            </div>
            <Badge className={`${getCardTypeColor(card.type)} animate-pulse`}>{card.type.toUpperCase()}</Badge>
          </div>

          {/* Card Stats */}
          <div className="grid grid-cols-2 gap-2">
            {card.damage && (
              <div className="flex items-center gap-1 text-destructive">
                <span className="text-sm font-semibold">⚔️ {card.damage}</span>
              </div>
            )}
            {card.armor && (
              <div className="flex items-center gap-1 text-primary">
                <span className="text-sm font-semibold">🛡️ {card.armor}</span>
              </div>
            )}
            {card.statusEffect && (
              <div className="flex items-center gap-1 text-accent">
                <span className="text-sm font-semibold">✨ Effect</span>
              </div>
            )}
          </div>

          {/* Card Description */}
          <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>

          {/* Crypto Bonus Indicator */}
          {card.type === "attack" && (
            <div className="flex items-center gap-1 text-chart-1 text-xs">
              <span>📈 Crypto Bonus Available</span>
            </div>
          )}
        </div>

        {/* Hover Glow Effect */}
        {isHovered && (
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 animate-pulse" />
        )}

        {/* Selection Indicator */}
        {selected && (
          <div className="absolute top-2 right-2">
            <div className="w-3 h-3 bg-primary rounded-full animate-ping" />
            <div className="absolute top-0 right-0 w-3 h-3 bg-primary rounded-full" />
          </div>
        )}
      </Card>

      {/* Particle Effects */}
      <ParticleSystem
        trigger={isPlaying}
        type={card.type === "attack" ? "damage" : card.type === "defense" ? "heal" : "ambient"}
        intensity={8}
      />
    </div>
  )
}
