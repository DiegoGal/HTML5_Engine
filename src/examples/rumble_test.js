/**
 * Rumble / Haptic Feedback test
 *
 * Demonstrates Input.RumbleGamepad() with four named presets (face buttons or
 * keyboard 1-4) and a custom section where LT/RT control the strong/weak motor
 * magnitudes live before firing with START or Enter.
 *
 * The last API call is always displayed at the bottom so it is easy to copy.
 *
 * Text rendering uses TextLabel throughout:
 *  - Static labels are created once in Start() and never marked dirty again.
 *  - Preset labels store their TextLabels on the preset object; color is
 *    updated only on state transitions (activate / timer-expire) so the
 *    WebGL texture cache stays valid between frames.
 *  - Dynamic labels (status, LT/RT values, code snippet) update their .text /
 *    .color properties in Update(); the setter's !== guard avoids unnecessary
 *    texture re-renders when the value has not changed.
 */

class RumbleTest extends Game {
    constructor(renderer) {
        super(renderer);

        this.presets        = [];
        this.activePreset   = -1;
        this.activeTimer    = 0;
        this.lastRumble     = null;

        this.customStrong   = 0;
        this.customWeak     = 0;

        // palette — stored as instance fields so TextLabel setters can compare
        // by reference and skip dirty-marking when the color hasn't changed
        this.colorBg     = Color.FromHex("#111827");
        this.colorCard   = Color.FromHex("#1f2937");
        this.colorText   = Color.FromHex("#f1f5f9");
        this.colorMuted  = Color.FromHex("#64748b");
        this.colorAccent = Color.FromHex("#6366f1");
        this.colorGreen  = Color.FromHex("#4ade80");
        this.colorRed    = Color.FromHex("#f87171");
        this.colorYellow = Color.FromHex("#fbbf24");
        this.colorPurple = Color.FromHex("#c084fc");

        // TextLabels — initialised in Start() once screen dimensions are known
        this.titleLabel         = null;
        this.statusLabel        = null;
        this.presetsLabel       = null;
        this.customSectionLabel = null;
        this.fireLabel          = null;
        this.lastCallLabel      = null;
        this.snippetLabel       = null;
        this.annotationLabel    = null;
        this.placeholderLabel   = null;
        this.ltValueLabel       = null;
        this.rtValueLabel       = null;

        drawStats = false;
    }

    Start() {
        super.Start();

        const pad   = 25;
        const gap   = 14;
        const cardW = (this.screenWidth - pad * 2 - gap) / 2;
        const cardH = 84;
        const row1y = 90;
        const row2y = row1y + cardH + 10;

        this.presets = [
            {
                label:    "Tap",
                hint:     "Short light buzz",
                keyLabel: "1  /  A",
                button:   "FACE_DOWN",
                strong:   0,
                weak:     0.4,
                duration: 80,
                color:    this.colorGreen,
                rect:     { x: pad, y: row1y, w: cardW, h: cardH },
            },
            {
                label:    "Impact",
                hint:     "Sudden heavy hit",
                keyLabel: "2  /  B",
                button:   "FACE_RIGHT",
                strong:   1,
                weak:     0.5,
                duration: 300,
                color:    this.colorRed,
                rect:     { x: pad + cardW + gap, y: row1y, w: cardW, h: cardH },
            },
            {
                label:    "Engine",
                hint:     "Low continuous rumble",
                keyLabel: "3  /  X",
                button:   "FACE_LEFT",
                strong:   0.6,
                weak:     0.2,
                duration: 1000,
                color:    this.colorYellow,
                rect:     { x: pad, y: row2y, w: cardW, h: cardH },
            },
            {
                label:    "Buzz",
                hint:     "High-freq vibration",
                keyLabel: "4  /  Y",
                button:   "FACE_UP",
                strong:   0,
                weak:     1,
                duration: 600,
                color:    this.colorPurple,
                rect:     { x: pad + cardW + gap, y: row2y, w: cardW, h: cardH },
            },
        ];

        // Register rumble presets from the same data — single source of truth
        for (const p of this.presets) {
            Input.RegisterRumble(p.label, p.strong, p.weak, p.duration);
        }

        // Attach a TextLabel for each text element of every preset card.
        // Text content never changes; color is updated only on state transitions.
        for (const p of this.presets) {
            const r = p.rect;
            p.keyLabelText = new TextLabel(p.keyLabel,
                new Vector2(r.x + 12, r.y + 16),
                "bold 12px Arial", p.color, "left", "alphabetic");

            p.paramsText = new TextLabel(
                `S:${p.strong.toFixed(1)}  W:${p.weak.toFixed(1)}  ${p.duration}ms`,
                new Vector2(r.x + r.w - 8, r.y + 16),
                "11px Arial", this.colorMuted, "right", "alphabetic");

            p.labelText = new TextLabel(p.label,
                new Vector2(r.x + r.w / 2, r.y + 46),
                "bold 20px Arial", this.colorText, "center", "alphabetic");

            p.hintText = new TextLabel(p.hint,
                new Vector2(r.x + r.w / 2, r.y + 68),
                "12px Arial", this.colorMuted, "center", "alphabetic");
        }

        // Custom section layout — stored so Draw() can access without recalculating
        this._cy   = 284;
        this._barX = 25;
        this._barW = 270;
        this._barH = 22;
        const cy = this._cy, barX = this._barX, barW = this._barW;

        // ── Static labels (created once, never updated) ───────────
        this.titleLabel = new TextLabel(
            "Rumble / Haptic Feedback Test",
            new Vector2(this.screenHalfWidth, 26),
            "bold 22px Arial", this.colorText, "center", "alphabetic");

        this.presetsLabel = new TextLabel(
            "PRESETS", new Vector2(25, 77),
            "bold 11px Arial", this.colorMuted, "left", "alphabetic");

        this.customSectionLabel = new TextLabel(
            "CUSTOM — pull LT / RT, then press START or Enter to fire (500ms)",
            new Vector2(25, cy),
            "bold 11px Arial", this.colorMuted, "left", "alphabetic");

        this.fireLabel = new TextLabel(
            "▶  START / Enter  →  fire",
            new Vector2(barX + barW + 20, cy + 38),
            "13px Arial", this.colorAccent, "left", "alphabetic");

        this.lastCallLabel = new TextLabel(
            "LAST CALL", new Vector2(25, 378),
            "bold 11px Arial", this.colorMuted, "left", "alphabetic");

        this.annotationLabel = new TextLabel(
            "                       gamepadIndex  strong  weak  duration (ms)",
            new Vector2(25, 420),
            "11px Consolas, monospace", this.colorMuted, "left", "alphabetic");

        this.placeholderLabel = new TextLabel(
            "Fire a preset or custom rumble to see the call here",
            new Vector2(25, 400),
            "15px Arial", this.colorMuted, "left", "alphabetic");

        // ── Dynamic labels (.text / .color updated in Update()) ───
        this.statusLabel = new TextLabel(
            "No gamepad detected — keyboard shortcuts still work",
            new Vector2(this.screenHalfWidth, 50),
            "13px Arial", this.colorMuted, "center", "alphabetic");

        this.snippetLabel = new TextLabel(
            "", new Vector2(25, 400),
            "bold 16px Consolas, monospace", this.colorAccent, "left", "alphabetic");

        this.ltValueLabel = new TextLabel(
            "LT   Strong motor: 0.000",
            new Vector2(barX + 7, cy + 29),
            "bold 12px Arial", this.colorText, "left", "alphabetic");

        this.rtValueLabel = new TextLabel(
            "RT   Weak motor:   0.000",
            new Vector2(barX + 7, cy + 59),
            "bold 12px Arial", this.colorText, "left", "alphabetic");
    }

    // Restores a preset card's labels to their default (inactive) colors.
    _resetPresetColors(index) {
        const p = this.presets[index];
        p.keyLabelText.color = p.color;
        p.paramsText.color   = this.colorMuted;
        p.labelText.color    = this.colorText;
        p.hintText.color     = this.colorMuted;
    }

    _fire(strong, weak, duration, label, color) {
        Input.RumbleGamepad(0, strong, weak, duration);
        this.lastRumble        = { label, strong, weak, duration, color };
        // Custom section uses RumbleGamepad directly — show the raw call
        this.snippetLabel.text  = `Input.RumbleGamepad( 0,  ${strong.toFixed(2)},  ${weak.toFixed(2)},  ${duration} );`;
        this.snippetLabel.color = color;
    }

    _firePreset(index) {
        // Reset the previously active preset before switching to a new one
        if (this.activePreset >= 0 && this.activePreset !== index) {
            this._resetPresetColors(this.activePreset);
        }

        const p = this.presets[index];
        Input.ExecuteRumble(p.label);
        this.lastRumble        = { label: p.label, strong: p.strong, weak: p.weak, duration: p.duration, color: p.color };
        this.snippetLabel.text  = `Input.ExecuteRumble( "${p.label}" );`;
        this.snippetLabel.color = p.color;

        // Flip preset labels to the inverted (active-flash) color scheme
        p.keyLabelText.color = this.colorBg;
        p.paramsText.color   = this.colorBg;
        p.labelText.color    = this.colorBg;
        p.hintText.color     = this.colorBg;

        this.activePreset = index;
        this.activeTimer  = 0.3;
    }

    Update(deltaTime) {
        super.Update(deltaTime);

        // Tick down flash timer; reset label colors when it expires
        const wasActive = this.activeTimer > 0;
        
        if (wasActive) {
            this.activeTimer -= deltaTime;
            
            if (this.activeTimer <= 0 && this.activePreset >= 0) {
                this._resetPresetColors(this.activePreset);
            }
        }
        
        // Presets — keyboard
        if (Input.IsKeyDown(KEY_1)) this._firePreset(0);
        if (Input.IsKeyDown(KEY_2)) this._firePreset(1);
        if (Input.IsKeyDown(KEY_3)) this._firePreset(2);
        if (Input.IsKeyDown(KEY_4)) this._firePreset(3);

        // Presets — gamepad face buttons
        if (Input.IsGamepadButtonDown(0, "FACE_DOWN"))  this._firePreset(0);
        if (Input.IsGamepadButtonDown(0, "FACE_RIGHT")) this._firePreset(1);
        if (Input.IsGamepadButtonDown(0, "FACE_LEFT"))  this._firePreset(2);
        if (Input.IsGamepadButtonDown(0, "FACE_UP"))    this._firePreset(3);

        // Custom — read LT / RT live
        this.customStrong = Input.GetGamepadTriggerValue(0, "LT");
        this.customWeak   = Input.GetGamepadTriggerValue(0, "RT");

        // Update live value labels — setter skips re-render when string is unchanged
        this.ltValueLabel.text = `LT   Strong motor: ${this.customStrong.toFixed(3)}`;
        this.rtValueLabel.text = `RT   Weak motor:   ${this.customWeak.toFixed(3)}`;

        // Custom — fire: uses RumbleGamepad directly since it's ad-hoc (no preset registered)
        if (Input.IsGamepadButtonDown(0, "START") || Input.IsKeyDown(KEY_ENTER)) {
            this._fire(this.customStrong, this.customWeak, 500, "Custom", this.colorAccent);
        }

        // Update status label — color object references are stable so the setter
        // only marks dirty when the connection state actually changes
        const connected = Input.gamepads.length > 0;
        this.statusLabel.text  = connected
            ? `Connected: ${Input.gamepads[0].gamepad.id}`
            : "No gamepad detected — keyboard shortcuts still work";
        this.statusLabel.color = connected ? this.colorGreen : this.colorMuted;
    }

    Draw() {
        super.Draw();

        // background
        this.renderer.DrawFillBasicRectangle(0, 0, this.screenWidth, this.screenHeight, this.colorBg);

        // ── Header ──────────────────────────────────────────────
        this.titleLabel.Draw(this.renderer);
        this.statusLabel.Draw(this.renderer);

        // ── Preset cards ─────────────────────────────────────────
        this.presetsLabel.Draw(this.renderer);

        this.presets.forEach((preset, i) => {
            const r        = preset.rect;
            const isActive = this.activePreset === i && this.activeTimer > 0;

            this.renderer.DrawFillBasicRectangle(r.x, r.y, r.w, r.h, isActive ? preset.color : this.colorCard);
            if (!isActive)
                this.renderer.DrawFillBasicRectangle(r.x, r.y, 4, r.h, preset.color);

            preset.keyLabelText.Draw(this.renderer);
            preset.paramsText.Draw(this.renderer);
            preset.labelText.Draw(this.renderer);
            preset.hintText.Draw(this.renderer);
        });

        // ── Custom section ────────────────────────────────────────
        const cy = this._cy, barX = this._barX, barW = this._barW, barH = this._barH;

        this.customSectionLabel.Draw(this.renderer);

        // LT — strong motor bar
        this.renderer.DrawFillBasicRectangle(barX, cy + 14, barW, barH, this.colorCard);
        this.renderer.DrawFillBasicRectangle(barX, cy + 14, barW * this.customStrong, barH, this.colorYellow);
        this.ltValueLabel.Draw(this.renderer);

        // RT — weak motor bar
        this.renderer.DrawFillBasicRectangle(barX, cy + 44, barW, barH, this.colorCard);
        this.renderer.DrawFillBasicRectangle(barX, cy + 44, barW * this.customWeak, barH, this.colorPurple);
        this.rtValueLabel.Draw(this.renderer);

        this.fireLabel.Draw(this.renderer);

        // ── Divider ───────────────────────────────────────────────
        this.renderer.DrawFillBasicRectangle(25, 362, this.screenWidth - 50, 1, this.colorCard);

        // ── Live API call display ─────────────────────────────────
        this.lastCallLabel.Draw(this.renderer);

        if (this.lastRumble) {
            this.snippetLabel.Draw(this.renderer);
            this.annotationLabel.Draw(this.renderer);
        }
        else {
            this.placeholderLabel.Draw(this.renderer);
        }
    }
}

window.onload = () => {
    Init(RumbleTest);
}
