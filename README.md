# Crypto-Game: Trading Card Battle Arena

A playable prototype of a crypto-powered trading card game where real cryptocurrency market movements influence battle outcomes. Players engage in turn-based combat using strategic cards while live market data affects damage multipliers and special abilities.

## Features

### Backend (Next.js API Routes)
- **Game Engine**: Complete turn-based combat system with HP, armor, and status effects
- **Crypto Integration**: Real-time price data from Binance API (BTC, ETH, BNB, ADA, SOL, MATIC)
- **AI Opponent**: Simple AI that makes random card choices
- **In-Memory Storage**: Game state management without database dependency
- **REST Endpoints**: Full API for game creation, state management, and turn execution

### Frontend (Next.js + TypeScript)
- **Modern UI**: Clean, crypto-themed interface with emerald and orange color scheme
- **Real-Time Data**: Live cryptocurrency price ticker with market direction indicators
- **Interactive Cards**: 6 unique cards with attack, defense, and special abilities
- **Player Stats**: Dynamic HP bars, armor tracking, and status effect displays
- **Battle Log**: Turn-by-turn combat history with crypto market context
- **Game Results**: Victory/defeat screens with match summaries

### Game Mechanics
- **Crypto Multipliers**: Market volatility affects damage (up to 2x for extreme moves)
- **Status Effects**: Poison, weakness, strength, and shield effects
- **Card Types**: Attack cards benefit from bull markets, defense cards from bear markets
- **Turn-Based Combat**: Strategic card selection with real-time market influence

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation & Setup

1. **Clone or download the project files**

2. **Install dependencies**
   \`\`\`bash
   npm install
   # or
   yarn install
   \`\`\`

3. **Start the development server**
   \`\`\`bash
   npm run dev
   # or
   yarn dev
   \`\`\`

4. **Open your browser**
   Navigate to `http://localhost:3000`

5. **Start playing!**
   - Enter your player name
   - Select cards strategically based on market conditions
   - Watch crypto prices influence your battle outcomes

## How to Play

1. **Game Setup**: Enter your name to create a new game
2. **Card Selection**: Choose from 6 available cards each turn:
   - **Fire Strike**: High damage attack (25 + crypto bonus)
   - **Ice Shard**: Moderate damage + weakness effect
   - **Shield Wall**: Defensive armor boost
   - **Poison Dart**: Damage over time effect
   - **Berserker Rage**: Damage + strength buff
   - **Healing Potion**: Armor + status cleanse

3. **Market Influence**: 
   - Bull markets (crypto up) boost attack card damage
   - Bear markets (crypto down) can benefit defensive plays
   - High volatility (>10% moves) doubles damage multipliers

4. **Victory Conditions**: Reduce opponent HP to 0 while surviving their attacks

## API Endpoints

### Game Management
- `POST /api/game/create` - Create new game
- `GET /api/game/[gameId]` - Get game state
- `POST /api/game/[gameId]/play` - Play a turn
- `POST /api/game/[gameId]/restart` - Restart game

### Crypto Data
- `GET /api/crypto/current` - Get current market data
- `GET /api/crypto/pairs` - List available crypto pairs

## Technical Architecture

### Backend Structure
\`\`\`
lib/
├── game-engine.ts      # Core game logic and state management
├── crypto-service.ts   # Cryptocurrency API integration
└── api-client.ts       # Frontend API client with error handling

app/api/
├── game/              # Game management endpoints
└── crypto/            # Cryptocurrency data endpoints
\`\`\`

### Frontend Components
\`\`\`
components/
├── game-setup.tsx     # Player name input and game creation
├── game-board.tsx     # Main game interface
├── player-stats.tsx   # HP, armor, and status displays
├── game-card.tsx      # Interactive card components
├── crypto-ticker.tsx  # Real-time market data display
├── turn-log.tsx       # Battle history
└── game-result.tsx    # Victory/defeat screens
\`\`\`

## Development Notes

- **TypeScript**: Full type safety across frontend and backend
- **Error Handling**: Comprehensive error states and user feedback
- **Responsive Design**: Mobile-friendly interface
- **Real-Time Updates**: 30-second crypto data refresh intervals
- **Fallback Systems**: Graceful degradation when APIs are unavailable

## Future Enhancements

- Multiplayer support
- Card deck customization
- Tournament modes
- More cryptocurrency pairs
- Advanced AI opponents
- Persistent game statistics

---

**Built with**: Next.js, TypeScript, Tailwind CSS, Radix UI, Binance API
