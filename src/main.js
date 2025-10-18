import { ScrabbleGame } from './ScrabbleGame.js';
import { Renderer } from './Renderer.js';
import { InputHandler } from './InputHandler.js';

// Main application class
class ScrabbleApp {
    constructor() {
        // Wait for DOM to be fully loaded before initializing
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    init() {
        try {
            // Get DOM elements first
            this.canvas = document.getElementById('canvas');
            this.scoresElement = document.getElementById('scores');
            this.playerRackElement = document.getElementById('player-rack');
            this.loadingElement = document.getElementById('loading');
            this.gameContainer = document.getElementById('game-container');
            
            // Show loading indicator
            if (this.loadingElement) {
                this.loadingElement.style.display = 'block';
            }
            
            // Initialize game components
            this.game = new ScrabbleGame();
            this.renderer = new Renderer(this.canvas);
            this.inputHandler = new InputHandler(this.canvas, this.game, this.renderer);
            
            // Initialize the game first before setting up UI
            this.game.initializeGame();
            
            // Now setup UI elements that depend on game state
            this.updateScores();
            this.updatePlayerRack();
            
            this.setupEventListeners();
            
            // Hide loading screen and show game
            if (this.loadingElement) {
                this.loadingElement.style.display = 'none';
            }
            if (this.gameContainer) {
                this.gameContainer.style.display = 'block';
            }
            
            // Start the game loop
            this.gameLoop();
        } catch (error) {
            console.error('Failed to initialize game:', error);
            if (this.loadingElement) {
                this.loadingElement.textContent = 'Error loading game. Please check console for details.';
            }
        }
    }
    
    setupUI() {
        // This method is deprecated, functionality moved to init()
    }
    
    setupEventListeners() {
        // Button event listeners
        const rotateButton = document.getElementById('rotate-board');
        const resetButton = document.getElementById('reset-view');
        const passButton = document.getElementById('pass-turn');
        const exchangeButton = document.getElementById('exchange-tiles');
        const submitButton = document.getElementById('submit-word');
        
        if (rotateButton) {
            rotateButton.addEventListener('click', () => {
                this.renderer.rotateBoard();
            });
        }
        
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                this.renderer.resetView();
            });
        }
        
        if (passButton) {
            passButton.addEventListener('click', () => {
                this.game.passTurn();
                this.updateScores();
                this.updatePlayerRack();
            });
        }
        
        if (exchangeButton) {
            exchangeButton.addEventListener('click', () => {
                this.game.exchangeTiles();
                this.updateScores();
                this.updatePlayerRack();
        });
        }
        
        if (submitButton) {
            submitButton.addEventListener('click', () => {
                const result = this.game.submitWord();
                if (result.valid) {
                    alert(`Valid word! Score: ${result.score}`);
                    this.updateScores();
                    this.updatePlayerRack();
                } else {
                    alert(`Invalid word: ${result.message}`);
                }
            });
        }
    }
    
    updateScores() {
        try {
            if (!this.scoresElement) {
                console.warn('Scores element not found');
                return;
            }
            
            const players = this.game.getPlayers();
            let scoresHTML = '';
            
            players.forEach((player, index) => {
                scoresHTML += `<div>Player ${index + 1}: ${player.score} points</div>`;
            });
            
            this.scoresElement.innerHTML = scoresHTML;
        } catch (error) {
            console.error('Error updating scores:', error);
        }
    }
    
    updatePlayerRack() {
        try {
            if (!this.playerRackElement) {
                console.warn('Player rack element not found');
                return;
            }
            
            const currentPlayer = this.game.getCurrentPlayer();
            
            let rackHTML = '';
            
            // Check if currentPlayer exists and has a rack before accessing
            if (currentPlayer && typeof currentPlayer === 'object' && currentPlayer.hasOwnProperty('rack') && Array.isArray(currentPlayer.rack)) {
                currentPlayer.rack.forEach((tile, index) => {
                    if (tile) {
                        rackHTML += `<div class="tile" data-index="${index}">${tile.letter}</div>`;
                    }
                });
            } else {
                console.warn('Current player or rack not properly initialized:', currentPlayer);
                // Provide a fallback empty rack
                rackHTML = '<div class="empty-rack">Rack not available</div>';
            }
            
            this.playerRackElement.innerHTML = rackHTML;
            
            // Add event listeners to tiles only if they exist
            const tileElements = document.querySelectorAll('.tile');
            if (tileElements.length > 0) {
                tileElements.forEach(tileElement => {
                    tileElement.addEventListener('mousedown', (e) => {
                        const index = parseInt(e.target.dataset.index);
                        if (this.inputHandler) {
                            this.inputHandler.selectTile(index);
                        }
                    });
                });
            }
        } catch (error) {
            console.error('Error updating player rack:', error);
            // Provide a fallback in case of error
            if (this.playerRackElement) {
                this.playerRackElement.innerHTML = '<div class="error-rack">Error loading rack</div>';
            }
        }
    }
    
    gameLoop() {
        try {
            // Update game state
            this.game.update();
            
            // Render the scene
            this.renderer.render(this.game);
        } catch (error) {
            console.error('Error in game loop:', error);
        }
        
        // Continue the loop
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize the app
new ScrabbleApp();
