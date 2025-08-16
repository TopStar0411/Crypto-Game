import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { Player } from "@/types/game"

interface PlayerStatsProps {
  player: Player | undefined
  title: string
  isCurrentPlayer: boolean
}

export function PlayerStats({ player, title, isCurrentPlayer }: PlayerStatsProps) {
  if (!player) {
    return (
      <Card className={`border-border bg-card ${isCurrentPlayer ? "ring-2 ring-primary" : ""}`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-card-foreground">
            <span>{title}</span>
            <span className="text-sm font-normal">Loading...</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Health</span>
              <span className="font-mono">--/--</span>
            </div>
            <Progress value={0} className="h-3" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const hpPercentage = (player.hp / player.maxHp) * 100

  return (
    <Card className={`border-border bg-card ${isCurrentPlayer ? "ring-2 ring-primary" : ""}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-card-foreground">
          <span>{title}</span>
          <span className="text-sm font-normal">{player.name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* HP Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Health</span>
            <span className="font-mono">
              {player.hp}/{player.maxHp}
            </span>
          </div>
          <Progress value={hpPercentage} className="h-3" />
        </div>

        {/* Armor */}
        {player.armor > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm">Armor</span>
            <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
              {player.armor}
            </Badge>
          </div>
        )}

        {/* Status Effects */}
        {player.statusEffects.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-medium">Status Effects</span>
            <div className="flex flex-wrap gap-2">
              {player.statusEffects.map((effect, index) => (
                <Badge
                  key={index}
                  variant={effect.type === "poison" || effect.type === "weakness" ? "destructive" : "default"}
                  className="text-xs"
                >
                  {effect.type} ({effect.duration})
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
