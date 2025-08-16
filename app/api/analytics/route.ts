import { NextResponse } from "next/server"
import { GameAnalytics } from "@/lib/game-analytics"

export async function GET() {
  try {
    const metrics = GameAnalytics.getMetrics()
    const recentEvents = GameAnalytics.getRecentEvents(20)

    return NextResponse.json({
      metrics,
      recentEvents,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
