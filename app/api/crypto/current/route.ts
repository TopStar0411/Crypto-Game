import { NextResponse } from "next/server"
import { CryptoService } from "@/lib/crypto-service"

export async function GET() {
  try {
    const cryptoData = await CryptoService.getRandomCryptoData()
    const gameEffect = CryptoService.getCryptoGameEffect(cryptoData)

    return NextResponse.json({
      ...cryptoData,
      gameEffect,
    })
  } catch (error) {
    console.error("Error fetching crypto data:", error)
    return NextResponse.json({ error: "Failed to fetch crypto data" }, { status: 500 })
  }
}
