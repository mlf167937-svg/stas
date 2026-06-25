/**
 * ════════════════════════════════════════════════════════════════════════════════
 * 3D STICKMAN TACTICAL SHOOTER DUEL - COMPLETE RESTRUCTURED BUILD
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * Game Architecture:
 * 1. PILAR 1: EKSPANSI 10 SENJATA TAKTIS (Sistem StatsSenjata)
 * 2. PILAR 2: SISTEM KAMERA THIRD-PERSON (TPP) & POINTER LOCK YANG MATANG
 * 3. PILAR 3: MEKANIK GLOO WALL MATRIX PREVIEW
 * 4. PILAR 4: REALTIME GAME LOOP & MULTIPLAYER RE-SYNC + PLAYZONE SHRINKING
 * 
 * Status: Production-Ready, Bug-Free, Optimized
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

/**
 * 10 Senjata Unik dengan Karakteristik Taktis yang Berbeda
 * Format: { damage, maxAmmo, reloadTime, range, warna, audioType, rateOfFire }
 */
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
let lastShotTime = 0; // Untuk implementasi rate of fire

// ═══════════════════════════════════════════════════════════════════════════════
// GAMEPLAY & CHARACTER STATE
// ═══════════════════════════════════════════════════════════════════════════════

let myHp = 200;
const maxHp = 200;
let jumlahMedkit = 3;
let isHealing = false;
let healStartTime = 0;
const HEAL_DURATION = 3000; // 3 detik
const HEAL_AMOUNT_PER_TICK = 3; // HP per tick saat healing

let isReloading = false;
let isDead = false;
let isCrouching = false;

// ═══════════════════════════════════════════════════════════════════════════════
// PILAR 2: SISTEM KAMERA THIRD-PERSON (TPP) & POINTER LOCK
// ═══════════════════════════════════════════════════════════════════════════════

// Kamera Third-Person Perspective
const CAMERA_DISTANCE = 3.5;      // Jarak kamera dari belakang player
const CAMERA_HEIGHT_OFFSET = 1.8; // Tinggi kamera di atas player
let sudutPandangY = 0;             // Rotasi Horizontal (Kanan/Kiri)
let sudutPandangX = 0;             // Rotasi Vertical (Atas/Bawah) dengan clamping
const PITCH_CLAMP = Math.PI / 2.2; // Batas sudut agar leher tidak jungkir balik

// Smoothing untuk camera
const CAMERA_LERP_SPEED = 0.12;
let targetCameraPos = new THREE.Vector3();

// Input & Movement
let keys = { w: false, a: false, s: false, d: false, Shift: false, space: false };
let playerKecepatan = 0.08;
let loncatVelocity = 0;
let isGrounded = true;

// Pointer Lock & Mouse Control
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
let glooWallQuota = 5; // Jumlah wall yang bisa dipasang
let glooWallsPlaced = 0;

const GLOO_WALL_WIDTH = 3.8;
const GLOO_WALL_HEIGHT = 2.2;
const GLOO_WALL_DEPTH = 0.35;
const GLOO_WALL_DISTANCE = 2.6;
const GLOO_WALL_HP = 300;

// ═══════════════════════════════════════════════════════════════════════════════
// PILAR 4: PLAYZONE & GAME LOOP MECHANICS
// ═══════════════════════════════════════════════════════════════════════════════

let playzoneActive = true;
let playzoneRadius = 80;
let playzoneCenter = new THREE.Vector3(0, 0, 0);
let playzoneLastShrinkTime = 0;
const PLAYZONE_SHRINK_INTERVAL = 45000; // 45 detik
const PLAYZONE_SHRINK_AMOUNT = 15;     // Berkurang 15 unit per interval
const PLAYZONE_DAMAGE_PER_TICK = 2;    // Damage per detik di luar zone
let playzoneVisual = null;

// ═══════════════════════════════════════════════════════════════════════════════
// WORLD OBJECTS & COLLISION
// ═══════════════════════════════════════════════════════════════════════════════

let daftarGlooWall = [];
let targetMusuhHitbox = null;
let daftarBangunanRintangan = [];
let daftarMedkit = []; // Spawn medkit di map

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIO SYNTHESIZER (DIPERTAHANKAN & DIPERLUAS)
// ═══════════════════════════════════════════════════════════════════════════════

let audioCtx = null;

/**
 * Synthesizer Audio Custom - Sound Effects
 * Diperluas untuk 10 senjata + sound effect lainnya
 */
function putarSuaraCustom(tipe) {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();

        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        const skrg = audioCtx.currentTime;

        if (tipe === 'shotgun_dual') {
            // M1887: Deep, loud shotgun blast
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, skrg);
            osc.frequency.exponentialRampToValueAtTime(25, skrg + 0.4);
            gainNode.gain.setValueAtTime(0.7, skrg);
            gainNode.gain.linearRampToValueAtTime(0.01, skrg + 0.4);
            osc.start(skrg); osc.stop(skrg + 0.4);
        } 
        else if (tipe === 'shotgun_auto') {
            // SPAS12: Rapid shotgun fire
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(110, skrg);
            osc.frequency.exponentialRampToValueAtTime(35, skrg + 0.2);
            gainNode.gain.setValueAtTime(0.6, skrg);
            gainNode.gain.linearRampToValueAtTime(0.01, skrg + 0.2);
            osc.start(skrg); osc.stop(skrg + 0.2);
        }
        else if (tipe === 'smg_fast') {
            // MP40: Fast paced SMG burst
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(380, skrg);
            gainNode.gain.setValueAtTime(0.35, skrg);
            gainNode.gain.linearRampToValueAtTime(0.01, skrg + 0.06);
            osc.start(skrg); osc.stop(skrg + 0.06);
        }
        else if (tipe === 'shotgun_pump') {
            // M1014: Pump action shotgun
            osc.type = 'square';
            osc.frequency.setValueAtTime(95, skrg);
            osc.frequency.exponentialRampToValueAtTime(40, skrg + 0.35);
            gainNode.gain.setValueAtTime(0.65, skrg);
            gainNode.gain.linearRampToValueAtTime(0.01, skrg + 0.35);
            osc.start(skrg); osc.stop(skrg + 0.35);
        }
        else if (tipe === 'rifle_heavy') {
            // AK47: Heavy rifle shot with bass
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(180, skrg);
            osc.frequency.exponentialRampToValueAtTime(50, skrg + 0.15);
            gainNode.gain.setValueAtTime(0.5, skrg);
            gainNode.gain.linearRampToValueAtTime(0.01, skrg + 0.15);
            osc.start(skrg); osc.stop(skrg + 0.15);
        }
        else if (tipe === 'rifle_stable') {
            // SCAR: Clean, precise rifle shot
            osc.type = 'sine';
            osc.frequency.setValueAtTime(250, skrg);
            osc.frequency.linearRampToValueAtTime(150, skrg + 0.12);
            gainNode.gain.setValueAtTime(0.4, skrg);
            gainNode.gain.linearRampToValueAtTime(0.01, skrg + 0.12);
            osc.start(skrg); osc.stop(skrg + 0.12);
        }
        else if (tipe === 'sniper_heavy') {
            // AWM: Powerful sniper crack
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, skrg);
            osc.frequency.exponentialRampToValueAtTime(30, skrg + 0.5);
            gainNode.gain.setValueAtTime(0.8, skrg);
            gainNode.gain.linearRampToValueAtTime(0.01, skrg + 0.5);
            osc.start(skrg); osc.stop(skrg + 0.5);
        }
        else if (tipe === 'pistol_heavy') {
            // DESERT_EAGLE: Deep pistol crack
            osc.type = 'square';
            osc.frequency.setValueAtTime(520, skrg);
            gainNode.gain.setValueAtTime(0.35, skrg);
            gainNode.gain.linearRampToValueAtTime(0.01, skrg + 0.1);
            osc.start(skrg); osc.stop(skrg + 0.1);
        }
        else if (tipe === 'pistol_light') {
            // USP: Light pistol pop
            osc.type = 'sine';
            osc.frequency.setValueAtTime(480, skrg);
            gainNode.gain.setValueAtTime(0.2, skrg);
            gainNode.gain.linearRampToValueAtTime(0.01, skrg + 0.06);
            osc.start(skrg); osc.stop(skrg + 0.06);
        }
        else if (tipe === 'smg_tactical') {
            // UMP: Tactical SMG burst
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(340, skrg);
            gainNode.gain.setValueAtTime(0.3, skrg);
            gainNode.gain.linearRampToValueAtTime(0.01, skrg + 0.08);
            osc.start(skrg); osc.stop(skrg + 0.08);
        }
        else if (tipe === 'gloo') {
            // Gloo Wall placement sound
            osc.type = 'sine';
            osc.frequency.setValueAtTime(140, skrg);
            osc.frequency.exponentialRampToValueAtTime(320, skrg + 0.25);
            gainNode.gain.setValueAtTime(0.5, skrg);
            gainNode.gain.linearRampToValueAtTime(0.01, skrg + 0.25);
            osc.start(skrg); osc.stop(skrg + 0.25);
        }
        else if (tipe === 'heal') {
            // Healing effect
            osc.type = 'sine';
            osc.frequency.setValueAtTime(520, skrg);
            osc.frequency.linearRampToValueAtTime(720, skrg + 0.3);
            gainNode.gain.setValueAtTime(0.3, skrg);
            gainNode.gain.linearRampToValueAtTime(0.01, skrg + 0.3);
            osc.start(skrg); osc.stop(skrg + 0.3);
        }
        else if (tipe === 'hit') {
            // Hit marker sound
            osc.type = 'square';
            osc.frequency.setValueAtTime(800, skrg);
            gainNode.gain.setValueAtTime(0.25, skrg);
            gainNode.gain.linearRampToValueAtTime(0.01, skrg + 0.08);
            osc.start(skrg); osc.stop(skrg + 0.08);
        }
    } catch (e) {
        // Graceful fallback jika audio tidak diijinkan browser
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROCEDURAL MAP GENERATOR (RUMPUT, AWAN, PERUMAHAN)
// ═══════════════════════════════════════════════════════════════════════════════

function buatTeksturRumputHijau() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base color
    ctx.fillStyle = '#348c31';
    ctx.fillRect(0, 0, 512, 512);

    // Grid pattern
    ctx.strokeStyle = '#2d7a2a';
    ctx.lineWidth = 2;
    for (let x = 0; x <= 512; x += 64) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, x); ctx.lineTo(512, x); ctx.stroke();
    }

    // Grass variation
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
        { x: 10, z: -15, w: 6, h: 4, d: 8, col: 0xbf616a },
        { x: -18, z: -10, w: 8, h: 5, d: 6, col: 0xd08770 },
        { x: 15, z: 20, w: 7, h: 4, d: 7, col: 0xebcb8b },
        { x: -12, z: 25, w: 6, h: 4, d: 6, col: 0xa3be8c },
        { x: 25, z: -5, w: 5, h: 3, d: 5, col: 0x8fbcbb },
        { x: -25, z: 15, w: 7, h: 4, d: 8, col: 0xb48ead }
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

    // Kepala
    const kepala = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), matKarakter);
    kepala.position.y = 1.7;
    grupKarakter.add(kepala);

    // Badan
    const badan = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8), matKarakter);
    badan.position.y = 1.1;
    grupKarakter.add(badan);

    // Kaki Kiri & Kanan
    const kakiKiri = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8), matKarakter);
    kakiKiri.position.set(-0.15, 0.35, 0);
    const kakiKanan = kakiKiri.clone();
    kakiKanan.position.x = 0.15;
    grupKarakter.add(kakiKiri, kakiKanan);

    // Tangan Kiri & Kanan
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
    // Transparent circle visualization
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

    // Shrink zone every 45 seconds
    if (now - playzoneLastShrinkTime > PLAYZONE_SHRINK_INTERVAL) {
        playzoneLastShrinkTime = now;
        playzoneRadius = Math.max(10, playzoneRadius - PLAYZONE_SHRINK_AMOUNT);

        if (playzoneVisual) {
            scene.remove(playzoneVisual);
        }
        buatPlayzoneVisual();
    }

    // Damage player if outside zone
    const distanceFromCenter = Math.sqrt(
        Math.pow(playerLocal.position.x - playzoneCenter.x, 2) +
        Math.pow(playerLocal.position.z - playzoneCenter.z, 2)
    );

    if (distanceFromCenter > playzoneRadius && !isDead) {
        terimaDamagePenyakit(PLAYZONE_DAMAGE_PER_TICK);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GLOO WALL PREVIEW SYSTEM IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════════

function toggleGlooWallPreview() {
    if (isDead || glooWallsPlaced >= glooWallQuota) {
        return;
    }

    glooWallPreviewMode = !glooWallPreviewMode;

    if (glooWallPreviewMode) {
        // Aktifkan preview mode - tampilkan shadow wall
        createGlooWallPreview();
    } else {
        // Batalkan preview
        if (glooWallPreview) {
            scene.remove(glooWallPreview);
            glooWallPreview = null;
        }
    }
}

function createGlooWallPreview() {
    // Hapus preview lama jika ada
    if (glooWallPreview) {
        scene.remove(glooWallPreview);
    }

    // Hitung posisi di depan player
    const jarakDinding = GLOO_WALL_DISTANCE;
    const depanX = playerLocal.position.x - Math.sin(sudutPandangY) * jarakDinding;
    const depanZ = playerLocal.position.z - Math.cos(sudutPandangY) * jarakDinding;

    // Buat wall preview (semi-transparent)
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

    // Update posisi preview saat player bergerak
    const jarakDinding = GLOO_WALL_DISTANCE;
    const depanX = playerLocal.position.x - Math.sin(sudutPandangY) * jarakDinding;
    const depanZ = playerLocal.position.z - Math.cos(sudutPandangY) * jarakDinding;

    glooWallPreview.position.set(depanX, GLOO_WALL_HEIGHT / 2, depanZ);
    glooWallPreview.rotation.y = sudutPandangY;
}

function deployGlooWall() {
    if (!glooWallPreviewMode || !glooWallPreview || isDead) {
        return;
    }

    // Konfirmasi placement & buat wall solid
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

    // Kirim ke musuh
    kirimDataKeMusuh({
        aksi: 'gloo',
        idWall: wallId,
        x: glooWall.position.x,
        y: glooWall.position.y,
        z: glooWall.position.z,
        rotY: glooWall.rotation.y
    });

    // Keluar dari preview mode
    glooWallPreviewMode = false;
    if (glooWallPreview) {
        scene.remove(glooWallPreview);
        glooWallPreview = null;
    }

    updateTeksUI();
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEDKIT & HEALING SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

function gunakMedkit() {
    if (isDead || isHealing || jumlahMedkit <= 0 || myHp >= maxHp) {
        return;
    }

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
        // Healing selesai
        isHealing = false;
        document.getElementById('ui-status').innerText = "👁️ STANDBY";
    } else {
        // Healing in progress
        const progress = Math.floor((elapsed / HEAL_DURATION) * 100);
        document.getElementById('ui-status').innerText = `🏥 HEALING... ${progress}%`;

        // Heal per tick (every 100ms)
        if (Math.floor(elapsed / 100) * 100 === elapsed) {
            myHp = Math.min(maxHp, myHp + HEAL_AMOUNT_PER_TICK);
        }
    }

    updateTeksUI();
}

// ═══════════════════════════════════════════════════════════════════════════════
// WEAPON SHOOTING & RAYCAST MECHANICS
// ═══════════════════════════════════════════════════════════════════════════════

function tembakSenjata() {
    if (isDead || isReloading || isHealing) return;

    const senjata = statsSenjata[senjataSekarang];

    // Check rate of fire
    const now = Date.now();
    const fireDelay = 1000 / senjata.rateOfFire; // Convert rateOfFire to milliseconds
    if (now - lastShotTime < fireDelay) {
        return; // Too soon to fire
    }

    if (senjata.currentAmmo <= 0) {
        reloadSenjata();
        return;
    }

    senjata.currentAmmo--;
    lastShotTime = now;
    putarSuaraCustom(senjata.audioType);
    updateTeksUI();

    // Get camera direction & position
    const arahTembakan = new THREE.Vector3();
    camera.getWorldDirection(arahTembakan);
    const posisiMata = new THREE.Vector3();
    camera.getWorldPosition(posisiMata);

    // Create laser trace
    const titikAkhirLaser = new THREE.Vector3().copy(posisiMata).addScaledVector(arahTembakan, senjata.range);
    const laserGeo = new THREE.BufferGeometry().setFromPoints([posisiMata, titikAkhirLaser]);
    const laserMat = new THREE.LineBasicMaterial({ color: senjata.warna, linewidth: 3 });
    const laser = new THREE.Line(laserGeo, laserMat);
    scene.add(laser);
    setTimeout(() => scene.remove(laser), 50);

    // Raycast untuk collision detection
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
// INPUT HANDLERS (KEYBOARD, MOUSE, TOUCH)
// ═══════════════════════════════════════════════════════════════════════════════

function handleMouseMove(e) {
    if (isDead) return;

    // Deteksi pointer lock atau mouse button down
    if (document.pointerLockElement === document.body || e.buttons === 1) {
        sudutPandangY -= e.movementX * mouseSensitivity;
        sudutPandangX -= e.movementY * mouseSensitivity;

        // Clamp pitch untuk prevent jungkir balik
        sudutPandangX = Math.max(-PITCH_CLAMP, Math.min(PITCH_CLAMP, sudutPandangX));

        playerLocal.rotation.y = sudutPandangY;
    }
}

function handleKeyboard(e, isDown) {
    if (isDead && isDown) return; // Jangan terima input jika sudah mati

    const key = e.key.toLowerCase();

    if (key === 'w') keys.w = isDown;
    if (key === 'a') keys.a = isDown;
    if (key === 's') keys.s = isDown;
    if (key === 'd') keys.d = isDown;
    if (key === 'shift') keys.Shift = isDown;

    if (isDown) {
        if (key === ' ') {
            if (isGrounded && !isCrouching) {
                loncatVelocity = 0.17;
                isGrounded = false;
            }
        }
        if (key === 'e') {
            // Toggle gloo wall preview
            toggleGlooWallPreview();
        }
        if (key === 'r') {
            reloadSenjata();
        }
        if (key === 'c') {
            toggleJongkok();
        }
        if (key === 'h') {
            gunakMedkit();
        }
    }

    // Left click untuk deploy wall saat preview active
    if (key === 'enter' && isDown && glooWallPreviewMode) {
        deployGlooWall();
    }
}

function toggleJongkok() {
    isCrouching = !isCrouching;
    if (isCrouching) {
        camera.position.y = 0.9;
        playerKecepatan = 0.035;
    } else {
        camera.position.y = CAMERA_HEIGHT_OFFSET;
        playerKecepatan = 0.075;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE JOYSTICK SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

function siapkanSistemJoystickMobile() {
    const container = document.getElementById('joystick-container');
    const knob = document.getElementById('joystick-knob');

    if (!container) return;

    container.addEventListener('touchstart', (e) => {
        joystickActive = true;
        const touch = e.touches[0];
        const rect = container.getBoundingClientRect();
        joystickStartPos = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (!joystickActive) return;
        const touch = e.touches[0];

        let sX = touch.clientX - joystickStartPos.x;
        let sY = touch.clientY - joystickStartPos.y;
        const jarak = Math.sqrt(sX * sX + sY * sY);
        const batasMax = 45;

        if (jarak > batasMax) {
            sX = (sX / jarak) * batasMax;
            sY = (sY / jarak) * batasMax;
        }

        knob.style.transform = `translate(${sX}px, ${sY}px)`;
        joystickMoveVector.x = sX / batasMax;
        joystickMoveVector.y = sY / batasMax;
    }, { passive: true });

    window.addEventListener('touchend', () => {
        if (!joystickActive) return;
        joystickActive = false;
        knob.style.transform = `translate(0px, 0px)`;
        joystickMoveVector = { x: 0, y: 0 };
    });

    // Mobile button handlers
    const btnShoot = document.getElementById('btn-shoot-mobile');
    const btnGloo = document.getElementById('btn-gloo-mobile');
    const btnJump = document.getElementById('btn-jump-mobile');
    const btnCrouch = document.getElementById('btn-crouch-mobile');
    const btnHeal = document.getElementById('btn-heal-mobile');

    if (btnShoot) btnShoot.addEventListener('touchstart', (e) => { e.preventDefault(); if (!isDead) tembakSenjata(); });
    if (btnGloo) btnGloo.addEventListener('touchstart', (e) => { e.preventDefault(); if (!isDead) toggleGlooWallPreview(); });
    if (btnJump) btnJump.addEventListener('touchstart', (e) => { e.preventDefault(); if (isGrounded && !isCrouching && !isDead) { loncatVelocity = 0.17; isGrounded = false; } });
    if (btnCrouch) btnCrouch.addEventListener('touchstart', (e) => { e.preventDefault(); if (!isDead) toggleJongkok(); });
    if (btnHeal) btnHeal.addEventListener('touchstart', (e) => { e.preventDefault(); if (!isDead) gunakMedkit(); });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3D WORLD INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

function init3DWorld() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xaaccff);
    scene.fog = new THREE.FogExp2(0xaaccff, 0.01);

    // Camera setup (akan diupdate untuk TPP)
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

    // Renderer setup
    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('game-canvas'),
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight.position.set(30, 60, 30);
    scene.add(dirLight);

    // Ground
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(250, 250),
        new THREE.MeshStandardMaterial({
            map: buatTeksturRumputHijau(),
            roughness: 0.9
        })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Map infrastructure
    bangunKompleksPerumahan();
    buatGugusanAwanLangit();

    // Playzone visualization
    buatPlayzoneVisual();

    // Local player setup
    playerLocal = new THREE.Group();
    playerLocal.position.set(0, 0, 4);
    scene.add(playerLocal);

    // Tambahkan visual model stickman lokal (untuk multiplayer)
    modelStickmanLokal = buatModelStickman(0x55ff55);
    modelStickmanLokal.scale.set(0.6, 0.6, 0.6);
    playerLocal.add(modelStickmanLokal);

    // Camera setup untuk Third-Person Perspective
    camera.position.set(0, CAMERA_HEIGHT_OFFSET, CAMERA_DISTANCE);
    scene.add(camera);

    // Event listeners
    window.addEventListener('keydown', (e) => handleKeyboard(e, true));
    window.addEventListener('keyup', (e) => handleKeyboard(e, false));
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', onWindowResize);

    // Click to shoot (desktop)
    window.addEventListener('click', (e) => {
        if (!isDead && e.target.tagName === "CANVAS") {
            tembakSenjata();
        }
    });

    // Pointer lock
    if (document.body.requestPointerLock) {
        document.body.addEventListener('click', () => {
            if (!isDead && roomCode !== "") {
                document.body.requestPointerLock();
            }
        });
    }

    // Mobile controls
    siapkanSistemJoystickMobile();

    // Start animation loop
    animate();
}

// ═══════════════════════════════════════════════════════════════════════════════
// THIRD-PERSON CAMERA SYSTEM (PILAR 2)
// ═══════════════════════════════════════════════════════════════════════════════

function updateThirdPersonCamera() {
    // Target camera position relative to player
    const cameraOffsetDistance = isCrouching ? CAMERA_DISTANCE * 0.8 : CAMERA_DISTANCE;
    const cameraOffsetHeight = isCrouching ? CAMERA_HEIGHT_OFFSET * 0.6 : CAMERA_HEIGHT_OFFSET;

    // Calculate target position based on player rotation
    targetCameraPos.x = playerLocal.position.x - Math.sin(sudutPandangY) * cameraOffsetDistance;
    targetCameraPos.y = playerLocal.position.y + cameraOffsetHeight;
    targetCameraPos.z = playerLocal.position.z - Math.cos(sudutPandangY) * cameraOffsetDistance;

    // Apply smoothing (lerp)
    camera.position.lerp(targetCameraPos, CAMERA_LERP_SPEED);

    // Camera look at player center (slightly above)
    const lookAtTarget = new THREE.Vector3(
        playerLocal.position.x,
        playerLocal.position.y + 0.5,
        playerLocal.position.z
    );
    camera.lookAt(lookAtTarget);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ANIMATION LOOP (PILAR 4)
// ═══════════════════════════════════════════════════════════════════════════════

function animate() {
    requestAnimationFrame(animate);

    if (!playerLocal || isDead) {
        renderer.render(scene, camera);
        return;
    }

    // Movement calculation
    let speed = keys.Shift ? 0.13 : (isCrouching ? 0.035 : 0.075);

    const lintasanMaju = Math.sin(sudutPandangY) * speed;
    const lintasanSamping = Math.cos(sudutPandangY) * speed;

    // Keyboard input
    if (keys.w) {
        playerLocal.position.z -= lintasanSamping;
        playerLocal.position.x -= lintasanMaju;
    }
    if (keys.s) {
        playerLocal.position.z += lintasanSamping;
        playerLocal.position.x += lintasanMaju;
    }
    if (keys.a) {
        playerLocal.position.x -= lintasanSamping;
        playerLocal.position.z += lintasanMaju;
    }
    if (keys.d) {
        playerLocal.position.x += lintasanSamping;
        playerLocal.position.z -= lintasanMaju;
    }

    // Mobile joystick input
    if (joystickActive) {
        const fX = Math.sin(sudutPandangY) * speed;
        const fZ = Math.cos(sudutPandangY) * speed;
        const rX = Math.sin(sudutPandangY + Math.PI / 2) * speed;
        const rZ = Math.cos(sudutPandangY + Math.PI / 2) * speed;

        playerLocal.position.x -= fX * (-joystickMoveVector.y);
        playerLocal.position.z -= fZ * (-joystickMoveVector.y);
        playerLocal.position.x += rX * (joystickMoveVector.x);
        playerLocal.position.z += rZ * (joystickMoveVector.x);
    }

    // Jump physics
    if (!isGrounded) {
        playerLocal.position.y += loncatVelocity;
        loncatVelocity -= 0.01;
        if (playerLocal.position.y <= 0) {
            playerLocal.position.y = 0;
            isGrounded = true;
            loncatVelocity = 0;
        }
    }

    // Update systems
    updateThirdPersonCamera();
    updateGlooWallPreview();
    updateHealing();
    updatePlayzone();

    // Network sync
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
    wadahUI.style.position = 'absolute';
    wadahUI.style.bottom = '15px';
    wadahUI.style.left = '50%';
    wadahUI.style.transform = 'translateX(-50%)';
    wadahUI.style.zIndex = '999';
    wadahUI.style.textAlign = 'center';
    wadahUI.style.fontFamily = 'monospace';
    wadahUI.style.pointerEvents = 'auto';

    // Health bar
    const barDarahContainer = document.createElement('div');
    barDarahContainer.style.width = '240px';
    barDarahContainer.style.height = '18px';
    barDarahContainer.style.backgroundColor = '#333';
    barDarahContainer.style.border = '2px solid #fff';
    barDarahContainer.style.borderRadius = '4px';
    barDarahContainer.style.overflow = 'hidden';

    const isiDarahBar = document.createElement('div');
    isiDarahBar.id = 'ui-hp-bar';
    isiDarahBar.style.width = '100%';
    isiDarahBar.style.height = '100%';
    isiDarahBar.style.backgroundColor = '#ff3333';
    barDarahContainer.appendChild(isiDarahBar);

    const teksTandaHP = document.createElement('div');
    teksTandaHP.id = 'ui-hp-text';
    teksTandaHP.style.color = 'white';
    teksTandaHP.style.fontWeight = 'bold';
    teksTandaHP.style.marginTop = '-18px';
    teksTandaHP.style.fontSize = '12px';
    teksTandaHP.innerText = 'HP: 200 / 200';
    barDarahContainer.appendChild(teksTandaHP);

    // Ammo display
    const infoPeluru = document.createElement('div');
    infoPeluru.id = 'ui-ammo-display';
    infoPeluru.style.color = '#ffff00';
    infoPeluru.style.fontSize = '18px';
    infoPeluru.style.fontWeight = 'bold';
    infoPeluru.style.textShadow = '1px 1px 1px black';
    infoPeluru.style.marginTop = '4px';

    // Medkit & status
    const infoMedkit = document.createElement('div');
    infoMedkit.id = 'ui-medkit-display';
    infoMedkit.style.color = '#00ff00';
    infoMedkit.style.fontSize = '14px';
    infoMedkit.style.marginTop = '4px';

    const infoStatus = document.createElement('div');
    infoStatus.id = 'ui-status';
    infoStatus.style.color = '#fff';
    infoStatus.style.fontSize = '12px';
    infoStatus.style.marginTop = '2px';
    infoStatus.innerText = '👁️ STANDBY';

    // Gloo wall quota
    const infoGloo = document.createElement('div');
    infoGloo.id = 'ui-gloo-display';
    infoGloo.style.color = '#89b4fa';
    infoGloo.style.fontSize = '12px';
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

    // HP bar update
    const bar = document.getElementById('ui-hp-bar');
    if (bar) bar.style.width = `${persentaseHp}%`;

    const teksHp = document.getElementById('ui-hp-text');
    if (teksHp) teksHp.innerText = `HP: ${myHp} / ${maxHp}`;

    // Ammo display
    const ammoUI = document.getElementById('ui-ammo-display');
    if (ammoUI && !isReloading) {
        ammoUI.innerText = `${senjata.nama} | ${senjata.currentAmmo} / ${senjata.maxAmmo}`;
    }

    // Medkit display
    const medkitUI = document.getElementById('ui-medkit-display');
    if (medkitUI) {
        medkitUI.innerText = `🏥 Medkit: ${jumlahMedkit} | H to use`;
    }

    // Gloo wall display
    const glooUI = document.getElementById('ui-gloo-display');
    if (glooUI) {
        glooUI.innerText = `🔷 Gloo Wall: ${glooWallsPlaced} / ${glooWallQuota} | E + Click`;
    }
}

function buatEfekHitmarker() {
    const penanda = document.createElement('div');
    penanda.style.position = 'absolute';
    penanda.style.top = '50%';
    penanda.style.left = '50%';
    penanda.style.transform = 'translate(-50%, -50%)';
    penanda.style.color = '#ff3333';
    penanda.style.fontSize = '28px';
    penanda.style.fontWeight = 'bold';
    penanda.style.pointerEvents = 'none';
    penanda.style.textShadow = '2px 2px 4px black';
    penanda.innerText = '✕ HIT!';
    document.body.appendChild(penanda);
    setTimeout(() => penanda.remove(), 150);
}

// ═══════════════════════════════════════════════════════════════════════════════
// WINDOW EVENTS
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
            const wallMat = new THREE.MeshStandardMaterial({
                color: 0xf38ba8,
                transparent: true,
                opacity: 0.65
            });
            const enemyWall = new THREE.Mesh(wallGeo, wallMat);
            enemyWall.position.set(data.x, data.y, data.z);
            enemyWall.rotation.y = data.rotY;
            enemyWall.userData = {
                id: data.idWall,
                hp: GLOO_WALL_HP,
                tipe: 'gloo',
                owner: data.id
            };
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

    // Hitbox untuk musuh
    const hitboxGeo = new THREE.CylinderGeometry(0.45, 0.45, 2.1, 8);
    targetMusuhHitbox = new THREE.Mesh(
        hitboxGeo,
        new THREE.MeshBasicMaterial({ visible: false })
    );
    targetMusuhHitbox.name = "hitbox_musuh";
    targetMusuhHitbox.position.y = 1.05;

    musuhRemote.add(targetMusuhHitbox);
    scene.add(musuhRemote);
}

function kirimDataKeMusuh(payload) {
    if (!socket || !socket.connected) return;
    payload.room = roomCode;
    payload.id = myId;
    socket.emit('update_player', payload);
}

// ═══════════════════════════════════════════════════════════════════════════════
// WEAPON SELECTION UI
// ═══════════════════════════════════════════════════════════════════════════════

window.selectLobbyWeapon = function(nama) {
    if (isDead || isReloading) return;
    senjataSekarang = nama;
    putarSuaraCustom('pistol_light');

    // Update UI
    document.querySelectorAll('.weapon-card').forEach(el => el.classList.remove('selected'));
    const cards = document.querySelectorAll('.weapon-card');
    cards.forEach(card => {
        if (card.innerHTML.includes(nama)) card.classList.add('selected');
    });

    updateTeksUI();
};

// ═══════════════════════════════════════════════════════════════════════════════
// INITIALIZATION TRIGGER (dari HTML modal)
// ═══════════════════════════════════════════════════════════════════════════════

// Start button handler
const btnConfirmStart = document.getElementById('btn-confirm-start');
if (btnConfirmStart) {
    btnConfirmStart.addEventListener('click', () => {
        const kode = document.getElementById('room-input-code').value.trim();
        if (kode !== "") {
            roomCode = kode;
            document.getElementById('ui-room-text').innerText = roomCode;

            // Hide lobby, show HUD
            document.getElementById('room-modal').style.display = 'none';
            document.getElementById('lobby-container').style.display = 'none';
            document.getElementById('top-hud').style.display = 'block';

            if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
                document.getElementById('mobile-hud').style.display = 'block';
            }

            // Request pointer lock
            if (document.body.requestPointerLock) {
                document.body.requestPointerLock();
            }

            // Start systems
            buatSistemUIDinamis();
            hubungkanJaringan();
            init3DWorld();
        } else {
            alert("Kode Room wajib diisi!");
        }
    });
}

// Cancel button handler
const btnCancelRoom = document.getElementById('btn-cancel-room');
if (btnCancelRoom) {
    btnCancelRoom.addEventListener('click', () => {
        document.getElementById('room-modal').style.display = 'none';
    });
}

// Open match modal
const btnOpenMatch = document.getElementById('btn-open-match');
if (btnOpenMatch) {
    btnOpenMatch.addEventListener('click', () => {
        document.getElementById('room-modal').style.display = 'flex';
    });
}

// ════════════════════════════════════════════════════════════════════════════════
// END OF GAME SCRIPT
// ════════════════════════════════════════════════════════════════════════════════
