import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { GameTurn } from "@/types/game"

interface TurnLogProps {
  turns: GameTurn[]
}

export function TurnLog({ turns }: TurnLogProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-card-foreground">Battle Log</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {turns
            .slice(-5)
            .reverse()
            .map((turn) => (
              <div key={turn.turnNumber} className="border-b border-border pb-3 last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">Turn {turn.turnNumber}</Badge>
                  <Badge
                    variant={turn.cryptoResult.direction === "up" ? "default" : "destructive"}
                    className={turn.cryptoResult.direction === "up" ? "bg-primary text-primary-foreground" : ""}
                  >
                    {turn.cryptoResult.symbol} {turn.cryptoResult.direction === "up" ? "↗" : "↘"}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground mb-1">{turn.result}</div>
                <div className="text-xs text-muted-foreground">
                  Damage dealt: {turn.opponentDamage} | Damage taken: {turn.playerDamage}
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  )
}
