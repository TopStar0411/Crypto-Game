import { NextResponse } from "next/server"
import { CryptoService } from "@/lib/crypto-service"

export async function GET() {
  try {
    const pairs = CryptoService.getAllCryptoPairs()
    return NextResponse.json(pairs)
  } catch (error) {
    console.error("Error fetching crypto pairs:", error)
    return NextResponse.json({ error: "Failed to fetch crypto pairs" }, { status: 500 })
  }
}
