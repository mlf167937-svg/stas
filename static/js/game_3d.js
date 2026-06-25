let scene, camera, renderer, socket;
let roomCode = "";
let myId = Math.random().toString(36).substring(7);
let playerLocal, musuhRemote, modelStickmanLokal, targetMusuhHitbox;

// ─── 10 SENJATA TAKTIS ───────────────────────────────────────────────────────
const statsSenjata = {
    M1887: { nama: "M1887", damage: 120, maxAmmo: 2, currentAmmo: 2, reloadTime: 2200, range: 18, warna: 0xff3333, audioType: 'shotgun_dual', rateOfFire: 0.8 },
    SPAS12: { nama: "SPAS12", damage: 85, maxAmmo: 6, currentAmmo: 6, reloadTime: 2500, range: 19, warna: 0xcc2222, audioType: 'shotgun_auto', rateOfFire: 1.2 },
    MP40: { nama: "MP40", damage: 28, maxAmmo: 32, currentAmmo: 32, reloadTime: 1800, range: 35, warna: 0xffff33, audioType: 'smg_fast', rateOfFire: 3.5 },
    M1014: { nama: "M1014", damage: 90, maxAmmo: 6, currentAmmo: 6, reloadTime: 2800, range: 16, warna: 0xffaa00, audioType: 'shotgun_pump', rateOfFire: 0.9 },
    AK47: { nama: "AK47", damage: 42, maxAmmo: 30, currentAmmo: 30, reloadTime: 2400, range: 55, warna: 0xff5555, audioType: 'rifle_heavy', rateOfFire: 2.0 },
    SCAR: { nama: "SCAR", damage: 35, maxAmmo: 30, currentAmmo: 30, reloadTime: 2100, range: 60, warna: 0x88ff88, audioType: 'rifle_stable', rateOfFire: 2.2 },
    AWM: { nama: "AWM", damage: 200, maxAmmo: 5, currentAmmo: 5, reloadTime: 3500, range: 120, warna: 0xff00ff, audioType: 'sniper_heavy', rateOfFire: 0.4 },
    DESERT_EAGLE: { nama: "DEAGLE", damage: 55, maxAmmo: 7, currentAmmo: 7, reloadTime: 1400, range: 40, warna: 0x003366, audioType: 'pistol_heavy', rateOfFire: 1.0 },
    USP: { nama: "USP", damage: 15, maxAmmo: 12, currentAmmo: 12, reloadTime: 900, range: 28, warna: 0x3366ff, audioType: 'pistol_light', rateOfFire: 2.5 },
    UMP: { nama: "UMP", damage: 32, maxAmmo: 30, currentAmmo: 30, reloadTime: 1900, range: 45, warna: 0x00ffff, audioType: 'smg_tactical', rateOfFire: 2.8 }
};

let senjataSekarang = "M1887";
let lastShotTime = 0;

// ─── STATUS GAMEPLAY ─────────────────────────────────────────────────────────
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

// ─── KAMERA TPP & KONTROL ────────────────────────────────────────────────────
const CAMERA_DISTANCE = 3.5;      
const CAMERA_HEIGHT_OFFSET = 1.8; 
let sudutPandangY = 0;            
let sudutPandangX = 0;            
const PITCH_CLAMP = Math.PI / 2.2; 
const CAMERA_LERP_SPEED = 0.12;
let targetCameraPos = new THREE.Vector3();

let keys = { w: false, a: false, s: false, d: false, Shift: false, space: false };
let playerKecepatan = 0.08;
let loncatVelocity = 0;
let isGrounded = true;
let mouseSensitivity = 0.003;

// ─── JOYSTICK MOBILE ─────────────────────────────────────────────────────────
let joystickActive = false;
let joystickStartPos = { x: 0, y: 0 };
let joystickMoveVector = { x: 0, y: 0 };

// ─── GLOO WALL MATRIX PREVIEW ────────────────────────────────────────────────
let glooWallPreviewMode = false;
let glooWallPreview = null;
let glooWallQuota = 5; 
let glooWallsPlaced = 0;
let daftarGlooWall = [];
let daftarBangunanRintangan = [];

// ─── PLAYZONE (ZONA AMAN) ────────────────────────────────────────────────────
let playzoneRadius = 80;
let playzoneCenter = new THREE.Vector3(0, 0, 0);
let playzoneLastShrinkTime = 0;
const PLAYZONE_SHRINK_INTERVAL = 45000;
const PLAYZONE_SHRINK_AMOUNT = 15;     
const PLAYZONE_DAMAGE_PER_TICK = 2;    
let playzoneVisual = null;

// ─── AUDIO SYNTHESIZER ───────────────────────────────────────────────────────
let audioCtx = null;
function putarSuaraCustom(tipe) {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode); gainNode.connect(audioCtx.destination);
        const skrg = audioCtx.currentTime;

        if (tipe === 'shotgun_dual') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(100, skrg); osc.frequency.exponentialRampToValueAtTime(25, skrg + 0.4); gainNode.gain.setValueAtTime(0.7, skrg); gainNode.gain.linearRampToValueAtTime(0.01, skrg + 0.4); osc.start(skrg); osc.stop(skrg + 0.4); } 
        else if (tipe === 'shotgun_auto') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(110, skrg); osc.frequency.exponentialRampToValueAtTime(35, skrg + 0.2); gainNode.gain.setValueAtTime(0.6, skrg); gainNode.gain.linearRampToValueAtTime(0.01, skrg + 0.2); osc.start(skrg); osc.stop(skrg + 0.2); }
        else if (tipe === 'smg_fast') { osc.type = 'triangle'; osc.frequency.setValueAtTime(380, skrg); gainNode.gain.setValueAtTime(0.35, skrg); gainNode.gain.linearRampToValueAtTime(0.01, skrg + 0.06); osc.start(skrg); osc.stop(skrg + 0.06); }
        else if (tipe === 'shotgun_pump') { osc.type = 'square'; osc.frequency.setValueAtTime(95, skrg); osc.frequency.exponentialRampToValueAtTime(40, skrg + 0.35); gainNode.gain.setValueAtTime(0.65, skrg); gainNode.gain.linearRampToValueAtTime(0.01, skrg + 0.35); osc.start(skrg); osc.stop(skrg + 0.35); }
        else if (tipe === 'rifle_heavy') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(180, skrg); osc.frequency.exponentialRampToValueAtTime(50, skrg + 0.15); gainNode.gain.setValueAtTime(0.5, skrg); gainNode.gain.linearRampToValueAtTime(0.01, skrg + 0.15); osc.start(skrg); osc.stop(skrg + 0.15); }
        else if (tipe === 'rifle_stable') { osc.type = 'sine'; osc.frequency.setValueAtTime(250, skrg); osc.frequency.linearRampToValueAtTime(150, skrg + 0.12); gainNode.gain.setValueAtTime(0.4, skrg); gainNode.gain.linearRampToValueAtTime(0.01, skrg + 0.12); osc.start(skrg); osc.stop(skrg + 0.12); }
        else if (tipe === 'sniper_heavy') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, skrg); osc.frequency.exponentialRampToValueAtTime(30, skrg + 0.5); gainNode.gain.setValueAtTime(0.8, skrg); gainNode.gain.linearRampToValueAtTime(0.01, skrg + 0.5); osc.start(skrg); osc.stop(skrg + 0.5); }
        else if (tipe === 'pistol_heavy') { osc.type = 'square'; osc.frequency.setValueAtTime(520, skrg); gainNode.gain.setValueAtTime(0.35, skrg); gainNode.gain.linearRampToValueAtTime(0.01, skrg + 0.1); osc.start(skrg); osc.stop(skrg + 0.1); }
        else if (tipe === 'pistol_light') { osc.type = 'sine'; osc.frequency.setValueAtTime(480, skrg); gainNode.gain.setValueAtTime(0.2, skrg); gainNode.gain.linearRampToValueAtTime(0.01, skrg + 0.06); osc.start(skrg); osc.stop(skrg + 0.06); }
        else if (tipe === 'smg_tactical') { osc.type = 'triangle'; osc.frequency.setValueAtTime(340, skrg); gainNode.gain.setValueAtTime(0.3, skrg); gainNode.gain.linearRampToValueAtTime(0.01, skrg + 0.08); osc.start(skrg); osc.stop(skrg + 0.08); }
        else if (tipe === 'gloo') { osc.type = 'sine'; osc.frequency.setValueAtTime(140, skrg); osc.frequency.exponentialRampToValueAtTime(320, skrg + 0.25); gainNode.gain.setValueAtTime(0.5, skrg); gainNode.gain.linearRampToValueAtTime(0.01, skrg + 0.25); osc.start(skrg); osc.stop(skrg + 0.25); }
        else if (tipe === 'heal') { osc.type = 'sine'; osc.frequency.setValueAtTime(520, skrg); osc.frequency.linearRampToValueAtTime(720, skrg + 0.3); gainNode.gain.setValueAtTime(0.3, skrg); gainNode.gain.linearRampToValueAtTime(0.01, skrg + 0.3); osc.start(skrg); osc.stop(skrg + 0.3); }
        else if (tipe === 'hit') { osc.type = 'square'; osc.frequency.setValueAtTime(800, skrg); gainNode.gain.setValueAtTime(0.25, skrg); gainNode.gain.linearRampToValueAtTime(0.01, skrg + 0.08); osc.start(skrg); osc.stop(skrg + 0.08); }
    } catch (e) {}
}

// ─── PROCEDURAL MAP GENERATOR ────────────────────────────────────────────────
function buatTeksturRumputHijau() {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#348c31'; ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#2d7a2a'; ctx.lineWidth = 2;
    for (let x = 0; x <= 512; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, x); ctx.lineTo(512, x); ctx.stroke(); }
    for (let i = 0; i < 1500; i++) { ctx.fillStyle = Math.random() > 0.5 ? '#40a33c' : '#296e27'; ctx.fillRect(Math.random() * 512, Math.random() * 512, 4, 4); }
    const texture = new THREE.CanvasTexture(canvas); texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(25, 25);
    return texture;
}

function bangunKompleksPerumahan() {
    const lokasiRumah = [
        { x: 10, z: -15, w: 6, h: 4, d: 8, col: 0xbf616a }, { x: -18, z: -10, w: 8, h: 5, d: 6, col: 0xd08770 },
        { x: 15, z: 20, w: 7, h: 4, d: 7, col: 0xebcb8b }, { x: -12, z: 25, w: 6, h: 4, d: 6, col: 0xa3be8c },
        { x: 25, z: -5, w: 5, h: 3, d: 5, col: 0x8fbcbb }, { x: -25, z: 15, w: 7, h: 4, d: 8, col: 0xb48ead }
    ];
    lokasiRumah.forEach(r => {
        const rumah = new THREE.Mesh(new THREE.BoxGeometry(r.w, r.h, r.d), new THREE.MeshStandardMaterial({ color: r.col, roughness: 0.6 }));
        rumah.position.set(r.x, r.h / 2, r.z); rumah.userData = { tipe: 'bangunan' }; scene.add(rumah); daftarBangunanRintangan.push(rumah);
    });
}

function buatGugusanAwanLangit() {
    for (let i = 0; i < 20; i++) {
        const cloudGroup = new THREE.Group();
        for (let j = 0; j < (3 + Math.floor(Math.random() * 4)); j++) {
            const gumpalan = new THREE.Mesh(new THREE.SphereGeometry(2 + Math.random() * 2, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 }));
            gumpalan.position.set(j * 2, Math.random() * 1, Math.random() * 2); cloudGroup.add(gumpalan);
        }
        cloudGroup.position.set((Math.random() - 0.5) * 160, 25 + Math.random() * 10, (Math.random() - 0.5) * 160); scene.add(cloudGroup);
    }
}

// ─── STICKMAN 3D GENERATOR ───────────────────────────────────────────────────
function buatModelStickman(warnaKulit) {
    const grupKarakter = new THREE.Group();
    const matKarakter = new THREE.MeshStandardMaterial({ color: warnaKulit, roughness: 0.7 });
    const kepala = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), matKarakter); kepala.position.y = 1.7; grupKarakter.add(kepala);
    const badan = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8), matKarakter); badan.position.y = 1.1; grupKarakter.add(badan);
    const kakiKiri = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8), matKarakter); kakiKiri.position.set(-0.15, 0.35, 0); const kakiKanan = kakiKiri.clone(); kakiKanan.position.x = 0.15; grupKarakter.add(kakiKiri, kakiKanan);
    const tanganKiri = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8), matKarakter); tanganKiri.position.set(-0.25, 1.1, 0); tanganKiri.rotation.z = Math.PI / 12; const tanganKanan = tanganKiri.clone(); tanganKanan.position.x = 0.25; tanganKanan.rotation.z = -Math.PI / 12; grupKarakter.add(tanganKiri, tanganKanan);
    return grupKarakter;
}

// ─── PLAYZONE VISUAL ─────────────────────────────────────────────────────────
function buatPlayzoneVisual() {
    playzoneVisual = new THREE.Mesh(new THREE.CircleGeometry(playzoneRadius, 64), new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.1, side: THREE.DoubleSide }));
    playzoneVisual.position.set(playzoneCenter.x, 0.05, playzoneCenter.z); playzoneVisual.rotation.x = -Math.PI / 2; scene.add(playzoneVisual);
}

function updatePlayzone() {
    if(isDead) return;
    const now = Date.now();
    if (now - playzoneLastShrinkTime > PLAYZONE_SHRINK_INTERVAL) {
        playzoneLastShrinkTime = now; playzoneRadius = Math.max(10, playzoneRadius - PLAYZONE_SHRINK_AMOUNT);
        if (playzoneVisual) scene.remove(playzoneVisual);
        buatPlayzoneVisual();
    }
    const dist = Math.sqrt(Math.pow(playerLocal.position.x - playzoneCenter.x, 2) + Math.pow(playerLocal.position.z - playzoneCenter.z, 2));
    if (dist > playzoneRadius) terimaDamagePenyakit(PLAYZONE_DAMAGE_PER_TICK);
}

// ─── GLOO WALL MATRIX PREVIEW ────────────────────────────────────────────────
function toggleGlooWallPreview() {
    if (isDead || glooWallsPlaced >= glooWallQuota) return;
    glooWallPreviewMode = !glooWallPreviewMode;
    if (glooWallPreviewMode) {
        if (glooWallPreview) scene.remove(glooWallPreview);
        const depanX = playerLocal.position.x - Math.sin(sudutPandangY) * 2.6; const depanZ = playerLocal.position.z - Math.cos(sudutPandangY) * 2.6;
        glooWallPreview = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.2, 0.35), new THREE.MeshStandardMaterial({ color: 0x89b4fa, transparent: true, opacity: 0.4, roughness: 0.2 }));
        glooWallPreview.position.set(depanX, 1.1, depanZ); glooWallPreview.rotation.y = sudutPandangY; glooWallPreview.userData = { tipe: 'preview' };
        scene.add(glooWallPreview);
    } else {
        if (glooWallPreview) { scene.remove(glooWallPreview); glooWallPreview = null; }
    }
}

function updateGlooWallPreview() {
    if (!glooWallPreviewMode || !glooWallPreview) return;
    glooWallPreview.position.set(playerLocal.position.x - Math.sin(sudutPandangY) * 2.6, 1.1, playerLocal.position.z - Math.cos(sudutPandangY) * 2.6);
    glooWallPreview.rotation.y = sudutPandangY;
}

function deployGlooWall() {
    if (!glooWallPreviewMode || !glooWallPreview || isDead) return;
    putarSuaraCustom('gloo');
    const wallId = Math.random().toString(36).substring(5);
    const glooWall = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.2, 0.35), new THREE.MeshStandardMaterial({ color: 0x89b4fa, transparent: true, opacity: 0.8, roughness: 0.2 }));
    glooWall.position.copy(glooWallPreview.position); glooWall.rotation.y = glooWallPreview.rotation.y;
    glooWall.userData = { id: wallId, hp: 300, tipe: 'gloo', owner: myId };
    scene.add(glooWall); daftarGlooWall.push(glooWall); glooWallsPlaced++;

    kirimDataKeMusuh({ aksi: 'gloo', idWall: wallId, x: glooWall.position.x, y: glooWall.position.y, z: glooWall.position.z, rotY: glooWall.rotation.y });
    glooWallPreviewMode = false; scene.remove(glooWallPreview); glooWallPreview = null; updateTeksUI();
}

// ─── MEDKIT & HEALING ────────────────────────────────────────────────────────
function gunakMedkit() {
    if (isDead || isHealing || jumlahMedkit <= 0 || myHp >= maxHp) return;
    isHealing = true; healStartTime = Date.now(); putarSuaraCustom('heal'); jumlahMedkit--;
    document.getElementById('ui-status').innerText = "🏥 HEALING... (3s)";
}

function updateHealing() {
    if (!isHealing) return;
    const elapsed = Date.now() - healStartTime;
    if (elapsed >= HEAL_DURATION) { isHealing = false; document.getElementById('ui-status').innerText = "👁️ STANDBY"; } 
    else {
        document.getElementById('ui-status').innerText = `🏥 HEALING... ${Math.floor((elapsed / HEAL_DURATION) * 100)}%`;
        if (Math.floor(elapsed / 100) * 100 === elapsed) myHp = Math.min(maxHp, myHp + HEAL_AMOUNT_PER_TICK);
    }
    updateTeksUI();
}

// ─── WEAPON SHOOTING (RAYCASTER) ─────────────────────────────────────────────
function tembakSenjata() {
    if (isDead || isReloading || isHealing) return;
    const senjata = statsSenjata[senjataSekarang];
    const now = Date.now();
    if (now - lastShotTime < (1000 / senjata.rateOfFire)) return;
    if (senjata.currentAmmo <= 0) { reloadSenjata(); return; }

    senjata.currentAmmo--; lastShotTime = now; putarSuaraCustom(senjata.audioType); updateTeksUI();

    const arahTembakan = new THREE.Vector3(); camera.getWorldDirection(arahTembakan);
    const posisiMata = new THREE.Vector3(); camera.getWorldPosition(posisiMata);

    const titikAkhirLaser = new THREE.Vector3().copy(posisiMata).addScaledVector(arahTembakan, senjata.range);
    const laser = new THREE.Line(new THREE.BufferGeometry().setFromPoints([posisiMata, titikAkhirLaser]), new THREE.LineBasicMaterial({ color: senjata.warna, linewidth: 3 }));
    scene.add(laser); setTimeout(() => scene.remove(laser), 50);

    const raycaster = new THREE.Raycaster(posisiMata, arahTembakan, 0, senjata.range);
    let targetDaftar = [...daftarGlooWall, ...daftarBangunanRintangan];
    if (targetMusuhHitbox) targetDaftar.push(targetMusuhHitbox);

    const hasilSenggolan = raycaster.intersectObjects(targetDaftar);
    if (hasilSenggolan.length > 0) {
        const targetKena = hasilSenggolan[0].object;
        if (targetKena.userData && targetKena.userData.tipe === 'gloo') {
            targetKena.userData.hp -= senjata.damage;
            kirimDataKeMusuh({ aksi: 'gloo_hit', idWall: targetKena.userData.id, dmg: senjata.damage });
            if (targetKena.userData.hp <= 0) { const idx = daftarGlooWall.indexOf(targetKena); if(idx!==-1){scene.remove(targetKena); daftarGlooWall.splice(idx,1);} }
        } else if (targetKena.name === "hitbox_musuh") {
            kirimDataKeMusuh({ aksi: 'berikan_damage', besarDamage: senjata.damage });
            buatEfekHitmarker(); putarSuaraCustom('hit');
        }
    }
}

function reloadSenjata() {
    const senjata = statsSenjata[senjataSekarang];
    if (isReloading || senjata.currentAmmo === senjata.maxAmmo) return;
    isReloading = true; document.getElementById('ui-ammo-display').innerText = "⚙️ RELOADING...";
    setTimeout(() => { senjata.currentAmmo = senjata.maxAmmo; isReloading = false; updateTeksUI(); }, senjata.reloadTime);
}

function terimaDamagePenyakit(besarDamage) {
    if (isDead) return;
    myHp = Math.max(0, myHp - besarDamage); updateTeksUI();
    if (myHp <= 0) {
        isDead = true; document.getElementById('ui-status').innerText = "🔴 TERELIMINASI";
        document.getElementById('ui-ammo-display').innerText = "Refresh browser untuk balas dendam!";
        kirimDataKeMusuh({ aksi: 'mati_total' });
    }
}

// ─── INPUT (MOUSE, KEYBOARD, TOUCH) ──────────────────────────────────────────
function handleMouseMove(e) {
    if (isDead) return;
    if (document.pointerLockElement === document.body || e.buttons === 1) {
        sudutPandangY -= e.movementX * mouseSensitivity;
        sudutPandangX -= e.movementY * mouseSensitivity;
        sudutPandangX = Math.max(-PITCH_CLAMP, Math.min(PITCH_CLAMP, sudutPandangX));
        playerLocal.rotation.y = sudutPandangY;
    }
}

function handleKeyboard(e, isDown) {
    if (isDead && isDown) return;
    const key = e.key.toLowerCase();
    if (key === 'w') keys.w = isDown; if (key === 'a') keys.a = isDown;
    if (key === 's') keys.s = isDown; if (key === 'd') keys.d = isDown;
    if (key === 'shift') keys.Shift = isDown;

    if (isDown) {
        if (key === ' ' && isGrounded && !isCrouching) { loncatVelocity = 0.17; isGrounded = false; }
        if (key === 'e') toggleGlooWallPreview();
        if (key === 'r') reloadSenjata();
        if (key === 'c') toggleJongkok();
        if (key === 'h') gunakMedkit();
    }
    if (key === 'enter' && isDown && glooWallPreviewMode) deployGlooWall();
}

function toggleJongkok() {
    isCrouching = !isCrouching;
    if (isCrouching) { playerKecepatan = 0.035; } else { playerKecepatan = 0.075; }
}

function siapkanSistemJoystickMobile() {
    const container = document.getElementById('joystick-container'); const knob = document.getElementById('joystick-knob');
    if (!container) return;
    container.addEventListener('touchstart', (e) => {
        joystickActive = true; const rect = container.getBoundingClientRect();
        joystickStartPos = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }, { passive: true });
    window.addEventListener('touchmove', (e) => {
        if (!joystickActive) return;
        let sX = e.touches[0].clientX - joystickStartPos.x; let sY = e.touches[0].clientY - joystickStartPos.y;
        const jarak = Math.sqrt(sX * sX + sY * sY); const batasMax = 45;
        if (jarak > batasMax) { sX = (sX / jarak) * batasMax; sY = (sY / jarak) * batasMax; }
        knob.style.transform = `translate(${sX}px, ${sY}px)`;
        joystickMoveVector.x = sX / batasMax; joystickMoveVector.y = sY / batasMax;
    }, { passive: true });
    window.addEventListener('touchend', () => { if (!joystickActive) return; joystickActive = false; knob.style.transform = `translate(0px, 0px)`; joystickMoveVector = { x: 0, y: 0 }; });

    // Pemicu Aksi Tombol Mobile Layar HP
    const binds = [
        ['btn-shoot-mobile', () => { if(!isDead && glooWallPreviewMode) deployGlooWall(); else if(!isDead) tembakSenjata(); }],
        ['btn-gloo-mobile', () => { if(!isDead) toggleGlooWallPreview(); }],
        ['btn-jump-mobile', () => { if (isGrounded && !isCrouching && !isDead) { loncatVelocity = 0.17; isGrounded = false; } }],
        ['btn-crouch-mobile', () => { if(!isDead) toggleJongkok(); }],
        ['btn-heal-mobile', () => { if(!isDead) gunakMedkit(); }]
    ];
    binds.forEach(([id, fn]) => { const el = document.getElementById(id); if (el) el.addEventListener('touchstart', (e) => { e.preventDefault(); fn(); }); });
}

// ─── 3D ENGINE (THREE.JS) INIT & ANIMATE ─────────────────────────────────────
function init3DWorld() {
    scene = new THREE.Scene(); scene.background = new THREE.Color(0xaaccff); scene.fog = new THREE.FogExp2(0xaaccff, 0.01);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight); renderer.setPixelRatio(window.devicePixelRatio);

    scene.add(new THREE.AmbientLight(0xffffff, 0.75)); const dirLight = new THREE.DirectionalLight(0xffffff, 0.7); dirLight.position.set(30, 60, 30); scene.add(dirLight);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(250, 250), new THREE.MeshStandardMaterial({ map: buatTeksturRumputHijau(), roughness: 0.9 }));
    ground.rotation.x = -Math.PI / 2; scene.add(ground);

    bangunKompleksPerumahan(); buatGugusanAwanLangit(); buatPlayzoneVisual(); playzoneLastShrinkTime = Date.now();

    playerLocal = new THREE.Group(); playerLocal.position.set(0, 0, 4); scene.add(playerLocal);
    modelStickmanLokal = buatModelStickman(0x55ff55); modelStickmanLokal.scale.set(0.6, 0.6, 0.6); playerLocal.add(modelStickmanLokal);
    
    // TPP Camera init
    camera.position.set(0, CAMERA_HEIGHT_OFFSET, CAMERA_DISTANCE); scene.add(camera);

    window.addEventListener('keydown', (e) => handleKeyboard(e, true)); window.addEventListener('keyup', (e) => handleKeyboard(e, false));
    window.addEventListener('mousemove', handleMouseMove); window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });
    window.addEventListener('mousedown', (e) => { if (!isDead && e.target.tagName === "CANVAS") { if(glooWallPreviewMode) deployGlooWall(); else tembakSenjata(); } });

    if (document.body.requestPointerLock) { document.body.addEventListener('click', () => { if (!isDead && roomCode !== "") document.body.requestPointerLock(); }); }
    siapkanSistemJoystickMobile(); animate();
}

function updateThirdPersonCamera() {
    const camDist = isCrouching ? CAMERA_DISTANCE * 0.8 : CAMERA_DISTANCE;
    const camHeight = isCrouching ? CAMERA_HEIGHT_OFFSET * 0.6 : CAMERA_HEIGHT_OFFSET;
    targetCameraPos.x = playerLocal.position.x - Math.sin(sudutPandangY) * camDist;
    targetCameraPos.y = playerLocal.position.y + camHeight;
    targetCameraPos.z = playerLocal.position.z - Math.cos(sudutPandangY) * camDist;
    
    camera.position.lerp(targetCameraPos, CAMERA_LERP_SPEED);
    camera.lookAt(new THREE.Vector3(playerLocal.position.x, playerLocal.position.y + 0.5, playerLocal.position.z));
}

function animate() {
    requestAnimationFrame(animate);
    if (!playerLocal || isDead) { renderer.render(scene, camera); return; }

    let speed = keys.Shift ? 0.13 : (isCrouching ? 0.035 : 0.075);
    const lintasanMaju = Math.sin(sudutPandangY) * speed; const lintasanSamping = Math.cos(sudutPandangY) * speed;

    if (keys.w) { playerLocal.position.z -= lintasanSamping; playerLocal.position.x -= lintasanMaju; }
    if (keys.s) { playerLocal.position.z += lintasanSamping; playerLocal.position.x += lintasanMaju; }
    if (keys.a) { playerLocal.position.x -= lintasanSamping; playerLocal.position.z += lintasanMaju; }
    if (keys.d) { playerLocal.position.x += lintasanSamping; playerLocal.position.z -= lintasanMaju; }

    if (joystickActive) {
        const fX = Math.sin(sudutPandangY) * speed; const fZ = Math.cos(sudutPandangY) * speed;
        const rX = Math.sin(sudutPandangY + Math.PI / 2) * speed; const rZ = Math.cos(sudutPandangY + Math.PI / 2) * speed;
        playerLocal.position.x -= fX * (-joystickMoveVector.y); playerLocal.position.z -= fZ * (-joystickMoveVector.y);
        playerLocal.position.x += rX * (joystickMoveVector.x); playerLocal.position.z += rZ * (joystickMoveVector.x);
    }

    if (!isGrounded) {
        playerLocal.position.y += loncatVelocity; loncatVelocity -= 0.01;
        if (playerLocal.position.y <= 0) { playerLocal.position.y = 0; isGrounded = true; loncatVelocity = 0; }
    }

    updateThirdPersonCamera(); updateGlooWallPreview(); updateHealing(); updatePlayzone();

    if (roomCode !== "" && socket && socket.connected) {
        kirimDataKeMusuh({ aksi: 'gerak', x: playerLocal.position.x, y: playerLocal.position.y, z: playerLocal.position.z, rotY: sudutPandangY });
    }
    renderer.render(scene, camera);
}

// ─── NETWORKING SOCKET.IO ────────────────────────────────────────────────────
function hubungkanJaringan() {
    socket = io();
    socket.on('connect', () => { socket.emit('join_game', { room: roomCode, id: myId, username: "Player STAS" }); document.getElementById('ui-status').innerText = "🔍 Mencari Musuh..."; });
    socket.on('player_joined', () => { document.getElementById('ui-status').innerText = "⚔️ Bertarung Dimulai!"; buatKarakterMusuh(); });
    socket.on('player_updated', (data) => {
        if (data.aksi === 'gerak') { if (!musuhRemote) buatKarakterMusuh(); if (musuhRemote) { musuhRemote.position.set(data.x, data.y, data.z); musuhRemote.rotation.y = data.rotY; } }
        else if (data.aksi === 'gloo') {
            const enemyWall = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.2, 0.35), new THREE.MeshStandardMaterial({ color: 0xf38ba8, transparent: true, opacity: 0.65 }));
            enemyWall.position.set(data.x, data.y, data.z); enemyWall.rotation.y = data.rotY; enemyWall.userData = { id: data.idWall, hp: 300, tipe: 'gloo' };
            scene.add(enemyWall); daftarGlooWall.push(enemyWall);
        }
        else if (data.aksi === 'gloo_hit') { const tw = daftarGlooWall.find(w => w.userData.id === data.idWall); if (tw) { tw.userData.hp -= data.dmg; if (tw.userData.hp <= 0) hancurkanGlooWall(data.idWall); } }
        else if (data.aksi === 'berikan_damage') { terimaDamagePenyakit(data.besarDamage); }
        else if (data.aksi === 'mati_total') { document.getElementById('ui-status').innerText = "👑 BOOYAH! VICTORY!"; if (musuhRemote) scene.remove(musuhRemote); }
    });
}

function buatKarakterMusuh() {
    if (musuhRemote) return;
    musuhRemote = buatModelStickman(0xff5555); musuhRemote.position.set(0, 0, -10); musuhRemote.scale.set(0.6, 0.6, 0.6);
    targetMusuhHitbox = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 2.1, 8), new THREE.MeshBasicMaterial({ visible: false }));
    targetMusuhHitbox.name = "hitbox_musuh"; targetMusuhHitbox.position.y = 1.05; musuhRemote.add(targetMusuhHitbox); scene.add(musuhRemote);
}

function kirimDataKeMusuh(payload) { if (!socket || !socket.connected) return; payload.room = roomCode; payload.id = myId; socket.emit('update_player', payload); }

// ─── COMPONENT UI HUD MANAGER ────────────────────────────────────────────────
function buatSistemUIDinamis() {
    const wadahUI = document.createElement('div'); wadahUI.style.position = 'absolute'; wadahUI.style.bottom = '15px'; wadahUI.style.left = '50%'; wadahUI.style.transform = 'translateX(-50%)'; wadahUI.style.zIndex = '999'; wadahUI.style.textAlign = 'center'; wadahUI.style.fontFamily = 'monospace'; wadahUI.style.pointerEvents = 'none';
    const barContainer = document.createElement('div'); barContainer.style.width = '240px'; barContainer.style.height = '18px'; barContainer.style.backgroundColor = '#333'; barContainer.style.border = '2px solid #fff'; barContainer.style.borderRadius = '4px'; barContainer.style.overflow = 'hidden';
    const isiDarahBar = document.createElement('div'); isiDarahBar.id = 'ui-hp-bar'; isiDarahBar.style.width = '100%'; isiDarahBar.style.height = '100%'; isiDarahBar.style.backgroundColor = '#ff3333'; barContainer.appendChild(isiDarahBar);
    const teksTandaHP = document.createElement('div'); teksTandaHP.id = 'ui-hp-text'; teksTandaHP.style.color = 'white'; teksTandaHP.style.fontWeight = 'bold'; teksTandaHP.style.marginTop = '-18px'; teksTandaHP.style.fontSize = '12px'; barContainer.appendChild(teksTandaHP);
    const infoPeluru = document.createElement('div'); infoPeluru.id = 'ui-ammo-display'; infoPeluru.style.color = '#ffff00'; infoPeluru.style.fontSize = '18px'; infoPeluru.style.fontWeight = 'bold'; infoPeluru.style.textShadow = '1px 1px 1px black'; infoPeluru.style.marginTop = '4px';
    const infoMedkit = document.createElement('div'); infoMedkit.id = 'ui-medkit-display'; infoMedkit.style.color = '#00ff00'; infoMedkit.style.fontSize = '14px'; infoMedkit.style.marginTop = '4px';
    wadahUI.appendChild(barContainer); wadahUI.appendChild(infoPeluru); wadahUI.appendChild(infoMedkit); document.body.appendChild(wadahUI);
    
    document.getElementById('crosshair').style.display = 'block'; // Tampilkan crosshair kekeran
    updateTeksUI();
}

function updateTeksUI() {
    const senjata = statsSenjata[senjataSekarang];
    const bar = document.getElementById('ui-hp-bar'); if (bar) bar.style.width = `${(myHp / maxHp) * 100}%`;
    const teksHp = document.getElementById('ui-hp-text'); if (teksHp) teksHp.innerText = `HP: ${myHp} / ${maxHp}`;
    const ammoUI = document.getElementById('ui-ammo-display'); if (ammoUI && !isReloading) ammoUI.innerText = `${senjata.nama} | ${senjata.currentAmmo} / ${senjata.maxAmmo}`;
    const medkitUI = document.getElementById('ui-medkit-display'); if (medkitUI) medkitUI.innerText = `🏥 Medkit: ${jumlahMedkit} | H`;
}

window.selectLobbyWeapon = function(nama) {
    if (isDead || isReloading) return;
    senjataSekarang = nama; putarSuaraCustom('pistol_light');
    document.querySelectorAll('.weapon-card').forEach(el => el.classList.remove('selected'));
    document.querySelectorAll('.weapon-card').forEach(card => { if (card.innerHTML.includes(nama)) card.classList.add('selected'); });
};

// ─── START LOBBY BINDING ─────────────────────────────────────────────────────
document.getElementById('btn-open-match').addEventListener('click', () => { document.getElementById('room-modal').style.display = 'flex'; });
document.getElementById('btn-cancel-room').addEventListener('click', () => { document.getElementById('room-modal').style.display = 'none'; });
document.getElementById('btn-confirm-start').addEventListener('click', () => {
    const kode = document.getElementById('room-input-code').value.trim();
    if (kode !== "") {
        roomCode = kode; document.getElementById('ui-room-text').innerText = roomCode;
        document.getElementById('room-modal').style.display = 'none'; document.getElementById('lobby-container').style.display = 'none'; document.getElementById('top-hud').style.display = 'block';
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) document.getElementById('mobile-hud').style.display = 'block';
        if (document.body.requestPointerLock) document.body.requestPointerLock();
        buatSistemUIDinamis(); hubungkanJaringan(); init3DWorld();
    } else { alert("Isi Kode Room dulu, bro!"); }
});
