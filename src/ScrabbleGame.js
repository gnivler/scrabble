// Scrabble game logic
export class ScrabbleGame {
    constructor() {
        try {
            // Define point values for letters first
            this.letterValues = {
                'A': 1, 'E': 1, 'I': 1, 'L': 1, 'N': 1, 'O': 1, 'R': 1, 'S': 1, 'T': 1, 'U': 1,
                'D': 2, 'G': 2,
                'B': 3, 'C': 3, 'M': 3, 'P': 3,
                'F': 4, 'H': 4, 'V': 4, 'W': 4, 'Y': 4,
                'K': 5,
                'J': 8, 'X': 8,
                'Q': 10, 'Z': 10,
                ' ': 0  // Blank tile
            };
            
            // Initialize basic properties
            this.board = [];
            this.players = [];
            this.currentPlayerIndex = 0;
            this.selectedTiles = [];
            this.gameOver = false;
            
            // These will be initialized by methods
            this.tileBag = [];
            this.squareMultipliers = {};
        } catch (error) {
            console.error('Error initializing ScrabbleGame:', error);
            throw new Error('Failed to initialize Scrabble game: ' + error.message);
        }
    }
    
    createBoard() {
        // Create 15x15 board
        const board = [];
        for (let i = 0; i < 15; i++) {
            board[i] = [];
            for (let j = 0; j < 15; j++) {
                board[i][j] = null; // Empty cell
            }
        }
        return board;
    }
    
    createSquareMultipliers() {
        // Define special squares according to Scrabble rules
        const multipliers = {};
        
        // Triple Word Scores (dark red)
        const tripleWordSquares = [
            [0, 0], [0, 7], [0, 14],
            [7, 0], [7, 14],
            [14, 0], [14, 7], [14, 14]
        ];
        
        // Double Word Scores (light red)
        const doubleWordSquares = [
            [1, 1], [2, 2], [3, 3], [4, 4],
            [1, 13], [2, 12], [3, 11], [4, 10],
            [10, 4], [11, 3], [12, 2], [13, 1],
            [10, 10], [11, 11], [12, 12], [13, 13]
        ];
        
        // Triple Letter Scores (dark blue)
        const tripleLetterSquares = [
            [1, 5], [1, 9],
            [5, 1], [5, 5], [5, 9], [5, 13],
            [9, 1], [9, 5], [9, 9], [9, 13],
            [13, 5], [13, 9]
        ];
        
        // Double Letter Scores (light blue)
        const doubleLetterSquares = [
            [0, 3], [0, 11],
            [2, 6], [2, 8],
            [3, 0], [3, 7], [3, 14],
            [6, 2], [6, 6], [6, 8], [6, 12],
            [7, 3], [7, 11],
            [8, 2], [8, 6], [8, 8], [8, 12],
            [11, 0], [11, 7], [11, 14],
            [12, 6], [12, 8],
            [14, 3], [14, 11]
        ];
        
        tripleWordSquares.forEach(pos => {
            const key = `${pos[0]},${pos[1]}`;
            multipliers[key] = { type: 'tripleWord', applied: false };
        });
        
        doubleWordSquares.forEach(pos => {
            const key = `${pos[0]},${pos[1]}`;
            multipliers[key] = { type: 'doubleWord', applied: false };
        });
        
        tripleLetterSquares.forEach(pos => {
            const key = `${pos[0]},${pos[1]}`;
            multipliers[key] = { type: 'tripleLetter', applied: false };
        });
        
        doubleLetterSquares.forEach(pos => {
            const key = `${pos[0]},${pos[1]}`;
            multipliers[key] = { type: 'doubleLetter', applied: false };
        });
        
        return multipliers;
    }
    
    createTileBag() {
        // Create the tile bag according to Scrabble rules
        const tileBag = [];
        
        // Define tile distribution (letter, count, points)
        const tileDistribution = [
            [' ', 2, 0],  // Blank tiles
            ['A', 9, 1], ['B', 2, 3], ['C', 2, 3], ['D', 4, 2], ['E', 12, 1],
            ['F', 2, 4], ['G', 3, 2], ['H', 2, 4], ['I', 9, 1], ['J', 1, 8],
            ['K', 1, 5], ['L', 4, 1], ['M', 2, 3], ['N', 6, 1], ['O', 8, 1],
            ['P', 2, 3], ['Q', 1, 10], ['R', 6, 1], ['S', 4, 1], ['T', 6, 1],
            ['U', 4, 1], ['V', 2, 4], ['W', 2, 4], ['X', 1, 8], ['Y', 2, 4],
            ['Z', 1, 10]
        ];
        
        // Add tiles to bag
        tileDistribution.forEach(([letter, count, points]) => {
            for (let i = 0; i < count; i++) {
                tileBag.push({
                    letter: letter,
                    points: points,
                    isBlank: letter === ' '
                });
            }
        });
        
        // Shuffle the bag
        this.shuffleArray(tileBag);
        
        return tileBag;
    }
    
    shuffleArray(array) {
        // Fisher-Yates shuffle algorithm
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    initializeGame() {
        try {
            // Initialize the board and other components
            this.board = this.createBoard();
            this.tileBag = this.createTileBag();
            this.squareMultipliers = this.createSquareMultipliers();
            
            // Initialize players (2-4 players)
            const numPlayers = 2; // Start with 2 players for simplicity
            for (let i = 0; i < numPlayers; i++) {
                this.players.push({
                    id: i,
                    name: `Player ${i + 1}`,
                    score: 0,
                    rack: []
                });
            }
            
            // Draw initial tiles for each player
            this.players.forEach(player => {
                this.drawTilesForPlayer(player, 7);
            });
            
            // Determine starting player by drawing tiles
            this.determineStartingPlayer();
        } catch (error) {
            console.error('Error in initializeGame:', error);
            throw new Error('Failed to initialize game: ' + error.message);
        }
    }
    
    drawTilesForPlayer(player, count) {
        // Draw tiles from bag to fill player's rack
        while (player.rack.length < 7 && this.tileBag.length > 0) {
            player.rack.push(this.tileBag.pop());
        }
    }
    
    determineStartingPlayer() {
        // Simplified version - Player 0 starts
        this.currentPlayerIndex = 0;
    }
    
    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }
    
    getPlayers() {
        return this.players;
    }
    
    passTurn() {
        // Pass the turn to the next player
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    }
    
    exchangeTiles() {
        // Exchange tiles logic
        const currentPlayer = this.getCurrentPlayer();
        
        // For simplicity, we'll just redraw all tiles
        // In a full implementation, we'd allow selection of specific tiles
        currentPlayer.rack = [];
        this.drawTilesForPlayer(currentPlayer, 7);
        
        // Pass turn after exchanging
        this.passTurn();
    }
    
    submitWord() {
        // Validate and score submitted word
        // This is a simplified implementation
        
        // Check if it's the first move (must cover the center star)
        const isFirstMove = this.isFirstMove();
        if (isFirstMove) {
            if (!this.coversCenter()) {
                return { valid: false, message: "First word must cover the center square" };
            }
        }
        
        // Calculate score
        const score = this.calculateScore();
        
        // Add score to current player
        const currentPlayer = this.getCurrentPlayer();
        currentPlayer.score += score;
        
        // Draw new tiles
        this.drawTilesForPlayer(currentPlayer, 7);
        
        // Pass turn
        this.passTurn();
        
        return { valid: true, score: score };
    }
    
    isFirstMove() {
        // Check if any tiles are placed on the board
        for (let i = 0; i < 15; i++) {
            for (let j = 0; j < 15; j++) {
                if (this.board[i][j] !== null) {
                    return false;
                }
            }
        }
        return true;
    }
    
    coversCenter() {
        // Check if center square (7,7) is covered
        return this.board[7][7] !== null;
    }
    
    calculateScore() {
        // Simplified scoring - in a real implementation we'd check the actual word
        // For now, we'll return a random score for demonstration
        return Math.floor(Math.random() * 50) + 10;
    }
    
    selectTile(index) {
        // Select a tile from the player's rack
        this.selectedTiles.push(index);
    }
    
    update() {
        // Update game state
        // This would include things like animations, checking for game end, etc.
    }
}
