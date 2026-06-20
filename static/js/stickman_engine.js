/* ============================================================================
   STAS ARENA — STICKMAN ENGINE
   Jantung utama game engine 2D Canvas, cuks.
   Handle: gravity/ragdoll dasar, collision, state machine, render, input
   (keyboard WASD/Arrows + virtual joystick/D-Pad touch).

   Dependency HTML wajib ada di game_stickman.html:
     <canvas id="arenaCanvas"></canvas>
     Tombol D-Pad/Joystick dengan id:
       #btnLeft, #btnRight, #btnJump, #btnAttack, #btnDefend
     (Kalau ID di HTML kamu beda, tinggal sesuaikan di CONFIG.controlIds)

   Engine ini expose object global `STASEngine` biar gampang dipanggil
   dari stickman_network.js atau inline script di HTML.
   ============================================================================ */

(function (window) {
  "use strict";

  /* ============================================================
     0. KONFIGURASI GLOBAL
     ============================================================ */
  const CONFIG = {
    canvasId: "arenaCanvas",
    fps: 60,
    gravity: 0.85,
    groundFriction: 0.82,
    airFriction: 0.95,
    moveSpeed: 4.2,
    jumpForce: -15.5,
    maxFallSpeed: 22,
    arenaPadding: 40,           // jarak dari tepi canvas ke "dinding" arena
    groundHeightRatio: 0.86,    // posisi tanah relatif terhadap tinggi canvas
    roundTime: 99,              // detik per ronde
    maxHP: 100,

    // Hitbox & jangkauan serangan
    punchRange: 64,
    punchDamage: 8,
    punchDamageCrit: 14,
    hitStunDuration: 22,        // frame kena stun setelah dipukul
    attackDuration: 18,         // frame durasi animasi nonjok
    attackCooldown: 26,         // frame cooldown antar pukulan
    defendDamageReduction: 0.78,// defend mengurangi damage 78%

    // Warna tema Cyberpunk
    colors: {
      bg: "#0a0a0c",
      gold: "#ffb703",
      goldGlow: "rgba(255,183,3,0.55)",
      cyan: "#00f5d4",
      cyanGlow: "rgba(0,245,212,0.55)",
      ground: "#161616",
      groundLine: "#ffb703",
      hpRed: "#ff2d55",
      hpBarBg: "#1a1a1d",
      white: "#f4f4f6",
      dim: "#7d7d86",
    },

    // ID elemen kontrol sentuh — sesuaikan kalau beda di HTML
    controlIds: {
      left: "btnLeft",
      right: "btnRight",
      jump: "btnJump",
      attack: "btnAttack",
      defend: "btnDefend",
    },
  };

  const STATE = {
    IDLE: "idle",
    MOVE: "move",
    JUMP: "jump",
    ATTACK: "attack",
    DEFEND: "defend",
    HIT: "hit",
    DEAD: "dead",
  };

  /* ============================================================
     1. UTIL
     ============================================================ */
  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function aabbIntersect(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  function randRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  function log(msg) {
    // Log santai khas anak IT, biar gampang debug pas demo ke dosen/klien
    if (window.STASEngine && window.STASEngine.debug) {
      console.log(`%c[STAS-ENGINE] ${msg}`, "color:#ffb703;font-weight:bold;");
    }
  }

  /* ============================================================
     2. CLASS: FIGHTER (Stickman)
     ============================================================ */
  class Fighter {
    /**
     * @param {Object} opts
     * @param {string} opts.id          - "p1" | "p2"
     * @param {string} opts.name        - nama tampil
     * @param {string} opts.color       - warna neon utama
     * @param {number} opts.x           - posisi awal x
     * @param {number} opts.facing      - 1 = hadap kanan, -1 = hadap kiri
     * @param {boolean} opts.isAI       - true kalau dikontrol bot lokal
     */
    constructor(opts) {
      this.id = opts.id;
      this.name = opts.name || opts.id.toUpperCase();
      this.color = opts.color;
      this.glowColor = opts.glowColor || opts.color;
      this.facing = opts.facing || 1;
      this.isAI = !!opts.isAI;
      this.isRemote = false; // dikontrol via network (multiplayer online)

      // Posisi & fisika
      this.x = opts.x || 100;
      this.y = 0; // di-set saat resize/groundY dihitung
      this.vx = 0;
      this.vy = 0;
      this.width = 34;
      this.height = 96;
      this.onGround = true;

      // Status game
      this.hp = CONFIG.maxHP;
      this.state = STATE.IDLE;
      this.prevState = STATE.IDLE;
      this.attackTimer = 0;
      this.attackCooldownTimer = 0;
      this.hitStunTimer = 0;
      this.isDefending = false;
      this.hasHitThisAttack = false; // biar 1x ayun cuma kena 1x damage
      this.comboCount = 0;
      this.score = 0;

      // Animasi
      this.walkCycle = 0;
      this.bobOffset = 0;
      this.flashTimer = 0; // efek flash putih saat kena hit
      this.shakeTimer = 0;

      // Input state (dipakai oleh keyboard & virtual dpad sama-sama)
      this.input = {
        left: false,
        right: false,
        jump: false,
        attack: false,
        defend: false,
      };
    }

    get isDead() {
      return this.hp <= 0;
    }

    getHitbox() {
      return { x: this.x, y: this.y, w: this.width, h: this.height };
    }

    getAttackHitbox() {
      const range = CONFIG.punchRange;
      const x = this.facing === 1 ? this.x + this.width : this.x - range;
      return {
        x: x,
        y: this.y + this.height * 0.18,
        w: range,
        h: this.height * 0.42,
      };
    }

    takeDamage(amount, attackerFacing) {
      let dmg = amount;
      if (this.isDefending) {
        dmg = amount * (1 - CONFIG.defendDamageReduction);
      }
      this.hp = clamp(this.hp - dmg, 0, CONFIG.maxHP);
      this.hitStunTimer = CONFIG.hitStunDuration;
      this.flashTimer = 10;
      this.shakeTimer = 8;

      // Sedikit knockback
      const kb = this.isDefending ? 2.5 : 6.5;
      this.vx = (attackerFacing || 1) * kb;
      this.vy = this.isDefending ? this.vy : -3.5;

      if (!this.isDefending) {
        this.state = STATE.HIT;
      }
      if (this.hp <= 0) {
        this.state = STATE.DEAD;
      }
      return dmg;
    }

    resetRound(x) {
      this.hp = CONFIG.maxHP;
      this.x = x;
      this.vx = 0;
      this.vy = 0;
      this.state = STATE.IDLE;
      this.hitStunTimer = 0;
      this.attackTimer = 0;
      this.attackCooldownTimer = 0;
      this.isDefending = false;
      this.comboCount = 0;
    }
  }

  /* ============================================================
     3. CLASS: ENGINE UTAMA
     ============================================================ */
  class StickmanEngine {
    constructor() {
      this.canvas = null;
      this.ctx = null;
      this.width = 0;
      this.height = 0;
      this.groundY = 0;
      this.running = false;
      this.paused = false;
      this.debug = false;

      this.player1 = null;
      this.player2 = null;
      this.roundTimer = CONFIG.roundTime * CONFIG.fps;
      this.gameOver = false;
      this.winner = null;

      this._lastTime = 0;
      this._accumulator = 0;
      this._frameDuration = 1000 / CONFIG.fps;

      this._keyMap = this._buildKeyMap();
      this._aiTimer = 0;
      this._aiDecisionInterval = 26;
      this._aiState = { moveDir: 0, wantJump: false, wantAttack: false, wantDefend: false };

      this._particles = []; // efek spark waktu kena pukul

      // callback hook eksternal (dipakai stickman_network.js & UI)
      this.onStateChange = null;   // (fighter) => {}
      this.onHit = null;           // (attacker, defender, dmg) => {}
      this.onRoundEnd = null;      // (winnerId) => {}
      this.onHpChange = null;      // (p1hp, p2hp) => {}
      this.onTimerTick = null;     // (secondsLeft) => {}

      this._boundLoop = this._loop.bind(this);
      this._touchHandlersBound = false;
    }

    /* ---------------------------------------------------------
       3.1 INIT
       --------------------------------------------------------- */
    init(canvasId) {
      canvasId = canvasId || CONFIG.canvasId;
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) {
        console.error(
          `%c[STAS-ENGINE] Waduh cuks, canvas #${canvasId} gak ketemu di DOM. Cek lagi id-nya di HTML.`,
          "color:#ff2d55;font-weight:bold;"
        );
        return false;
      }
      this.ctx = this.canvas.getContext("2d");
      this._resizeCanvas();

      // Buat dua fighter default
      this.player1 = new Fighter({
        id: "p1",
        name: "PLAYER 1",
        color: CONFIG.colors.gold,
        glowColor: CONFIG.colors.goldGlow,
        x: CONFIG.arenaPadding + 60,
        facing: 1,
        isAI: false,
      });

      this.player2 = new Fighter({
        id: "p2",
        name: "AI BOT",
        color: CONFIG.colors.cyan,
        glowColor: CONFIG.colors.cyanGlow,
        x: this.width - CONFIG.arenaPadding - 100,
        facing: -1,
        isAI: true, // default offline = AI lokal yang gerakin, nanti bisa di-override stickman_network.js
      });

      this._placeOnGround(this.player1);
      this._placeOnGround(this.player2);

      this._bindKeyboard();
      this._bindTouchControls();
      window.addEventListener("resize", () => this._resizeCanvas());

      log("Engine initialized. Arena siap digeber, cuks!");
      return true;
    }

    _resizeCanvas() {
      const parent = this.canvas.parentElement;
      const w = parent ? parent.clientWidth : window.innerWidth;
      // ratio 16:9 dengan max height biar pas di HP & desktop
      let cw = Math.min(w, 1000);
      let ch = Math.round(cw * 0.5625);

      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = cw * dpr;
      this.canvas.height = ch * dpr;
      this.canvas.style.width = cw + "px";
      this.canvas.style.height = ch + "px";
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      this.width = cw;
      this.height = ch;
      this.groundY = Math.round(this.height * CONFIG.groundHeightRatio);

      if (this.player1) this._placeOnGround(this.player1);
      if (this.player2) this._placeOnGround(this.player2);
    }

    _placeOnGround(f) {
      f.y = this.groundY - f.height;
      f.x = clamp(
        f.x,
        CONFIG.arenaPadding,
        this.width - CONFIG.arenaPadding - f.width
      );
    }

    /* ---------------------------------------------------------
       3.2 INPUT — KEYBOARD
       --------------------------------------------------------- */
    _buildKeyMap() {
      return {
        // Player 1: WASD + F serang + G bertahan
        KeyA: { player: "p1", action: "left" },
        KeyD: { player: "p1", action: "right" },
        KeyW: { player: "p1", action: "jump" },
        KeyF: { player: "p1", action: "attack" },
        KeyG: { player: "p1", action: "defend" },
        // Player 2 (mode lokal 2-pemain / debug): Arrows + tombol numpad-ish
        ArrowLeft: { player: "p2", action: "left" },
        ArrowRight: { player: "p2", action: "right" },
        ArrowUp: { player: "p2", action: "jump" },
        Slash: { player: "p2", action: "attack" },
        Period: { player: "p2", action: "defend" },
      };
    }

    _bindKeyboard() {
      window.addEventListener("keydown", (e) => this._handleKey(e, true));
      window.addEventListener("keyup", (e) => this._handleKey(e, false));
    }

    _handleKey(e, isDown) {
      const map = this._keyMap[e.code];
      if (!map) return;

      const fighter = map.player === "p1" ? this.player1 : this.player2;
      if (!fighter || fighter.isRemote) return; // remote player gak boleh di-override keyboard lokal
      // P2 lokal cuma aktif kalau dia BUKAN AI (mode 2 pemain satu papan ketik)
      if (map.player === "p2" && fighter.isAI) return;

      fighter.input[map.action] = isDown;
      e.preventDefault();
    }

    /* ---------------------------------------------------------
       3.3 INPUT — VIRTUAL JOYSTICK / D-PAD (TOUCHSCREEN)
       --------------------------------------------------------- */
    _bindTouchControls() {
      if (this._touchHandlersBound) return;
      const ids = CONFIG.controlIds;
      const targetFighter = () => this.player1; // D-Pad layar selalu kontrol player lokal (p1)

      const pressMap = [
        { id: ids.left, action: "left" },
        { id: ids.right, action: "right" },
        { id: ids.jump, action: "jump" },
        { id: ids.attack, action: "attack" },
        { id: ids.defend, action: "defend" },
      ];

      let boundAny = false;

      pressMap.forEach(({ id, action }) => {
        const el = document.getElementById(id);
        if (!el) {
          log(`Tombol D-Pad #${id} belum ada di HTML, skip binding (cek lagi ya cuks kalau perlu).`);
          return;
        }
        boundAny = true;

        const setState = (val) => (e) => {
          if (e) e.preventDefault();
          const f = targetFighter();
          if (!f) return;
          f.input[action] = val;
          el.classList.toggle("is-active", val);
        };

        // Touch events
        el.addEventListener("touchstart", setState(true), { passive: false });
        el.addEventListener("touchend", setState(false), { passive: false });
        el.addEventListener("touchcancel", setState(false), { passive: false });

        // Mouse events juga di-handle, jaga-jaga kalau ditest pakai mouse di desktop/tablet hybrid
        el.addEventListener("mousedown", setState(true));
        el.addEventListener("mouseup", setState(false));
        el.addEventListener("mouseleave", setState(false));

        // Cegah long-press context menu di mobile
        el.addEventListener("contextmenu", (e) => e.preventDefault());
      });

      this._touchHandlersBound = boundAny;
      if (boundAny) {
        log("Virtual D-Pad/Joystick berhasil disambung ke Player 1. Gas tap-tap di HP!");
      }
    }

    /**
     * Dipanggil manual dari stickman_network.js / kode lain kalau
     * mau "nyuntik" gerakan joystick analog (bukan cuma D-Pad digital).
     * dir: -1 (kiri) .. 0 .. 1 (kanan)
     */
    setAnalogMove(dir) {
      if (!this.player1) return;
      this.player1.input.left = dir < -0.15;
      this.player1.input.right = dir > 0.15;
    }

    /* ---------------------------------------------------------
       3.4 GAME LOOP
       --------------------------------------------------------- */
    start() {
      if (this.running) return;
      this.running = true;
      this.paused = false;
      this.gameOver = false;
      this._lastTime = performance.now();
      requestAnimationFrame(this._boundLoop);
      log("Game loop dimulai. Let's gooo!");
    }

    pause() {
      this.paused = true;
    }

    resume() {
      this.paused = false;
      this._lastTime = performance.now();
    }

    stop() {
      this.running = false;
    }

    restartRound() {
      this.gameOver = false;
      this.winner = null;
      this.roundTimer = CONFIG.roundTime * CONFIG.fps;
      this.player1.resetRound(CONFIG.arenaPadding + 60);
      this.player2.resetRound(this.width - CONFIG.arenaPadding - 100);
      this.player1.facing = 1;
      this.player2.facing = -1;
      this._particles = [];
      log("Ronde direstart. Fight lagi, cuks!");
    }

    _loop(timestamp) {
      if (!this.running) return;

      const delta = timestamp - this._lastTime;
      this._lastTime = timestamp;

      if (!this.paused) {
        this._accumulator += delta;
        // fixed timestep biar fisika konsisten di semua refresh rate device
        while (this._accumulator >= this._frameDuration) {
          this._update();
          this._accumulator -= this._frameDuration;
        }
      }

      this._render();
      requestAnimationFrame(this._boundLoop);
    }

    /* ---------------------------------------------------------
       3.5 UPDATE (PHYSICS + STATE + COLLISION)
       --------------------------------------------------------- */
    _update() {
      if (this.gameOver) return;

      // Timer ronde
      this.roundTimer--;
      if (this.roundTimer % CONFIG.fps === 0 && this.onTimerTick) {
        this.onTimerTick(Math.max(0, Math.ceil(this.roundTimer / CONFIG.fps)));
      }
      if (this.roundTimer <= 0) {
        this._endRound(this.player1.hp >= this.player2.hp ? this.player1.id : this.player2.id);
        return;
      }

      if (this.player2.isAI && !this.player2.isRemote) {
        this._runLocalAI();
      }

      this._updateFighterPhysics(this.player1, this.player2);
      this._updateFighterPhysics(this.player2, this.player1);

      this._resolveAttacks(this.player1, this.player2);
      this._resolveAttacks(this.player2, this.player1);

      this._resolveBodyCollision(this.player1, this.player2);

      this._updateParticles();

      if (this.onHpChange) {
        this.onHpChange(this.player1.hp, this.player2.hp);
      }

      if (this.player1.isDead || this.player2.isDead) {
        const winnerId = this.player1.isDead ? this.player2.id : this.player1.id;
        this._endRound(winnerId);
      }
    }

    _updateFighterPhysics(f, opponent) {
      const prevState = f.state;

      // Hit stun: kontrol dikunci sementara
      if (f.hitStunTimer > 0) {
        f.hitStunTimer--;
        if (f.hitStunTimer === 0 && !f.isDead) {
          f.state = STATE.IDLE;
        }
      }

      // Attack cooldown & durasi
      if (f.attackCooldownTimer > 0) f.attackCooldownTimer--;
      if (f.attackTimer > 0) {
        f.attackTimer--;
        if (f.attackTimer === 0) {
          f.state = STATE.IDLE;
          f.hasHitThisAttack = false;
        }
      }

      const canAct = f.hitStunTimer <= 0 && f.attackTimer <= 0 && !f.isDead;

      // ===== DEFEND =====
      f.isDefending = canAct && f.input.defend && f.onGround;
      if (f.isDefending) {
        f.state = STATE.DEFEND;
      }

      // ===== ATTACK =====
      if (canAct && f.input.attack && f.attackCooldownTimer <= 0 && !f.isDefending) {
        f.state = STATE.ATTACK;
        f.attackTimer = CONFIG.attackDuration;
        f.attackCooldownTimer = CONFIG.attackCooldown;
        f.hasHitThisAttack = false;
      }

      // ===== MOVE (kiri/kanan) — gak boleh gerak waktu nyerang/defend/hitstun =====
      const lockedFromMove =
        f.state === STATE.ATTACK || f.state === STATE.DEFEND || f.hitStunTimer > 0 || f.isDead;

      if (!lockedFromMove) {
        let moveX = 0;
        if (f.input.left) moveX -= 1;
        if (f.input.right) moveX += 1;

        if (moveX !== 0) {
          f.vx += moveX * CONFIG.moveSpeed * 0.35;
          f.facing = moveX;
          if (f.onGround) f.state = STATE.MOVE;
        } else if (f.onGround && f.state !== STATE.ATTACK && f.state !== STATE.DEFEND) {
          f.state = STATE.IDLE;
        }

        // ===== JUMP =====
        if (f.input.jump && f.onGround) {
          f.vy = CONFIG.jumpForce;
          f.onGround = false;
          f.state = STATE.JUMP;
        }
      }

      // ===== GRAVITY =====
      f.vy += CONFIG.gravity;
      f.vy = clamp(f.vy, -999, CONFIG.maxFallSpeed);

      // ===== FRICTION =====
      const friction = f.onGround ? CONFIG.groundFriction : CONFIG.airFriction;
      f.vx *= friction;
      f.vx = clamp(f.vx, -CONFIG.moveSpeed, CONFIG.moveSpeed);

      // ===== APPLY VELOCITY =====
      f.x += f.vx;
      f.y += f.vy;

      // ===== GROUND COLLISION =====
      const floorY = this.groundY - f.height;
      if (f.y >= floorY) {
        f.y = floorY;
        f.vy = 0;
        if (!f.onGround && f.state === STATE.JUMP) {
          f.state = STATE.IDLE;
        }
        f.onGround = true;
      } else {
        f.onGround = false;
        if (f.state !== STATE.ATTACK && f.state !== STATE.HIT && f.state !== STATE.DEAD) {
          f.state = STATE.JUMP;
        }
      }

      // ===== ARENA WALL BOUNDS =====
      const minX = CONFIG.arenaPadding;
      const maxX = this.width - CONFIG.arenaPadding - f.width;
      if (f.x < minX) {
        f.x = minX;
        f.vx = 0;
      }
      if (f.x > maxX) {
        f.x = maxX;
        f.vx = 0;
      }

      // Auto-hadap ke lawan kalau idle/move (biar berasa "fighting game")
      if ((f.state === STATE.IDLE || f.state === STATE.MOVE) && opponent) {
        f.facing = opponent.x > f.x ? 1 : -1;
      }

      // Animasi jalan
      if (f.state === STATE.MOVE) {
        f.walkCycle += 0.22;
      } else {
        f.walkCycle *= 0.85;
      }
      f.bobOffset = Math.sin(f.walkCycle) * 4;

      if (f.flashTimer > 0) f.flashTimer--;
      if (f.shakeTimer > 0) f.shakeTimer--;

      if (f.state !== prevState) {
        f.prevState = prevState;
        if (this.onStateChange) this.onStateChange(f);
      }
    }

    /* ---------------------------------------------------------
       3.6 COLLISION — SERANGAN
       --------------------------------------------------------- */
    _resolveAttacks(attacker, defender) {
      if (attacker.state !== STATE.ATTACK) return;
      if (attacker.hasHitThisAttack) return;

      // window aktif pukulan: pertengahan durasi attack (biar ada "wind-up")
      const activeFrameStart = CONFIG.attackDuration * 0.35;
      const activeFrameEnd = CONFIG.attackDuration * 0.75;
      const elapsed = CONFIG.attackDuration - attacker.attackTimer;
      if (elapsed < activeFrameStart || elapsed > activeFrameEnd) return;

      const hitbox = attacker.getAttackHitbox();
      const defenderBox = defender.getHitbox();

      if (aabbIntersect(hitbox, defenderBox) && !defender.isDead) {
        attacker.hasHitThisAttack = true;
        const isCrit = Math.random() < 0.18;
        const baseDmg = isCrit ? CONFIG.punchDamageCrit : CONFIG.punchDamage;
        const dealt = defender.takeDamage(baseDmg, attacker.facing);
        attacker.comboCount++;
        attacker.score += Math.round(dealt);

        this._spawnHitParticles(
          defender.x + defender.width / 2,
          defender.y + defender.height * 0.35,
          defender.isDefending ? CONFIG.colors.cyan : CONFIG.colors.hpRed
        );

        if (this.onHit) this.onHit(attacker, defender, dealt);
        log(
          `${attacker.name} ngehajar ${defender.name} ${isCrit ? "CRIT! " : ""}(-${dealt.toFixed(
            1
          )} HP)`
        );
      }
    }

    /* ---------------------------------------------------------
       3.7 COLLISION — BODY (gak boleh saling tembus)
       --------------------------------------------------------- */
    _resolveBodyCollision(a, b) {
      const boxA = a.getHitbox();
      const boxB = b.getHitbox();
      if (!aabbIntersect(boxA, boxB)) return;

      const overlap =
        Math.min(boxA.x + boxA.w, boxB.x + boxB.w) - Math.max(boxA.x, boxB.x);
      if (overlap <= 0) return;

      const push = overlap / 2 + 0.5;
      if (a.x < b.x) {
        a.x -= push;
        b.x += push;
      } else {
        a.x += push;
        b.x -= push;
      }

      // Clamp lagi ke dalam arena setelah didorong
      const minX = CONFIG.arenaPadding;
      const maxX = this.width - CONFIG.arenaPadding;
      a.x = clamp(a.x, minX, maxX - a.width);
      b.x = clamp(b.x, minX, maxX - b.width);
    }

    /* ---------------------------------------------------------
       3.8 AI BOT LOKAL SEDERHANA (dipakai kalau room = offline)
       --------------------------------------------------------- */
    _runLocalAI() {
      const ai = this.player2;
      const enemy = this.player1;
      if (ai.isDead || this.gameOver) {
        ai.input.left = ai.input.right = ai.input.attack = ai.input.defend = ai.input.jump = false;
        return;
      }

      this._aiTimer++;
      const dist = enemy.x - ai.x;
      const absDist = Math.abs(dist);

      if (this._aiTimer >= this._aiDecisionInterval) {
        this._aiTimer = 0;

        if (absDist > CONFIG.punchRange * 0.85) {
          this._aiState.moveDir = dist > 0 ? 1 : -1;
          this._aiState.wantAttack = false;
        } else {
          this._aiState.moveDir = 0;
          // Dalam jangkauan: kadang nyerang, kadang defend, biar gak gampang ditebak
          const roll = Math.random();
          this._aiState.wantAttack = roll < 0.55;
          this._aiState.wantDefend = !this._aiState.wantAttack && roll < 0.8;
        }

        // Sesekali lompat random biar dinamis
        this._aiState.wantJump = Math.random() < 0.06;
      }

      ai.input.left = this._aiState.moveDir === -1;
      ai.input.right = this._aiState.moveDir === 1;
      ai.input.jump = this._aiState.wantJump;
      ai.input.attack = this._aiState.wantAttack && absDist <= CONFIG.punchRange * 1.1;
      ai.input.defend = !!this._aiState.wantDefend;

      // reset one-shot triggers
      this._aiState.wantJump = false;
    }

    /* ---------------------------------------------------------
       3.9 PARTICLES (spark effect saat hit)
       --------------------------------------------------------- */
    _spawnHitParticles(x, y, color) {
      for (let i = 0; i < 10; i++) {
        this._particles.push({
          x,
          y,
          vx: randRange(-4, 4),
          vy: randRange(-5, -1),
          life: 24,
          maxLife: 24,
          color,
          size: randRange(2, 4),
        });
      }
    }

    _updateParticles() {
      for (let i = this._particles.length - 1; i >= 0; i--) {
        const p = this._particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3;
        p.life--;
        if (p.life <= 0) this._particles.splice(i, 1);
      }
    }

    /* ---------------------------------------------------------
       3.10 ROUND END
       --------------------------------------------------------- */
    _endRound(winnerId) {
      if (this.gameOver) return;
      this.gameOver = true;
      this.winner = winnerId;
      const winnerName =
        winnerId === this.player1.id ? this.player1.name : this.player2.name;
      log(`ROUND OVER! Pemenangnya: ${winnerName}. GG cuks!`);
      if (this.onRoundEnd) this.onRoundEnd(winnerId);
    }

    /* ============================================================
       4. RENDER
       ============================================================ */
    _render() {
      const ctx = this.ctx;
      const { width: w, height: h } = this;
      const c = CONFIG.colors;

      ctx.clearRect(0, 0, w, h);

      this._drawBackground(ctx, w, h);
      this._drawGround(ctx, w, h);

      // Urutkan render biar yang di belakang (y lebih kecil... di sini flat aja) konsisten
      this._drawFighter(this.player1);
      this._drawFighter(this.player2);

      this._drawParticles(ctx);

      if (this.gameOver) {
        this._drawGameOverOverlay(ctx, w, h);
      }
    }

    _drawBackground(ctx, w, h) {
      const c = CONFIG.colors;
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#0d0d10");
      grad.addColorStop(1, c.bg);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Grid garis neon tipis ala cyberpunk
      ctx.save();
      ctx.globalAlpha = 0.07;
      ctx.strokeStyle = c.cyan;
      ctx.lineWidth = 1;
      const gridSize = 36;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, this.groundY);
        ctx.stroke();
      }
      ctx.restore();

      // Glow lampu di kejauhan
      this._drawGlowCircle(ctx, w * 0.15, h * 0.22, 70, c.goldGlow);
      this._drawGlowCircle(ctx, w * 0.85, h * 0.18, 70, c.cyanGlow);
    }

    _drawGlowCircle(ctx, x, y, radius, color) {
      const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
      grad.addColorStop(0, color);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    _drawGround(ctx, w, h) {
      const c = CONFIG.colors;
      ctx.fillStyle = c.ground;
      ctx.fillRect(0, this.groundY, w, h - this.groundY);

      // Garis neon di permukaan tanah
      ctx.save();
      ctx.shadowColor = c.groundLine;
      ctx.shadowBlur = 14;
      ctx.strokeStyle = c.groundLine;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, this.groundY);
      ctx.lineTo(w, this.groundY);
      ctx.stroke();
      ctx.restore();

      // Garis batas arena kiri-kanan
      ctx.save();
      ctx.strokeStyle = "rgba(255,183,3,0.25)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(CONFIG.arenaPadding, 0);
      ctx.lineTo(CONFIG.arenaPadding, this.groundY);
      ctx.moveTo(w - CONFIG.arenaPadding, 0);
      ctx.lineTo(w - CONFIG.arenaPadding, this.groundY);
      ctx.stroke();
      ctx.restore();
    }

    /* ---------------------------------------------------------
       4.1 RENDER STICKMAN
       Kepala bulat, badan garis, tangan bisa "menonjok".
       --------------------------------------------------------- */
    _drawFighter(f) {
      const ctx = this.ctx;
      let drawColor = f.color;

      if (f.flashTimer > 0 && f.flashTimer % 4 < 2) {
        drawColor = "#ffffff";
      }
      if (f.isDead) {
        drawColor = CONFIG.colors.dim;
      }

      const shakeX = f.shakeTimer > 0 ? randRange(-3, 3) : 0;
      const cx = f.x + f.width / 2 + shakeX; // center x
      const groundFootY = f.y + f.height; // posisi kaki di tanah
      const bob = f.state === STATE.MOVE ? f.bobOffset : 0;

      ctx.save();
      ctx.translate(0, f.isDead ? 6 : 0);

      // ===== GLOW di belakang badan =====
      ctx.save();
      ctx.shadowColor = f.glowColor;
      ctx.shadowBlur = f.state === STATE.HIT ? 28 : 16;

      const headRadius = f.width * 0.42;
      const headCenterY = f.y + headRadius + 2 + Math.abs(bob) * 0.3;
      const neckY = headCenterY + headRadius;
      const hipY = f.y + f.height * 0.62;
      const footY = f.y + f.height;

      ctx.strokeStyle = drawColor;
      ctx.fillStyle = drawColor;
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // ===== KEPALA (lingkaran) =====
      ctx.beginPath();
      ctx.arc(cx, headCenterY, headRadius, 0, Math.PI * 2);
      ctx.fillStyle = CONFIG.colors.bg;
      ctx.fill();
      ctx.stroke();

      // Mata kecil biar ada "karakter", arah sesuai facing
      ctx.fillStyle = drawColor;
      const eyeX = cx + f.facing * headRadius * 0.35;
      ctx.beginPath();
      ctx.arc(eyeX, headCenterY - 2, 2.4, 0, Math.PI * 2);
      ctx.fill();

      // ===== BADAN (garis vertikal sedikit lentur saat jalan) =====
      const bodyLean = f.state === STATE.MOVE ? f.facing * 3 : 0;
      const hipX = cx + bodyLean;
      ctx.beginPath();
      ctx.moveTo(cx, neckY);
      ctx.lineTo(hipX, hipY);
      ctx.stroke();

      // ===== TANGAN =====
      const shoulderY = neckY + 6;
      const isAttacking = f.state === STATE.ATTACK;
      const attackProgress = isAttacking
        ? 1 - f.attackTimer / CONFIG.attackDuration
        : 0;

      this._drawArms(ctx, cx, shoulderY, f, isAttacking, attackProgress);

      // ===== KAKI =====
      this._drawLegs(ctx, hipX, hipY, footY, f);

      // ===== POSE DEFEND: tambahan tameng garis depan badan =====
      if (f.state === STATE.DEFEND) {
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.strokeStyle = CONFIG.colors.cyan;
        ctx.shadowColor = CONFIG.colors.cyan;
        ctx.shadowBlur = 18;
        ctx.lineWidth = 3;
        const shieldX = cx + f.facing * (f.width * 0.55);
        ctx.beginPath();
        ctx.moveTo(shieldX, headCenterY - 4);
        ctx.lineTo(shieldX, hipY + 6);
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore(); // end glow block

      // ===== NAMA & STATE LABEL (debug-friendly, kecil di atas kepala) =====
      ctx.save();
      ctx.font = "bold 11px 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = drawColor;
      ctx.globalAlpha = 0.85;
      ctx.fillText(f.name, cx, headCenterY - headRadius - 10);
      ctx.restore();

      ctx.restore(); // end translate block
    }

    _drawArms(ctx, cx, shoulderY, f, isAttacking, progress) {
      const armLen = f.width * 1.05;
      const facing = f.facing;

      // Lengan belakang (statis, sedikit ayun saat jalan)
      const backSwing = f.state === STATE.MOVE ? Math.sin(f.walkCycle + Math.PI) * 10 : 0;
      ctx.beginPath();
      ctx.moveTo(cx, shoulderY);
      ctx.lineTo(cx - facing * armLen * 0.4, shoulderY + armLen * 0.55 + backSwing);
      ctx.stroke();

      if (isAttacking) {
        // Lengan depan: animasi nonjok — dari nekuk ke lurus ke depan lalu balik
        const punchOut = Math.sin(Math.min(progress * Math.PI, Math.PI));
        const elbowX = cx + facing * armLen * 0.32;
        const elbowY = shoulderY + armLen * 0.28;
        const fistX = cx + facing * (armLen * 0.35 + punchOut * armLen * 0.85);
        const fistY = shoulderY + armLen * 0.32 - punchOut * 6;

        ctx.beginPath();
        ctx.moveTo(cx, shoulderY);
        ctx.lineTo(elbowX, elbowY);
        ctx.lineTo(fistX, fistY);
        ctx.stroke();

        // Kepalan tangan (titik tebal)
        ctx.beginPath();
        ctx.arc(fistX, fistY, 5, 0, Math.PI * 2);
        ctx.fill();

        // Efek motion line pas lagi nonjok kencang
        if (punchOut > 0.5) {
          ctx.save();
          ctx.globalAlpha = 0.4;
          ctx.lineWidth = 2;
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            const off = i * 6;
            ctx.moveTo(fistX - facing * (10 + off), fistY - 6 + i * 4);
            ctx.lineTo(fistX - facing * (2 + off), fistY - 6 + i * 4);
            ctx.stroke();
          }
          ctx.restore();
        }
      } else if (f.state === STATE.DEFEND) {
        // Lengan depan nekuk melindungi badan
        const elbowX = cx + facing * armLen * 0.25;
        const elbowY = shoulderY + armLen * 0.22;
        const fistX = cx + facing * armLen * 0.18;
        const fistY = shoulderY + armLen * 0.05;
        ctx.beginPath();
        ctx.moveTo(cx, shoulderY);
        ctx.lineTo(elbowX, elbowY);
        ctx.lineTo(fistX, fistY);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(fistX, fistY, 4.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Lengan depan idle/jalan: ayun normal
        const frontSwing =
          f.state === STATE.MOVE ? Math.sin(f.walkCycle) * 10 : 0;
        const fistX = cx + facing * armLen * 0.4;
        const fistY = shoulderY + armLen * 0.55 + frontSwing;
        ctx.beginPath();
        ctx.moveTo(cx, shoulderY);
        ctx.lineTo(fistX, fistY);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(fistX, fistY, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    _drawLegs(ctx, hipX, hipY, footY, f) {
      const stride =
        f.state === STATE.MOVE ? Math.sin(f.walkCycle) * (f.width * 0.55) : 0;
      const strideBack =
        f.state === STATE.MOVE ? Math.sin(f.walkCycle + Math.PI) * (f.width * 0.55) : 0;

      let footAY = footY;
      let footBY = footY;

      // Pose lompat: kedua kaki nekuk ke belakang dikit
      if (f.state === STATE.JUMP) {
        footAY -= 10;
        footBY -= 4;
      }

      // Kaki 1
      ctx.beginPath();
      ctx.moveTo(hipX, hipY);
      ctx.lineTo(hipX + stride * 0.5, footAY);
      ctx.stroke();

      // Kaki 2
      ctx.beginPath();
      ctx.moveTo(hipX, hipY);
      ctx.lineTo(hipX + strideBack * 0.5, footBY);
      ctx.stroke();
    }

    _drawParticles(ctx) {
      for (const p of this._particles) {
        const alpha = p.life / p.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    _drawGameOverOverlay(ctx, w, h) {
      const c = CONFIG.colors;
      ctx.save();
      ctx.fillStyle = "rgba(10,10,12,0.72)";
      ctx.fillRect(0, 0, w, h);

      const winnerName =
        this.winner === this.player1.id ? this.player1.name : this.player2.name;
      const winnerColor =
        this.winner === this.player1.id ? c.gold : c.cyan;

      ctx.textAlign = "center";
      ctx.fillStyle = winnerColor;
      ctx.shadowColor = winnerColor;
      ctx.shadowBlur = 22;
      ctx.font = "bold 34px 'Segoe UI', sans-serif";
      ctx.fillText(`${winnerName} MENANG!`, w / 2, h / 2 - 10);

      ctx.shadowBlur = 0;
      ctx.fillStyle = c.white;
      ctx.font = "14px 'Segoe UI', sans-serif";
      ctx.fillText("Gas rematch? Tap Restart, cuks.", w / 2, h / 2 + 22);
      ctx.restore();
    }

    /* ============================================================
       5. PUBLIC HELPERS (dipanggil dari luar, mis. network.js / UI)
       ============================================================ */
    getPlayer(id) {
      if (id === "p1") return this.player1;
      if (id === "p2") return this.player2;
      return null;
    }

    setPlayerName(id, name) {
      const f = this.getPlayer(id);
      if (f) f.name = name;
    }

    /**
     * Dipakai stickman_network.js untuk override input P2 dari data remote
     * (multiplayer online) alih-alih AI lokal.
     */
    applyRemoteInput(id, inputState) {
      const f = this.getPlayer(id);
      if (!f) return;
      f.isRemote = true;
      f.isAI = false;
      Object.assign(f.input, inputState);
    }

    /**
     * Snapshot ringan buat dikirim ke server/peer kalau multiplayer online.
     */
    getLocalSnapshot() {
      const f = this.player1;
      return {
        x: f.x,
        y: f.y,
        vx: f.vx,
        vy: f.vy,
        facing: f.facing,
        state: f.state,
        hp: f.hp,
        input: { ...f.input },
      };
    }

    /**
     * Terapkan snapshot posisi musuh remote (P2) hasil sync online.
     */
    applyRemoteSnapshot(snapshot) {
      const f = this.player2;
      if (!f || !snapshot) return;
      f.isRemote = true;
      f.isAI = false;
      f.x = snapshot.x ?? f.x;
      f.y = snapshot.y ?? f.y;
      f.vx = snapshot.vx ?? f.vx;
      f.vy = snapshot.vy ?? f.vy;
      f.facing = snapshot.facing ?? f.facing;
      f.hp = snapshot.hp ?? f.hp;
      if (snapshot.state) f.state = snapshot.state;
    }

    setDebug(val) {
      this.debug = !!val;
    }
  }

  /* ============================================================
     6. EXPORT GLOBAL
     ============================================================ */
  window.STASEngine = new StickmanEngine();
  window.STASEngine.STATE = STATE;
  window.STASEngine.CONFIG = CONFIG;

  log("stickman_engine.js loaded. Tinggal panggil STASEngine.init() & .start() di HTML, cuks.");
})(window);
