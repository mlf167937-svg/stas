/**
 * ════════════════════════════════════════════════════════════════════════════════
 * 3D STICKMAN TACTICAL SHOOTER DUEL - REVISED BUILD
 * ════════════════════════════════════════════════════════════════════════════════
 *
 * Game Architecture:
 * 1. PILAR 1: EKSPANSI 10 SENJATA TAKTIS (Sistem StatsSenjata)
 * 2. PILAR 2: SISTEM KAMERA THIRD-PERSON (TPP) SMOOTH & NATURAL
 * 3. PILAR 3: MEKANIK GLOO WALL MATRIX PREVIEW
 * 4. PILAR 4: REALTIME GAME LOOP & MULTIPLAYER RE-SYNC + PLAYZONE SHRINKING
 *
 * REVISI:
 * - Kamera TPP diperbaiki: smooth orbit mengikuti punggung karakter dengan pitch vertikal
 * - Joystick Mobile diperbaiki: atas=maju, bawah=mundur, kiri=kiri, kanan=kanan (relatif kamera)
 * - Kontrol Baru: Middle Click = Pointer Lock | Left Click = Shoot | Shift = Crouch | CapsLock = Sprint | E = Gloo Preview
 * ════════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL SCENE & NETWORKING STATE
// ═══════════════════════════════════════════════════════════════════════════════
let scene, camera, renderer, socket;
let roomCode = "";
let myId = Math.random().toString(36).substring(7);
let playerLocal, musuhRemote, modelStickmanLokal, modelStickmanMusuh;

// ═══════════════════════════════════════════════════════════════════════════════
// PILAR 1: EKSPANSI 10 SENJATA TAKTIS (SISTEM STATS SENJATA)
// ═══════════════════════════════════════════════════════════════════════════════

const statsSenjata = {
    M1887: {
        nama: "M1887 (Shotgun Ganda)",
        damage: 120,
        maxAmmo: 2,
        currentAmmo: 2,
        reloadTime: 2200,
        range: 18,
        warna: 0xff3333,
        audioType: 'shotgun_dual',
        rateOfFire: 0.8,
        description: "Damage tinggi, ammo sedikit, reload cepat. Range dekat saja."
    },
    SPAS12: {
        nama: "SPAS12 (Shotgun Otomatis)",
        damage: 85,
        maxAmmo: 6,
        currentAmmo: 6,
        reloadTime: 2500,
        range: 19,
        warna: 0xcc2222,
        audioType: 'shotgun_auto',
        rateOfFire: 1.2,
        description: "Shotgun semi-auto dengan fire rate lebih cepat."
    },
    MP40: {
        nama: "MP40 (SMG Brutal)",
        damage: 28,
        maxAmmo: 32,
        currentAmmo: 32,
        reloadTime: 1800,
        range: 35,
        warna: 0xffff33,
        audioType: 'smg_fast',
        rateOfFire: 3.5,
        description: "SMG cepat dengan damage rendah tapi ammo banyak."
    },
    M1014: {
        nama: "M1014 (Shotgun Beruntun)",
        damage: 90,
        maxAmmo: 6,
        currentAmmo: 6,
        reloadTime: 2800,
        range: 16,
        warna: 0xffaa00,
        audioType: 'shotgun_pump',
        rateOfFire: 0.9,
        description: "Shotgun dengan damage menengah, range sangat dekat."
    },
    AK47: {
        nama: "AK47 (Assault Rifle Berat)",
        damage: 42,
        maxAmmo: 30,
        currentAmmo: 30,
        reloadTime: 2400,
        range: 55,
        warna: 0xff5555,
        audioType: 'rifle_heavy',
        rateOfFire: 2.0,
        description: "Rifle all-purpose dengan range jauh dan ammo banyak."
    },
    SCAR: {
        nama: "SCAR (Assault Rifle Stabil)",
        damage: 35,
        maxAmmo: 30,
        currentAmmo: 30,
        reloadTime: 2100,
        range: 60,
        warna: 0x88ff88,
        audioType: 'rifle_stable',
        rateOfFire: 2.2,
        description: "Rifle akurat dengan recoil rendah, semi-auto."
    },
    AWM: {
        nama: "AWM (Sniper Mematikan)",
        damage: 200,
        maxAmmo: 5,
        currentAmmo: 5,
        reloadTime: 3500,
        range: 120,
        warna: 0xff00ff,
        audioType: 'sniper_heavy',
        rateOfFire: 0.4,
        description: "One-shot kill dengan range terjauh, reload sangat lama."
    },
    DESERT_EAGLE: {
        nama: "DESERT_EAGLE (Pistol Berat)",
        damage: 55,
        maxAmmo: 7,
        currentAmmo: 7,
        reloadTime: 1400,
        range: 40,
        warna: 0x003366,
        audioType: 'pistol_heavy',
        rateOfFire: 1.0,
        description: "Pistol powerful dengan damage tinggi."
    },
    USP: {
        nama: "USP (Pistol Ringan)",
        damage: 15,
        maxAmmo: 12,
        currentAmmo: 12,
        reloadTime: 900,
        range: 28,
        warna: 0x3366ff,
        audioType: 'pistol_light',
        rateOfFire: 2.5,
        description: "Pistol ringan, fire rate tinggi, ammo banyak."
    },
    UMP: {
        nama: "UMP (SMG Taktis)",
        damage: 32,
        maxAmmo: 30,
        currentAmmo: 30,
        reloadTime: 1900,
        range: 45,
        warna: 0x00ffff,
        audioType: 'smg_tactical',
        rateOfFire: 2.8,
        description: "SMG balanced dengan range menengah dan damage solid."
    }
};

let senjataSekarang = "M1887";
let lastShotTime = 0;

// ═══════════════════════════════════════════════════════════════════════════════
// GAMEPLAY & CHARACTER STATE
// ═══════════════════════════════════════════════════════════════════════════════

let myHp = 200;
const maxHp = 200;
let jumlahMedkit = 3;
let isHealing = false;
let healStartTime = 0;
const HEAL_DURATION = 3000;
const HEAL_AMOUNT_PER_TICK = 3;

let isReloading = false;
let isDead = false;
let isCrouching = false;

// ═══════════════════════════════════════════════════════════════════════════════
// PILAR 2: SISTEM KAMERA THIRD-PERSON (TPP) - DIPERBAIKI
// ═══════════════════════════════════════════════════════════════════════════════

// Konstanta kamera
const CAMERA_DISTANCE     = 3.5;   // Jarak orbit kamera dari pivot player
const CAMERA_HEIGHT_PIVOT = 1.2;   // Tinggi pivot lookAt di atas kaki player
const PITCH_CLAMP_UP      = 0.55;  // Batas sudut atas (radian) ~31°
const PITCH_CLAMP_DOWN    = 0.45;  // Batas sudut bawah (radian) ~26°

// Sudut orbital kamera (dikendalikan mouse)
let sudutPandangY = 0; // Yaw horizontal (kiri/kanan)
let sudutPandangX = 0; // Pitch vertikal (atas/bawah)

// Smoothing kamera
const CAMERA_LERP_SPEED = 0.14;
let targetCameraPos = new THREE.Vector3();
let currentLookAt    = new THREE.Vector3();

// Input & Movement
// [KONTROL BARU] Shift = Crouch, CapsLock = Sprint (sebelumnya Shift)
let keys = { w: false, a: false, s: false, d: false, capslock: false, shift: false, space: false };
let isSprinting  = false; // dikontrol CapsLock (toggle)

// Kecepatan dasar
const SPEED_WALK   = 0.075;
const SPEED_SPRINT = 0.13;
const SPEED_CROUCH = 0.035;

let loncatVelocity = 0;
let isGrounded = true;

// Pointer Lock
let isPointerLocked = false;
let mouseSensitivity = 0.003;

// ═══════════════════════════════════════════════════════════════════════════════
// JOYSTICK MOBILE & TOUCH INPUT
// ═══════════════════════════════════════════════════════════════════════════════

let joystickActive = false;
let joystickStartPos = { x: 0, y: 0 };
let joystickMoveVector = { x: 0, y: 0 };

// ═══════════════════════════════════════════════════════════════════════════════
// PILAR 3: GLOO WALL PREVIEW SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

let glooWallPreviewMode = false;
let glooWallPreview = null;
let glooWallQuota = 5;
let glooWallsPlaced = 0;

const GLOO_WALL_WIDTH    = 3.8;
const GLOO_WALL_HEIGHT   = 2.2;
const GLOO_WALL_DEPTH    = 0.35;
const GLOO_WALL_DISTANCE = 2.6;
const GLOO_WALL_HP       = 300;

// ═══════════════════════════════════════════════════════════════════════════════
// PILAR 4: PLAYZONE & GAME LOOP MECHANICS
// ═══════════════════════════════════════════════════════════════════════════════

let playzoneActive = true;
let playzoneRadius = 80;
let playzoneCenter = new THREE.Vector3(0, 0, 0);
let playzoneLastShrinkTime = 0;
const PLAYZONE_SHRINK_INTERVAL = 45000;
const PLAYZONE_SHRINK_AMOUNT   = 15;
const PLAYZONE_DAMAGE_PER_TICK = 2;
let playzoneVisual = null;

// ═══════════════════════════════════════════════════════════════════════════════
// WORLD OBJECTS & COLLISION
// ═══════════════════════════════════════════════════════════════════════════════

let daftarGlooWall = [];
let targetMusuhHitbox = null;
let daftarBangunanRintangan = [];
let daftarMedkit = [];

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIO SYNTHESIZER
// ═══════════════════════════════════════════════════════════════════════════════

let audioCtx = null;

function putarSuaraCustom(tipe) {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();

        const osc      = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        const skrg = audioCtx.currentTime;

        if (tipe === 'shotgun_dual') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, skrg);
            osc.frequency.exponentialRampToValueAtTime(25, skrg + 0.4);
            gainNode.gain.setValueAtTime(0.7, skrg);
            gainNode.gain.linearRampToValueAtTime(0.01, skrg + 0.4);
            osc.start(skrg); osc.stop(skrg + 0.4);
        }
        else if (tipe === 'shotgun_auto') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(110, skrg);
            osc.frequency.exponentialRampToValueAtTime(35, skrg + 0.2);
            gainNode.gain.setValueAtTime(0.6, skrg);
            gainNode.gain.linearRampToValueAtTime(0.01, skrg + 0.2);
            osc.start(skrg); osc.stop(skrg + 0.2);
        }
        else if (tipe === 'smg_fast') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(380, skrg);
            gainNode.gain.setValueAtTime(0.35, skrg);
            gainNode.gain.linearRampToValueAtTime(0.01, skrg + 0.06);
            osc.start(skrg); osc.stop(skrg + 0.06);
        }
        else if (tipe === 'shotgun_pump') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(95, skrg);
            osc.frequency.exponentialRampToValueAtTime(40, skrg + 0.35);
            gainNode.gain.setValueAtTime(0.65, skrg);
            gainNode.gain.linearRampToValueAtTime(0.01, skrg + 0.35);
            osc.start(skrg); osc.stop(skrg + 0.35);
        }
        else if (tipe === 'rifle_heavy') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(180, skrg);
            osc.frequency.exponentialRampToValueAtTime(50, skrg + 0.15);
            gainNode.gain.setValueAtTime(0.5, skrg);
            gainNode.gain.linearRampToValueAtTime(0.01, skrg + 0.15);
            osc.start(skrg); osc.stop(skrg + 0.15);
        }
        else if (tipe === 'rifle_stable') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(250, skrg);
            osc.frequency.linearRampToValueAtTime(150, skrg + 0.12);
            gainNode.gain.setValueAtTime(0.4, skrg);
            gainNode.gain.linearRampToValueAtTime(0.01, skrg + 0.12);
            osc.start(skrg); osc.stop(skrg + 0.12);
        }
        else if (tipe === 'sniper_heavy') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, skrg);
            osc.frequency.exponentialRampToValueAtTime(30, skrg + 0.5);
            gainNode.gain.setValueAtTime(0.8, skrg);
            gainNode.gain.linearRampToValueAtTime(0.01, skrg + 0.5);
            osc.start(skrg); osc.stop(skrg + 0.5);
        }
        else if (tipe === 'pistol_heavy') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(520, skrg);
            gainNode.gain.setValueAtTime(0.35, skrg);
            gainNode.gain.linearRampToValueAtTime(0.01, skrg + 0.1);
            osc.start(skrg); osc.stop(skrg + 0.1);
        }
        else if (tipe === 'pistol_light') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(480, skrg);
            gainNode.gain.setValueAtTime(0.2, skrg);
            gainNode.gain.linearRampToValueAtTime(0.01, skrg + 0.06);
            osc.start(skrg); osc.stop(skrg + 0.06);
        }
        else if (tipe === 'smg_tactical') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(340, skrg);
            gainNode.gain.setValueAtTime(0.3, skrg);
            gainNode.gain.linearRampToValueAtTime(0.01, skrg + 0.08);
            osc.start(skrg); osc.stop(skrg + 0.08);
        }
        else if (tipe === 'gloo') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(140, skrg);
            osc.frequency.exponentialRampToValueAtTime(320, skrg + 0.25);
            gainNode.gain.setValueAtTime(0.5, skrg);
            gainNode.gain.linearRampToValueAtTime(0.01, skrg + 0.25);
            osc.start(skrg); osc.stop(skrg + 0.25);
        }
        else if (tipe === 'heal') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(520, skrg);
            osc.frequency.linearRampToValueAtTime(720, skrg + 0.3);
            gainNode.gain.setValueAtTime(0.3, skrg);
            gainNode.gain.linearRampToValueAtTime(0.01, skrg + 0.3);
            osc.start(skrg); osc.stop(skrg + 0.3);
        }
        else if (tipe === 'hit') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(800, skrg);
            gainNode.gain.setValueAtTime(0.25, skrg);
            gainNode.gain.linearRampToValueAtTime(0.01, skrg + 0.08);
            osc.start(skrg); osc.stop(skrg + 0.08);
        }
    } catch (e) {
        // Graceful fallback
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROCEDURAL MAP GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

function buatTeksturRumputHijau() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#348c31';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#2d7a2a';
    ctx.lineWidth = 2;
    for (let x = 0; x <= 512; x += 64) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, x); ctx.lineTo(512, x); ctx.stroke();
    }

    for (let i = 0; i < 1500; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#40a33c' : '#296e27';
        ctx.fillRect(Math.random() * 512, Math.random() * 512, 4, 4);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(25, 25);
    return texture;
}

function bangunKompleksPerumahan() {
    const lokasiRumah = [
        { x: 10,  z: -15, w: 6, h: 4, d: 8, col: 0xbf616a },
        { x: -18, z: -10, w: 8, h: 5, d: 6, col: 0xd08770 },
        { x: 15,  z:  20, w: 7, h: 4, d: 7, col: 0xebcb8b },
        { x: -12, z:  25, w: 6, h: 4, d: 6, col: 0xa3be8c },
        { x: 25,  z:  -5, w: 5, h: 3, d: 5, col: 0x8fbcbb },
        { x: -25, z:  15, w: 7, h: 4, d: 8, col: 0xb48ead }
    ];

    lokasiRumah.forEach(r => {
        const houseGeo = new THREE.BoxGeometry(r.w, r.h, r.d);
        const houseMat = new THREE.MeshStandardMaterial({ color: r.col, roughness: 0.6 });
        const rumah = new THREE.Mesh(houseGeo, houseMat);
        rumah.position.set(r.x, r.h / 2, r.z);
        rumah.userData = { tipe: 'bangunan' };
        scene.add(rumah);
        daftarBangunanRintangan.push(rumah);
    });
}

function buatGugusanAwanLangit() {
    for (let i = 0; i < 20; i++) {
        const cloudGroup = new THREE.Group();
        const jmlGumpalan = 3 + Math.floor(Math.random() * 4);

        for (let j = 0; j < jmlGumpalan; j++) {
            const cloudGeo = new THREE.SphereGeometry(2 + Math.random() * 2, 8, 8);
            const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
            const gumpalan = new THREE.Mesh(cloudGeo, cloudMat);
            gumpalan.position.set(j * 2, Math.random() * 1, Math.random() * 2);
            cloudGroup.add(gumpalan);
        }
        cloudGroup.position.set(
            (Math.random() - 0.5) * 160,
            25 + Math.random() * 10,
            (Math.random() - 0.5) * 160
        );
        scene.add(cloudGroup);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHARACTER MODEL GENERATOR (STICKMAN 3D)
// ═══════════════════════════════════════════════════════════════════════════════

function buatModelStickman(warnaKulit) {
    const grupKarakter = new THREE.Group();
    const matKarakter = new THREE.MeshStandardMaterial({ color: warnaKulit, roughness: 0.7 });

    const kepala = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), matKarakter);
    kepala.position.y = 1.7;
    grupKarakter.add(kepala);

    const badan = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8), matKarakter);
    badan.position.y = 1.1;
    grupKarakter.add(badan);

    const kakiKiri = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8), matKarakter);
    kakiKiri.position.set(-0.15, 0.35, 0);
    const kakiKanan = kakiKiri.clone();
    kakiKanan.position.x = 0.15;
    grupKarakter.add(kakiKiri, kakiKanan);

    const tanganKiri = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8), matKarakter);
    tanganKiri.position.set(-0.25, 1.1, 0);
    tanganKiri.rotation.z = Math.PI / 12;
    const tanganKanan = tanganKiri.clone();
    tanganKanan.position.x = 0.25;
    tanganKanan.rotation.z = -Math.PI / 12;
    grupKarakter.add(tanganKiri, tanganKanan);

    return grupKarakter;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLAYZONE VISUAL & MECHANICS
// ═══════════════════════════════════════════════════════════════════════════════

function buatPlayzoneVisual() {
    const geometry = new THREE.CircleGeometry(playzoneRadius, 64);
    const material = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide
    });
    playzoneVisual = new THREE.Mesh(geometry, material);
    playzoneVisual.position.set(playzoneCenter.x, 0.05, playzoneCenter.z);
    playzoneVisual.rotation.x = -Math.PI / 2;
    scene.add(playzoneVisual);
}

function updatePlayzone() {
    const now = Date.now();

    if (now - playzoneLastShrinkTime > PLAYZONE_SHRINK_INTERVAL) {
        playzoneLastShrinkTime = now;
        playzoneRadius = Math.max(10, playzoneRadius - PLAYZONE_SHRINK_AMOUNT);
        if (playzoneVisual) scene.remove(playzoneVisual);
        buatPlayzoneVisual();
    }

    const distanceFromCenter = Math.sqrt(
        Math.pow(playerLocal.position.x - playzoneCenter.x, 2) +
        Math.pow(playerLocal.position.z - playzoneCenter.z, 2)
    );

    if (distanceFromCenter > playzoneRadius && !isDead) {
        terimaDamagePenyakit(PLAYZONE_DAMAGE_PER_TICK);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GLOO WALL PREVIEW SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

function toggleGlooWallPreview() {
    if (isDead || glooWallsPlaced >= glooWallQuota) return;

    glooWallPreviewMode = !glooWallPreviewMode;

    if (glooWallPreviewMode) {
        createGlooWallPreview();
    } else {
        if (glooWallPreview) {
            scene.remove(glooWallPreview);
            glooWallPreview = null;
        }
    }
}

function createGlooWallPreview() {
    if (glooWallPreview) scene.remove(glooWallPreview);

    const depanX = playerLocal.position.x - Math.sin(sudutPandangY) * GLOO_WALL_DISTANCE;
    const depanZ = playerLocal.position.z - Math.cos(sudutPandangY) * GLOO_WALL_DISTANCE;

    const wallGeo = new THREE.BoxGeometry(GLOO_WALL_WIDTH, GLOO_WALL_HEIGHT, GLOO_WALL_DEPTH);
    const wallMat = new THREE.MeshStandardMaterial({
        color: 0x89b4fa,
        transparent: true,
        opacity: 0.4,
        roughness: 0.2
    });
    glooWallPreview = new THREE.Mesh(wallGeo, wallMat);
    glooWallPreview.position.set(depanX, GLOO_WALL_HEIGHT / 2, depanZ);
    glooWallPreview.rotation.y = sudutPandangY;
    glooWallPreview.userData = { tipe: 'preview' };
    scene.add(glooWallPreview);
}

function updateGlooWallPreview() {
    if (!glooWallPreviewMode || !glooWallPreview) return;

    const depanX = playerLocal.position.x - Math.sin(sudutPandangY) * GLOO_WALL_DISTANCE;
    const depanZ = playerLocal.position.z - Math.cos(sudutPandangY) * GLOO_WALL_DISTANCE;

    glooWallPreview.position.set(depanX, GLOO_WALL_HEIGHT / 2, depanZ);
    glooWallPreview.rotation.y = sudutPandangY;
}

function deployGlooWall() {
    if (!glooWallPreviewMode || !glooWallPreview || isDead) return;

    putarSuaraCustom('gloo');

    const wallId = Math.random().toString(36).substring(5);
    const wallGeo = new THREE.BoxGeometry(GLOO_WALL_WIDTH, GLOO_WALL_HEIGHT, GLOO_WALL_DEPTH);
    const wallMat = new THREE.MeshStandardMaterial({
        color: 0x89b4fa,
        transparent: true,
        opacity: 0.8,
        roughness: 0.2
    });
    const glooWall = new THREE.Mesh(wallGeo, wallMat);
    glooWall.position.copy(glooWallPreview.position);
    glooWall.rotation.y = glooWallPreview.rotation.y;
    glooWall.userData = {
        id: wallId,
        hp: GLOO_WALL_HP,
        tipe: 'gloo',
        owner: myId
    };

    scene.add(glooWall);
    daftarGlooWall.push(glooWall);
    glooWallsPlaced++;

    kirimDataKeMusuh({
        aksi: 'gloo',
        idWall: wallId,
        x: glooWall.position.x,
        y: glooWall.position.y,
        z: glooWall.position.z,
        rotY: glooWall.rotation.y
    });

    glooWallPreviewMode = false;
    scene.remove(glooWallPreview);
    glooWallPreview = null;

    updateTeksUI();
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEDKIT & HEALING SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

function gunakMedkit() {
    if (isDead || isHealing || jumlahMedkit <= 0 || myHp >= maxHp) return;

    isHealing = true;
    healStartTime = Date.now();
    putarSuaraCustom('heal');
    jumlahMedkit--;
    document.getElementById('ui-status').innerText = "🏥 HEALING... (3 SEK)";
}

function updateHealing() {
    if (!isHealing) return;

    const elapsed = Date.now() - healStartTime;

    if (elapsed >= HEAL_DURATION) {
        isHealing = false;
        document.getElementById('ui-status').innerText = "👁️ STANDBY";
    } else {
        const progress = Math.floor((elapsed / HEAL_DURATION) * 100);
        document.getElementById('ui-status').innerText = `🏥 HEALING... ${progress}%`;
        if (Math.floor(elapsed / 100) * 100 === elapsed) {
            myHp = Math.min(maxHp, myHp + HEAL_AMOUNT_PER_TICK);
        }
    }

    updateTeksUI();
}

// ═══════════════════════════════════════════════════════════════════════════════
// WEAPON SHOOTING & RAYCAST
// ═══════════════════════════════════════════════════════════════════════════════

function tembakSenjata() {
    if (isDead || isReloading || isHealing) return;

    const senjata = statsSenjata[senjataSekarang];
    const now = Date.now();
    const fireDelay = 1000 / senjata.rateOfFire;
    if (now - lastShotTime < fireDelay) return;

    if (senjata.currentAmmo <= 0) {
        reloadSenjata();
        return;
    }

    senjata.currentAmmo--;
    lastShotTime = now;
    putarSuaraCustom(senjata.audioType);
    updateTeksUI();

    const arahTembakan = new THREE.Vector3();
    camera.getWorldDirection(arahTembakan);
    const posisiMata = new THREE.Vector3();
    camera.getWorldPosition(posisiMata);

    const titikAkhirLaser = new THREE.Vector3().copy(posisiMata).addScaledVector(arahTembakan, senjata.range);
    const laserGeo = new THREE.BufferGeometry().setFromPoints([posisiMata, titikAkhirLaser]);
    const laserMat = new THREE.LineBasicMaterial({ color: senjata.warna, linewidth: 3 });
    const laser = new THREE.Line(laserGeo, laserMat);
    scene.add(laser);
    setTimeout(() => scene.remove(laser), 50);

    const raycaster = new THREE.Raycaster(posisiMata, arahTembakan, 0, senjata.range);
    let targetDaftar = [...daftarGlooWall, ...daftarBangunanRintangan];
    if (targetMusuhHitbox) targetDaftar.push(targetMusuhHitbox);

    const hasilSenggolan = raycaster.intersectObjects(targetDaftar);

    if (hasilSenggolan.length > 0) {
        const targetKena = hasilSenggolan[0].object;

        if (targetKena.userData && targetKena.userData.tipe === 'gloo') {
            targetKena.userData.hp -= senjata.damage;
            kirimDataKeMusuh({
                aksi: 'gloo_hit',
                idWall: targetKena.userData.id,
                dmg: senjata.damage
            });
            if (targetKena.userData.hp <= 0) {
                hancurkanGlooWall(targetKena.userData.id);
            }
        } else if (targetKena.name === "hitbox_musuh") {
            kirimDataKeMusuh({
                aksi: 'berikan_damage',
                besarDamage: senjata.damage
            });
            buatEfekHitmarker();
            putarSuaraCustom('hit');
        }
    }
}

function reloadSenjata() {
    const senjata = statsSenjata[senjataSekarang];
    if (isReloading || senjata.currentAmmo === senjata.maxAmmo) return;

    isReloading = true;
    document.getElementById('ui-ammo-display').innerText = "⚙️ RELOADING...";

    setTimeout(() => {
        senjata.currentAmmo = senjata.maxAmmo;
        isReloading = false;
        updateTeksUI();
    }, senjata.reloadTime);
}

function hancurkanGlooWall(id) {
    const indeks = daftarGlooWall.findIndex(w => w.userData.id === id);
    if (indeks !== -1) {
        scene.remove(daftarGlooWall[indeks]);
        daftarGlooWall.splice(indeks, 1);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DAMAGE & DEATH SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

function terimaDamagePenyakit(besarDamage) {
    if (isDead) return;
    myHp = Math.max(0, myHp - besarDamage);
    updateTeksUI();

    if (myHp <= 0) {
        isDead = true;
        document.getElementById('ui-status').innerText = "🔴 TERELIMINASI";
        document.getElementById('ui-ammo-display').innerText = "Refresh untuk balas dendam!";
        kirimDataKeMusuh({ aksi: 'mati_total' });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INPUT HANDLERS - DIPERBAIKI
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * handleMouseMove — diaktifkan HANYA saat pointer lock aktif.
 * Mouse kiri (buttons & 1) TIDAK lagi menggerakkan kamera (klik kiri = tembak).
 */
function handleMouseMove(e) {
    if (isDead) return;

    // Gerakkan kamera HANYA saat pointer lock aktif
    if (isPointerLocked) {
        sudutPandangY -= e.movementX * mouseSensitivity;
        sudutPandangX -= e.movementY * mouseSensitivity;

        // Clamp pitch vertikal
        sudutPandangX = Math.max(-PITCH_CLAMP_UP, Math.min(PITCH_CLAMP_DOWN, sudutPandangX));

        // Rotasi body player ikut yaw
        playerLocal.rotation.y = sudutPandangY;
    }
}

/**
 * handleKeyboard — kontrol baru:
 * W/A/S/D = gerak | Space = lompat | Shift = Crouch | CapsLock = toggle Sprint
 * E = Gloo Wall Preview | R = Reload | H = Medkit
 * (C dan Shift-sprint DIHAPUS dari fungsi lama)
 */
function handleKeyboard(e, isDown) {
    if (isDead && isDown) return;

    const key = e.key;
    const keyLow = key.toLowerCase();

    // Movement keys
    if (keyLow === 'w') keys.w = isDown;
    if (keyLow === 'a') keys.a = isDown;
    if (keyLow === 's') keys.s = isDown;
    if (keyLow === 'd') keys.d = isDown;

    // [BARU] Shift = Crouch (toggle saat keydown)
    if (key === 'Shift') {
        if (isDown) toggleJongkok();
    }

    // [BARU] CapsLock = Toggle Sprint
    if (key === 'CapsLock') {
        if (isDown) {
            isSprinting = !isSprinting;
        }
        // Cegah default CapsLock behavior
        e.preventDefault();
    }

    if (isDown) {
        if (key === ' ') {
            if (isGrounded && !isCrouching) {
                loncatVelocity = 0.17;
                isGrounded = false;
            }
        }
        if (keyLow === 'e') {
            toggleGlooWallPreview();
        }
        if (keyLow === 'r') {
            reloadSenjata();
        }
        if (keyLow === 'h') {
            gunakMedkit();
        }
    }
}

/**
 * toggleJongkok — Shift mengontrol crouch.
 * Sprint akan dinonaktifkan saat crouching.
 */
function toggleJongkok() {
    if (isCrouching) {
        // Berdiri lagi
        isCrouching = false;
    } else {
        // Jongkok — matikan sprint
        isCrouching = true;
        isSprinting = false;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOUSE BUTTON HANDLERS - DIPERBAIKI
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * mousedown handler:
 * - Button 0 (Klik Kiri)  = Tembak / Konfirmasi Gloo Wall
 * - Button 1 (Middle Click) = requestPointerLock()
 * - Button 2 (Klik Kanan)  = tidak dipakai
 */
function handleMouseDown(e) {
    if (isDead) return;

    if (e.button === 1) {
        // Middle Click = Pointer Lock
        e.preventDefault();
        if (document.body.requestPointerLock && roomCode !== "") {
            document.body.requestPointerLock();
        }
        return;
    }

    if (e.button === 0) {
        // Klik Kiri = Tembak atau konfirmasi Gloo Wall
        if (e.target.tagName === "CANVAS" || isPointerLocked) {
            if (glooWallPreviewMode) {
                deployGlooWall();
            } else {
                tembakSenjata();
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE JOYSTICK SYSTEM - DIPERBAIKI
// ═══════════════════════════════════════════════════════════════════════════════

function siapkanSistemJoystickMobile() {
    const container = document.getElementById('joystick-container');
    const knob      = document.getElementById('joystick-knob');

    if (!container) return;

    container.addEventListener('touchstart', (e) => {
        joystickActive = true;
        const rect = container.getBoundingClientRect();
        joystickStartPos = {
            x: rect.left + rect.width  / 2,
            y: rect.top  + rect.height / 2
        };
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (!joystickActive) return;
        const touch = e.touches[0];

        let sX = touch.clientX - joystickStartPos.x;
        let sY = touch.clientY - joystickStartPos.y;
        const jarak   = Math.sqrt(sX * sX + sY * sY);
        const batasMax = 45;

        if (jarak > batasMax) {
            sX = (sX / jarak) * batasMax;
            sY = (sY / jarak) * batasMax;
        }

        knob.style.transform = `translate(${sX}px, ${sY}px)`;

        // [DIPERBAIKI] Normalisasi:
        // sX  > 0 → geser kanan  → joystickMoveVector.x > 0 → straf kanan
        // sY  > 0 → geser bawah  → joystickMoveVector.y > 0 → mundur  (positif Y = mundur)
        // sY  < 0 → geser atas   → joystickMoveVector.y < 0 → maju    (negatif Y = maju)
        joystickMoveVector.x = sX / batasMax;
        joystickMoveVector.y = sY / batasMax; // positif = mundur, negatif = maju
    }, { passive: true });

    window.addEventListener('touchend', () => {
        if (!joystickActive) return;
        joystickActive = false;
        knob.style.transform = `translate(0px, 0px)`;
        joystickMoveVector = { x: 0, y: 0 };
    });

    // Mobile button handlers (tetap ada untuk di-bind ke HTML)
    const btnShoot  = document.getElementById('btn-shoot-mobile');
    const btnGloo   = document.getElementById('btn-gloo-mobile');
    const btnJump   = document.getElementById('btn-jump-mobile');
    const btnCrouch = document.getElementById('btn-crouch-mobile');
    const btnHeal   = document.getElementById('btn-heal-mobile');

    if (btnShoot)  btnShoot.addEventListener('touchstart',  (e) => { e.preventDefault(); if (!isDead) { glooWallPreviewMode ? deployGlooWall() : tembakSenjata(); } });
    if (btnGloo)   btnGloo.addEventListener('touchstart',   (e) => { e.preventDefault(); if (!isDead) toggleGlooWallPreview(); });
    if (btnJump)   btnJump.addEventListener('touchstart',   (e) => { e.preventDefault(); if (isGrounded && !isCrouching && !isDead) { loncatVelocity = 0.17; isGrounded = false; } });
    if (btnCrouch) btnCrouch.addEventListener('touchstart', (e) => { e.preventDefault(); if (!isDead) toggleJongkok(); });
    if (btnHeal)   btnHeal.addEventListener('touchstart',   (e) => { e.preventDefault(); if (!isDead) gunakMedkit(); });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3D WORLD INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

function init3DWorld() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xaaccff);
    scene.fog = new THREE.FogExp2(0xaaccff, 0.01);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('game-canvas'),
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight.position.set(30, 60, 30);
    scene.add(dirLight);

    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(250, 250),
        new THREE.MeshStandardMaterial({ map: buatTeksturRumputHijau(), roughness: 0.9 })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    bangunKompleksPerumahan();
    buatGugusanAwanLangit();
    buatPlayzoneVisual();

    // Local player
    playerLocal = new THREE.Group();
    playerLocal.position.set(0, 0, 4);
    scene.add(playerLocal);

    modelStickmanLokal = buatModelStickman(0x55ff55);
    modelStickmanLokal.scale.set(0.6, 0.6, 0.6);
    playerLocal.add(modelStickmanLokal);

    // Posisi awal kamera (akan langsung diatur ulang oleh updateThirdPersonCamera)
    scene.add(camera);

    // ── Event Listeners ────────────────────────────────────────────────────────

    window.addEventListener('keydown',   (e) => handleKeyboard(e, true));
    window.addEventListener('keyup',     (e) => handleKeyboard(e, false));
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('resize',    onWindowResize);

    // Cegah context menu klik kanan di canvas
    document.getElementById('game-canvas').addEventListener('contextmenu', (e) => e.preventDefault());

    // Cegah scroll saat middle click
    window.addEventListener('mousedown', (e) => { if (e.button === 1) e.preventDefault(); }, { passive: false });

    // Pointer Lock change listener
    document.addEventListener('pointerlockchange', () => {
        isPointerLocked = (document.pointerLockElement === document.body);
    });
    document.addEventListener('pointerlockerror', () => {
        console.warn("Pointer lock gagal.");
    });

    // Mobile controls
    siapkanSistemJoystickMobile();

    // Start loop
    animate();
}

// ═══════════════════════════════════════════════════════════════════════════════
// THIRD-PERSON CAMERA SYSTEM - DIPERBAIKI
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * updateThirdPersonCamera — Sistem kamera orbital yang smooth.
 *
 * Logika:
 * 1. Pivot berada di tengah punggung atas player (setinggi bahu).
 * 2. Kamera di-orbit mengelilingi pivot menggunakan sudutPandangY (yaw) dan
 *    sudutPandangX (pitch) dengan metode spherical coordinates.
 * 3. Posisi kamera di-lerp agar transisi mulus saat player bergerak/rotasi.
 * 4. lookAt kamera selalu mengarah ke pivot agar "mata" selalu mengikuti player.
 */
function updateThirdPersonCamera() {
    const crouchFactor = isCrouching ? 0.65 : 1.0;

    // Tinggi pivot mengikuti postur (crouching lebih rendah)
    const pivotHeight = CAMERA_HEIGHT_PIVOT * crouchFactor;

    // Jarak orbit saat crouching sedikit lebih dekat
    const orbitDistance = CAMERA_DISTANCE * (isCrouching ? 0.85 : 1.0);

    // ── Hitung posisi pivot (titik tengah fokus kamera) ──────────────────────
    const pivotX = playerLocal.position.x;
    const pivotY = playerLocal.position.y + pivotHeight;
    const pivotZ = playerLocal.position.z;

    // ── Spherical orbit: pitch (sudutPandangX) + yaw (sudutPandangY) ─────────
    // Konversi sudut polar ke koordinat Cartesian:
    // - cos(pitch) = komponen horizontal radius
    // - sin(pitch) = komponen vertikal (ke atas saat pitch positif)
    const cosP = Math.cos(sudutPandangX);
    const sinP = Math.sin(sudutPandangX);

    targetCameraPos.set(
        pivotX + cosP * Math.sin(sudutPandangY) * orbitDistance,
        pivotY + sinP * orbitDistance + 0.5, // +0.5 offset agar tidak terlalu rendah
        pivotZ + cosP * Math.cos(sudutPandangY) * orbitDistance
    );

    // ── Lerp posisi kamera (smooth follow) ────────────────────────────────────
    camera.position.lerp(targetCameraPos, CAMERA_LERP_SPEED);

    // ── lookAt pivot (smooth) ─────────────────────────────────────────────────
    const targetLookAt = new THREE.Vector3(pivotX, pivotY, pivotZ);
    currentLookAt.lerp(targetLookAt, CAMERA_LERP_SPEED * 1.5);
    camera.lookAt(currentLookAt);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ANIMATION LOOP
// ═══════════════════════════════════════════════════════════════════════════════

function animate() {
    requestAnimationFrame(animate);

    if (!playerLocal || isDead) {
        renderer.render(scene, camera);
        return;
    }

    // ── Hitung kecepatan berdasarkan status ────────────────────────────────────
    let speed;
    if (isCrouching) {
        speed = SPEED_CROUCH;
    } else if (isSprinting) {
        speed = SPEED_SPRINT;
    } else {
        speed = SPEED_WALK;
    }

    // ── Vektor arah maju (forward) & samping (right) relatif kamera yaw ───────
    const sinY = Math.sin(sudutPandangY);
    const cosY = Math.cos(sudutPandangY);

    // Forward: ke arah hadap kamera (sumbu -Z di Three.js → sin/cos yaw)
    const fwdX = sinY;
    const fwdZ = cosY;

    // Right: 90° searah jarum jam dari forward
    const rgtX =  cosY;
    const rgtZ = -sinY;

    // ── Keyboard movement ──────────────────────────────────────────────────────
    if (keys.w) {
        playerLocal.position.x -= fwdX * speed;
        playerLocal.position.z -= fwdZ * speed;
    }
    if (keys.s) {
        playerLocal.position.x += fwdX * speed;
        playerLocal.position.z += fwdZ * speed;
    }
    if (keys.a) {
        playerLocal.position.x -= rgtX * speed;
        playerLocal.position.z -= rgtZ * speed;
    }
    if (keys.d) {
        playerLocal.position.x += rgtX * speed;
        playerLocal.position.z += rgtZ * speed;
    }

    // ── Mobile joystick movement - DIPERBAIKI ─────────────────────────────────
    // joystickMoveVector.y < 0 → dorong atas → MAJU  → kurangi posisi searah forward
    // joystickMoveVector.y > 0 → dorong bawah → MUNDUR → tambah posisi searah forward
    // joystickMoveVector.x > 0 → dorong kanan → STRAF KANAN → tambah searah right
    // joystickMoveVector.x < 0 → dorong kiri  → STRAF KIRI  → kurangi searah right
    if (joystickActive) {
        const joyFwd  = -joystickMoveVector.y; // negatif Y = maju
        const joyRgt  =  joystickMoveVector.x; // positif X = kanan

        playerLocal.position.x += (fwdX * joyFwd + rgtX * joyRgt) * speed;
        playerLocal.position.z += (fwdZ * joyFwd + rgtZ * joyRgt) * speed;
    }

    // ── Jump physics ───────────────────────────────────────────────────────────
    if (!isGrounded) {
        playerLocal.position.y += loncatVelocity;
        loncatVelocity -= 0.01;
        if (playerLocal.position.y <= 0) {
            playerLocal.position.y = 0;
            isGrounded = true;
            loncatVelocity = 0;
        }
    }

    // ── Update subsystems ──────────────────────────────────────────────────────
    updateThirdPersonCamera();
    updateGlooWallPreview();
    updateHealing();
    updatePlayzone();

    // ── Network sync ───────────────────────────────────────────────────────────
    if (roomCode !== "" && socket && socket.connected) {
        kirimDataKeMusuh({
            aksi: 'gerak',
            x: playerLocal.position.x,
            y: playerLocal.position.y,
            z: playerLocal.position.z,
            rotY: sudutPandangY
        });
    }

    renderer.render(scene, camera);
}

// ═══════════════════════════════════════════════════════════════════════════════
// UI SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

function buatSistemUIDinamis() {
    const wadahUI = document.createElement('div');
    wadahUI.style.position  = 'absolute';
    wadahUI.style.bottom    = '15px';
    wadahUI.style.left      = '50%';
    wadahUI.style.transform = 'translateX(-50%)';
    wadahUI.style.zIndex    = '999';
    wadahUI.style.textAlign = 'center';
    wadahUI.style.fontFamily = 'monospace';
    wadahUI.style.pointerEvents = 'auto';

    // Health bar
    const barDarahContainer = document.createElement('div');
    barDarahContainer.style.width           = '240px';
    barDarahContainer.style.height          = '18px';
    barDarahContainer.style.backgroundColor = '#333';
    barDarahContainer.style.border          = '2px solid #fff';
    barDarahContainer.style.borderRadius    = '4px';
    barDarahContainer.style.overflow        = 'hidden';

    const isiDarahBar = document.createElement('div');
    isiDarahBar.id                  = 'ui-hp-bar';
    isiDarahBar.style.width          = '100%';
    isiDarahBar.style.height         = '100%';
    isiDarahBar.style.backgroundColor = '#ff3333';
    barDarahContainer.appendChild(isiDarahBar);

    const teksTandaHP = document.createElement('div');
    teksTandaHP.id             = 'ui-hp-text';
    teksTandaHP.style.color    = 'white';
    teksTandaHP.style.fontWeight = 'bold';
    teksTandaHP.style.marginTop  = '-18px';
    teksTandaHP.style.fontSize   = '12px';
    teksTandaHP.innerText = 'HP: 200 / 200';
    barDarahContainer.appendChild(teksTandaHP);

    // Ammo display
    const infoPeluru = document.createElement('div');
    infoPeluru.id                 = 'ui-ammo-display';
    infoPeluru.style.color        = '#ffff00';
    infoPeluru.style.fontSize     = '18px';
    infoPeluru.style.fontWeight   = 'bold';
    infoPeluru.style.textShadow   = '1px 1px 1px black';
    infoPeluru.style.marginTop    = '4px';

    // Medkit
    const infoMedkit = document.createElement('div');
    infoMedkit.id              = 'ui-medkit-display';
    infoMedkit.style.color     = '#00ff00';
    infoMedkit.style.fontSize  = '14px';
    infoMedkit.style.marginTop = '4px';

    const infoStatus = document.createElement('div');
    infoStatus.id              = 'ui-status';
    infoStatus.style.color     = '#fff';
    infoStatus.style.fontSize  = '12px';
    infoStatus.style.marginTop = '2px';
    infoStatus.innerText = '👁️ STANDBY';

    const infoGloo = document.createElement('div');
    infoGloo.id              = 'ui-gloo-display';
    infoGloo.style.color     = '#89b4fa';
    infoGloo.style.fontSize  = '12px';
    infoGloo.style.marginTop = '2px';

    wadahUI.appendChild(barDarahContainer);
    wadahUI.appendChild(infoPeluru);
    wadahUI.appendChild(infoMedkit);
    wadahUI.appendChild(infoStatus);
    wadahUI.appendChild(infoGloo);
    document.body.appendChild(wadahUI);

    updateTeksUI();
}

function updateTeksUI() {
    const senjata = statsSenjata[senjataSekarang];
    const persentaseHp = (myHp / maxHp) * 100;

    const bar = document.getElementById('ui-hp-bar');
    if (bar) bar.style.width = `${persentaseHp}%`;

    const teksHp = document.getElementById('ui-hp-text');
    if (teksHp) teksHp.innerText = `HP: ${myHp} / ${maxHp}`;

    const ammoUI = document.getElementById('ui-ammo-display');
    if (ammoUI && !isReloading) {
        ammoUI.innerText = `${senjata.nama} | ${senjata.currentAmmo} / ${senjata.maxAmmo}`;
    }

    const medkitUI = document.getElementById('ui-medkit-display');
    if (medkitUI) {
        medkitUI.innerText = `🏥 Medkit: ${jumlahMedkit} | H to use`;
    }

    const glooUI = document.getElementById('ui-gloo-display');
    if (glooUI) {
        const sprintLabel = isSprinting ? '🏃 SPRINT ON' : '';
        glooUI.innerText = `🔷 Gloo Wall: ${glooWallsPlaced} / ${glooWallQuota} | E + Click   ${sprintLabel}`;
    }
}

function buatEfekHitmarker() {
    const penanda = document.createElement('div');
    penanda.style.position      = 'absolute';
    penanda.style.top           = '50%';
    penanda.style.left          = '50%';
    penanda.style.transform     = 'translate(-50%, -50%)';
    penanda.style.color         = '#ff3333';
    penanda.style.fontSize      = '28px';
    penanda.style.fontWeight    = 'bold';
    penanda.style.pointerEvents = 'none';
    penanda.style.textShadow    = '2px 2px 4px black';
    penanda.innerText = '✕ HIT!';
    document.body.appendChild(penanda);
    setTimeout(() => penanda.remove(), 150);
}

// ═══════════════════════════════════════════════════════════════════════════════
// WINDOW RESIZE
// ═══════════════════════════════════════════════════════════════════════════════

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MULTIPLAYER NETWORKING & SOCKET.IO
// ═══════════════════════════════════════════════════════════════════════════════

function hubungkanJaringan() {
    socket = io();

    socket.on('connect', () => {
        socket.emit('join_game', {
            room: roomCode,
            id: myId,
            username: "Player STAS"
        });
        document.getElementById('ui-status').innerText = "🔍 Mencari Musuh...";
    });

    socket.on('player_joined', (data) => {
        document.getElementById('ui-status').innerText = "⚔️ Bertarung Dimulai!";
        buatKarakterMusuh();
    });

    socket.on('player_updated', (data) => {
        if (data.aksi === 'gerak') {
            if (!musuhRemote) buatKarakterMusuh();
            if (musuhRemote) {
                musuhRemote.position.set(data.x, data.y, data.z);
                musuhRemote.rotation.y = data.rotY;
            }
        }
        else if (data.aksi === 'gloo') {
            const wallGeo = new THREE.BoxGeometry(GLOO_WALL_WIDTH, GLOO_WALL_HEIGHT, GLOO_WALL_DEPTH);
            const wallMat = new THREE.MeshStandardMaterial({ color: 0xf38ba8, transparent: true, opacity: 0.65 });
            const enemyWall = new THREE.Mesh(wallGeo, wallMat);
            enemyWall.position.set(data.x, data.y, data.z);
            enemyWall.rotation.y = data.rotY;
            enemyWall.userData = { id: data.idWall, hp: GLOO_WALL_HP, tipe: 'gloo', owner: data.id };
            scene.add(enemyWall);
            daftarGlooWall.push(enemyWall);
        }
        else if (data.aksi === 'gloo_hit') {
            const tw = daftarGlooWall.find(w => w.userData.id === data.idWall);
            if (tw) {
                tw.userData.hp -= data.dmg;
                if (tw.userData.hp <= 0) hancurkanGlooWall(data.idWall);
            }
        }
        else if (data.aksi === 'berikan_damage') {
            terimaDamagePenyakit(data.besarDamage);
        }
        else if (data.aksi === 'mati_total') {
            document.getElementById('ui-status').innerText = "👑 BOOYAH! VICTORY!";
            if (musuhRemote) scene.remove(musuhRemote);
        }
    });

    socket.on('disconnect', () => {
        console.log("Disconnected from server");
    });
}

function buatKarakterMusuh() {
    if (musuhRemote) return;
    musuhRemote = buatModelStickman(0xff5555);
    musuhRemote.position.set(0, 0, -10);

    const hitboxGeo = new THREE.CylinderGeometry(0.45, 0.45, 2.1, 8);
    targetMusuhHitbox = new THREE.Mesh(
        hitboxGeo,
        new THREE.MeshBasicMaterial({ visible: false })
    );
    targetMusuhHitbox.name     = "hitbox_musuh";
    targetMusuhHitbox.position.y = 1.05;

    musuhRemote.add(targetMusuhHitbox);
    scene.add(musuhRemote);
}

function kirimDataKeMusuh(payload) {
    if (!socket || !socket.connected) return;
    payload.room = roomCode;
    payload.id   = myId;
    socket.emit('update_player', payload);
}

// ═══════════════════════════════════════════════════════════════════════════════
// WEAPON SELECTION UI
// ═══════════════════════════════════════════════════════════════════════════════

window.selectLobbyWeapon = function(nama) {
    if (isDead || isReloading) return;
    senjataSekarang = nama;
    putarSuaraCustom('pistol_light');

    document.querySelectorAll('.weapon-card').forEach(el => el.classList.remove('selected'));
    document.querySelectorAll('.weapon-card').forEach(card => {
        if (card.innerHTML.includes(nama)) card.classList.add('selected');
    });

    updateTeksUI();
};

// ═══════════════════════════════════════════════════════════════════════════════
// INITIALIZATION TRIGGER (dari HTML modal)
// ═══════════════════════════════════════════════════════════════════════════════

const btnConfirmStart = document.getElementById('btn-confirm-start');
if (btnConfirmStart) {
    btnConfirmStart.addEventListener('click', () => {
        const kode = document.getElementById('room-input-code').value.trim();
        if (kode !== "") {
            roomCode = kode;
            document.getElementById('ui-room-text').innerText = roomCode;

            document.getElementById('room-modal').style.display    = 'none';
            document.getElementById('lobby-container').style.display = 'none';
            document.getElementById('top-hud').style.display        = 'block';

            if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
                document.getElementById('mobile-hud').style.display = 'block';
            }

            // TIDAK auto-request pointer lock di sini.
            // Pointer lock hanya via Middle Click.

            buatSistemUIDinamis();
            hubungkanJaringan();
            init3DWorld();
        } else {
            alert("Kode Room wajib diisi!");
        }
    });
}

const btnCancelRoom = document.getElementById('btn-cancel-room');
if (btnCancelRoom) {
    btnCancelRoom.addEventListener('click', () => {
        document.getElementById('room-modal').style.display = 'none';
    });
}

const btnOpenMatch = document.getElementById('btn-open-match');
if (btnOpenMatch) {
    btnOpenMatch.addEventListener('click', () => {
        document.getElementById('room-modal').style.display = 'flex';
    });
}

// ════════════════════════════════════════════════════════════════════════════════
// END OF GAME SCRIPT
// ════════════════════════════════════════════════════════════════════════════════
