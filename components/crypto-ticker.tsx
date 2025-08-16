"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ApiClient, ApiError } from "@/lib/api-client"

interface CryptoData {
  symbol: string
  displayName: string
  direction: "up" | "down"
  changePercent: number
  price: number
  timestamp: number
}

export function CryptoTicker() {
  const [cryptoData, setCryptoData] = useState<CryptoData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCryptoData = async () => {
      try {
        setError(null)
        const data = await ApiClient.getCurrentCrypto()
        setCryptoData(data)
      } catch (error) {
        console.error("Error fetching crypto data:", error)
        if (error instanceof ApiError) {
          setError(error.message)
        } else {
          setError("Failed to load market data")
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchCryptoData()
    const interval = setInterval(fetchCryptoData, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="py-4">
          <div className="text-center text-muted-foreground">Loading market data...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="py-4">
          <div className="text-center text-destructive">Market data unavailable: {error}</div>
        </CardContent>
      </Card>
    )
  }

  if (!cryptoData) {
    return null
  }

  return (
    <Card className="border-border bg-card">
      <CardContent className="py-4">
        <div className="flex items-center justify-center space-x-4">
          <div className="text-lg font-bold text-card-foreground">
            {cryptoData.displayName} ({cryptoData.symbol})
          </div>
          <div className="font-mono text-lg">${cryptoData.price.toLocaleString()}</div>
          <Badge
            variant={cryptoData.direction === "up" ? "default" : "destructive"}
            className={cryptoData.direction === "up" ? "bg-primary text-primary-foreground" : ""}
          >
            {cryptoData.direction === "up" ? "↗" : "↘"} {cryptoData.changePercent.toFixed(2)}%
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
