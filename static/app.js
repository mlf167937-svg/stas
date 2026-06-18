/* ═══════════════════════════════════════════════════════════════════════
   STICKMAN WAR 2D — STAS ARENA
   Game Engine (Refactored to match your coding style)
   ═════════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  // ══════════════════════════════════════════════════════════════════
  // 1. GAME CONFIG
  // ══════════════════════════════════════════════════════════════════

  const GAME_CONFIG = {
    MAX_HP: 100,
    GRAVITY: 0.55,
    JUMP_POWER: -14,
    MOVE_SPD: 4.5,
    GROUND_H: 60,
    ROUND_TIME: 99,
    WEAPONS: {
      KATANA: {
        name: '⚔️ Katana',
        color: '#b0d8ff',
        damage: 9,
        cooldown: 280,
        range: 70,
        knockback: 3,
        swing: 'melee',
        swingDur: 180,
        label: '⚔️ Katana',
      },
      MACE: {
        name: '🛡️ Palu Gada',
        color: '#e0a860',
        damage: 22,
        cooldown: 900,
        range: 90,
        knockback: 14,
        swing: 'melee',
        swingDur: 450,
        label: '🛡️ Gada',
      },
      BOW: {
        name: '🏹 Busur',
        color: '#a8e88a',
        damage: 18,
        cooldown: 1100,
        range: 9999,
        knockback: 2,
        swing: 'projectile',
        projSpeed: 11,
        projCount: 1,
        spread: 0,
        projW: 22,
        projH: 5,
        label: '🏹 Busur',
      },
      LASER: {
        name: '🔫 Laser',
        color: '#ff66ff',
        damage: 8,
        cooldown: 420,
        range: 9999,
        knockback: 1.5,
        swing: 'projectile',
        projSpeed: 18,
        projCount: 2,
        spread: 0.07,
        projW: 14,
        projH: 4,
        label: '🔫 Laser',
        burst: true,
      },
    },
  };

  const WEAPON_KEYS = Object.keys(GAME_CONFIG.WEAPONS);

  // ══════════════════════════════════════════════════════════════════
  // 2. GAME STATE
  // ══════════════════════════════════════════════════════════════════

  let gameState = {
    mode: null,       // '1hp' | 'online'
    active: false,
    round: 1,
    timer: GAME_CONFIG.ROUND_TIME,
    timerInterval: null,
    screenShake: 0,
    particles: [],
    floatTexts: [],
    projectiles: [],
  };

  let onlineState = {
    socket: null,
    username: '',
    room: '',
    playerId: null,
  };

  let p1 = null;
  let p2 = null;

  // ══════════════════════════════════════════════════════════════════
  // 3. CANVAS SETUP
  // ══════════════════════════════════════════════════════════════════

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // ══════════════════════════════════════════════════════════════════
  // 4. PLAYER CLASS
  // ══════════════════════════════════════════════════════════════════

  class Player {
    constructor(id, x, color, facing) {
      this.id = id;
      this.x = x;
      this.y = 0;
      this.vx = 0;
      this.vy = 0;
      this.w = 32;
      this.h = 80;
      this.color = color;
      this.facing = facing;
      this.hp = GAME_CONFIG.MAX_HP;
      this.onGround = false;
      this.weapon = null;
      this.swingTimer = 0;
      this.cooldownTimer = 0;
      this.walkPhase = 0;
      this.isMoving = false;
      this.knockbackVx = 0;
      this.dead = false;
      this.burstCount = 0;
      this.burstTimer = 0;
    }

    assignWeapon(key) {
      this.weapon = { ...GAME_CONFIG.WEAPONS[key], key };
      this.cooldownTimer = 0;
      this.swingTimer = 0;
    }

    get groundY() {
      return canvas.height - GAME_CONFIG.GROUND_H - this.h;
    }

    get centerX() {
      return this.x + this.w / 2;
    }

    get centerY() {
      return this.y + this.h / 2;
    }

    get headY() {
      return this.y + 12;
    }

    get torsoY() {
      return this.y + 30;
    }

    get hipY() {
      return this.y + 52;
    }

    update(dt) {
      if (this.dead) return;

      this.knockbackVx *= 0.78;
      this.vx += this.knockbackVx * 0.1;

      this.vy += GAME_CONFIG.GRAVITY;
      this.x += this.vx + this.knockbackVx;
      this.y += this.vy;

      const gy = this.groundY;
      if (this.y >= gy) {
        this.y = gy;
        this.vy = 0;
        this.onGround = true;
      } else {
        this.onGround = false;
      }

      this.x = Math.max(10, Math.min(canvas.width - this.w - 10, this.x));
      this.vx *= 0.8;

      if (this.cooldownTimer > 0) this.cooldownTimer -= dt;
      if (this.swingTimer > 0) this.swingTimer -= dt;
      if (this.burstTimer > 0) this.burstTimer -= dt;

      this.walkPhase += this.isMoving ? 0.18 : 0;
      this.isMoving = false;
    }

    move(dx) {
      if (this.dead) return;
      this.vx = dx * GAME_CONFIG.MOVE_SPD;
      if (dx !== 0) {
        this.facing = dx > 0 ? 1 : -1;
        this.isMoving = true;
      }
    }

    jump() {
      if (this.onGround && !this.dead) {
        this.vy = GAME_CONFIG.JUMP_POWER;
      }
    }

    attack(other) {
      if (this.dead || !this.weapon) return;
      if (this.cooldownTimer > 0) return;

      const w = this.weapon;
      this.swingTimer = w.swingDur;
      this.cooldownTimer = w.cooldown;

      if (w.swing === 'melee') {
        const dx = other.centerX - this.centerX;
        if (Math.abs(dx) < w.range && Math.sign(dx) === this.facing) {
          this._dealDamage(other, w.damage, w.knockback, this.facing);
        }
        this._spawnMeleeParticles(w);
      } else {
        if (w.burst && this.burstCount < w.projCount) {
          this._fireLaserBurst(w);
        } else {
          this._fireSingle(w);
        }
      }
    }

    _dealDamage(other, dmg, kb, dir) {
      if (other.dead) return;
      other.hp = Math.max(0, other.hp - dmg);
      other.knockbackVx = dir * kb * 1.8;
      other.vy = -3;

      spawnFloatText(other.centerX, other.y - 10, `-${dmg}`, this.color);
      gameState.screenShake = Math.min(gameState.screenShake + 8, 18);

      for (let i = 0; i < 12; i++) {
        spawnParticle(
          other.centerX,
          other.y + other.h * 0.3,
          other.color,
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 6 - 2,
          Math.random() * 5 + 2,
          35
        );
      }

      updateHpBars();
      if (other.hp <= 0) endRound(this);
    }

    _spawnMeleeParticles(w) {
      for (let i = 0; i < 10; i++) {
        spawnParticle(
          this.centerX + this.facing * w.range * 0.7,
          this.y + this.h * 0.35,
          w.color,
          (Math.random() - 0.5) * 5 + this.facing * 3,
          (Math.random() - 0.5) * 5 - 2,
          Math.random() * 5 + 2,
          28
        );
      }
    }

    _fireSingle(w) {
      const ox = this.centerX + this.facing * 20;
      const oy = this.y + this.h * 0.3;
      gameState.projectiles.push({
        x: ox,
        y: oy,
        vx: w.projSpeed * this.facing,
        vy: 0,
        w: w.projW,
        h: w.projH,
        color: w.color,
        owner: this.id,
        damage: w.damage,
        knockback: w.knockback,
        life: 120,
      });

      for (let i = 0; i < 6; i++) {
        spawnParticle(
          ox,
          oy,
          w.color,
          this.facing * (4 + Math.random() * 5),
          (Math.random() - 0.5) * 4,
          Math.random() * 4 + 2,
          14
        );
      }
    }

    _fireLaserBurst(w) {
      for (let i = 0; i < w.projCount; i++) {
        setTimeout(() => {
          if (!gameState.active) return;
          const spread = (Math.random() - 0.5) * w.spread;
          const ox = this.centerX + this.facing * 20;
          const oy = this.y + this.h * 0.3 + (Math.random() - 0.5) * 8;
          const vx = Math.cos(spread) * w.projSpeed * this.facing;
          const vy = Math.sin(spread) * w.projSpeed;

          gameState.projectiles.push({
            x: ox,
            y: oy,
            vx,
            vy,
            w: w.projW,
            h: w.projH,
            color: w.color,
            owner: this.id,
            damage: w.damage,
            knockback: w.knockback,
            life: 100,
          });

          for (let j = 0; j < 5; j++) {
            spawnParticle(
              ox,
              oy,
              w.color,
              this.facing * (3 + Math.random() * 4),
              (Math.random() - 0.5) * 3,
              Math.random() * 3 + 1,
              10
            );
          }
        }, i * 120);
      }
    }

    draw(ctx) {
      if (this.dead) return;
      ctx.save();

      const sw = this.swingTimer > 0;
      const swingProg = sw ? (this.weapon.swingDur - this.swingTimer) / this.weapon.swingDur : 0;

      this._drawShadow(ctx);
      this._drawBody(ctx);
      this._drawArmsAndWeapon(ctx, sw, swingProg);

      ctx.restore();
    }

    _drawShadow(ctx) {
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      ctx.beginPath();
      ctx.ellipse(this.centerX, this.y + this.h + 4, 22, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    _drawBody(ctx) {
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';

      // head
      ctx.beginPath();
      ctx.arc(this.centerX, this.headY, 13, 0, Math.PI * 2);
      ctx.stroke();

      // eyes
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.centerX + this.facing * 5, this.headY - 1, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // torso
      ctx.beginPath();
      ctx.moveTo(this.centerX, this.headY + 13);
      ctx.lineTo(this.centerX, this.hipY);
      ctx.stroke();

      // legs
      const legAngle = Math.sin(this.walkPhase) * 0.6;
      const legLen = 28;
      ctx.beginPath();
      ctx.moveTo(this.centerX, this.hipY);
      ctx.lineTo(this.centerX + Math.sin(-legAngle) * legLen, this.hipY + Math.cos(legAngle) * legLen);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(this.centerX, this.hipY);
      ctx.lineTo(this.centerX + Math.sin(legAngle) * legLen, this.hipY + Math.cos(legAngle) * legLen);
      ctx.stroke();
    }

    _drawArmsAndWeapon(ctx, swinging, prog) {
      const w = this.weapon;
      const shoulderX = this.centerX;
      const shoulderY = this.torsoY;
      const armLen = 24;

      const baseAngle = this.facing === 1 ? -0.4 : Math.PI + 0.4;
      const passAng = this.facing === 1 ? baseAngle - Math.PI * 0.6 : baseAngle + Math.PI * 0.6;

      const pArmX = shoulderX + Math.cos(passAng) * armLen;
      const pArmY = shoulderY + Math.sin(passAng) * armLen;
      ctx.beginPath();
      ctx.moveTo(shoulderX, shoulderY);
      ctx.lineTo(pArmX, pArmY);
      ctx.stroke();

      let weapAngle = baseAngle;
      if (swinging && w && w.swing === 'melee') {
        const swingArc = w.key === 'MACE' ? Math.PI * 0.85 : Math.PI * 0.65;
        weapAngle = baseAngle - this.facing * swingArc * prog;
      }

      const wArmX = shoulderX + Math.cos(weapAngle) * armLen;
      const wArmY = shoulderY + Math.sin(weapAngle) * armLen;
      ctx.beginPath();
      ctx.moveTo(shoulderX, shoulderY);
      ctx.lineTo(wArmX, wArmY);
      ctx.stroke();

      if (w) this._drawWeaponHead(ctx, wArmX, wArmY, weapAngle, swinging, prog, w);
    }

    _drawWeaponHead(ctx, hx, hy, ang, swinging, prog, w) {
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(ang + (this.facing === 1 ? 0 : Math.PI));

      if (w.key === 'KATANA') {
        ctx.strokeStyle = '#c8e8ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(42, 0);
        ctx.stroke();
        ctx.strokeStyle = w.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(0, 8);
        ctx.stroke();
        if (swinging && prog > 0.3) {
          ctx.strokeStyle = 'rgba(180,220,255,.3)';
          ctx.lineWidth = 10;
          ctx.beginPath();
          ctx.moveTo(-5, 0);
          ctx.lineTo(40, 0);
          ctx.stroke();
        }
      } else if (w.key === 'MACE') {
        ctx.strokeStyle = '#b8885a';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(38, 0);
        ctx.stroke();
        ctx.fillStyle = w.color;
        ctx.beginPath();
        ctx.arc(44, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          ctx.beginPath();
          ctx.moveTo(44 + Math.cos(a) * 12, Math.sin(a) * 12);
          ctx.lineTo(44 + Math.cos(a) * 18, Math.sin(a) * 18);
          ctx.strokeStyle = w.color;
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
        if (swinging && prog > 0.5) {
          ctx.strokeStyle = 'rgba(224,168,96,.2)';
          ctx.lineWidth = 18;
          ctx.beginPath();
          ctx.arc(22, 0, 22, -Math.PI * 0.3, Math.PI * 0.3);
          ctx.stroke();
        }
      } else if (w.key === 'BOW') {
        ctx.strokeStyle = '#8b6432';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 22, -0.9, 0.9);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, 22, Math.PI - 0.9, Math.PI + 0.9);
        ctx.stroke();
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(0, -22);
        ctx.lineTo(0, 22);
        ctx.stroke();
        ctx.setLineDash([]);
        if (this.cooldownTimer > 0) {
          ctx.strokeStyle = w.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-5, 0);
          ctx.lineTo(22, 0);
          ctx.stroke();
        }
      } else if (w.key === 'LASER') {
        ctx.fillStyle = '#555';
        ctx.fillRect(0, -5, 28, 10);
        ctx.fillStyle = '#888';
        ctx.fillRect(0, -8, 8, 16);
        ctx.fillStyle = '#bbb';
        ctx.fillRect(24, -3, 12, 6);
        ctx.shadowBlur = 8;
        ctx.shadowColor = w.color;
        ctx.fillStyle = w.color;
        ctx.beginPath();
        ctx.arc(30, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.restore();
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // 5. PARTICLE & EFFECT FUNCTIONS
  // ══════════════════════════════════════════════════════════════════

  function spawnParticle(x, y, color, vx, vy, size, life) {
    gameState.particles.push({ x, y, color, vx, vy, size, life, maxLife: life });
  }

  function spawnFloatText(x, y, text, color) {
    gameState.floatTexts.push({ x, y, text, color, life: 60, maxLife: 60, vy: -1.4 });
  }

  function updateParticles() {
    gameState.particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.vx *= 0.94;
      p.life--;
    });
    gameState.particles = gameState.particles.filter((p) => p.life > 0);
  }

  function updateFloatTexts() {
    gameState.floatTexts.forEach((t) => {
      t.y += t.vy;
      t.life--;
    });
    gameState.floatTexts = gameState.floatTexts.filter((t) => t.life > 0);
  }

  function updateProjectiles() {
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
      const p = gameState.projectiles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;

      if (p.x < -50 || p.x > canvas.width + 50 || p.y < 0 || p.y > canvas.height || p.life <= 0) {
        gameState.projectiles.splice(i, 1);
        continue;
      }

      const target = p.owner === 1 ? p2 : p1;
      if (
        !target.dead &&
        p.x > target.x &&
        p.x < target.x + target.w &&
        p.y > target.y &&
        p.y < target.y + target.h
      ) {
        const attacker = p.owner === 1 ? p1 : p2;
        attacker._dealDamage(target, p.damage, p.knockback, Math.sign(p.vx));

        for (let j = 0; j < 8; j++) {
          spawnParticle(p.x, p.y, p.color, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, 3, 18);
        }
        gameState.projectiles.splice(i, 1);
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // 6. DRAWING FUNCTIONS
  // ══════════════════════════════════════════════════════════════════

  function drawBackground() {
    const w = canvas.width;
    const h = canvas.height;

    // sky
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#080a12');
    sky.addColorStop(1, '#141830');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // buildings
    ctx.fillStyle = '#0d1020';
    const buildH = [120, 90, 140, 80, 110, 150, 100, 130, 70, 160, 95, 120];
    const bw = w / buildH.length;
    buildH.forEach((bh, i) => {
      ctx.fillRect(i * bw, h - GAME_CONFIG.GROUND_H - bh, bw - 2, bh);
    });

    // stars
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    for (let i = 0; i < 60; i++) {
      const sx = (i * 137.508) % w;
      const sy = (i * 83.171) % (h * 0.55);
      ctx.fillRect(sx | 0, sy | 0, 1.5, 1.5);
    }

    // arena platform
    const grd = ctx.createLinearGradient(0, h - GAME_CONFIG.GROUND_H - 4, 0, h);
    grd.addColorStop(0, '#2a3060');
    grd.addColorStop(1, '#0d1028');
    ctx.fillStyle = grd;
    ctx.fillRect(0, h - GAME_CONFIG.GROUND_H, w, GAME_CONFIG.GROUND_H);

    ctx.strokeStyle = 'rgba(80,120,255,.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, h - GAME_CONFIG.GROUND_H);
    ctx.lineTo(w, h - GAME_CONFIG.GROUND_H);
    ctx.stroke();

    // grid
    ctx.strokeStyle = 'rgba(80,100,200,.1)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, h - GAME_CONFIG.GROUND_H);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // watermark
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.min(w * 0.06, 32)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('STAS ARENA', w / 2, h / 2 + 20);
    ctx.restore();
  }

  function drawProjectiles() {
    gameState.projectiles.forEach((p) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(Math.atan2(p.vy, p.vx));
      ctx.shadowBlur = 10;
      ctx.shadowColor = p.color;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.fillStyle = '#fff';
      ctx.fillRect(-p.w / 2 + 2, -2, p.w - 4, 4);
      ctx.shadowBlur = 0;
      ctx.restore();
    });
  }

  function drawParticles() {
    gameState.particles.forEach((p) => {
      const alpha = p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawFloatTexts() {
    gameState.floatTexts.forEach((t) => {
      const alpha = t.life / t.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `bold ${18 + (1 - alpha) * 6}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = t.color;
      ctx.strokeStyle = 'rgba(0,0,0,.6)';
      ctx.lineWidth = 3;
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    });
  }

  // ══════════════════════════════════════════════════════════════════
  // 7. INPUT HANDLING
  // ══════════════════════════════════════════════════════════════════

  let p1Input = { dx: 0, dy: 0 };
  let p2Input = { dx: 0, dy: 0 };
  const keys = {};

  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
  });

  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });

  function applyInputs() {
    if (!gameState.active) return;

    p1.move(p1Input.dx);
    if (p1Input.dy < -0.6) p1.jump();

    if (gameState.mode === '1hp') {
      p2.move(p2Input.dx);
      if (p2Input.dy < -0.6) p2.jump();
    }

    if (keys['KeyA']) p1.move(-1);
    if (keys['KeyD']) p1.move(1);
    if (keys['KeyW']) p1.jump();
    if (keys['KeyF']) p1.attack(p2);

    if (keys['ArrowLeft']) p2.move(-1);
    if (keys['ArrowRight']) p2.move(1);
    if (keys['ArrowUp']) p2.jump();
    if (keys['Slash']) p2.attack(p1);
  }

  // ══════════════════════════════════════════════════════════════════
  // 8. JOYSTICK SETUP
  // ══════════════════════════════════════════════════════════════════

  function setupJoystick(wrapId, knobId, onMove) {
    const wrap = document.getElementById(wrapId);
    const knob = document.getElementById(knobId);
    const R = 55;
    let active = false;
    let tid = null;
    let bx = 0;
    let by = 0;

    function getRect() {
      return wrap.getBoundingClientRect();
    }

    function start(e) {
      e.preventDefault();
      const t = e.touches ? e.touches[0] : e;
      const r = getRect();
      bx = r.left + r.width / 2;
      by = r.top + r.height / 2;
      active = true;
      tid = t.identifier ?? null;
      move(e);
    }

    function move(e) {
      if (!active) return;
      e.preventDefault();
      const t = e.touches ? [...e.touches].find((tt) => tt.identifier === tid) || e.touches[0] : e;
      let dx = t.clientX - bx;
      let dy = t.clientY - by;
      const dist = Math.hypot(dx, dy);
      if (dist > R) {
        dx = (dx / dist) * R;
        dy = (dy / dist) * R;
      }
      knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      onMove(dx / R, dy / R);
    }

    function end(e) {
      e.preventDefault();
      active = false;
      knob.style.transform = 'translate(-50%,-50%)';
      onMove(0, 0);
    }

    wrap.addEventListener('touchstart', start, { passive: false });
    wrap.addEventListener('touchmove', move, { passive: false });
    wrap.addEventListener('touchend', end, { passive: false });
    wrap.addEventListener('touchcancel', end, { passive: false });
    wrap.addEventListener('mousedown', start, { passive: false });
    window.addEventListener('mousemove', (e) => active && move(e));
    window.addEventListener('mouseup', (e) => active && end(e));
  }

  setupJoystick('js1', 'jk1', (dx, dy) => {
    p1Input.dx = dx;
    p1Input.dy = dy;
  });

  setupJoystick('js2', 'jk2', (dx, dy) => {
    p2Input.dx = dx;
    p2Input.dy = dy;
  });

  // ══════════════════════════════════════════════════════════════════
  // 9. HUD UPDATE
  // ══════════════════════════════════════════════════════════════════

  function updateHpBars() {
    document.getElementById('hpBar1').style.width = (p1.hp / GAME_CONFIG.MAX_HP) * 100 + '%';
    document.getElementById('hpBar2').style.width = (p2.hp / GAME_CONFIG.MAX_HP) * 100 + '%';
    document.getElementById('hpBar1').style.opacity = p1.hp < 30 ? '0.7' : '1';
    document.getElementById('hpBar2').style.opacity = p2.hp < 30 ? '0.7' : '1';
  }

  function updateTimerDisplay() {
    document.getElementById('timerDisplay').textContent = String(gameState.timer).padStart(2, '0');
    if (gameState.timer <= 10) {
      document.getElementById('timerDisplay').style.color = '#f55';
    } else {
      document.getElementById('timerDisplay').style.color = 'var(--c-gold)';
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // 10. GAME LOOP
  // ══════════════════════════════════════════════════════════════════

  let lastTime = 0;

  function gameLoop(ts) {
    if (!gameState.active) return;

    applyInputs();
    const dt = ts - lastTime || 16;
    lastTime = ts;

    let sx = 0;
    let sy = 0;
    if (gameState.screenShake > 0) {
      sx = (Math.random() - 0.5) * gameState.screenShake;
      sy = (Math.random() - 0.5) * gameState.screenShake;
      gameState.screenShake *= 0.82;
      if (gameState.screenShake < 0.5) gameState.screenShake = 0;
    }

    ctx.save();
    ctx.translate(sx, sy);

    drawBackground();
    drawProjectiles();
    drawParticles();

    p1.update(dt);
    p2.update(dt);
    updateProjectiles();

    p1.draw(ctx);
    p2.draw(ctx);
    drawFloatTexts();
    updateParticles();
    updateFloatTexts();

    ctx.restore();

    if (gameState.mode === 'online') onlineSyncSend();

    requestAnimationFrame(gameLoop);
  }

  // ══════════════════════════════════════════════════════════════════
  // 11. GAME STATE MANAGEMENT
  // ══════════════════════════════════════════════════════════════════

  function initPlayers() {
    p1 = new Player(1, canvas.width * 0.22, '#38d9f5', 1);
    p2 = new Player(2, canvas.width * 0.68, '#f54f38', -1);
    p1.y = p2.y = canvas.height - GAME_CONFIG.GROUND_H - 80;
    p1.hp = p2.hp = GAME_CONFIG.MAX_HP;
    p1.dead = p2.dead = false;

    p1.assignWeapon(WEAPON_KEYS[Math.floor(Math.random() * WEAPON_KEYS.length)]);
    p2.assignWeapon(WEAPON_KEYS[Math.floor(Math.random() * WEAPON_KEYS.length)]);

    document.getElementById('p1Weapon').textContent = p1.weapon.label;
    document.getElementById('p2Weapon').textContent = p2.weapon.label;

    const getIcon = (key) => ({ KATANA: '⚔', MACE: '🔨', BOW: '🏹', LASER: '🔫' }[key] || '👊');
    document.getElementById('hitBtn1').textContent = getIcon(p1.weapon.key);
    document.getElementById('hitBtn2').textContent = getIcon(p2.weapon.key);

    updateHpBars();
    gameState.particles = [];
    gameState.floatTexts = [];
    gameState.projectiles = [];
  }

  function startRound() {
    resizeCanvas();
    initPlayers();
    startTimer();
    gameState.active = true;
    drawIdleScreen();
    requestAnimationFrame(gameLoop);
  }

  function startTimer() {
    gameState.timer = GAME_CONFIG.ROUND_TIME;
    updateTimerDisplay();
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = setInterval(() => {
      gameState.timer--;
      updateTimerDisplay();
      if (gameState.timer <= 0) {
        clearInterval(gameState.timerInterval);
        if (p1.hp > p2.hp) {
          endRound(p1);
        } else if (p2.hp > p1.hp) {
          endRound(p2);
        } else {
          endRound(null);
        }
      }
    }, 1000);
  }

  function endRound(winner) {
    gameState.active = false;
    clearInterval(gameState.timerInterval);

    const res = document.getElementById('resultScreen');
    const title = document.getElementById('resultTitle');
    const sub = document.getElementById('resultSub');

    if (!winner) {
      title.textContent = 'SERI!';
      title.style.color = '#f5c832';
      sub.textContent = 'Tidak ada pemenang ronde ini';
    } else {
      const isP1 = winner.id === 1;
      const wname =
        gameState.mode === 'online'
          ? isP1
            ? onlineState.username || 'KAMU'
            : 'LAWAN'
          : isP1
          ? 'PLAYER 1'
          : 'PLAYER 2';
      title.textContent = `${wname} MENANG!`;
      title.style.color = isP1 ? '#38d9f5' : '#f54f38';
      sub.textContent = `HP Tersisa: ${winner.hp} • Senjata: ${winner.weapon.label}`;
    }

    const loser = winner ? (winner.id === 1 ? p2 : p1) : p1;
    for (let i = 0; i < 30; i++) {
      spawnParticle(
        loser.centerX,
        loser.centerY,
        loser.color,
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 14 - 3,
        Math.random() * 8 + 3,
        60
      );
    }

    ctx.save();
    drawBackground();
    drawParticles();
    p1.draw(ctx);
    p2.draw(ctx);
    ctx.restore();

    setTimeout(() => {
      res.classList.remove('hidden');
    }, 800);
  }

  function startGame(mode) {
    gameState.mode = mode;
    gameState.round = 1;
    document.getElementById('roundDisplay').textContent = `RONDE ${gameState.round}`;
    document.getElementById('p1Name').textContent =
      mode === 'online' ? onlineState.username || 'KAMU' : 'PLAYER 1';
    document.getElementById('p2Name').textContent = mode === 'online' ? 'LAWAN' : 'PLAYER 2';

    if (mode === 'online') {
      document.getElementById('ctrl-p2').classList.add('hidden');
    } else {
      document.getElementById('ctrl-p2').classList.remove('hidden');
    }

    document.getElementById('menuScreen').classList.add('hidden');
    document.getElementById('resultScreen').classList.add('hidden');
    document.getElementById('hud').style.display = 'flex';
    document.getElementById('controls').style.display = 'flex';

    startRound();
  }

  function backToMenu() {
    gameState.active = false;
    clearInterval(gameState.timerInterval);
    document.getElementById('resultScreen').classList.add('hidden');
    document.getElementById('hud').style.display = 'none';
    document.getElementById('controls').style.display = 'none';
    document.getElementById('menuScreen').classList.remove('hidden');
    document.getElementById('lobbyPanel').classList.remove('active');
    if (onlineState.socket) {
      onlineState.socket.disconnect();
      onlineState.socket = null;
    }
    drawIdleScreen();
  }

  function drawIdleScreen() {
    resizeCanvas();
    ctx.save();
    drawBackground();
    const lx = canvas.width * 0.25;
    const ly = canvas.height - GAME_CONFIG.GROUND_H - 80;
    ctx.strokeStyle = 'rgba(56,217,245,.18)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.arc(lx, ly + 12, 13, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(lx, ly + 25);
    ctx.lineTo(lx, ly + 52);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(lx, ly + 32);
    ctx.lineTo(lx + 20, ly + 40);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(lx, ly + 52);
    ctx.lineTo(lx - 12, ly + 80);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(lx, ly + 52);
    ctx.lineTo(lx + 12, ly + 80);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(245,79,56,.18)';
    const rx = canvas.width * 0.75;
    ctx.beginPath();
    ctx.arc(rx, ly + 12, 13, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(rx, ly + 25);
    ctx.lineTo(rx, ly + 52);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(rx, ly + 32);
    ctx.lineTo(rx - 20, ly + 40);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(rx, ly + 52);
    ctx.lineTo(rx - 12, ly + 80);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(rx, ly + 52);
    ctx.lineTo(rx + 12, ly + 80);
    ctx.stroke();

    ctx.restore();
  }

  // ══════════════════════════════════════════════════════════════════
  // 12. EVENT LISTENERS
  // ══════════════════════════════════════════════════════════════════

  document.getElementById('btn1HP').addEventListener('click', () => startGame('1hp'));
  document.getElementById('btnOnline').addEventListener('click', () => {
    document.getElementById('lobbyPanel').classList.add('active');
  });
  document.getElementById('btnBackMenu').addEventListener('click', () => {
    document.getElementById('lobbyPanel').classList.remove('active');
  });
  document.getElementById('btnPlayAgain').addEventListener('click', () => {
    document.getElementById('resultScreen').classList.add('hidden');
    gameState.round++;
    document.getElementById('roundDisplay').textContent = `RONDE ${gameState.round}`;
    startRound();
  });
  document.getElementById('btnMainMenu').addEventListener('click', backToMenu);

  document.getElementById('hitBtn1').addEventListener(
    'touchstart',
    (e) => {
      e.preventDefault();
      if (gameState.active) p1.attack(p2);
    },
    { passive: false }
  );
  document.getElementById('hitBtn2').addEventListener(
    'touchstart',
    (e) => {
      e.preventDefault();
      if (gameState.active && gameState.mode === '1hp') p2.attack(p1);
    },
    { passive: false }
  );
  document.getElementById('hitBtn1').addEventListener('mousedown', (e) => {
    if (gameState.active) p1.attack(p2);
  });
  document.getElementById('hitBtn2').addEventListener('mousedown', (e) => {
    if (gameState.active && gameState.mode === '1hp') p2.attack(p1);
  });

  // ══════════════════════════════════════════════════════════════════
  // 13. ONLINE MULTIPLAYER
  // ══════════════════════════════════════════════════════════════════

  document.getElementById('btnJoin').addEventListener('click', () => {
    const room = document.getElementById('roomInput').value.trim();
    const name = document.getElementById('nameInput').value.trim();
    if (!room || !name) {
      document.getElementById('lobbyStatus').textContent = '⚠️ Isi nama room & username dulu!';
      return;
    }
    onlineState.username = name;
    onlineState.room = room;
    connectOnline(room, name);
  });

  function connectOnline(room, name) {
    document.getElementById('lobbyStatus').textContent = '⏳ Menghubungkan ke server...';

    if (!window.io) {
      const s = document.createElement('script');
      s.src = '/socket.io/socket.io.js';
      s.onerror = () => {
        document.getElementById('lobbyStatus').textContent = '❌ Server offline. Gunakan Mode 1HP dulu.';
      };
      s.onload = () => initSocket(room, name);
      document.head.appendChild(s);
    } else {
      initSocket(room, name);
    }
  }

  function initSocket(room, name) {
    try {
      onlineState.socket = io({ transports: ['websocket'] });

      onlineState.socket.on('connect', () => {
        document.getElementById('lobbyStatus').textContent = '✅ Terhubung! Bergabung room...';
        onlineState.socket.emit('join_room', { room, name });
      });

      onlineState.socket.on('room_joined', (data) => {
        onlineState.playerId = data.player_id;
        document.getElementById('lobbyStatus').textContent = `Kamu Player ${onlineState.playerId}. Menunggu lawan...`;
      });

      onlineState.socket.on('game_start', (data) => {
        document.getElementById('p2Name').textContent = data.opponent_name || 'LAWAN';
        startGame('online');
      });

      onlineState.socket.on('opponent_state', (data) => {
        if (!gameState.active) return;
        if (onlineState.playerId === 1) {
          p2.x = canvas.width - data.x_pct * canvas.width - p2.w;
          p2.y = data.y_pct * canvas.height;
          p2.vx = -data.vx;
          p2.facing = -data.facing;
          if (data.attack && data.attack.hit) {
            p2._dealDamage(p1, data.attack.damage, data.attack.knockback, -1);
          }
        }
      });

      onlineState.socket.on('opponent_disconnect', () => {
        if (gameState.active) endRound(onlineState.playerId === 1 ? p1 : p2);
      });

      onlineState.socket.on('connect_error', () => {
        document.getElementById('lobbyStatus').textContent = '❌ Gagal terhubung ke server.';
      });
    } catch (e) {
      document.getElementById('lobbyStatus').textContent = '❌ Socket.IO tidak tersedia.';
    }
  }

  function onlineSyncSend() {
    if (!onlineState.socket || !gameState.active) return;
    const me = onlineState.playerId === 1 ? p1 : p2;
    onlineState.socket.emit('player_state', {
      room: onlineState.room,
      x_pct: me.x / canvas.width,
      y_pct: me.y / canvas.height,
      vx: me.vx,
      vy: me.vy,
      facing: me.facing,
      hp: me.hp,
    });
  }

  // ══════════════════════════════════════════════════════════════════
  // 14. INITIALIZATION
  // ══════════════════════════════════════════════════════════════════

  drawIdleScreen();
});
