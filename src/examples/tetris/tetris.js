const TetrisGameState = {
    MainMenu: 0,
    Pause: 1,
    Playing: 3,
    GameOver: 4
};

class Tetris extends Game {
    constructor() {
        super();

        this.currentState = TetrisGameState.Playing;

        this.grid = null;
        this.gridSize = { rows: 20, cols: 10 };
        this.gridPosition = { x: 220, y: 20 };
        this.squareSize = 20;

        this.initialPiecePosition = { x: 3, y: 0 };
        
        this.rotationStates = {
            'I': [
                [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
                [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]],
                [[0, 0, 0, 0], [0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0]],
                [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]]
            ],
            'J': [
                [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
                [[0, 1, 1], [0, 1, 0], [0, 1, 0]],
                [[0, 0, 0], [1, 1, 1], [0, 0, 1]],
                [[0, 1, 0], [0, 1, 0], [1, 1, 0]]
            ],
            'L': [
                [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
                [[0, 1, 0], [0, 1, 0], [0, 1, 1]],
                [[0, 0, 0], [1, 1, 1], [1, 0, 0]],
                [[1, 1, 0], [0, 1, 0], [0, 1, 0]]
            ],
            'O': [
                [[1, 1], [1, 1]]
            ],
            'S': [
                [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
                [[0, 1, 0], [0, 1, 1], [0, 0, 1]],
                [[0, 0, 0], [0, 1, 1], [1, 1, 0]],
                [[1, 0, 0], [1, 1, 0], [0, 1, 0]]
            ],
            'T': [
                [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
                [[0, 1, 0], [0, 1, 1], [0, 1, 0]],
                [[0, 0, 0], [1, 1, 1], [0, 1, 0]],
                [[0, 1, 0], [1, 1, 0], [0, 1, 0]]
            ],
            'Z': [
                [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
                [[0, 0, 1], [0, 1, 1], [0, 1, 0]],
                [[0, 0, 0], [1, 1, 0], [0, 1, 1]],
                [[0, 1, 0], [1, 1, 0], [1, 0, 0]]
            ]
        };

        this.wallKickData = {
            'I': [
                [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
                [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
                [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
                [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]]
            ],
            'J': [
                [[0, 0], [-1, 0], [1, 0], [-1, -1], [1, 2]],
                [[0, 0], [1, 0], [-1, 0], [1, -2], [-1, 1]],
                [[0, 0], [1, 0], [-1, 0], [1, -1], [-1, 2]],
                [[0, 0], [-1, 0], [1, 0], [-1, 2], [1, -1]]
            ],
            'L': [
                [[0, 0], [-1, 0], [1, 0], [-1, -1], [1, 2]],
                [[0, 0], [1, 0], [-1, 0], [1, -2], [-1, 1]],
                [[0, 0], [1, 0], [-1, 0], [1, -1], [-1, 2]],
                [[0, 0], [-1, 0], [1, 0], [-1, 2], [1, -1]]
            ],
            'O': [
                [[0, 0]]
            ],
            'S': [
                [[0, 0], [-1, 0], [1, 0], [-1, -1], [1, 2]],
                [[0, 0], [1, 0], [-1, 0], [1, -2], [-1, 1]],
                [[0, 0], [1, 0], [-1, 0], [1, -1], [-1, 2]],
                [[0, 0], [-1, 0], [1, 0], [-1, 2], [1, -1]]
            ],
            'T': [
                [[0, 0], [-1, 0], [1, 0], [-1, -1], [1, 2]],
                [[0, 0], [1, 0], [-1, 0], [1, -2], [-1, 1]],
                [[0, 0], [1, 0], [-1, 0], [1, -1], [-1, 2]],
                [[0, 0], [-1, 0], [1, 0], [-1, 2], [1, -1]]
            ],
            'Z': [
                [[0, 0], [-1, 0], [1, 0], [-1, -1], [1, 2]],
                [[0, 0], [1, 0], [-1, 0], [1, -2], [-1, 1]],
                [[0, 0], [1, 0], [-1, 0], [1, -1], [-1, 2]],
                [[0, 0], [-1, 0], [1, 0], [-1, 2], [1, -1]]
            ]
        };

        this.pieces = [
            { type: 'I', color: 'red', shape: this.rotationStates['I'][0] },
            { type: 'J', color: 'blue', shape: this.rotationStates['J'][0] },
            { type: 'L', color: 'green', shape: this.rotationStates['L'][0] },
            { type: 'O', color: 'yellow', shape: this.rotationStates['O'][0] },
            { type: 'S', color: 'purple', shape: this.rotationStates['S'][0] },
            { type: 'T', color: 'orange', shape: this.rotationStates['T'][0] },
            { type: 'Z', color: 'cyan', shape: this.rotationStates['Z'][0] }
        ];
        
        this.currentPiece = null;
        this.nextPieces = [];
        this.nextPiecesCount = 5;
        this.savedPiece = null;
        this.lastPieceSaved = false;
        this.ghostPiece = null; // preview of where the current piece is going to fall
        
        this.currentDropTime = 0; // time passed since the last drop
        this.dropTime = 0.5; // time to drop a piece in seconds

        this.minTimeToMove = 0.033; // minimum time to move a piece in milliseconds
        this.minTimeToMoveSinceLastMove = 0.25; // minimum time to repeat movement since the first key down
        this.lastTimeMoved = 0; // last time the piece was moved
        this.repeatedMovement = false;
        
        this.totalLinesCleared = 0;
        this.scoreTable = [0, 40, 100, 300, 1200];
        this.score = 0;

        // UI elements
        this.scoreLabel = null;
        this.keysLabel = null;
        this.gameOverLavel = null;
        this.pauseLavel = null;
    }
    
    Start() {
        super.Start();
        
        this.currentState = TetrisGameState.Playing;
        this.lastTime = 0;
        this.InitializeGrid(this.gridSize.rows, this.gridSize.cols);

        // set the right pieces colors
        this.pieces.forEach(piece => {
            piece.color = Color.FromHTMLColorName(piece.color);
        });
        
        // Initialize the first piece
        this.currentPiece = this.CreateRandomPiece();
        this.currentPiece.position.x = this.initialPiecePosition.x;
        this.currentPiece.position.y = this.initialPiecePosition.y;
        this.ghostPiece = {
            type: this.currentPiece.type,
            color: new Color(128, 128, 128, 0.5), // semi-transparent grey
            shape: [],
            position: { x: 0, y: 0 }
        };
        this.UpdateGhostPieceAfterChange();
        
        // Initialize next pieces array
        this.nextPieces = [];
        for (let i = 0; i < this.nextPiecesCount; i++) {
            this.nextPieces.push(this.CreateRandomPiece());
        }
        
        this.savedPiece = null;
        this.lastPieceSaved = false;
        
        this.totalLinesCleared = 0;
        this.score = 0;

        this.scoreLabel = new TextLabel("Score: 0", new Vector2(20, 420), "20px Comic Sans MS", "black", "left", "middle", false);
        this.keysLabel = new TextLabel("Keys: A (left) | D (right) | Space (rotate) | W (instant fall) | Q (save piece)", new Vector2(20, 460), "16px Comic Sans MS", "grey", "left", "middle", false);
        this.gameOverLavel = new TextLabel("Game Over", new Vector2(canvas.width / 2, canvas.height / 2), "40px Comic Sans MS", "black", "center", "middle", false);
        this.pauseLavel = new TextLabel("PAUSE", new Vector2(canvas.width / 2, canvas.height / 2), "40px Comic Sans MS", "black", "center", "middle", false);

        // center the grid in the canvas
        this.gridPosition.x = Math.floor((canvas.width - this.gridSize.cols * this.squareSize) / 2);
    }

    Update(deltaTime) {
        super.Update(deltaTime);
        
        switch (this.currentState) {
            case TetrisGameState.Playing:
                if (Input.IsKeyDown(KEY_PAUSE) || Input.IsKeyDown(KEY_ESCAPE) || Input.IsGamepadButtonDown(0, "START"))
                    this.currentState = TetrisGameState.Pause;
                else {
                    this.HandleInput(deltaTime);
                    
                    this.currentDropTime += deltaTime;
                    if (this.currentDropTime > this.dropTime) {
                        this.Drop();
                    }
    
                    // update the ghost piece
                    this.UpdateGhostPiece();
                    // TODO this call should only be made when the piece is moved or rotated
                }
                break;
            case TetrisGameState.Pause:
                if (Input.IsKeyDown(KEY_PAUSE) || Input.IsKeyDown(KEY_ESCAPE) || Input.IsGamepadButtonDown(0, "START"))
                    this.currentState = TetrisGameState.Playing;
                break;
            case TetrisGameState.GameOver:
                if (Input.IsKeyDown(KEY_SPACE) || Input.IsGamepadButtonDown(0, "START") || Input.IsGamepadButtonDown(0, "FACE_DOWN")) {
                    this.Start();
                }
                break;
        }
    }

    Draw(ctx) {
        super.Draw(ctx);

        // Draw the grid
        // Fallen pieces of the grid
        for (let y = 0; y < this.grid.length; y++) {
            for (let x = 0; x < this.grid[y].length; x++) {
                if (this.grid[y][x] !== 0) {
                    DrawFillRectangle(ctx, this.gridPosition.x + x * this.squareSize, this.gridPosition.y + y * this.squareSize, this.squareSize, this.squareSize, 'gray');
                    DrawStrokeRectangle(ctx, this.gridPosition.x + x * this.squareSize, this.gridPosition.y + y * this.squareSize, this.squareSize, this.squareSize, 'black', 1);
                }
            }
        }

        // Draw the ghost piece
        this.DrawPiece(ctx, this.ghostPiece, this.gridPosition.x + this.ghostPiece.position.x * this.squareSize, this.gridPosition.y + this.ghostPiece.position.y * this.squareSize);

        // Draw the current piece
        this.DrawPiece(ctx, this.currentPiece, this.gridPosition.x + this.currentPiece.position.x * this.squareSize, this.gridPosition.y + this.currentPiece.position.y * this.squareSize);
        
        // Border of the grid
        DrawStrokeRectangle(ctx, this.gridPosition.x, this.gridPosition.y, this.gridSize.cols * this.squareSize, this.gridSize.rows * this.squareSize, 'black', 2);
        
        // Draw the next pieces
        DrawStrokeRectangle(ctx, this.gridPosition.x + this.gridSize.cols * this.squareSize + 20, this.gridPosition.y, 6 * this.squareSize, 4 * this.squareSize, 'black', 2);
        for (let i = 0; i < this.nextPieces.length; i++) {
            this.DrawPiece(ctx, this.nextPieces[i], this.gridPosition.x + (this.gridSize.cols + 1) * this.squareSize + 20, this.gridPosition.y + 20 + (i * 4 * this.squareSize));
        }

        // Draw the saved piece
        DrawStrokeRectangle(ctx, this.gridPosition.x - 6 * this.squareSize - 20, this.gridPosition.y, 6 * this.squareSize, 4 * this.squareSize, 'black', 2);
        if (this.savedPiece !== null) {
            this.DrawPiece(ctx, this.savedPiece, this.gridPosition.x - 6 * this.squareSize - 20, this.gridPosition.y + 20);
        }
        
        // UI
        this.keysLabel.Draw(ctx);
        this.scoreLabel.Draw(ctx);

        if (this.currentState === TetrisGameState.GameOver) {
            this.gameOverLavel.Draw(ctx);
        }
        else if (this.currentState == TetrisGameState.Pause) {
            this.pauseLavel.Draw(ctx);
        }
    }
    
    InitializeGrid(rows, cols) {
        this.grid = [];
        while (rows--) {
            this.grid.push(new Array(cols).fill(0));
        }
    }

    CreateRandomPiece() {
        const randomId = RandomBetweenInt(0, this.pieces.length - 1);

        return {
            type: this.pieces[randomId].type,
            color: Color.Copy(this.pieces[randomId].color),
            shape: this.pieces[randomId].shape,
            position: { x: 0, y: 0 }
        };
    }

    CheckPieceGridCollision(piece) {
        const [m, o] = [piece.shape, piece.position];
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0 &&
                    (this.grid[y + o.y] &&
                    this.grid[y + o.y][x + o.x]) !== 0) {
                    return true;
                }
            }
        }
        return false;
    }

    MergePieceIntoGrid(piece) {
        piece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    this.grid[y + piece.position.y][x + piece.position.x] = value;
                }
            });
        });
    }

    RotatePiece(piece, direction) {
        const type = piece.type;
        const currentState = this.rotationStates[type].indexOf(piece.shape);
        const nextState = (currentState + 1) % this.rotationStates[type].length;

        return nextState;
    }

    RotateCurrentPiece() {
        // Super Rotation System (SRS)
        // https://tetris.fandom.com/wiki/SRS
        const originalPosition = { ...this.currentPiece.position };
        const originalShape = this.currentPiece.shape;
        const type = this.currentPiece.type;
        const currentState = this.rotationStates[type].indexOf(originalShape);

        const nextState = this.RotatePiece(this.currentPiece, 0);

        console.log(`Rotating piece ${type} from state ${currentState} to ${nextState}`);

        const kicks = this.wallKickData[type][currentState];

        for (const kick of kicks) {
            const [dx, dy] = kick;
            this.currentPiece.position.x += dx;
            this.currentPiece.position.y += dy;

            const newShape = this.rotationStates[type][nextState]; // get the new shape after rotation

            console.log(`Trying wall kick: dx=${dx}, dy=${dy}`);

            // Check collision with the new position AND the new shape
            if (!this.CheckPieceGridCollision({...this.currentPiece, shape: newShape })) {
                console.log('Wall kick successful');
                this.currentPiece.shape = newShape; // Update the shape if successful
                return;
            }

            // Revert position if collision detected
            this.currentPiece.position = { ...originalPosition };
        }

        // Revert shape if no valid position found
        console.log('Wall kick failed, reverting rotation');
    }

    ResetPieceRotation(piece) {
        piece.shape = this.pieces.find(p => p.type === piece.type).shape;
    }

    MoveCurrentPiece(offset) {
        this.currentPiece.position.x += offset;
        if (this.CheckPieceGridCollision(this.currentPiece)) {
            this.currentPiece.position.x -= offset;
        }
    }

    HandleInput(deltaTime) {
        this.lastTimeMoved += deltaTime;
        // left-right movement
        if (Input.IsKeyDown(KEY_LEFT) || Input.IsKeyDown(KEY_A) || Input.IsGamepadButtonDown(0, "DPAD_LEFT") || Input.IsGamepadButtonDown(0, "LS_LEFT")) {
            this.MoveCurrentPiece(-1);
            this.lastTimeMoved = 0;
            this.repeatedMovement = true;
        }
        if (Input.IsKeyDown(KEY_RIGHT) || Input.IsKeyDown(KEY_D) || Input.IsGamepadButtonDown(0, "DPAD_RIGHT") || Input.IsGamepadButtonDown(0, "LS_RIGHT")) {
            this.MoveCurrentPiece(1);
            this.lastTimeMoved = 0;
            this.repeatedMovement = true;
        }
        // debug
        // if (Input.IsKeyDown(KEY_DOWN) || Input.IsKeyDown(KEY_S))
        //     this.Drop();
        // if (Input.IsKeyDown(KEY_UP) || Input.IsKeyDown(KEY_W))
        //     this.UnDrop();

        // continuous press movement
        if (Input.IsKeyPressed(KEY_LEFT) || Input.IsKeyPressed(KEY_A) || Input.IsGamepadButtonPressed(0, "DPAD_LEFT") || Input.IsGamepadButtonPressed(0, "LS_LEFT")) {
            if ((this.repeatedMovement && this.lastTimeMoved > this.minTimeToMoveSinceLastMove) || (!this.repeatedMovement && this.lastTimeMoved > this.minTimeToMove)) {
                this.MoveCurrentPiece(-1);
                this.lastTimeMoved = 0;
                this.repeatedMovement = false;
            }
        }
        if (Input.IsKeyPressed(KEY_RIGHT) || Input.IsKeyPressed(KEY_D) || Input.IsGamepadButtonPressed(0, "DPAD_RIGHT") || Input.IsGamepadButtonPressed(0, "LS_RIGHT")) {
            if ((this.repeatedMovement && this.lastTimeMoved > this.minTimeToMoveSinceLastMove) || (!this.repeatedMovement && this.lastTimeMoved > this.minTimeToMove)) {
                this.MoveCurrentPiece(1);
                this.lastTimeMoved = 0;
                this.repeatedMovement = false;
            }
        }

        // drop movement
        if ((Input.IsKeyPressed(KEY_DOWN) || Input.IsKeyPressed(KEY_S) || Input.IsGamepadButtonPressed(0, "DPAD_DOWN") || Input.IsGamepadButtonPressed(0, "LS_DOWN")) && this.lastTimeMoved > this.minTimeToMove) {
            this.Drop();
            this.lastTimeMoved = 0;
        }

        // rotate
        if (Input.IsKeyDown(KEY_SPACE) || Input.IsMouseDown() || Input.IsGamepadButtonDown(0, "FACE_DOWN")) {
            this.RotateCurrentPiece();
        }

        // Save the current piece
        if ((Input.IsKeyPressed(KEY_Q) || Input.IsGamepadButtonPressed(0, "LB") || Input.IsGamepadButtonPressed(0, "RT")) && !this.lastPieceSaved) {
            if (this.savedPiece === null) {
                this.savedPiece = this.currentPiece;
                this.currentPiece = this.nextPieces.shift();
                this.nextPieces.push(this.CreateRandomPiece());
                this.UpdateGhostPieceAfterChange();
            } else {
                const temp = this.currentPiece;
                this.currentPiece = this.savedPiece;
                this.savedPiece = temp;
                this.UpdateGhostPieceAfterChange();
            }
            this.currentPiece.position.x = this.initialPiecePosition.x;
            this.currentPiece.position.y = this.initialPiecePosition.y;

            this.ResetPieceRotation(this.savedPiece);

            this.currentDropTime = 0;
            this.lastPieceSaved = true;
        }

        // Full fall
        if (Input.IsKeyDown(KEY_W) || Input.IsGamepadButtonDown(0, "DPAD_UP") || Input.IsGamepadButtonDown(0, "LS_UP")) {
            this.FullFall();
        }
    }

    Drop() {
        this.currentPiece.position.y++;
        if (this.CheckPieceGridCollision(this.currentPiece)) {
            this.currentPiece.position.y--;

            this.MergePieceIntoGrid(this.currentPiece);
            this.CheckAndClearLines();

            this.currentPiece = this.nextPieces.shift();
            this.currentPiece.position.x = this.initialPiecePosition.x;
            this.currentPiece.position.y = this.initialPiecePosition.y;
            this.UpdateGhostPieceAfterChange();

            if (this.CheckPieceGridCollision(this.currentPiece)) {
                // check for game over
                this.currentState = TetrisGameState.GameOver;
            } else {
                this.nextPieces.push(this.CreateRandomPiece());
                this.lastPieceSaved = false;
            }
        }
        this.currentDropTime = 0;
    }

    UnDrop() {
        // debug function to undo the last drop
        if (this.currentPiece.position.y > 0)
            this.currentPiece.position.y--;
    }

    CheckAndClearLines() {
        let linesCleared = 0;
        outer: for (let y = this.grid.length - 1; y >= 0; y--) {
            for (let x = 0; x < this.grid[y].length; x++) {
                if (this.grid[y][x] === 0) {
                    continue outer;
                }
            }
            const row = this.grid.splice(y, 1)[0].fill(0);
            this.grid.unshift(row);
            linesCleared++;
            y++;
        }

        this.totalLinesCleared += linesCleared;
        this.UpdateScore(linesCleared);
    }

    UpdateScore(linesCleared) {
        this.score += this.scoreTable[linesCleared];
        this.scoreLabel.text = `Score: ${this.score}`;
    }

    DrawPiece(ctx, piece, x, y) {
        // Debug bounding box
        DrawStrokeRectangle(ctx, x, y, this.squareSize * 4, this.squareSize * 4, 'grey', 1);

        for (let j = 0; j < piece.shape.length; j++) {
            for (let i = 0; i < piece.shape[j].length; i++) {
                if (piece.shape[j][i] !== 0) {
                    const coordX = x + i * this.squareSize;
                    const coordY = y + j * this.squareSize;

                    DrawFillRectangle(ctx, coordX, coordY, this.squareSize, this.squareSize, piece.color.string);
                    DrawStrokeRectangle(ctx, coordX, coordY, this.squareSize, this.squareSize, 'black', 1);
                }
            }
        }
    }

    FullFall() {
        while (!this.CheckPieceGridCollision(this.currentPiece)) {
            this.currentPiece.position.y++;
        }
        this.currentPiece.position.y--;

        this.MergePieceIntoGrid(this.currentPiece);
        this.CheckAndClearLines();

        this.currentPiece = this.nextPieces.shift();
        this.currentPiece.position.x = this.initialPiecePosition.x;
        this.currentPiece.position.y = this.initialPiecePosition.y;
        this.UpdateGhostPieceAfterChange();

        if (this.CheckPieceGridCollision(this.currentPiece)) {
            // check for game over
            this.currentState = TetrisGameState.GameOver;
        } else {
            this.nextPieces.push(this.CreateRandomPiece());
            this.lastPieceSaved = false;
        }
        this.currentDropTime = 0;
    }

    UpdateGhostPiece() {
        this.ghostPiece.shape = this.currentPiece.shape;
        this.ghostPiece.position = { ...this.currentPiece.position };

        while (!this.CheckPieceGridCollision(this.ghostPiece)) {
            this.ghostPiece.position.y++;
        }
        this.ghostPiece.position.y--;
    }

    UpdateGhostPieceAfterChange() {
        this.ghostPiece.type = this.currentPiece.type;
        this.ghostPiece.color = Color.Copy(this.currentPiece.color).Desaturate(0.33);
        this.ghostPiece.color.a = 0.5;
    }
}

// initialize the game
if (game === null)
    game = new Tetris();