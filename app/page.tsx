"use client"

import { useState, useEffect } from "react"
import { GameSetup } from "@/components/game-setup"
import { GameBoard } from "@/components/game-board"
import { WalletConnection } from "@/components/wallet-connection"
import { UserHistory } from "@/components/user-history"
import type { GameState } from "@/types/game"

export default function Home() {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [gameHistory, setGameHistory] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)

  // Load game history from localStorage when wallet connects
  useEffect(() => {
    if (walletAddress) {
      const savedHistory = localStorage.getItem(`crypto-game-history-${walletAddress}`)
      if (savedHistory) {
        setGameHistory(JSON.parse(savedHistory))
      }
    }
  }, [walletAddress])

  const handleGameStart = (newGameState: GameState) => {
    setGameState(newGameState)
  }

  const handleGameEnd = (finalGameState: GameState) => {
    // Save game to history if wallet is connected
    if (walletAddress && finalGameState) {
      const gameRecord = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        result: finalGameState.gameStatus,
        playerHp: finalGameState.player?.hp || 0,
        opponentHp: finalGameState.opponent?.hp || 0,
        turnsPlayed: finalGameState.turnHistory?.length || 0,
        cryptoData: finalGameState.cryptoResult,
        walletAddress,
      }

      const updatedHistory = [gameRecord, ...gameHistory].slice(0, 50) // Keep last 50 games
      setGameHistory(updatedHistory)
      localStorage.setItem(`crypto-game-history-${walletAddress}`, JSON.stringify(updatedHistory))
    }

    setGameState(null)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="absolute top-4 right-4 z-50">
        <WalletConnection
          walletAddress={walletAddress}
          onWalletConnect={setWalletAddress}
          onShowHistory={() => setShowHistory(true)}
        />
      </div>

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
            {walletAddress && (
              <>
                <span>•</span>
                <span>🔗 Wallet connected</span>
              </>
            )}
          </div>
        </header>

        {!gameState ? (
          <div className="max-w-md mx-auto">
            <GameSetup onGameStart={handleGameStart} />
          </div>
        ) : (
          <GameBoard
            gameState={gameState}
            onGameStateUpdate={setGameState}
            onGameEnd={handleGameEnd}
            walletAddress={walletAddress}
          />
        )}
      </div>

      {showHistory && (
        <UserHistory gameHistory={gameHistory} walletAddress={walletAddress} onClose={() => setShowHistory(false)} />
      )}
    </main>
  )
}
