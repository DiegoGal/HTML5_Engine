/**
 * MouseTest — interactive demo of the multi-button mouse input API.
 *
 * Shows:
 *  • Left / Middle / Right button down, up, and pressed states
 *  • Per-button down/up event counters
 *  • Live cursor position tracked with a crosshair
 *  • Scroll-wheel delta visualised with an arrow and accumulated value
 *  • A click trail that records the position and which button was clicked
 */

// Maximum number of click trail dots to keep on screen at once
const TRAIL_MAX = 74;

// Colours for each mouse button
const BTN_COLORS = {
    left:   new Color(0.20, 0.70, 0.20), // green
    middle: new Color(0.20, 0.55, 0.90), // blue
    right:  new Color(0.90, 0.30, 0.20), // red
};

const darkgreenColor = new Color(0, 0.545, 0); // darkgreen
const darkredColor   = new Color(0.545, 0, 0); // darkred
const darkblueColor  = new Color(0, 0, 0.545); // darkblue

class MouseButtonWidget {
    /**
     * @param {string} label      Display label, e.g. "Left"
     * @param {string} buttonKey  Key on Input.mouse — "left", "middle", or "right"
     * @param {number} x          Centre X of the widget
     * @param {number} y          Centre Y of the widget
     * @param {number} radius     Circle radius
     */
    constructor(label, buttonKey, position, radius) {
        this.label     = label;
        this.buttonKey = buttonKey;
        this.position = position;
        this.radius = radius;
        this.downCount = 0;
        this.upCount   = 0;
        this.pressed   = false;

        // fill and stroke Circle
        this.fillCircle = new Circle(this.position, this.radius, Color.white, false);
        this.strokeCircle = new Circle(this.position, this.radius, Color.black, true, 2);

        // labels
        this.titleLabel = new TextLabel(this.label, this.position, "bold 16px Arial", Color.black, "center", "middle");
        this.downCounterLabel = new TextLabel('↓0', new Vector2(this.position.x - 18, this.position.y + this.radius + 14), "normal 12px Arial", darkgreenColor);
        this.upCounterLabel = new TextLabel('↓0', new Vector2(this.position.x + 18, this.position.y + this.radius + 14), "normal 12px Arial", darkredColor);
        this.heldLabel = new TextLabel("HELD", new Vector2(this.position.x, this.position.y - this.radius - 6), "bold 11px Arial", BTN_COLORS[this.buttonKey]);
    }

    Update() {
        const btn = Input.mouse[this.buttonKey];
        this.pressed = btn.pressed;

        if (btn.down)
            this.downCount++;
        if (btn.up)
            this.upCount++;

        this.fillCircle.color = this.pressed ? BTN_COLORS[this.buttonKey] : Color.white;

        this.downCounterLabel.text = `↓${this.downCount}`;
        this.upCounterLabel.text = `↑${this.upCount}`;
    }

    Draw(renderer) {
        this.fillCircle.Draw(renderer);
        this.strokeCircle.Draw(renderer);

        // button label
        this.titleLabel.Draw(renderer);

        // down / up counters below the circle
        this.downCounterLabel.Draw(renderer);
        this.upCounterLabel.Draw(renderer);

        // "HELD" badge while pressed
        if (this.pressed) {
            this.heldLabel.Draw(renderer);
        }
    }
}

class MouseTest extends Game {
    constructor(renderer) {
        super(renderer);

        // Three button widgets, evenly spaced across the top half
        this.buttons = [
            new MouseButtonWidget("Left",   "left",   new Vector2(160, 124), 46),
            new MouseButtonWidget("Middle", "middle", new Vector2(320, 124), 46),
            new MouseButtonWidget("Right",  "right",  new Vector2(480, 124), 46),
        ];

        // Scroll wheel state
        this.wheelAccum = 0;   // running total (resets on R key)
        this.wheelDelta = 0;   // last non-zero delta for the arrow visual

        // Click trail: [{x, y, button}]
        this.trail = [];

        // Text labels
        this.titleLabel = null;
        this.cursorLabel = null;
        this.coordinatesLabel = null;
        this.mouseMovedLabel = null;
        this.scrollWheelLabel = null;
        this.scrollUpDownLabel = null;
        this.accumulatedWheelLabel = null;
        this.pressRToResetLabel = null;
        this.clickTrailLabel = null;
    }

    Start() {
        super.Start();

        // Mouse Button Events
        this.titleLabel = new TextLabel("Mouse Button Events", new Vector2(this.screenHalfWidth, 34), "bold 20px Arial", Color.black);
        // Cursor
        this.cursorLabel = new TextLabel("Cursor", new Vector2(this.screenHalfWidth, 52), "normal 12px Arial", Color.FromHTMLColorName("gray"));

        // x: 164  y: 323
        this.coordinatesLabel = new TextLabel('x: 0  y: 0', new Vector2(this.screenHalfWidth, 230), "normal 13px Arial", Color.black);
        // moved: yes
        this.mouseMovedLabel = new TextLabel("moved: " + (Input.mouse.moved ? "yes" : "no"), new Vector2(this.screenHalfWidth, 246), "normal 12px Arial", Color.black);

        // Scroll Wheel
        this.scrollWheelLabel = new TextLabel("Scroll Wheel", new Vector2(this.screenHalfWidth, 284), "bold 15px Arial", Color.black);
        // ^ scroll up
        this.scrollUpDownLabel = new TextLabel("", new Vector2(this.screenHalfWidth, 360), "bold 13px Arial", Color.black);
        // accumulated: 1000
        this.accumulatedWheelLabel = new TextLabel("accumulated: 0", new Vector2(this.screenHalfWidth, 374), "normal 12px Arial", Color.black);
        // (press R to reset)
        this.pressRToResetLabel = new TextLabel("(press R to reset)", new Vector2(this.screenHalfWidth, 384), "normal 11px Arial", Color.grey, "center");
        
        // Click Trail  (last 40 clicks)
        this.clickTrailLabel = new TextLabel("Click Trail  (last " + TRAIL_MAX + " clicks)", new Vector2(this.screenHalfWidth, 426), "bold 15px Arial", Color.black);
    }

    Update(deltaTime) {
        super.Update(deltaTime);

        // Update button widgets
        this.buttons.forEach(b => b.Update());

        // Scroll wheel — accumulate and remember last direction
        if (Input.mouse.wheel !== 0) {
            this.wheelDelta = Input.mouse.wheel;
            this.wheelAccum += Input.mouse.wheel;
        }

        // Press R to reset wheel accumulator
        if (Input.IsKeyDown(KEY_R))
            this.wheelAccum = 0;

        // Record a click trail dot on any button down event
        for (const b of this.buttons) {
            if (Input.mouse[b.buttonKey].down) {
                this.trail.push({ x: Input.mouse.x, y: Input.mouse.y, button: b.buttonKey });
                if (this.trail.length > TRAIL_MAX)
                    this.trail.shift();
            }
        }

        // update the labels text
        this.coordinatesLabel.text = `x: ${Input.mouse.x.toFixed(0)}  y: ${Input.mouse.y.toFixed(0)}`;
        if (Input.mouse.moved) {
            this.mouseMovedLabel.text = "moved: yes";
            this.mouseMovedLabel.color = Color.FromHTMLColorName("darkgreen");
        }
        else {
            this.mouseMovedLabel.text = "moved: no";
            this.mouseMovedLabel.color = Color.grey;
        }

        // arrow showing last scroll direction
        if (this.wheelDelta !== 0) {
            const arrowColor = this.wheelDelta > 0 ? darkredColor : darkblueColor;
            const arrow = this.wheelDelta > 0 ? "▼ scroll down" : "▲ scroll up";
            this.scrollUpDownLabel.text = arrow;
            this.scrollUpDownLabel.color = arrowColor;
        }

        this.accumulatedWheelLabel.text = "accumulated: " + this.wheelAccum.toFixed(0);
    }

    Draw() {
        super.Draw();

        const r = this.renderer;

        // ── background ──────────────────────────────────────────────────────
        r.DrawFillBasicRectangle(0, 0, this.screenWidth, this.screenHeight, Color.lightGrey);

        // ── section titles ──────────────────────────────────────────────────
        this.titleLabel.Draw(r);
        this.cursorLabel.Draw(r);
        this.scrollWheelLabel.Draw(r);
        this.clickTrailLabel.Draw(r);

        // ── button widgets ───────────────────────────────────────────────────
        this.buttons.forEach(b => b.Draw(r));

        // ── mouse position readout under each button ─────────────────────────
        this.coordinatesLabel.Draw(r);
        this.mouseMovedLabel.Draw(r);
        this.coordinatesLabel.Draw(r);
        this.mouseMovedLabel.Draw(r);

        // ── scroll wheel section ─────────────────────────────────────────────
        // wheel graphic (rectangle with a dot)
        r.DrawStrokeBasicRectangle(this.screenHalfWidth - 17, 288, 34, 52, Color.black, 2);
        r.DrawFillCircle(this.screenHalfWidth, 306, 5, Color.black);

        // arrow showing last scroll direction
        this.scrollUpDownLabel.Draw(r);

        // accumulated total and reset hint
        this.accumulatedWheelLabel.Draw(r);
        this.pressRToResetLabel.Draw(r);

        // ── click trail ──────────────────────────────────────────────────────
        const trailY = 435;
        const dotR   = 5;
        const cols   = Math.floor((this.screenWidth - 40) / (dotR * 2 + 6));

        this.trail.forEach((dot, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const dx  = 26 + col * (dotR * 2 + 6) + dotR;
            const dy  = trailY + row * (dotR * 2 + 8) + dotR;
            r.DrawFillCircle(dx, dy, dotR, BTN_COLORS[dot.button]);
            r.DrawStrokeCircle(dx, dy, dotR, Color.black, 1);
        });

        if (this.trail.length === 0) {
            r.DrawFillText("click anywhere to record dots",
                this.screenHalfWidth, trailY + 14, "normal 14px Arial",
                Color.grey, "center");
        }

        // ── live cursor crosshair ────────────────────────────────────────────
        this.DrawCroshair();
    }

    DrawCroshair() {
        const mx = Input.mouse.x;
        const my = Input.mouse.y;

        // colour based on which button (if any) is pressed
        let cursorColor = Color.black;
        for (const b of this.buttons) {
            if (Input.mouse[b.buttonKey].pressed) {
                cursorColor = BTN_COLORS[b.buttonKey];
                break;
            }
        }

        const armLen = 10;
        // horizontal arm
        this.renderer.DrawLine(mx - armLen, my, mx + armLen, my, cursorColor, 1.5);
        // vertical arm
        this.renderer.DrawLine(mx, my - armLen, mx, my + armLen, cursorColor, 1.5);
        // outer ring
        this.renderer.DrawStrokeCircle(mx, my, 5, cursorColor, 1.5);
    }
}

window.onload = () => {
    Init(MouseTest);

    // hide the mouse cursor in the canvas
    canvas.style.cursor = "none";
}