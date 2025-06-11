class BasicGame extends Game {
    constructor(renderer) {
        super(renderer);
        this.graphicAssets = {
            snake: {
                path: "src/examples/common_assets/snake.png",
                img: null
            },
            portal: {
                path: "src/examples/common_assets/portal2.png",
                img: null
            },
            floppy: {
                path: "./src/examples/floppyderp/assets/player_sprites.png",
                img: null
            },
        };

        // game objects
        this.redRect = null;
        this.yellowRect = null;
        this.animationObjectBasic1 = null;
        this.animationObjectBasic2 = null;

        // other objects
        this.blackRect = null;
        this.blueCircle = null;
        this.pinkCircle = null;
        this.snakeSprite = null;
        this.portalSprite = null;
        this.textLabel = null;

        // auxiliar
        this.grey = new Color(0.5, 0.5, 0.5, 1);
    }
    
    Start() {
        super.Start();
        
        // a red 100x100px rectangle game object
        this.redRect = new RectangleGO(new Vector2(this.screenHalfWidth, this.screenHalfHeight));
        this.gameObjects.push(this.redRect);

        // a yellow 50x50px rectangle game object
        this.yellowRect = new RectangleGO(new Vector2(this.screenHalfWidth, this.screenHalfHeight), 50, 50, Color.yellow, true, 4);
        this.gameObjects.push(this.yellowRect);

        // SSAnimationObjectBasic
        this.animationObjectBasic1 = new SSAnimationObjectBasic(new Vector2(460, this.screenHalfHeight), 0, 1, this.graphicAssets.floppy.img, 24, 24, [10, 10], 1 / 12);
        this.gameObjects.push(this.animationObjectBasic1);

        this.animationObjectBasic2 = new SSAnimationObjectBasic(new Vector2(560, this.screenHalfHeight), 0, 2, this.graphicAssets.floppy.img, 24, 24, [10, 10], 1 / 8);
        this.gameObjects.push(this.animationObjectBasic2);
        this.animationObjectBasic2.PlayAnimationLoop(1);

        // big black background rectangle
        this.blackRect = new Rectangle(new Vector2(0, this.screenHalfHeight), this.screenWidth, this.screenHalfHeight);
        
        // blue fill circle
        this.blueCircle = new Circle(new Vector2(400, 100), 40, Color.blue);
        // purple stroke circle
        this.pinkCircle = new Circle(new Vector2(400, 100), 40, new Color(1, 0, 1, 1), true, 4);

        // Snake sprite
        this.snakeSprite = new Sprite(this.graphicAssets.snake.img, new Vector2(100, 100), 0, 1);
        // Portal sprite
        this.portalSprite = new Sprite(this.graphicAssets.portal.img, new Vector2(100, 300), 0, 1);

        // a label text
        this.textLabel = new TextLabel("a white text :)", new Vector2(this.screenHalfWidth, this.screenHeight - 10), "20px Comic Sans MS", Color.white, "center");
    }

    Update(deltaTime) {
        super.Update(deltaTime);

        this.redRect.rotation += 1 * deltaTime;
        this.yellowRect.rotation -= 1.5 * deltaTime;

        this.portalSprite.rotation += 0.33 * deltaTime;

        this.pinkCircle.radius = (Math.sin(totalTime) + 1) * this.blueCircle.radius * 0.5;

        // update the scale of the animationObjectBasic1
        const newScale = (Math.sin(totalTime) + 1) * 2;
        this.animationObjectBasic1.scale = newScale;

        // update the position and rotation of the animationObjectBasic2
        const newPosY = Math.sin(totalTime) * 20;
        this.animationObjectBasic2.position.Set(this.animationObjectBasic2.x, this.screenHalfHeight + newPosY);
        this.animationObjectBasic2.rotation += 0.2 * deltaTime;
    }

    Draw() {
        this.blackRect.Draw(this.renderer);
        this.renderer.DrawLine(this.screenHalfWidth, 0, this.screenHalfWidth, this.screenHeight, this.grey);
        this.renderer.DrawLine(0, this.screenHalfHeight, this.screenWidth, this.screenHalfHeight, this.grey);

        super.Draw();

        this.snakeSprite.DrawBasic(this.renderer);
        this.portalSprite.Draw(this.renderer);

        this.blueCircle.Draw(this.renderer);
        this.pinkCircle.Draw(this.renderer);

        this.renderer.DrawFillText("Watson!!! O_O", this.screenHalfWidth, 20, "20px Comic Sans MS");

        this.textLabel.Draw(renderer);
    }
}