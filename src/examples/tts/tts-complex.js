const GAME_STATE = {
    MAIN_MENU: 0,
    INTRO: 1,
    GAME: 2,
    GAME_OVER: 3
}

class TTSC extends Game {
    constructor(renderer) {
        super(renderer);

        this.Configure({
            screenWidth: 1280,
            screenHeight: 720,
            fillWindow: true
        });

        this.graphicAssets = {
            ships: {
                path: "src/examples/tts/assets/simpleSpace_sheet.png",
                img: null
            },
            crosshair: {
                path: "src/examples/tts/assets/crosshair060.png",
                img: null
            }
        };

        this.state = GAME_STATE.MAIN_MENU;

        // background gradient
        this.bgGrad = null;

        this.mouseCircle = null;
        this.player = null;
        this.enemies = [];
        this.camera = null;

        this.sceneLimits = new Rectangle(Vector2.Zero(), 1200, 640, Color.white, true, 2);

        this.timeToSpawnEnemy = 1;
        this.timeToSpawnEnemyAux = 0;
        this.enemiesSpawnPoints = [
            new Vector2(50, 50),
            new Vector2(this.sceneLimits.width - 50, 50),
            new Vector2(50, this.sceneLimits.height - 50),
            new Vector2(this.sceneLimits.width - 50, this.sceneLimits.height - 50),
            new Vector2(this.sceneLimits.width / 2, 50),
            new Vector2(this.sceneLimits.width / 2, this.sceneLimits.height - 50)
        ]

        this.playerScore = 0;
        this.playerScoreLabel = new TextLabel("0", new Vector2(this.screenWidth / 2, 50), "40px Comic Sans MS", Color.white, "center", "bottom");

        this.playerSpeedBar = new SpeedMultBar(new Vector2(this.screenWidth - 120, 20), 100, 20);
    }

    Start() {
        super.Start();

        this.state = GAME_STATE.INTRO;

        // Gamepad rumble
        Input.RegisterRumble("Damage", 0.4, 0.2, 150, 0);
        Input.RegisterRumble("EnemyKilled", 0, 0.25, 100, 0);

        // configure background gradient
        this.bgGrad = new LinearGradient(this.renderer, new Vector2(0, 1), [
            [0, "#191200"],
            [0.1, "#000000"],
            [0.35, "#07073e"],
            [0.95, "#22375e"],
            [1, "#274f98"]
        ]);

        this.mouseCircle = new Circle(new Vector2(0, 0), 5, Color.red, 1);

        this.player = new TTSCPlayer(new Vector2(this.sceneLimits.width / 2, this.sceneLimits.height / 2), 0, 1, this.graphicAssets.ships.img, this.sceneLimits);
        this.gameObjects.push(this.player);

        this.camera = new FollowCamera(Vector2.Zero(), this.player, -200, 140, -100, 40, 5);
        this.camera.Start();
        
        if (this.state === GAME_STATE.INTRO) {
            this.camera.scale = 10;
            this.player.active = false;
        }

        this.player.Start();

        // initialize the starting enemies
        this.enemies = [];
    }

    Update(deltaTime) {
        // update the game objects
        super.Update(deltaTime);

        switch (this.state) {
            case GAME_STATE.MAIN_MENU:
                
                break;
            case GAME_STATE.INTRO:
                this._updateIntro(deltaTime);
                break;
            case GAME_STATE.GAME:
                this._updateGame(deltaTime);
                break;
            case GAME_STATE.GAME_OVER:
                
                break;
        }
        // update the camera
        this.camera.Update(deltaTime);
    }

    _updateIntro(deltaTime) {
        
        if (this.camera.scale <= 1) {
            this.camera.scale = 1;
            this.camera.rotation += 5 * deltaTime;
            if ((this.camera.rotation % PI2) <= 0.1) {
                this.camera.rotation = 0;
                this.state = GAME_STATE.GAME;
                this.player.active = true;
            }
        }
        else {
            this.camera.scale -= 10 * deltaTime;
            this.camera.rotation += 4 * deltaTime;
        }
    }

    _updateGame(deltaTime) {
        this.mouseCircle.position.Set(Input.mouse.x, Input.mouse.y);

        // enemy spawning
        this.timeToSpawnEnemyAux += deltaTime;
        if (this.timeToSpawnEnemyAux >= this.timeToSpawnEnemy) {
            this.timeToSpawnEnemyAux = 0;
            this.SpawnRandomEnemy();
        }
    }

    Draw() {
        // background
        this.renderer.DrawGradientRectangle(0, 0, this.screenWidth, this.screenHeight, this.bgGrad);

        this.camera.PreDraw(this.renderer);

        // background grid
        // horizontal lines
        const verticalStep = 50;
        const horizontalLines = this.sceneLimits.height / verticalStep;
        for (let i = 0; i < horizontalLines; i++) {
            this.renderer.DrawLine(this.sceneLimits.position.x, this.sceneLimits.position.y + verticalStep * i, this.sceneLimits.position.x + this.sceneLimits.width, this.sceneLimits.position.y + verticalStep * i, Color.grey, 1);
        }
        // vertical lines
        const horizontalStep = 50;
        const verticalLines = this.sceneLimits.width / horizontalStep;
        for (let i = 0; i < verticalLines; i++) {
            this.renderer.DrawLine(this.sceneLimits.position.x + horizontalStep * i, this.sceneLimits.position.y, this.sceneLimits.position.x + horizontalStep * i, this.sceneLimits.position.y + this.sceneLimits.height, Color.grey, 1);
        }

        this.sceneLimits.Draw(renderer);

        // draw the game objects
        super.Draw();

        this.camera.PostDraw(this.renderer);

        // draw the mouse position
        this.mouseCircle.Draw(renderer);

        this.playerScoreLabel.Draw(renderer);

        this.playerSpeedBar.Draw(renderer);
    }

    AddEnemy(enemy) {
        this.enemies.push(enemy);
        this.gameObjects.push(enemy);
        enemy.Start();
    }

    SpawnRandomEnemy() {
        const random = Math.random();
        let enemy = null;
        const spawnPoint = this.enemiesSpawnPoints[RandomBetweenInt(0, this.enemiesSpawnPoints.length - 1)];
        if (random < 0.33) {
            enemy = new Enemy(spawnPoint, this.graphicAssets.ships.img, this.player, this.sceneLimits);
        }
        else if (random < 0.66) {
            enemy = new EnemyKamikaze(spawnPoint, this.graphicAssets.ships.img, this.player, this.sceneLimits);
        }
        else {
            enemy = new EnemyAsteroid(spawnPoint, this.graphicAssets.ships.img, this.player, this.sceneLimits);
        }

        this.timeToSpawnEnemy *= 0.97;
        if (this.timeToSpawnEnemy < 0.15)
            this.timeToSpawnEnemy = 0.15

        this.AddEnemy(enemy);
    }

    EnemyKilled(enemy) {
        this.playerScore += enemy.score;
        this.playerScoreLabel.text = this.playerScore;

        this.camera.Shake(0.2, 200, 1.5);
        // this.camera.ZoomPunch(1.06, 0.2);
        Input.ExecuteRumble("EnemyKilled");

        this.RemoveEnemy(enemy);
    }

    RemoveEnemy(enemy) {
        const enemyIndex = this.enemies.indexOf(enemy);
        if (enemyIndex !== -1)
            this.enemies.splice(enemyIndex, 1);
        this.Destroy(enemy);
    }

    EnemyCollidesWithPlayer(enemy) {
        this.playerScore -= enemy.score;
        this.playerScoreLabel.text = this.playerScore;

        Input.ExecuteRumble("Damage");

        this.camera.Shake(0.3, 200, 4);
        this.camera.ZoomPunch(0.95, 0.45);

        this.RemoveEnemy(enemy);
    }
}

window.onload = () => {
    Init(TTSC);
}