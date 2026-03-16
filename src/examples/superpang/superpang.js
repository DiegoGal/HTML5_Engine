// Super Pang example project

// -------------------------------------------------------
// Ball sizes: large=48, medium=32, small=20, tiny=12
// When a ball is hit it splits into two smaller ones.
// Tiny balls are destroyed when hit.
// -------------------------------------------------------

const BALL_SIZES   = [48, 32, 20, 12];
const BALL_SPEEDS  = [80,  100, 150, 170];    // horizontal speed per size
const BALL_BOUNCEV = [-600, -510, -420, -350]; // vertical bounce speed per size
const GRAVITY      = 700;

const BALL_COLORS = [
    new Color(0.9, 0.2, 0.2),   // large  - red
    new Color(0.9, 0.5, 0.1),   // medium - orange
    new Color(0.2, 0.7, 0.2),   // small  - green
    new Color(0.2, 0.4, 0.9),   // tiny  a d - blue
];

// Game states
const STATE_PLAYING    = 0;
const STATE_DEAD       = 1;
const STATE_WIN        = 2;
const STATE_RESPAWNING = 3;
const STATE_LEVEL_WIN  = 4;

// -------------------------------------------------------
// Level definitions
// -------------------------------------------------------
const LEVELS = [
    { time: 60, balls: [
        { x: 150, sizeIndex: 0, dirX:  1 },
    ]},
    { time: 60, balls: [
        { x: 150, sizeIndex: 0, dirX:  1 },
        { x: 490, sizeIndex: 0, dirX: -1 },
    ]},
    { time: 55, balls: [
        { x: 150, sizeIndex: 0, dirX:  1 },
        { x: 320, sizeIndex: 1, dirX: -1 },
        { x: 490, sizeIndex: 0, dirX:  1 },
    ]},
    { time: 50, balls: [
        { x: 100, sizeIndex: 0, dirX:  1 },
        { x: 220, sizeIndex: 0, dirX: -1 },
        { x: 420, sizeIndex: 0, dirX:  1 },
        { x: 540, sizeIndex: 0, dirX: -1 },
    ]},
];

// -------------------------------------------------------
// SuperPang - main game class
// -------------------------------------------------------
class SuperPang extends Game {
    constructor(renderer) {
        super(renderer);

        this.Configure({
            screenWidth: 512,
            screenHeight: 424,
            imageSmoothingEnabled: false,
            collidersOnly: false
        });

        this.graphicAssets = {
            player:      { img: null, path: 'src/examples/superpang/assets/SuperPang_player.png', bgColor: '#FF00FF' },
            balloons:    { img: null, path: 'src/examples/superpang/assets/SuperPang_balloons.png', bgColor: '#8000FF' },
            backgrounds: { img: null, path: 'src/examples/superpang/assets/SuperPang_bgs.png' },
        };

        this.player        = null;
        this.shot          = null;
        this.balls         = [];
        this.state         = STATE_PLAYING;
        this.score         = 0;
        this.lives         = 3;
        this.level         = 0;
        this.timer         = 0;
        this._respawnTimer = 0;

        this.topLine = 15;
        this.floorLine = 368;
        this.leftWall = 15;
        this.rightWall = 497;
        this.bgSprite = null;

        this.livesLabel = null;
        this.scoreLabel = null;
        this.levelLabel = null;
        this.timerLabel = null;

        debugMode = true;
    }

    Start() {
        super.Start();

        this.score  = 0;
        this.lives  = 3;
        this.level  = 0;
        this.player = null; // already cleared by super.Start()
        this.shot   = null;
        this.balls  = [];

        this.bgSprite = new Sprite(this.graphicAssets.backgrounds.img, new Vector2(0, 0), 0, 2);

        this.livesLabel = new TextLabel(this.lives, new Vector2(60, this.screenHeight - 2), "32px monospace", Color.yellow, "left", "bottom");
        this.scoreLabel = new TextLabel(this.score, new Vector2(170, this.screenHeight - 6), "20px monospace", Color.orange, "right", "bottom");
        this.timerLabel = new TextLabel(this.timer, new Vector2(this.screenHalfWidth + 10, this.screenHeight - 2), "32px monospace", Color.yellow, "left", "bottom");
        this.levelLabel = new TextLabel(String(this.level + 1).padStart(2, '0'), new Vector2(this.screenWidth - 80, this.screenHeight - 2), "32px monospace", Color.yellow, "right", "bottom");

        this._startLevel();
    }

    _spawnBall(position, sizeIndex, dirX) {
        const ball = new PangBall(position, this.graphicAssets.balloons.img, sizeIndex, dirX);
        ball.Start();
        this.gameObjects.push(ball);
        this.balls.push(ball);
    }

    _startLevel() {
        // Clean up any existing shot
        if (this.shot) {
            this.Destroy(this.shot);
            this.shot = null;
        }
        // Clean up existing balls
        [...this.balls].forEach(b => this.Destroy(b));
        this.balls = [];

        // Clean up and respawn player
        if (this.player) {
            this.Destroy(this.player);
        }
        this.player = new PangPlayer(new Vector2(
            this.screenHalfWidth - 14,
            this.floorLine - 24
        ), this.graphicAssets.player.img);
        this.player.Start();
        this.gameObjects.push(this.player);

        // Reset timer and state
        this.timer = LEVELS[this.level].time;
        this.timerLabel.text = String(Math.ceil(this.timer)).padStart(3, '0');
        this.state = STATE_PLAYING;

        // Spawn balls for this level
        LEVELS[this.level].balls.forEach(b => {
            this._spawnBall(
                new Vector2(b.x, this.floorLine - BALL_SIZES[b.sizeIndex]),
                b.sizeIndex,
                b.dirX
            );
        });
    }

    // Handles player death: decrements lives and either respawns or ends the game
    PlayerDied() {
        if (this.state !== STATE_PLAYING)
            return; // guard against double-trigger

        this.lives--;
        this.livesLabel.text = this.lives;

        if (this.lives <= 0) {
            this.state = STATE_DEAD;
        }
        else {
            this.state = STATE_RESPAWNING;
            this._respawnTimer = 2;
        }
    }

    // Called by PangBall when it is hit by a shot
    PopBall(ball) {
        // Save spawn data before the ball is destroyed
        const spawnX    = ball.position.x;
        const spawnY    = ball.position.y;
        const sizeIndex = ball.sizeIndex;

        // Destroy the shot
        this.DestroyShot();

        // Remove ball from game
        const idx = this.balls.indexOf(ball);
        if (idx !== -1)
            this.balls.splice(idx, 1);
        this.Destroy(ball);

        this.score += (this.balls.length === 0 ? 200 : 100) * (sizeIndex + 1);
        this.scoreLabel.text = this.score;

        // Spawn two smaller balls at the hit position
        if (sizeIndex < BALL_SIZES.length - 1) {
            const nextSize = sizeIndex + 1;
            this._spawnBall(new Vector2(spawnX, spawnY), nextSize,  1);
            this._spawnBall(new Vector2(spawnX, spawnY), nextSize, -1);
        }

        // Check win condition
        if (this.balls.length === 0) {
            if (this.level + 1 >= LEVELS.length) {
                this.state = STATE_WIN;
            }
            else {
                this.state = STATE_LEVEL_WIN;
                this._respawnTimer = 2;
            }
        }
    }

    // Destroy the active shot
    DestroyShot() {
        if (this.shot) {
            this.Destroy(this.shot);
            this.shot = null;
        }
    }

    Update(deltaTime) {
        if (Input.IsKeyDown(KEY_F))
            this.config.collidersOnly = !this.config.collidersOnly;

        if (this.state === STATE_PLAYING) {
            super.Update(deltaTime);

            // Countdown timer
            this.timer -= deltaTime;
            this.timerLabel.text = String(Math.ceil(this.timer)).padStart(3, '0');
            if (this.timer <= 0) {
                this.timer = 0;
                this.PlayerDied();
            }
        }
        else if (this.state === STATE_RESPAWNING || this.state === STATE_LEVEL_WIN) {
            this._respawnTimer -= deltaTime;
            if (this._respawnTimer <= 0) {
                if (this.state === STATE_LEVEL_WIN) {
                    this.level++;
                    this.levelLabel.text = String(this.level + 1).padStart(2, '0');
                }
                this._startLevel();
            }
        }

        // Restart on Enter only after game over or final win
        if ((this.state === STATE_DEAD || this.state === STATE_WIN) && Input.IsKeyPressed(KEY_ENTER)) {
            this.Start();
        }
    }

    Draw() {
        // Background
        this.renderer.DrawFillBasicRectangle(0, 0, this.screenWidth, this.screenHeight, Color.black);
        this.bgSprite.DrawSectionBasicAt(this.renderer, 272, 8, 256, 190, 0, 0);

        // Floor line
        this.renderer.DrawLine(0, this.floorLine, this.screenWidth, this.floorLine, Color.red, 1);
        // Walls
        this.renderer.DrawLine(this.leftWall, 0, this.leftWall, this.floorLine, Color.red, 1);
        this.renderer.DrawLine(this.rightWall, 0, this.rightWall, this.floorLine, Color.red, 1);
        // Top line
        this.renderer.DrawLine(0, this.topLine, this.screenWidth, this.topLine, Color.red, 1);

        // Game objects (player, shot, balls)
        super.Draw();

        // HUD
        this.livesLabel.Draw(this.renderer);
        this.scoreLabel.Draw(this.renderer);
        this.levelLabel.Draw(this.renderer);
        this.timerLabel.Draw(this.renderer);

        // Overlays
        if (this.state === STATE_DEAD) {
            this._drawOverlay("GAME OVER", "Press ENTER to restart", new Color(0.8, 0.1, 0.1, 0.75));
        }
        else if (this.state === STATE_WIN) {
            this._drawOverlay("YOU WIN!", "Press ENTER to play again", new Color(0.1, 0.6, 0.1, 0.75));
        }
        else if (this.state === STATE_RESPAWNING) {
            this._drawOverlay(`Lives: ${this.lives}`, "Get ready...", new Color(0.8, 0.5, 0.1, 0.75));
        }
        else if (this.state === STATE_LEVEL_WIN) {
            this._drawOverlay(`Level ${this.level + 1} Clear!`, "Get ready...", new Color(0.1, 0.5, 0.8, 0.75));
        }
    }

    PlayerShot() {
        this.shot = new PangShot(this.player.x);
        this.shot.Start();
        this.gameObjects.push(this.shot);
    }

    _drawOverlay(title, subtitle, bgColor) {
        this.renderer.DrawFillBasicRectangle(0, this.screenHalfHeight - 70, this.screenWidth, 140, bgColor);
        this.renderer.DrawFillText(title,    this.screenHalfWidth, this.screenHalfHeight - 18, "bold 52px monospace", Color.white, "center", "bottom");
        this.renderer.DrawFillText(subtitle, this.screenHalfWidth, this.screenHalfHeight + 36, "20px monospace",      Color.white, "center", "bottom");
    }
}

// -------------------------------------------------------
// PangPlayer - the player character
// -------------------------------------------------------
class PangPlayer extends SSAnimationObjectComplex {
    constructor(position, img) {
        super(position, img, 2, img, [
            [
                // new Rect( 0, 0, 32, 34),
                // new Rect(32, 0, 32, 34),
                // new Rect(64, 0, 32, 34),
                // new Rect(96, 0, 32, 34),
                new Rect(127, 0, 32, 34),
                // new Rect(159, 0, 32, 34)
            ], // idle

            [   // walk
                new Rect( 0, 0, 32, 34),
                new Rect(32, 0, 32, 34),
                new Rect(64, 0, 32, 34),
                new Rect(96, 0, 32, 34)
            ],
            [   // shot
                new Rect(159, 0, 32, 34),
                new Rect(127, 0, 32, 34)
            ]
        ], [1/1, 1/6, 1/2]);

        this.width  = 28;
        this.height = 44;
        this.speed  = 240;
        this.color  = Color.blue;
        this.alive  = true;

        this.collider = null;

        this.shotTime = 0.24; // time the player is freze after a shot
        this.timeSinceLastShot = 0;
    }

    Start() {
        // Create collider with zero-offset so UpdateFromGO works correctly
        this.collider = new RectangleCollider(Vector2.Zero(), this.width, this.height, this);
        game.AddCollider(this.collider);

        this.timeSinceLastShot = this.shotTime;

        this.PlayAnimationLoop(0, false);
    }

    Update(deltaTime) {
        super.Update(deltaTime);

        if (!this.alive)
            return;

        this.timeSinceLastShot += deltaTime;

        let move = 0;
        if (Input.IsKeyPressed(KEY_LEFT)  || Input.IsKeyPressed(KEY_A))
            move -= 1;
        if (Input.IsKeyPressed(KEY_RIGHT) || Input.IsKeyPressed(KEY_D))
            move += 1;

        if (this.timeSinceLastShot >= this.shotTime) {
            // move when not shooting
            this.position.x += move * this.speed * deltaTime;

            if (move > 0) {
                this.flipX = true;
                this.PlayAnimationLoop(1, false);
             }
            else if (move < 0) {
                this.flipX = false;
                this.PlayAnimationLoop(1, false);
            }
            else
                this.PlayAnimationLoop(0, false);
        }

        // Clamp to play area bounds
        this.position.x = Math.max(game.leftWall + this.width * 0.5, Math.min(this.position.x, game.rightWall - this.width * 0.5));

        // Fire shot
        if ((Input.IsKeyDown(KEY_SPACE) || Input.IsMouseDown()) && !game.shot && this.timeSinceLastShot >= this.shotTime) {
            this.timeSinceLastShot = 0;
            game.PlayerShot();
            this.PlayAnimationLoop(2);
        }

        super.Update(deltaTime); // updates collider
    }

    Draw(renderer) {
        const headR = this.width * 0.5;
        // Body
        renderer.DrawFillRectangle(this.position.x, this.position.y, this.width, this.height, this.color);
        // Head
        renderer.DrawFillCircle(this.position.x, this.position.y - this.height * 0.5, headR, Color.pink);

        super.Draw(renderer);
    }

    OnCollisionEnter(myCollider, otherCollider) {
        // if (otherCollider.go instanceof PangBall) {
        //     this.alive = false;
        //     game.PlayerDied();
        // }
    }
}

// -------------------------------------------------------
// PangShot - the harpoon/wire shot upward by the player
// -------------------------------------------------------
class PangShot extends GameObject {
    constructor(x) {
        super(new Vector2(x, game.floorLine));
        this.width  = 4;
        this.top    = game.floorLine - 10; // current top of the wire
        this.speed  = 600;
        this._shotX = x;

        this.collider = null;
    }

    Start() {
        const wireHeight = game.floorLine - this.top;
        const wireCenterY = this.top + wireHeight * 0.5;
        this.collider = new RectangleCollider(new Vector2(this._shotX, wireCenterY), this.width, wireHeight, this);
        game.AddCollider(this.collider);
    }

    Update(deltaTime) {
        this.top -= this.speed * deltaTime;
        if (this.top <= game.topLine) {
            this.top = game.topLine;
            game.DestroyShot();
        }
        // Update collider manually to cover the wire from top to bottom
        const wireHeight = game.floorLine - this.top;
        const wireCenterY = this.top + wireHeight * 0.5;
        this.collider.position.Set(this._shotX, wireCenterY);
        this.collider.rect.x = this._shotX - this.width * 0.5;
        this.collider.rect.y = this.top;
        this.collider.rect.w = this.width;
        this.collider.rect.h = wireHeight;
        this.collider.boundingRadius = Math.max(this.width, wireHeight) * 0.5;
        this.collider.boundingRadius2 = this.collider.boundingRadius * this.collider.boundingRadius;
    }

    Draw(renderer) {
        const x       = this._shotX;
        const wireTop = this.top + 10; // wire starts just below the arrowhead
        const wireH   = game.floorLine - wireTop;

        // Wire: dark outer strip + bright center for a 3D cable look
        renderer.DrawFillBasicRectangle(x - 2, wireTop, 4, wireH, new Color(0.55, 0.45, 0.0));
        renderer.DrawFillBasicRectangle(x - 1, wireTop, 2, wireH, new Color(1.0,  0.95, 0.4));

        // Arrowhead triangle at the tip
        renderer.DrawPolygon([
            { x: x,     y: this.top },
            { x: x - 5, y: this.top + 10 },
            { x: x + 5, y: this.top + 10 }
        ], new Color(0.55, 0.45, 0.0), 1, true, new Color(1.0, 0.85, 0.1));
    }

    OnCollisionEnter(myCollider, otherCollider) {
        // Handled from PangBall side
    }
}

// -------------------------------------------------------
// PangBall - a bouncing ball that splits when hit
// -------------------------------------------------------
class PangBall extends SpriteObject {

    static _spriteSections = [
        {x: 2, y: 8, w: 64, h: 52},
        {x: 67, y: 13, w: 48, h: 40},
        {x: 116, y: 20, w: 32, h: 26},
        {x: 149, y: 26, w: 16, h: 12},
    ];

    // sizeIndex: 0=large, 1=medium, 2=small, 3=tiny
    constructor(position, img, sizeIndex, dirX) {
        super(position, 0, new Vector2(1.45, 1.75), img);
        this.sizeIndex = sizeIndex;
        this.radius    = BALL_SIZES[sizeIndex];
        this.color     = BALL_COLORS[sizeIndex];
        this.vx        = BALL_SPEEDS[sizeIndex] * dirX;
        this.vy        = BALL_BOUNCEV[sizeIndex] * (this.position.y + game.topLine) / (game.floorLine - game.topLine); // start moving upward (the initial upward momentum is proportional to the spawn height of the ball)

        this.spriteSection = PangBall._spriteSections[this.sizeIndex];

        this.collider = null;
    }

    Start() {
        super.Start();

        this.collider = new CircleCollider(Vector2.Zero(), this.radius, this);
        game.AddCollider(this.collider);
    }

    Update(deltaTime) {
        this.vy += GRAVITY * deltaTime;

        this.position.x += this.vx * deltaTime;
        this.position.y += this.vy * deltaTime;

        const sw = game.rightWall;
        const sh = game.floorLine;

        // Bounce off walls
        if (this.position.x - this.radius < game.leftWall) {
            this.position.x = game.leftWall + this.radius;
            this.vx = Math.abs(this.vx);
        }
        else if (this.position.x + this.radius > sw) {
            this.position.x = sw - this.radius;
            this.vx = -Math.abs(this.vx);
        }

        // Bounce off floor (always bounce back to the same height)
        if (this.position.y + this.radius >= sh) {
            this.position.y = sh - this.radius;
            this.vy = BALL_BOUNCEV[this.sizeIndex];
        }

        // Bounce off ceiling
        if (this.position.y - this.radius < game.topLine) {
            this.position.y = game.topLine + this.radius;
            this.vy = Math.abs(this.vy);
        }

        super.Update(deltaTime); // updates collider
    }

    Draw(renderer) {
        renderer.DrawFillCircle(this.position.x, this.position.y, this.radius, this.color);
        // Highlight
        renderer.DrawFillCircle(
            this.position.x - this.radius * 0.3,
            this.position.y - this.radius * 0.3,
            this.radius * 0.25,
            new Color(1, 1, 1, 0.4)
        );

        super.DrawSection(renderer, this.spriteSection.x, this.spriteSection.y, this.spriteSection.w, this.spriteSection.h);
    }

    OnCollisionEnter(myCollider, otherCollider) {
        if (otherCollider.go instanceof PangShot) {
            game.PopBall(this);
        }
    }
}

// Entry point
window.onload = function() {
    Init(SuperPang);
};
