"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, Trophy, Skull, Clock, TrendingUp, TrendingDown } from "lucide-react"

interface GameRecord {
  id: number
  timestamp: string
  result: string
  playerHp: number
  opponentHp: number
  turnsPlayed: number
  cryptoData?: any
  walletAddress: string
}

interface UserHistoryProps {
  gameHistory: GameRecord[]
  walletAddress: string | null
  onClose: () => void
}

export function UserHistory({ gameHistory, walletAddress, onClose }: UserHistoryProps) {
  const wins = gameHistory.filter((game) => game.result === "won").length
  const losses = gameHistory.filter((game) => game.result === "lost").length
  const winRate = gameHistory.length > 0 ? Math.round((wins / gameHistory.length) * 100) : 0

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden bg-slate-900/95 border-purple-500/20">
        <div className="p-6 border-b border-purple-500/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Game History</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {walletAddress && (
            <div className="flex items-center gap-4 text-sm text-gray-300 mb-4">
              <span>Wallet: {formatAddress(walletAddress)}</span>
              <Badge variant="outline" className="border-green-500/30 text-green-400">
                {gameHistory.length} games played
              </Badge>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{wins}</div>
              <div className="text-sm text-gray-400">Wins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{losses}</div>
              <div className="text-sm text-gray-400">Losses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{winRate}%</div>
              <div className="text-sm text-gray-400">Win Rate</div>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-96">
          {gameHistory.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No games played yet</p>
              <p className="text-sm">Start playing to build your history!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {gameHistory.map((game) => (
                <Card key={game.id} className="p-4 bg-slate-800/50 border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {game.result === "won" ? (
                        <Trophy className="w-4 h-4 text-green-400" />
                      ) : (
                        <Skull className="w-4 h-4 text-red-400" />
                      )}
                      <Badge
                        variant={game.result === "won" ? "default" : "destructive"}
                        className={game.result === "won" ? "bg-green-600" : "bg-red-600"}
                      >
                        {game.result === "won" ? "Victory" : "Defeat"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {formatDate(game.timestamp)}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">Your HP</div>
                      <div className="text-white font-medium">{game.playerHp}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Enemy HP</div>
                      <div className="text-white font-medium">{game.opponentHp}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Turns</div>
                      <div className="text-white font-medium">{game.turnsPlayed}</div>
                    </div>
                  </div>

                  {game.cryptoData && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-400">Crypto:</span>
                        <span className="text-white">{game.cryptoData.pair}</span>
                        <div className="flex items-center gap-1">
                          {game.cryptoData.direction === "up" ? (
                            <TrendingUp className="w-3 h-3 text-green-400" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-red-400" />
                          )}
                          <span className={game.cryptoData.direction === "up" ? "text-green-400" : "text-red-400"}>
                            {game.cryptoData.percentage}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
