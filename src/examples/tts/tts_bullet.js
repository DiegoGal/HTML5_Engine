class Bullet extends RectangleGO {
    constructor() {
        super(Vector2.Zero(), 8, 2, Color.yellow);
        
        this.speed = 700;
        this.damage = 1;
        this.owner = null;

        this.collider = new CircleCollider(Vector2.Zero(), 4, this);

        this._active = false;
    }

    get active() {
        return this._active;
    }

    set active(value) {
        if (value === this._active) return;
        this._active = value;
        if (value) {
            game.AddCollider(this.collider);
        } else {
            game.RemoveCollider(this.collider);
        }
    }

    Update(deltaTime) {
        super.Update(deltaTime); // updates collider position
        this.position.x += Math.cos(this.rotation) * this.speed * deltaTime;
        this.position.y += Math.sin(this.rotation) * this.speed * deltaTime;
    }
}
