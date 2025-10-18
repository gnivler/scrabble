// Handle user input for the Scrabble game
export class InputHandler {
    constructor(canvas, game, renderer) {
        this.canvas = canvas;
        this.game = game;
        this.renderer = renderer;
        this.selectedTileIndex = null;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Mouse event listeners for rotation
        let isDragging = false;
        let previousX = 0;
        let previousY = 0;
        
        this.canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            previousX = e.clientX;
            previousY = e.clientY;
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const deltaX = e.clientX - previousX;
                const deltaY = e.clientY - previousY;
                
                // Rotate camera based on mouse movement
                this.renderer.cameraAngle += deltaX * 0.01;
                this.renderer.cameraHeight -= deltaY * 0.05;
                
                // Limit camera height
                this.renderer.cameraHeight = Math.max(5, Math.min(30, this.renderer.cameraHeight));
                
                previousX = e.clientX;
                previousY = e.clientY;
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            isDragging = false;
        });
        
        // Mouse wheel for zooming
        this.canvas.addEventListener('wheel', (e) => {
            this.renderer.cameraDistance += e.deltaY * 0.01;
            this.renderer.cameraDistance = Math.max(10, Math.min(50, this.renderer.cameraDistance));
            e.preventDefault();
        });
    }
    
    selectTile(index) {
        this.selectedTileIndex = index;
        console.log(`Selected tile at index ${index}`);
    }
}