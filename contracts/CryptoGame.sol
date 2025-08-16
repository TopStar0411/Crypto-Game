// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title CryptoGame
 * @dev Smart contract for crypto trading card game with on-chain game state
 */
contract CryptoGame is Ownable, ReentrancyGuard {
    
    struct Player {
        uint256 hp;
        uint256 armor;
        uint256 wins;
        uint256 losses;
        bool isActive;
    }
    
    struct GameState {
        address player1;
        address player2;
        uint256 currentTurn;
        uint256 gameId;
        bool isActive;
        uint256 startTime;
        uint256 lastMoveTime;
    }
    
    struct Card {
        uint256 cardId;
        string cardType;
        uint256 damage;
        uint256 armor;
        string effect;
        bool isActive;
    }
    
    // Game state mappings
    mapping(uint256 => GameState) public games;
    mapping(address => Player) public players;
    mapping(uint256 => mapping(address => Card[])) public playerCards;
    mapping(address => uint256[]) public playerGameHistory;
    
    // Game configuration
    uint256 public constant INITIAL_HP = 100;
    uint256 public constant INITIAL_ARMOR = 0;
    uint256 public constant MAX_CARDS_PER_PLAYER = 5;
    uint256 public constant GAME_TIMEOUT = 300; // 5 minutes
    
    // Events
    event GameCreated(uint256 indexed gameId, address indexed player1, address indexed player2);
    event CardPlayed(uint256 indexed gameId, address indexed player, uint256 cardId, uint256 damage);
    event GameEnded(uint256 indexed gameId, address indexed winner, address indexed loser);
    event PlayerRegistered(address indexed player);
    
    // Modifiers
    modifier gameExists(uint256 _gameId) {
        require(games[_gameId].isActive, "Game does not exist or is not active");
        _;
    }
    
    modifier isPlayerTurn(uint256 _gameId) {
        GameState memory game = games[_gameId];
        require(
            (game.currentTurn % 2 == 0 && msg.sender == game.player1) ||
            (game.currentTurn % 2 == 1 && msg.sender == game.player2),
            "Not your turn"
        );
        _;
    }
    
    modifier gameNotTimedOut(uint256 _gameId) {
        require(
            block.timestamp - games[_gameId].lastMoveTime < GAME_TIMEOUT,
            "Game has timed out"
        );
        _;
    }
    
    constructor() {}
    
    /**
     * @dev Register a new player
     */
    function registerPlayer() external {
        require(!players[msg.sender].isActive, "Player already registered");
        
        players[msg.sender] = Player({
            hp: INITIAL_HP,
            armor: INITIAL_ARMOR,
            wins: 0,
            losses: 0,
            isActive: true
        });
        
        emit PlayerRegistered(msg.sender);
    }
    
    /**
     * @dev Create a new game between two players
     */
    function createGame(address _opponent) external returns (uint256) {
        require(players[msg.sender].isActive, "Player not registered");
        require(players[_opponent].isActive, "Opponent not registered");
        require(msg.sender != _opponent, "Cannot play against yourself");
        
        uint256 gameId = uint256(keccak256(abi.encodePacked(
            msg.sender,
            _opponent,
            block.timestamp,
            block.difficulty
        )));
        
        games[gameId] = GameState({
            player1: msg.sender,
            player2: _opponent,
            currentTurn: 0,
            gameId: gameId,
            isActive: true,
            startTime: block.timestamp,
            lastMoveTime: block.timestamp
        });
        
        // Initialize player cards
        _initializePlayerCards(gameId, msg.sender);
        _initializePlayerCards(gameId, _opponent);
        
        // Reset player HP and armor for new game
        players[msg.sender].hp = INITIAL_HP;
        players[msg.sender].armor = INITIAL_ARMOR;
        players[_opponent].hp = INITIAL_HP;
        players[_opponent].armor = INITIAL_ARMOR;
        
        // Add to game history
        playerGameHistory[msg.sender].push(gameId);
        playerGameHistory[_opponent].push(gameId);
        
        emit GameCreated(gameId, msg.sender, _opponent);
        return gameId;
    }
    
    /**
     * @dev Play a card in the game
     */
    function playCard(uint256 _gameId, uint256 _cardIndex) 
        external 
        gameExists(_gameId)
        isPlayerTurn(_gameId)
        gameNotTimedOut(_gameId)
        nonReentrant
    {
        GameState storage game = games[_gameId];
        Card[] storage cards = playerCards[_gameId][msg.sender];
        
        require(_cardIndex < cards.length, "Invalid card index");
        require(cards[_cardIndex].isActive, "Card already used");
        
        Card storage playedCard = cards[_cardIndex];
        address opponent = (msg.sender == game.player1) ? game.player2 : game.player1;
        
        // Calculate damage after armor reduction
        uint256 actualDamage = _calculateDamage(playedCard.damage, players[opponent].armor);
        
        // Apply damage
        if (players[opponent].hp > actualDamage) {
            players[opponent].hp -= actualDamage;
        } else {
            players[opponent].hp = 0;
        }
        
        // Apply card effects
        _applyCardEffect(playedCard.effect, msg.sender, opponent);
        
        // Mark card as used
        playedCard.isActive = false;
        
        // Update game state
        game.currentTurn++;
        game.lastMoveTime = block.timestamp;
        
        emit CardPlayed(_gameId, msg.sender, playedCard.cardId, actualDamage);
        
        // Check for game end
        if (players[opponent].hp == 0) {
            _endGame(_gameId, msg.sender, opponent);
        }
    }
    
    /**
     * @dev End a game and update player stats
     */
    function _endGame(uint256 _gameId, address _winner, address _loser) internal {
        games[_gameId].isActive = false;
        
        players[_winner].wins++;
        players[_loser].losses++;
        
        emit GameEnded(_gameId, _winner, _loser);
    }
    
    /**
     * @dev Initialize cards for a player
     */
    function _initializePlayerCards(uint256 _gameId, address _player) internal {
        // Create 5 random cards for the player
        for (uint256 i = 0; i < MAX_CARDS_PER_PLAYER; i++) {
            uint256 cardType = uint256(keccak256(abi.encodePacked(_player, i, block.timestamp))) % 3;
            
            if (cardType == 0) { // Attack card
                playerCards[_gameId][_player].push(Card({
                    cardId: i,
                    cardType: "attack",
                    damage: 15 + (uint256(keccak256(abi.encodePacked(_player, i))) % 10),
                    armor: 0,
                    effect: "none",
                    isActive: true
                }));
            } else if (cardType == 1) { // Defense card
                playerCards[_gameId][_player].push(Card({
                    cardId: i,
                    cardType: "defense",
                    damage: 0,
                    armor: 10 + (uint256(keccak256(abi.encodePacked(_player, i))) % 5),
                    effect: "armor",
                    isActive: true
                }));
            } else { // Special card
                playerCards[_gameId][_player].push(Card({
                    cardId: i,
                    cardType: "special",
                    damage: 20,
                    armor: 5,
                    effect: "heal",
                    isActive: true
                }));
            }
        }
    }
    
    /**
     * @dev Calculate actual damage after armor reduction
     */
    function _calculateDamage(uint256 _baseDamage, uint256 _armor) internal pure returns (uint256) {
        if (_armor >= _baseDamage) {
            return 1; // Minimum damage
        }
        return _baseDamage - _armor;
    }
    
    /**
     * @dev Apply card effects
     */
    function _applyCardEffect(string memory _effect, address _player, address _opponent) internal {
        bytes32 effectHash = keccak256(abi.encodePacked(_effect));
        
        if (effectHash == keccak256(abi.encodePacked("armor"))) {
            players[_player].armor += 5;
        } else if (effectHash == keccak256(abi.encodePacked("heal"))) {
            players[_player].hp += 10;
            if (players[_player].hp > INITIAL_HP) {
                players[_player].hp = INITIAL_HP;
            }
        }
    }
    
    /**
     * @dev Get game state
     */
    function getGameState(uint256 _gameId) external view returns (GameState memory) {
        return games[_gameId];
    }
    
    /**
     * @dev Get player cards for a game
     */
    function getPlayerCards(uint256 _gameId, address _player) external view returns (Card[] memory) {
        return playerCards[_gameId][_player];
    }
    
    /**
     * @dev Get player stats
     */
    function getPlayerStats(address _player) external view returns (Player memory) {
        return players[_player];
    }
    
    /**
     * @dev Get player game history
     */
    function getPlayerGameHistory(address _player) external view returns (uint256[] memory) {
        return playerGameHistory[_player];
    }
    
    /**
     * @dev Emergency function to end timed out games
     */
    function endTimedOutGame(uint256 _gameId) external gameExists(_gameId) {
        require(
            block.timestamp - games[_gameId].lastMoveTime >= GAME_TIMEOUT,
            "Game has not timed out yet"
        );
        
        GameState memory game = games[_gameId];
        address winner = (game.currentTurn % 2 == 0) ? game.player2 : game.player1;
        address loser = (winner == game.player1) ? game.player2 : game.player1;
        
        _endGame(_gameId, winner, loser);
    }
}
