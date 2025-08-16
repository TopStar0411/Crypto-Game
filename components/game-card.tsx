"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Card as GameCardType } from "@/types/game"

interface GameCardProps {
  card: GameCardType
  isSelected: boolean
  onClick: () => void
}

export function GameCard({ card, isSelected, onClick }: GameCardProps) {
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

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:scale-105 border-border bg-card ${
        isSelected ? "ring-2 ring-primary shadow-lg" : "hover:shadow-md"
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-card-foreground">{card.name}</CardTitle>
          <Badge className={getCardTypeColor(card.type)}>{card.type}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <CardDescription className="text-xs leading-relaxed">{card.description}</CardDescription>

        <div className="flex justify-between text-xs">
          {card.damage && <span className="text-destructive font-mono">⚔️ {card.damage}</span>}
          {card.armor && <span className="text-primary font-mono">🛡️ {card.armor}</span>}
        </div>
      </CardContent>
    </Card>
  )
}
