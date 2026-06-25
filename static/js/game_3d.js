let scene, camera, renderer, socket;
let roomCode = "";
let myId = Math.random().toString(36).substring(7);
let playerLocal, musuhRemote;

// ─── LOGIKA GAMEPLAY & STATS UTAMA ───────────────────────────────────────────
let myHp = 200;
const maxHp = 200;
let jumlahMedkit = 3;
let isHealing = false;
let isReloading = false;
let isDead = false;
let isCrouching = false;

// Spesifikasi 4 Senjata Sesuai Request Terbaru
const statsSenjata = {
    SG2:    { damage: 100, maxAmmo: 2,  currentAmmo: 2,  reloadTime: 1500, range: 18, warna: 0xff3333, audioType: 'shotgun' },
    MP40:   { damage: 35,  maxAmmo: 28, currentAmmo: 28, reloadTime: 2000, range: 32, warna: 0xffff33, audioType: 'smg' },
    MP5:    { damage: 40,  maxAmmo: 30, currentAmmo: 30, reloadTime: 1800, range: 38, warna: 0x33ff33, audioType: 'smg_heavy' },
    PISTOL: { damage: 15,  maxAmmo: 7,  currentAmmo: 7,  reloadTime: 1000, range: 22, warna: 0x3333ff, audioType: 'pistol' }
};
let senjataSekarang = "SG2";

// Kontrol & Pergerakan Kamera FPS 3D (Atas, Bawah, Samping)
let keys = { w: false, a: false, s: false, d: false, Shift: false, space: false };
let sudutPandangY = 0; // Rotasi Horizontal (Kanan/Kiri)
let sudutPandangX = 0; // Rotasi Vertical (Atas/Bawah)
let playerKecepatan = 0.08;
let loncatVelocity = 0;
let isGrounded = true;

// Variabel Input Joystick Mobile
let joystickActive = false;
let joystickStartPos = { x: 0, y: 0 };
let joystickMoveVector = { x: 0, y: 0 };

// Penampung Objek Kolisi Dunia (Raycasting Tembakan & Perlindungan)
let daftarGlooWall = []; 
let targetMusuhHitbox = null; 
let daftarBangunanRintangan = [];

// Konteks Audio Sintetis (Bikin Suara Tanpa File MP3 Eksternal)
let audioCtx = null;

// ─── ENGINE SYNTHESIZER AUDIO CUSTOM ─────────────────────────────────────────
function putarSuaraCustom(tipe) {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();

        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        const skrg = audioCtx.currentTime;

        if (tipe === 'shotgun') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, skrg);
            osc.frequency.exponentialRampToValueAtTime(30, skrg + 0.3);
            gainNode.gain.setValueAtTime(0.6, skrg);
            gainNode.gain.linearRampToValueAtTime(0.01, skrg + 0.3);
            osc.start(skrg); osc.stop(skrg + 0.3);
        } else if (tipe === 'smg') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(350, skrg);
            gainNode.gain.setValueAtTime(0.3, skrg);
            gainNode.gain.linearRampToValueAtTime(0.01, skrg + 0.08);
            osc.start(skrg); osc.stop(skrg + 0.08);
        } else if (tipe === 'smg_heavy') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, skrg);
            gainNode.gain.setValueAtTime(0.4, skrg);
            gainNode.gain.linearRampToValueAtTime(0.01, skrg + 0.1);
            osc.start(skrg); osc.stop(skrg + 0.1);
        } else if (tipe === 'pistol') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(450, skrg);
            gainNode.gain.setValueAtTime(0.2, skrg);
            gainNode.gain.linearRampToValueAtTime(0.01, skrg + 0.07);
            osc.start(skrg); osc.stop(skrg + 0.07);
        } else if (tipe === 'gloo') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(140, skrg);
            osc.frequency.exponentialRampToValueAtTime(320, skrg + 0.25);
            gainNode.gain.setValueAtTime(0.5, skrg);
            gainNode.gain.linearRampToValueAtTime(0.01, skrg + 0.25);
            osc.start(skrg); osc.stop(skrg + 0.25);
        }
    } catch (e) { console.log("Audio blm diijinkan browser"); }
}

// ─── PROSEDURAL MAP GENERATOR (RUMPUT MODIS, AWAN & PERUMAHAN) ────────────────
function buatTeksturRumputHijau() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Dasar Hijau Polos Fresh
    ctx.fillStyle = '#348c31';
    ctx.fillRect(0, 0, 512, 512);
    
    // Grid Halus & Variasi Daun Halus Biar Gak Terlalu Polos
    ctx.strokeStyle = '#2d7a2a';
    ctx.lineWidth = 2;
    for(let x=0; x<=512; x+=64) {
        ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,512); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,x); ctx.lineTo(512,x); ctx.stroke();
    }
    for (let i = 0; i < 1500; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#40a33c' : '#296e27';
        ctx.fillRect(Math.random() * 512, Math.random() * 512, 4, 4);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(25, 25);
    return texture;
}

function bangunKompleksPerumahan() {
    // Array titik koordinat lokasi rumah buatan untuk tempat sembunyi taktikal
    const lokasiRumah = [
        {x: 10, z: -15, w: 6, h: 4, d: 8, col: 0xbf616a},
        {x: -18, z: -10, w: 8, h: 5, d: 6, col: 0xd08770},
        {x: 15, z: 20, w: 7, h: 4, d: 7, col: 0xebcb8b},
        {x: -12, z: 25, w: 6, h: 4, d: 6, col: 0xa3be8c}
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
        
        for(let j=0; j<jmlGumpalan; j++) {
            const cloudGeo = new THREE.SphereGeometry(2 + Math.random()*2, 8, 8);
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

// ─── MODEL KARAKTER STICKMAN 3D ──────────────────────────────────────────────
function buatModelStickman(warnaKulit) {
    const grupKarakter = new THREE.Group();
    const matKarakter = new THREE.MeshStandardMaterial({ color: warnaKulit, roughness: 0.7 });
    
    const kepala = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), matKarakter);
    kepala.position.y = 1.7; grupKarakter.add(kepala);
    
    const badan = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8), matKarakter);
    badan.position.y = 1.1; grupKarakter.add(badan);
    
    const kakiKiri = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8), matKarakter);
    kakiKiri.position.set(-0.15, 0.35, 0);
    const kakiKanan = kakiKiri.clone(); kakiKanan.position.x = 0.15;
    grupKarakter.add(kakiKiri, kakiKanan);
    
    const tanganKiri = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8), matKarakter);
    tanganKiri.position.set(-0.25, 1.1, 0); tanganKiri.rotation.z = Math.PI / 12;
    const tanganKanan = tanganKiri.clone(); tanganKanan.position.x = 0.25; tanganKanan.rotation.z = -Math.PI / 12;
    grupKarakter.add(tanganKiri, tanganKanan);
    
    return grupKarakter;
}

// ─── INISIALISASI UNIVERSE & LOGIKA KAMETA ───────────────────────────────────
function init3DWorld() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xaaccff); // Langit Biru Cerah Sesuai Request
    scene.fog = new THREE.FogExp2(0xaaccff, 0.01);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Light Setup
    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.7); dirLight.position.set(30, 60, 30); scene.add(dirLight);

    // Ground Arena
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(250, 250), new THREE.MeshStandardMaterial({ map: buatTeksturRumputHijau(), roughness: 0.9 }));
    ground.rotation.x = -Math.PI / 2; scene.add(ground);

    // Bangun Infrastruktur Map Serius
    bangunKompleksPerumahan();
    buatGugusanAwanLangit();

    // Local FPS Setup Object
    playerLocal = new THREE.Group();
    playerLocal.position.set(0, 0, 4);
    scene.add(playerLocal);

    // Ketinggian Pandangan Kamera Pas Di Mata (FPS)
    camera.position.set(0, 1.6, 0);
    playerLocal.add(camera);

    // Event Input Desktop PC
    window.addEventListener('keydown', (e) => handleKeyboard(e, true));
    window.addEventListener('keyup', (e) => handleKeyboard(e, false));
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', onWindowResize);
    
    // Bind klik layar nembak khusus area non-hud desktop
    window.addEventListener('click', (e) => {
        if (!isDead && e.target.tagName === "CANVAS") {
            tembakSenjata();
        }
    });

    // Nyalakan Sistem Kendali Sentuh Mobile Smartphone
    siapkanSistemJoystickMobile();

    animate();
}

function handleMouseMove(e) {
    if (isDead) return;
    // Deteksi jika kursor terkunci (Pointer lock desktop) atau menekan layar game
    if (document.pointerLockElement === document.body || e.buttons === 1) {
        sudutPandangY -= e.movementX * 0.0025; // Sensitivitas Horizontal
        sudutPandangX -= e.movementY * 0.0025; // Sensitivitas Vertikal

        // Limitasi sudut pandang ke atas & ke bawah agar tidak jungkir balik (Maks 85 derajat)
        sudutPandangX = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, sudutPandangX));

        playerLocal.rotation.y = sudutPandangY;
        camera.rotation.x = sudutPandangX;
    }
}

function handleKeyboard(e, isDown) {
    if (isDead) return;
    if (e.key === 'w' || e.key === 'W') keys.w = isDown;
    if (e.key === 'a' || e.key === 'A') keys.a = isDown;
    if (e.key === 's' || e.key === 'S') keys.s = isDown;
    if (e.key === 'd' || e.key === 'D') keys.d = isDown;
    if (e.key === 'Shift') keys.Shift = isDown;
    if (e.key === ' ') {
        if (isDown && isGrounded && !isCrouching) { loncatVelocity = 0.17; isGrounded = false; }
    }
    if (e.key === 'e' || e.key === 'E') { if (isDown) pasangGlooWall(); }
    if (e.key === 'r' || e.key === 'R') { if (isDown) reloadSenjata(); }
    if (e.key === 'c' || e.key === 'C') { if (isDown) toggleJongkok(); }
}

function toggleJongkok() {
    isCrouching = !isCrouching;
    if (isCrouching) {
        camera.position.y = 0.9; // Turunkan pandangan mata ke bawah pas jongkok
        playerKecepatan = 0.03;  // Jalannya melambat
    } else {
        camera.position.y = 1.6; // Kembalikan ke posisi mata normal berdiri
        playerKecepatan = 0.07;
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ─── MEKANISME SELEKSI HUD SENJATA LOBBY ──────────────────────────────────────
window.selectLobbyWeapon = function(nama) {
    if (isDead || isReloading) return;
    senjataSekarang = nama;
    putarSuaraCustom('pistol'); // Efek suara klik ganti senjata
    
    // Reset status kelas aktif di UI HTML
    document.querySelectorAll('.weapon-card').forEach(el => el.classList.remove('selected'));
    // Cari elemen pembungkus dan jadikan aktif visual
    const cards = document.querySelectorAll('.weapon-card');
    cards.forEach(card => {
        if (card.innerHTML.includes(nama)) card.classList.add('selected');
    });
};

// ─── LOGIKA PASANG GLOO WALL & SYSTEM HP NYA ─────────────────────────────────
function pasangGlooWall() {
    if (isDead) return;
    putarSuaraCustom('gloo');

    const jarakDinding = 2.6;
    const depanX = playerLocal.position.x - Math.sin(sudutPandangY) * jarakDinding;
    const depanZ = playerLocal.position.z - Math.cos(sudutPandangY) * jarakDinding;

    const wallId = Math.random().toString(36).substring(5);
    const wallGeo = new THREE.BoxGeometry(3.8, 2.2, 0.35);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x89b4fa, transparent: true, opacity: 0.8, roughness: 0.2 });
    const glooWall = new THREE.Mesh(wallGeo, wallMat);
    
    glooWall.position.set(depanX, 1.1, depanZ);
    glooWall.rotation.y = sudutPandangY;
    glooWall.userData = { id: wallId, hp: 300, tipe: 'gloo' }; 
    
    scene.add(glooWall);
    daftarGlooWall.push(glooWall);

    kirimDataKeMusuh({ 
        aksi: 'gloo', idWall: wallId, x: glooWall.position.x, z: glooWall.position.z, rotY: glooWall.rotation.y 
    });
}

// ─── LOGIKA TEMBAK SENJATA & CALCULATE DAMAGE RAYCASTER ──────────────────────
function tembakSenjata() {
    const senjata = statsSenjata[senjataSekarang];
    if (senjata.currentAmmo <= 0) { reloadSenjata(); return; }

    senjata.currentAmmo--;
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

    // Deteksi Tembakan Raycast
    const raycaster = new THREE.Raycaster(posisiMata, arahTembakan, 0, senjata.range);
    let targetDaftar = [...daftarGlooWall, ...daftarBangunanRintangan];
    if (targetMusuhHitbox) targetDaftar.push(targetMusuhHitbox);

    const hasilSenggolan = raycaster.intersectObjects(targetDaftar);

    if (hasilSenggolan.length > 0) {
        const targetKena = hasilSenggolan[0].object;

        if (targetKena.userData && targetKena.userData.tipe === 'gloo') {
            targetKena.userData.hp -= senjata.damage;
            kirimDataKeMusuh({ aksi: 'gloo_hit', idWall: targetKena.userData.id, dmg: senjata.damage });
            if (targetKena.userData.hp <= 0) hancurkanGlooWall(targetKena.userData.id);
        }
        else if (targetKena.name === "hitbox_musuh") {
            kirimDataKeMusuh({ aksi: 'berikan_damage', besarDamage: senjata.damage });
            buatEfekHitmarker();
        }
    }
}

function reloadSenjata() {
    const senjata = statsSenjata[senjataSekarang];
    if (isReloading || senjata.currentAmmo === senjata.maxAmmo) return;

    isReloading = true;
    document.getElementById('ui-ammo-display').innerText = "RELOADING...";
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

function terimaDamagePenyakit(besarDamage) {
    if (isDead) return;
    myHp = Math.max(0, myHp - besarDamage);
    updateTeksUI();

    if (myHp <= 0) {
        isDead = true;
        document.getElementById('ui-status').innerText = "🔴 TERELIMINASI";
        alert("Kamu Kalah Duel! Refresh browser untuk balas dendam.");
        kirimDataKeMusuh({ aksi: 'mati_total' });
    }
}

// ─── SYSTEM VIRTUAL ANALOG JOYSTICK TOUCH SCREEN MOBILE ──────────────────────
function siapkanSistemJoystickMobile() {
    const container = document.getElementById('joystick-container');
    const knob = document.getElementById('joystick-knob');

    if(!container) return;

    container.addEventListener('touchstart', (e) => {
        joystickActive = true;
        const touch = e.touches[0];
        const rect = container.getBoundingClientRect();
        joystickStartPos = { x: rect.left + rect.width/2, y: rect.top + rect.height/2 };
    }, {passive: true});

    window.addEventListener('touchmove', (e) => {
        if (!joystickActive) return;
        const touch = e.touches[0];
        
        let sX = touch.clientX - joystickStartPos.x;
        let sY = touch.clientY - joystickStartPos.y;
        const jarak = Math.sqrt(sX*sX + sY*sY);
        const batasMax = 45; // Batas radius gerak knob analog

        if (jarak > batasMax) {
            sX = (sX / jarak) * batasMax;
            sY = (sY / jarak) * batasMax;
        }

        knob.style.transform = `translate(${sX}px, ${sY}px)`;
        
        // Normalisasi kalkulasi arah vector gerak (-1 sampai 1)
        joystickMoveVector.x = sX / batasMax;
        joystickMoveVector.y = sY / batasMax;
    }, {passive: true});

    window.addEventListener('touchend', () => {
        if (!joystickActive) return;
        joystickActive = false;
        knob.style.transform = `translate(0px, 0px)`;
        joystickMoveVector = { x: 0, y: 0 };
    });

    // Pemicu aksi tombol taktil kanan mobile touchscreen
    document.getElementById('btn-shoot-mobile').addEventListener('touchstart', (e) => { e.preventDefault(); if(!isDead) tembakSenjata(); });
    document.getElementById('btn-gloo-mobile').addEventListener('touchstart', (e) => { e.preventDefault(); if(!isDead) pasangGlooWall(); });
    document.getElementById('btn-jump-mobile').addEventListener('touchstart', (e) => { e.preventDefault(); if(isGrounded && !isCrouching) { loncatVelocity=0.17; isGrounded=false; } });
    document.getElementById('btn-crouch-mobile').addEventListener('touchstart', (e) => { e.preventDefault(); toggleJongkok(); });
}

// ─── TICK ENGINE LOOP REALTIME ───────────────────────────────────────────────
function animate() {
    requestAnimationFrame(animate);
    if (!playerLocal || isDead) return;

    // Kalkulasi kalkulasi kecepatan gerak kombinasi shift sprint
    let speed = keys.Shift ? 0.13 : (isCrouching ? 0.035 : 0.075);
    
    // 1. Gerakan Input dari Keyboard PC
    const lintasanMaju = Math.sin(sudutPandangY) * speed;
    const lintasanSamping = Math.cos(sudutPandangY) * speed;

    if (keys.w) { playerLocal.position.z -= lintasanSamping; playerLocal.position.x -= lintasanMaju; }
    if (keys.s) { playerLocal.position.z += lintasanSamping; playerLocal.position.x += lintasanMaju; }
    if (keys.a) { playerLocal.position.x -= lintasanSamping; playerLocal.position.z += lintasanMaju; }
    if (keys.d) { playerLocal.position.x += lintasanSamping; playerLocal.position.z -= lintasanMaju; }

    // 2. Integrasi Gerakan Input dari Virtual Analog Mobile HP
    if (joystickActive) {
        const fX = Math.sin(sudutPandangY) * speed;
        const fZ = Math.cos(sudutPandangY) * speed;
        const rX = Math.sin(sudutPandangY + Math.PI/2) * speed;
        const rZ = Math.cos(sudutPandangY + Math.PI/2) * speed;

        // Gerak maju mundur analog
        playerLocal.position.x -= fX * (-joystickMoveVector.y);
        playerLocal.position.z -= fZ * (-joystickMoveVector.y);
        // Geser kanan kiri analog
        playerLocal.position.x += rX * (joystickMoveVector.x);
        playerLocal.position.z += rZ * (joystickMoveVector.x);
    }

    // Fisika Gravitasi Lompat Sederhana
    if (!isGrounded) {
        playerLocal.position.y += loncatVelocity;
        loncatVelocity -= 0.01;
        if (playerLocal.position.y <= 0) { playerLocal.position.y = 0; isGrounded = true; loncatVelocity = 0; }
    }

    // Sinkronisasi Multiplayer Jaringan Realtime
    if(roomCode !== "" && socket && socket.connected) {
        kirimDataKeMusuh({
            aksi: 'gerak', x: playerLocal.position.x, y: playerLocal.position.y, z: playerLocal.position.z, rotY: sudutPandangY
        });
    }

    renderer.render(scene, camera);
}

// ─── LOGIKA MULTIPLAYER NETWORKING & SYNC ────────────────────────────────────
function hubungkanJaringan() {
    socket = io();

    socket.on('connect', () => {
        socket.emit('join_game', { room: roomCode, id: myId, username: "Player STAS" });
        document.getElementById('ui-status').innerText = "Mencari Musuh...";
    });

    socket.on('player_joined', (data) => {
        document.getElementById('ui-status').innerText = "Bertarung Dimulai!";
        buatKarakterMusuh();
    });

    socket.on('player_updated', (data) => {
        if (data.aksi === 'gerak') {
            if (!musuhRemote) buatKarakterMusuh();
            if (musuhRemote) { musuhRemote.position.set(data.x, data.y, data.z); musuhRemote.rotation.y = data.rotY; }
        } 
        else if (data.aksi === 'gloo') {
            const wallGeo = new THREE.BoxGeometry(3.8, 2.2, 0.35);
            const wallMat = new THREE.MeshStandardMaterial({ color: 0xf38ba8, transparent: true, opacity: 0.65 });
            const enemyWall = new THREE.Mesh(wallGeo, wallMat);
            enemyWall.position.set(data.x, 1.1, data.z); enemyWall.rotation.y = data.rotY;
            enemyWall.userData = { id: data.idWall, hp: 300, tipe: 'gloo' };
            scene.add(enemyWall); daftarGlooWall.push(enemyWall);
        } 
        else if (data.aksi === 'gloo_hit') {
            const tw = daftarGlooWall.find(w => w.userData.id === data.idWall);
            if (tw) { tw.userData.hp -= data.dmg; if (tw.userData.hp <= 0) hancurkanGlooWall(data.idWall); }
        } 
        else if (data.aksi === 'berikan_damage') {
            terimaDamagePenyakit(data.besarDamage);
        } 
        else if (data.aksi === 'mati_total') {
            document.getElementById('ui-status').innerText = "👑 BOOYAH!";
            if (musuhRemote) scene.remove(musuhRemote);
        }
    });
}

function buatKarakterMusuh() {
    if (musuhRemote) return;
    musuhRemote = buatModelStickman(0xff5555);
    musuhRemote.position.set(0, 0, -10);
    
    const hitboxGeo = new THREE.CylinderGeometry(0.45, 0.45, 2.1, 8);
    targetMusuhHitbox = new THREE.Mesh(hitboxGeo, new THREE.MeshBasicMaterial({ visible: false }));
    targetMusuhHitbox.name = "hitbox_musuh";
    targetMusuhHitbox.position.y = 1.05;
    
    musuhRemote.add(targetMusuhHitbox);
    scene.add(musuhRemote);
}

function kirimDataKeMusuh(payload) {
    if (!socket || !socket.connected) return;
    payload.room = roomCode; payload.id = myId;
    socket.emit('update_player', payload);
}

// ─── OTOMATISASI DAN IMPLEMENTASI COMPONENT UI DINAMIS ───────────────────────
function buatSistemUIDinamis() {
    const wadahUI = document.createElement('div');
    wadahUI.style.position = 'absolute'; wadahUI.style.bottom = '15px'; wadahUI.style.left = '50%';
    wadahUI.style.transform = 'translateX(-50%)'; wadahUI.style.zIndex = '999'; wadahUI.style.textAlign = 'center';
    wadahUI.style.fontFamily = 'monospace'; wadahUI.style.pointerEvents = 'auto';

    const barDarahContainer = document.createElement('div');
    barDarahContainer.style.width = '240px'; barDarahContainer.style.height = '18px'; barDarahContainer.style.backgroundColor = '#333';
    barDarahContainer.style.border = '2px solid #fff'; barDarahContainer.style.borderRadius = '4px'; barDarahContainer.style.overflow = 'hidden';

    const isiDarahBar = document.createElement('div');
    isiDarahBar.id = 'ui-hp-bar'; isiDarahBar.style.width = '100%'; isiDarahBar.style.height = '100%'; isiDarahBar.style.backgroundColor = '#ff3333';
    barDarahContainer.appendChild(isiDarahBar);

    const teksTandaHP = document.createElement('div');
    teksTandaHP.id = 'ui-hp-text'; teksTandaHP.style.color = 'white'; teksTandaHP.style.fontWeight = 'bold';
    teksTandaHP.style.marginTop = '-18px'; teksTandaHP.style.fontSize = '12px'; teksTandaHP.innerText = 'HP: 200 / 200';
    barDarahContainer.appendChild(teksTandaHP);

    const infoPeluru = document.createElement('div');
    infoPeluru.id = 'ui-ammo-display'; infoPeluru.style.color = '#ffff00'; infoPeluru.style.fontSize = '18px';
    infoPeluru.style.fontWeight = 'bold'; infoPeluru.style.textShadow = '1px 1px 1px black'; infoPeluru.style.marginTop = '4px';

    wadahUI.appendChild(barDarahContainer);
    wadahUI.appendChild(infoPeluru);
    document.body.appendChild(wadahUI);
    
    // Set Acak ID Profil di Awal Game
    document.getElementById('player-uid').innerText = Math.floor(100000 + Math.random() * 900000);
    updateTeksUI();
}

function updateTeksUI() {
    const senjata = statsSenjata[senjataSekarang];
    const persentaseHp = (myHp / maxHp) * 100;
    const bar = document.getElementById('ui-hp-bar'); if (bar) bar.style.width = `${persentaseHp}%`;
    const teksHp = document.getElementById('ui-hp-text'); if (teksHp) teksHp.innerText = `HP: ${myHp} / ${maxHp}`;

    const ammoUI = document.getElementById('ui-ammo-display');
    if (ammoUI && !isReloading) {
        ammoUI.innerText = `${senjataSekarang} AMMO: ${senjata.currentAmmo} / ${senjata.maxAmmo}`;
    }
}

function buatEfekHitmarker() {
    const penanda = document.createElement('div');
    penanda.style.position = 'absolute'; penanda.style.top = '50%'; penanda.style.left = '50%';
    penanda.style.transform = 'translate(-50%, -50%)'; penanda.style.color = '#ff3333'; penanda.style.fontSize = '28px';
    penanda.style.fontWeight = 'bold'; penanda.style.pointerEvents = 'none'; penanda.innerText = '✕';
    document.body.appendChild(penanda); setTimeout(() => penanda.remove(), 100);
}

// TRIGGER START BATTLE DARI MODAL LOBBY HTML
document.getElementById('btn-open-match').addEventListener('click', () => {
    document.getElementById('room-modal').style.display = 'flex';
});
document.getElementById('btn-cancel-room').addEventListener('click', () => {
    document.getElementById('room-modal').style.display = 'none';
});

document.getElementById('btn-confirm-start').addEventListener('click', () => {
    const kode = document.getElementById('room-input-code').value.trim();
    if (kode !== "") {
        roomCode = kode;
        document.getElementById('ui-room-text').innerText = roomCode;
        
        // Sembunyikan elemen Lobby & Aktifkan Seluruh HUD Arena Gameplay
        document.getElementById('room-modal').style.display = 'none';
        document.getElementById('lobby-container').style.display = 'none';
        document.getElementById('top-hud').style.display = 'block';
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            document.getElementById('mobile-hud').style.display = 'block';
        }

        // Kunci Pointer Kursor Desktop Otomatis demi Kenyamanan Sudut Pandang FPS
        if (document.body.requestPointerLock) {
            document.body.requestPointerLock();
            document.body.addEventListener('click', () => {
                if(!isDead && roomCode !== "") document.body.requestPointerLock();
            });
        }

        hubungkanJaringan();
        init3DWorld();
    } else {
        alert("Kode Room wajib diisi!");
    }
});
