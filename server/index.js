const express = require("express")
const cors = require("cors")
const { ethers } = require("ethers")
const WebSocket = require("ws")
const Redis = require("redis")
const rateLimit = require("express-rate-limit")
const helmet = require("helmet")
const compression = require("compression")
require("dotenv").config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(helmet())
app.use(compression())
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
)
app.use(express.json({ limit: "10mb" }))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
})
app.use("/api/", limiter)

// Redis client for caching and session management
const redisClient = Redis.createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
})

// Blockchain configuration
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "http://localhost:8545")
const contractAddress = process.env.CONTRACT_ADDRESS
const contractABI = require("./contracts/CryptoGame.json").abi

// WebSocket server for real-time game updates
const wss = new WebSocket.Server({ port: 8080 })

class GameServer {
  constructor() {
    this.games = new Map()
    this.players = new Map()
    this.contract = null
    this.init()
  }

  async init() {
    try {
      // Connect to Redis
      await redisClient.connect()
      console.log("Connected to Redis")

      // Initialize contract
      if (contractAddress) {
        this.contract = new ethers.Contract(contractAddress, contractABI, provider)
        console.log("Smart contract initialized")
      }

      // Setup WebSocket handlers
      this.setupWebSocket()

      console.log("Game server initialized successfully")
    } catch (error) {
      console.error("Failed to initialize game server:", error)
    }
  }

  setupWebSocket() {
    wss.on("connection", (ws, req) => {
      console.log("New WebSocket connection")

      ws.on("message", async (message) => {
        try {
          const data = JSON.parse(message)
          await this.handleWebSocketMessage(ws, data)
        } catch (error) {
          console.error("WebSocket message error:", error)
          ws.send(JSON.stringify({ error: "Invalid message format" }))
        }
      })

      ws.on("close", () => {
        console.log("WebSocket connection closed")
        this.handlePlayerDisconnect(ws)
      })
    })
  }

  async handleWebSocketMessage(ws, data) {
    const { type, payload } = data

    switch (type) {
      case "JOIN_GAME":
        await this.handleJoinGame(ws, payload)
        break
      case "PLAY_CARD":
        await this.handlePlayCard(ws, payload)
        break
      case "GET_GAME_STATE":
        await this.handleGetGameState(ws, payload)
        break
      default:
        ws.send(JSON.stringify({ error: "Unknown message type" }))
    }
  }

  async handleJoinGame(ws, { gameId, playerAddress }) {
    try {
      // Cache player connection
      this.players.set(playerAddress, ws)

      // Get game state from blockchain or cache
      let gameState = await redisClient.get(`game:${gameId}`)

      if (!gameState && this.contract) {
        const contractGameState = await this.contract.getGameState(gameId)
        gameState = {
          gameId,
          player1: contractGameState.player1,
          player2: contractGameState.player2,
          currentTurn: contractGameState.currentTurn.toString(),
          isActive: contractGameState.isActive,
        }

        // Cache for 5 minutes
        await redisClient.setEx(`game:${gameId}`, 300, JSON.stringify(gameState))
      } else if (gameState) {
        gameState = JSON.parse(gameState)
      }

      ws.send(
        JSON.stringify({
          type: "GAME_JOINED",
          payload: { gameState },
        }),
      )
    } catch (error) {
      console.error("Join game error:", error)
      ws.send(JSON.stringify({ error: "Failed to join game" }))
    }
  }

  async handlePlayCard(ws, { gameId, cardIndex, playerAddress }) {
    try {
      // Validate move with smart contract
      if (this.contract) {
        const tx = await this.contract.playCard(gameId, cardIndex)
        await tx.wait()

        // Invalidate cache
        await redisClient.del(`game:${gameId}`)

        // Broadcast update to all players in game
        this.broadcastGameUpdate(gameId, {
          type: "CARD_PLAYED",
          payload: { gameId, cardIndex, playerAddress },
        })
      }
    } catch (error) {
      console.error("Play card error:", error)
      ws.send(JSON.stringify({ error: "Failed to play card" }))
    }
  }

  broadcastGameUpdate(gameId, message) {
    // Broadcast to all connected players
    this.players.forEach((playerWs, playerAddress) => {
      if (playerWs.readyState === WebSocket.OPEN) {
        playerWs.send(JSON.stringify(message))
      }
    })
  }

  handlePlayerDisconnect(ws) {
    // Remove player from active connections
    for (const [playerAddress, playerWs] of this.players.entries()) {
      if (playerWs === ws) {
        this.players.delete(playerAddress)
        break
      }
    }
  }
}

// Initialize game server
const gameServer = new GameServer()

// REST API Routes
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    blockchain: !!gameServer.contract,
  })
})

app.post("/api/game/create", async (req, res) => {
  try {
    const { player1, player2 } = req.body

    if (!player1 || !player2) {
      return res.status(400).json({ error: "Both players required" })
    }

    // Create game on blockchain
    if (gameServer.contract) {
      const tx = await gameServer.contract.createGame(player2)
      const receipt = await tx.wait()

      // Extract game ID from events
      const gameCreatedEvent = receipt.events?.find((e) => e.event === "GameCreated")
      const gameId = gameCreatedEvent?.args?.gameId?.toString()

      res.json({ success: true, gameId })
    } else {
      // Fallback to in-memory game
      const gameId = Math.random().toString(36).substring(2, 15)
      res.json({ success: true, gameId })
    }
  } catch (error) {
    console.error("Create game error:", error)
    res.status(500).json({ error: "Failed to create game" })
  }
})

app.get("/api/game/:gameId", async (req, res) => {
  try {
    const { gameId } = req.params

    // Try cache first
    let gameState = await redisClient.get(`game:${gameId}`)

    if (!gameState && gameServer.contract) {
      const contractGameState = await gameServer.contract.getGameState(gameId)
      gameState = {
        gameId,
        player1: contractGameState.player1,
        player2: contractGameState.player2,
        currentTurn: contractGameState.currentTurn.toString(),
        isActive: contractGameState.isActive,
      }

      // Cache for 1 minute
      await redisClient.setEx(`game:${gameId}`, 60, JSON.stringify(gameState))
    } else if (gameState) {
      gameState = JSON.parse(gameState)
    }

    res.json({ gameState })
  } catch (error) {
    console.error("Get game error:", error)
    res.status(500).json({ error: "Failed to get game state" })
  }
})

app.get("/api/player/:address/stats", async (req, res) => {
  try {
    const { address } = req.params

    if (gameServer.contract) {
      const playerStats = await gameServer.contract.getPlayerStats(address)
      res.json({
        hp: playerStats.hp.toString(),
        armor: playerStats.armor.toString(),
        wins: playerStats.wins.toString(),
        losses: playerStats.losses.toString(),
        isActive: playerStats.isActive,
      })
    } else {
      res.json({ error: "Contract not available" })
    }
  } catch (error) {
    console.error("Get player stats error:", error)
    res.status(500).json({ error: "Failed to get player stats" })
  }
})

app.get("/api/crypto/prices", async (req, res) => {
  try {
    // Try cache first
    let prices = await redisClient.get("crypto:prices")

    if (!prices) {
      // Fetch from external API
      const response = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT","SOLUSDT"]')
      const data = await response.json()

      prices = data.map((coin) => ({
        symbol: coin.symbol,
        price: Number.parseFloat(coin.lastPrice),
        change: Number.parseFloat(coin.priceChangePercent),
      }))

      // Cache for 30 seconds
      await redisClient.setEx("crypto:prices", 30, JSON.stringify(prices))
    } else {
      prices = JSON.parse(prices)
    }

    res.json({ prices })
  } catch (error) {
    console.error("Get crypto prices error:", error)
    // Fallback data
    res.json({
      prices: [
        { symbol: "BTCUSDT", price: 45000, change: 2.5 },
        { symbol: "ETHUSDT", price: 3000, change: -1.2 },
        { symbol: "SOLUSDT", price: 100, change: 5.8 },
      ],
    })
  }
})

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Server error:", error)
  res.status(500).json({ error: "Internal server error" })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Crypto Game Server running on port ${PORT}`)
  console.log(`📡 WebSocket server running on port 8080`)
  console.log(`🔗 Blockchain integration: ${!!gameServer.contract ? "Enabled" : "Disabled"}`)
})

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("Shutting down gracefully...")
  await redisClient.quit()
  process.exit(0)
})
