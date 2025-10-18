// WebGL renderer for Scrabble game
export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        
        // Try to get WebGL context with error handling
        try {
            this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        } catch (e) {
            console.error('Error getting WebGL context:', e);
            throw new Error('WebGL not supported or unavailable: ' + e.message);
        }

        if (!this.gl) {
            throw new Error('WebGL not supported');
        }

        this.setupWebGL();
        this.setupShaders();
        this.setupGeometry();

        // Camera variables
        this.cameraAngle = 0;
        this.cameraHeight = 15;
        this.cameraDistance = 25;

        // Resize handling
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }


    setupWebGL() {
        // Set clear color to light blue (background)
        this.gl.clearColor(0.8, 0.85, 1.0, 1.0);

        // Enable depth testing
        this.gl.enable(this.gl.DEPTH_TEST);

        // Enable blending for transparency
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    }

    setupShaders() {
        // Vertex shader source
        const vertexShaderSource = `
        attribute vec3 aPosition;
        attribute vec3 aColor;
        
        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;
        
        varying vec3 vColor;
        
        void main() {
            gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
            vColor = aColor;
        }
    `;

        // Fragment shader source
        const fragmentShaderSource = `
        precision mediump float;
        
        varying vec3 vColor;
        
        void main() {
            gl_FragColor = vec4(vColor, 1.0);
        }
    `;

        // Compile shaders
        this.vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexShaderSource);
        this.fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);

        // Create shader program
        this.shaderProgram = this.createProgram(this.vertexShader, this.fragmentShader);

        // Get attribute and uniform locations
        this.positionAttributeLocation = this.gl.getAttribLocation(this.shaderProgram, 'aPosition');
        this.colorAttributeLocation = this.gl.getAttribLocation(this.shaderProgram, 'aColor');
        this.modelViewMatrixLocation = this.gl.getUniformLocation(this.shaderProgram, 'uModelViewMatrix');
        this.projectionMatrixLocation = this.gl.getUniformLocation(this.shaderProgram, 'uProjectionMatrix');
    }

    compileShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compilation error:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    createProgram(vertexShader, fragmentShader) {
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Program linking error:', this.gl.getProgramInfoLog(program));
            this.gl.deleteProgram(program);
            return null;
        }

        return program;
    }

    setupGeometry() {
        // Create board geometry
        this.createBoardGeometry();

        // Create tile geometry
        this.createTileGeometry();
    }

    createBoardGeometry() {
        // Create vertices for the Scrabble board (15x15 grid)
        const vertices = [];
        const colors = [];
        const indices = [];

        // Board is 15x15 squares, each square is 1 unit
        const boardSize = 15;
        const squareSize = 1.0;

        // Create vertices for each square
        for (let row = 0; row < boardSize; row++) {
            for (let col = 0; col < boardSize; col++) {
                const x = col * squareSize;
                const z = row * squareSize;

                // Square vertices (y = 0 for flat board)
                const squareVertices = [
                    x, 0, z,              // Bottom-left
                    x + squareSize, 0, z, // Bottom-right
                    x + squareSize, 0, z + squareSize, // Top-right
                    x, 0, z + squareSize  // Top-left
                ];

                // Determine square color based on multipliers
                let r, g, b;
                const key = `${row},${col}`;

                if (this.isTripleWordSquare(row, col)) {
                    // Dark red
                    r = 0.7; g = 0.1; b = 0.1;
                } else if (this.isDoubleWordSquare(row, col)) {
                    // Light red
                    r = 1.0; g = 0.6; b = 0.6;
                } else if (this.isTripleLetterSquare(row, col)) {
                    // Dark blue
                    r = 0.1; g = 0.1; b = 0.7;
                } else if (this.isDoubleLetterSquare(row, col)) {
                    // Light blue
                    r = 0.6; g = 0.6; b = 1.0;
                } else if (row === 7 && col === 7) {
                    // Center star (pink)
                    r = 1.0; g = 0.5; b = 0.8;
                } else {
                    // Regular square (light beige)
                    r = 0.9; g = 0.8; b = 0.6;
                }

                // Add vertices and colors
                for (let i = 0; i < 4; i++) {
                    vertices.push(squareVertices[i * 3], squareVertices[i * 3 + 1], squareVertices[i * 3 + 2]);
                    colors.push(r, g, b);
                }

                // Add indices for two triangles per square
                const baseIndex = (row * boardSize + col) * 4;
                indices.push(baseIndex, baseIndex + 1, baseIndex + 2);
                indices.push(baseIndex, baseIndex + 2, baseIndex + 3);
            }
        }

        // Create WebGL buffers
        this.boardVertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.boardVertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);

        this.boardColorBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.boardColorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.STATIC_DRAW);

        this.boardIndexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.boardIndexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), this.gl.STATIC_DRAW);

        this.boardIndexCount = indices.length;
    }

    isTripleWordSquare(row, col) {
        const tripleWordPositions = [
            [0, 0], [0, 7], [0, 14],
            [7, 0], [7, 14],
            [14, 0], [14, 7], [14, 14]
        ];

        return tripleWordPositions.some(pos => pos[0] === row && pos[1] === col);
    }

    isDoubleWordSquare(row, col) {
        const doubleWordPositions = [
            [1, 1], [2, 2], [3, 3], [4, 4],
            [1, 13], [2, 12], [3, 11], [4, 10],
            [10, 4], [11, 3], [12, 2], [13, 1],
            [10, 10], [11, 11], [12, 12], [13, 13]
        ];

        return doubleWordPositions.some(pos => pos[0] === row && pos[1] === col);
    }

    isTripleLetterSquare(row, col) {
        const tripleLetterPositions = [
            [1, 5], [1, 9],
            [5, 1], [5, 5], [5, 9], [5, 13],
            [9, 1], [9, 5], [9, 9], [9, 13],
            [13, 5], [13, 9]
        ];

        return tripleLetterPositions.some(pos => pos[0] === row && pos[1] === col);
    }

    isDoubleLetterSquare(row, col) {
        const doubleLetterPositions = [
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

        return doubleLetterPositions.some(pos => pos[0] === row && pos[1] === col);
    }

    createTileGeometry() {
        // Create a simple cube geometry for tiles
        const vertices = [
            // Front face
            -0.4, -0.1, 0.2,
            0.4, -0.1, 0.2,
            0.4, 0.1, 0.2,
            -0.4, 0.1, 0.2,

            // Back face
            -0.4, -0.1, -0.2,
            -0.4, 0.1, -0.2,
            0.4, 0.1, -0.2,
            0.4, -0.1, -0.2,

            // Top face
            -0.4, 0.1, -0.2,
            -0.4, 0.1, 0.2,
            0.4, 0.1, 0.2,
            0.4, 0.1, -0.2,

            // Bottom face
            -0.4, -0.1, -0.2,
            0.4, -0.1, -0.2,
            0.4, -0.1, 0.2,
            -0.4, -0.1, 0.2,

            // Right face
            0.4, -0.1, -0.2,
            0.4, 0.1, -0.2,
            0.4, 0.1, 0.2,
            0.4, -0.1, 0.2,

            // Left face
            -0.4, -0.1, -0.2,
            -0.4, -0.1, 0.2,
            -0.4, 0.1, 0.2,
            -0.4, 0.1, -0.2
        ];

        const colors = [
            // Front face (yellow)
            1.0, 1.0, 0.0,
            1.0, 1.0, 0.0,
            1.0, 1.0, 0.0,
            1.0, 1.0, 0.0,

            // Back face (yellow)
            1.0, 1.0, 0.0,
            1.0, 1.0, 0.0,
            1.0, 1.0, 0.0,
            1.0, 1.0, 0.0,

            // Top face (golden)
            1.0, 0.9, 0.0,
            1.0, 0.9, 0.0,
            1.0, 0.9, 0.0,
            1.0, 0.9, 0.0,

            // Bottom face (dark yellow)
            0.8, 0.8, 0.0,
            0.8, 0.8, 0.0,
            0.8, 0.8, 0.0,
            0.8, 0.8, 0.0,

            // Right face (yellow)
            1.0, 1.0, 0.0,
            1.0, 1.0, 0.0,
            1.0, 1.0, 0.0,
            1.0, 1.0, 0.0,

            // Left face (yellow)
            1.0, 1.0, 0.0,
            1.0, 1.0, 0.0,
            1.0, 1.0, 0.0,
            1.0, 1.0, 0.0
        ];

        const indices = [
            0, 1, 2, 0, 2, 3,    // front
            4, 5, 6, 4, 6, 7,    // back
            8, 9, 10, 8, 10, 11,   // top
            12, 13, 14, 12, 14, 15,   // bottom
            16, 17, 18, 16, 18, 19,   // right
            20, 21, 22, 20, 22, 23    // left
        ];

        // Create WebGL buffers
        this.tileVertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.tileVertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);

        this.tileColorBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.tileColorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.STATIC_DRAW);

        this.tileIndexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.tileIndexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), this.gl.STATIC_DRAW);

        this.tileIndexCount = indices.length;
    }

    resizeCanvas() {
        // Set canvas size to match display size
        const displayWidth = this.canvas.clientWidth;
        const displayHeight = this.canvas.clientHeight;

        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
    }
    
    forceRefresh() {
        // Force a resize and re-render
        this.resizeCanvas();
        // Clear the canvas
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    rotateBoard() {
        // Rotate the board view
        this.cameraAngle += Math.PI / 8; // 22.5 degrees
    }

    resetView() {
        // Reset camera to default position
        this.cameraAngle = 0;
        this.cameraHeight = 15;
        this.cameraDistance = 25;
    }

    render(game) {
        try {
            // Clear the canvas
            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

            // Use shader program
            this.gl.useProgram(this.shaderProgram);

            // Set up projection matrix (perspective)
            const projectionMatrix = this.createPerspectiveMatrix(
                45 * Math.PI / 180,   // Field of view
                this.canvas.width / this.canvas.height, // Aspect ratio
                0.1,                  // Near clipping plane
                100.0                 // Far clipping plane
            );

            // Set up camera position
            const cameraX = this.cameraDistance * Math.sin(this.cameraAngle);
            const cameraZ = this.cameraDistance * Math.cos(this.cameraAngle);
            const cameraY = this.cameraHeight;

            const viewMatrix = this.createLookAtMatrix(
                [cameraX, cameraY, cameraZ],  // Camera position
                [7.5, 0, 7.5],               // Look at center of board (7.5, 7.5 in 15x15 grid)
                [0, 1, 0]                    // Up vector
            );

            // Combine view and model matrices (identity for static board)
            const modelViewMatrix = viewMatrix;

            // Render the board
            this.renderBoard(modelViewMatrix, projectionMatrix);

            // Render tiles on board
            this.renderBoardTiles(game, modelViewMatrix, projectionMatrix);
        } catch (error) {
            console.error('Error in render loop:', error);
        }
    }

    renderBoard(modelViewMatrix, projectionMatrix) {
        // Bind vertex buffer
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.boardVertexBuffer);
        this.gl.enableVertexAttribArray(this.positionAttributeLocation);
        this.gl.vertexAttribPointer(this.positionAttributeLocation, 3, this.gl.FLOAT, false, 0, 0);

        // Bind color buffer
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.boardColorBuffer);
        this.gl.enableVertexAttribArray(this.colorAttributeLocation);
        this.gl.vertexAttribPointer(this.colorAttributeLocation, 3, this.gl.FLOAT, false, 0, 0);

        // Bind index buffer
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.boardIndexBuffer);

        // Set uniforms
        this.gl.uniformMatrix4fv(this.modelViewMatrixLocation, false, modelViewMatrix);
        this.gl.uniformMatrix4fv(this.projectionMatrixLocation, false, projectionMatrix);

        // Draw
        this.gl.drawElements(this.gl.TRIANGLES, this.boardIndexCount, this.gl.UNSIGNED_SHORT, 0);
    }

    renderBoardTiles(game, modelViewMatrix, projectionMatrix) {
        // Render tiles that have been placed on the board
        for (let row = 0; row < 15; row++) {
            for (let col = 0; col < 15; col++) {
                const tile = game.board[row][col];
                if (tile) {
                    // Calculate position for this tile
                    const x = col + 0.5; // Center of square
                    const z = row + 0.5; // Center of square
                    const y = 0.1;      // Slightly above board

                    // Create model matrix for this tile position
                    const tileModelMatrix = this.createTranslationMatrix(x, y, z);

                    // Combine with view matrix
                    const mvMatrix = this.multiplyMatrices(modelViewMatrix, tileModelMatrix);

                    // Render the tile
                    this.renderTile(mvMatrix, projectionMatrix);
                }
            }
        }
    }

    renderTile(modelViewMatrix, projectionMatrix) {
        // Bind vertex buffer
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.tileVertexBuffer);
        this.gl.enableVertexAttribArray(this.positionAttributeLocation);
        this.gl.vertexAttribPointer(this.positionAttributeLocation, 3, this.gl.FLOAT, false, 0, 0);

        // Bind color buffer
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.tileColorBuffer);
        this.gl.enableVertexAttribArray(this.colorAttributeLocation);
        this.gl.vertexAttribPointer(this.colorAttributeLocation, 3, this.gl.FLOAT, false, 0, 0);

        // Bind index buffer
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.tileIndexBuffer);

        // Set uniforms
        this.gl.uniformMatrix4fv(this.modelViewMatrixLocation, false, modelViewMatrix);
        this.gl.uniformMatrix4fv(this.projectionMatrixLocation, false, projectionMatrix);

        // Draw
        this.gl.drawElements(this.gl.TRIANGLES, this.tileIndexCount, this.gl.UNSIGNED_SHORT, 0);
    }

    createPerspectiveMatrix(fov, aspect, near, far) {
        const f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
        const rangeInv = 1.0 / (near - far);

        return [
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (near + far) * rangeInv, -1,
            0, 0, near * far * rangeInv * 2, 0
        ];
    }

    createLookAtMatrix(cameraPosition, target, up) {
        const zAxis = this.normalize([
            cameraPosition[0] - target[0],
            cameraPosition[1] - target[1],
            cameraPosition[2] - target[2]
        ]);

        const xAxis = this.normalize(this.cross(up, zAxis));
        const yAxis = this.cross(zAxis, xAxis);

        return [
            xAxis[0], yAxis[0], zAxis[0], 0,
            xAxis[1], yAxis[1], zAxis[1], 0,
            xAxis[2], yAxis[2], zAxis[2], 0,
            -this.dot(xAxis, cameraPosition), -this.dot(yAxis, cameraPosition), -this.dot(zAxis, cameraPosition), 1
        ];
    }

    createTranslationMatrix(tx, ty, tz) {
        return [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            tx, ty, tz, 1
        ];
    }

    multiplyMatrices(a, b) {
        const result = [];

        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                let sum = 0;
                for (let k = 0; k < 4; k++) {
                    sum += a[i * 4 + k] * b[k * 4 + j];
                }
                result[i * 4 + j] = sum;
            }
        }

        return result;
    }

    normalize(v) {
        const length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
        return [v[0] / length, v[1] / length, v[2] / length];
    }

    cross(a, b) {
        return [
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0]
        ];
    }

    dot(a, b) {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    }
}


