"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface WalletConnectionProps {
  walletAddress: string | null
  onWalletConnect: (address: string | null) => void
  onShowHistory: () => void
}

export function WalletConnection({ walletAddress, onWalletConnect, onShowHistory }: WalletConnectionProps) {
  const [isConnecting, setIsConnecting] = useState(false)

  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        setIsConnecting(true)
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
        if (accounts.length > 0) {
          onWalletConnect(accounts[0])
        }
      } catch (error) {
        console.error("Failed to connect wallet:", error)
      } finally {
        setIsConnecting(false)
      }
    } else {
      alert("Please install MetaMask to connect your wallet!")
    }
  }

  const disconnectWallet = () => {
    onWalletConnect(null)
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (walletAddress) {
    return (
      <Card className="p-4 bg-black/20 backdrop-blur-sm border-purple-500/20">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <div className="text-white text-sm">
            <div className="font-medium">{formatAddress(walletAddress)}</div>
            <div className="text-gray-400 text-xs">Connected</div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onShowHistory}
              className="text-xs border-purple-500/30 hover:border-purple-500/50 bg-transparent"
            >
              History
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={disconnectWallet}
              className="text-xs border-red-500/30 hover:border-red-500/50 bg-transparent"
            >
              Disconnect
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Button
      onClick={connectWallet}
      disabled={isConnecting}
      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
    >
      {isConnecting ? "Connecting..." : "Connect MetaMask"}
    </Button>
  )
}
