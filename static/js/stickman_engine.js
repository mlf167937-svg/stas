/**
 * STAS Arena - Stickman War 2D Core Game Engine Engine Modul
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Atur Skala Resolusi Layar Penuh
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Konfigurasi Parameter Keseimbangan Senjata & Atribut Fisika (Fair Balancing)
const CFG = {
    MAX_HP: 100, GRAVITY: 0.6, JUMP_POWER: -14, MOVE_SPD: 5, GROUND_H: 50,
    WEAPONS: {
        KATANA: { name: '⚔️ Katana', color: '#38d9f5', damage: 10, cooldown: 250, range: 75, knockback: 4, type: 'melee', label: '⚔️ Katana' },
        MACE: { name: '🔨 Palu Gada', color: '#e0a860', damage: 24, cooldown: 850, range: 90, knockback: 15, type: 'melee', label: '🔨 Gada heavy' },
        BOW: { name: '🏹 Busur Panah', color: '#a8e88a', damage: 18, cooldown: 950, speed: 12, type: 'ranged', label: '🏹 Busur Sniper' },
        LASER: { name: '🔫 Laser Gun', color: '#ff66ff', damage: 6, cooldown: 400, speed: 18, type: 'ranged', label: '🔫 Burst Laser' }
    }
};

const WEAPON_KEYS = Object.keys(CFG.WEAPONS);

// State Entities Kolektif Global
let gameActive = true;
let p1, p2;
let projectiles = [];
let particles = [];
let floatTexts = [];
let screenShake = 0;
let roundTimer = 99;

// Struktur Objek Karakter Stickman Tanding
class EntityStickman {
    constructor(id, x, color, facing) {
        this.id = id; this.x = x; this.w = 30; this.h = 80;
        this.y = canvas.height - CFG.GROUND_H - this.h;
        this.vx = 0; this.vy = 0; this.color = color; this.facing = facing; // 1 kanan, -1 kiri
        this.hp = CFG.MAX_HP; this.onGround = false; this.weapon = null;
        this.swingTimer = 0; this.cooldownTimer = 0; this.walkPhase = 0; this.isMoving = false;
    }

    assignWeapon(key) {
        this.weapon = { ...CFG.WEAPONS[key], key: key };
    }

    update(dt) {
        this.vy += CFG.GRAVITY;
        this.x += this.vx;
        this.y += this.vy;

        let gy = canvas.height - CFG.GROUND_H - this.h;
        if (this.y >= gy) { this.y = gy; this.vy = 0; this.onGround = true; } else { this.onGround = false; }
        this.x = Math.max(10, Math.min(canvas.width - this.w - 10, this.x));
        this.vx *= 0.8;

        if (this.cooldownTimer > 0) this.cooldownTimer -= dt;
        if (this.swingTimer > 0) this.swingTimer -= dt;
        if (this.isMoving) this.walkPhase += 0.2;
        this.isMoving = false;
    }

    move(dirX) {
        this.vx = dirX * CFG.MOVE_SPD;
        if (dirX !== 0) { this.facing = dirX > 0 ? 1 : -1; this.isMoving = true; }
    }

    jump() {
        if (this.onGround) this.vy = CFG.JUMP_POWER;
    }

    attack(target) {
        if (this.cooldownTimer > 0 || !this.weapon) return;
        let wp = this.weapon;
        this.cooldownTimer = wp.cooldown;
        this.swingTimer = 150; // milidetik animasi tebas

        if (wp.type === 'melee') {
            let distance = Math.abs((this.x + this.w/2) - (target.x + target.w/2));
            let directionMatch = (target.x > this.x && this.facing === 1) || (target.x < this.x && this.facing === -1);
            if (distance < wp.range && directionMatch) {
                target.takeDamage(wp.damage, wp.knockback * this.facing);
            }
            // Efek tebasan ranting partikel
            for(let i=0; i<8; i++) spawnParticle(this.x + (this.facing * 40), this.y + 30, wp.color);
        } else {
            // Mekanik Tembak Proyektil Ranged
            projectiles.push({
                owner: this.id, x: this.x + (this.facing * 30), y: this.y + 25,
                vx: this.facing * wp.speed, vy: 0, color: wp.color,
                damage: wp.damage, knockback: wp.knockback,
                w: wp.key === 'LASER' ? 15 : 22, h: 4
            });
        }
    }

    takeDamage(amount, knock) {
        this.hp = Math.max(0, this.hp - amount);
        this.vx += knock;
        this.vy = -3; // Sedikit efek mental ke atas
        screenShake = 10;
        floatTexts.push({ x: this.x + 15, y: this.y - 15, text: `-${amount}`, color: '#ff4444', life: 40 });
        for(let i=0; i<10; i++) spawnParticle(this.x + 15, this.y + 40, this.color);
        updateUiHUD();
        if (this.hp <= 0) declareWinner();
    }

    draw() {
        ctx.save();
        ctx.lineWidth = 4; ctx.strokeStyle = this.color; ctx.lineCap = 'round';
        
        // 1. Kepala
        ctx.beginPath(); ctx.arc(this.x + 15, this.y + 15, 12, 0, Math.PI*2); ctx.stroke();
        // 2. Badan Utama
        ctx.beginPath(); ctx.moveTo(this.x + 15, this.y + 27); ctx.lineTo(this.x + 15, this.y + 55); ctx.stroke();
        // 3. Kaki (Animasi Langkah)
        let leftLegOffset = Math.sin(this.walkPhase) * 15;
        ctx.beginPath(); ctx.moveTo(this.x + 15, this.y + 55); ctx.lineTo(this.x + 15 + leftLegOffset, this.y + 80); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(this.x + 15, this.y + 55); ctx.lineTo(this.x + 15 - leftLegOffset, this.y + 80); ctx.stroke();
        
        // 4. Tangan + Visual Senjata
        let handX = this.x + 15 + (this.facing * 20);
        let handY = this.y + 35;
        if (this.swingTimer > 0 && this.weapon.type === 'melee') {
            handX = this.x + 15 + (this.facing * 35); handY = this.y + 20; // Animasi mengayun lurus
        }
        ctx.beginPath(); ctx.moveTo(this.x + 15, this.y + 35); ctx.lineTo(handX, handY); ctx.stroke();

        // Gambar Ikon Senjata nempel di tangan stickman
        if (this.weapon) {
            ctx.fillStyle = this.weapon.color;
            ctx.font = '16px sans-serif';
            ctx.fillText(this.weapon.key === 'KATANA' ? '⚔️' : this.weapon.key === 'MACE' ? '🔨' : this.weapon.key === 'BOW' ? '🏹' : '🔫', handX - 8, handY + 5);
        }
        ctx.restore();
    }
}

// Inisialisasi Ulang Objek Pemain
function initGameEnvironment() {
    p1 = new EntityStickman(1, canvas.width * 0.2, '#38d9f5', 1);
    p2 = new EntityStickman(2, canvas.width * 0.7, '#f54f38', -1);
    
    // Acak Senjata Adil Mandiri
    p1.assignWeapon(WEAPON_KEYS[Math.floor(Math.random() * WEAPON_KEYS.length)]);
    p2.assignWeapon(WEAPON_KEYS[Math.floor(Math.random() * WEAPON_KEYS.length)]);

    document.getElementById('p1Weapon').textContent = p1.weapon.label;
    document.getElementById('p2Weapon').textContent = p2.weapon.label;
    updateUiHUD();
}

function updateUiHUD() {
    document.getElementById('hpBar1').style.width = p1.hp + '%';
    document.getElementById('hpBar2').style.width = p2.hp + '%';
}

function spawnParticle(x, y, color) {
    particles.push({ x: x, y: y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6, color: color, life: 30 });
}

function declareWinner() {
    gameActive = false;
    let title = document.getElementById('resultTitle');
    let sub = document.getElementById('resultSub');
    if (p1.hp <= 0 && p2.hp <= 0) { title.textContent = "HASIL SERI!"; title.style.color = '#fff'; }
    else if (p1.hp <= 0) { title.textContent = document.getElementById('p2Name').textContent + " MENANG!"; title.style.color = '#f54f38'; }
    else { title.textContent = document.getElementById('p1Name').textContent + " MENANG!"; title.style.color = '#38d9f5'; }
    document.getElementById('resultScreen').classList.remove('hidden');
}

// =====================================================================
// ENGINE ENGINE LOOP (60 FRAME PER DETIK)
// =====================================================================
let lastTime = 0;
function processCoreLoop(timestamp) {
    if (!gameActive) return;
    let dt = timestamp - lastTime || 16; lastTime = timestamp;

    // Guncangan Layar Efek Hit Damage
    let shakeX = 0, shakeY = 0;
    if (screenShake > 0) { shakeX = (Math.random()-0.5)*screenShake; shakeY = (Math.random()-0.5)*screenShake; screenShake *= 0.8; }

    ctx.save(); ctx.translate(shakeX, shakeY);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Gambarkan Tanah Panggung Arena STAS
    ctx.fillStyle = '#111520'; ctx.fillRect(0, canvas.height - CFG.GROUND_H, canvas.width, CFG.GROUND_H);
    ctx.strokeStyle = '#2a3060'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, canvas.height - CFG.GROUND_H); ctx.lineTo(canvas.width, canvas.height - CFG.GROUND_H); ctx.stroke();

    // Loop Update Entitas
    p1.update(dt); p2.update(dt);
    p1.draw(); p2.draw();

    // Hitung Jalur Terbang Proyektil Ranged Peluru
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let p = projectiles[i]; p.x += p.vx;
        ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.w, p.h);
        
        let target = p.owner === 1 ? p2 : p1;
        if (p.x > target.x && p.x < target.x + target.w && p.y > target.y && p.y < target.y + target.h) {
            target.takeDamage(p.damage, p.vx > 0 ? 5 : -5); projectiles.splice(i, 1); continue;
        }
        if (p.x < 0 || p.x > canvas.width) projectiles.splice(i, 1);
    }

    // Gambar Floating Teks Damage
    for (let i = floatTexts.length - 1; i >= 0; i--) {
        let t = floatTexts[i]; t.y -= 0.5; t.life--;
        ctx.fillStyle = t.color; ctx.font = 'bold 16px sans-serif'; ctx.fillText(t.text, t.x, t.y);
        if (t.life <= 0) floatTexts.splice(i, 1);
    }

    // Gambar Partikel Efek Ledakan Darah / Tebasan
    for (let i = particles.length - 1; i >= 0; i--) {
        let pt = particles[i]; pt.x += pt.vx; pt.y += pt.vy; pt.life--;
        ctx.fillStyle = pt.color; ctx.fillRect(pt.x, pt.y, 3, 3);
        if (pt.life <= 0) particles.splice(i, 1);
    }

    ctx.restore();
    requestAnimationFrame(processCoreLoop);
}

// Timer Penghitung Mundur Laga Ronde
setInterval(() => {
    if (!gameActive) return;
    roundTimer--; document.getElementById('timerDisplay').textContent = roundTimer;
    if (roundTimer <= 0) { gameActive = false; declareWinner(); }
}, 1000);

// Inisialisasi Pemicu Awal
initGameEnvironment();
requestAnimationFrame(processCoreLoop);
  
