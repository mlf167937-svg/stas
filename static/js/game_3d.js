let scene, camera, renderer, socket;
let roomCode = "";
let myId = Math.random().toString(36).substring(7);
let playerLocal, musuhRemote;

// ─── LOGIKA GAMEPLAY & STATS (ALA FF) ─────────────────────────────────────────
let myHp = 200;
const maxHp = 200;
let jumlahMedkit = 3;
let isHealing = false;
let isReloading = false;
let isDead = false;

// Spesifikasi Senjata Sesuai Request
const statsSenjata = {
    SG2:  { damage: 100, maxAmmo: 2,  currentAmmo: 2,  reloadTime: 1500, range: 15,  warna: 0xff3333 },
    MP40: { damage: 35,  maxAmmo: 28, currentAmmo: 28, reloadTime: 2000, range: 30,  warna: 0xffff33 }
};
let senjataSekarang = "SG2";

// Kontrol & Pergerakan Kamera FPS
let keys = { w: false, a: false, s: false, d: false, Shift: false, space: false };
let sudutPandangY = 0; // Untuk rotasi hadap kiri/kanan
let mouseX = 0;
let playerKecepatan = 0.08;
let loncatVelocity = 0;
let isGrounded = true;

// Penampung Objek Dunia untuk Fitur Tembak-Menembak (Raycasting)
let daftarGlooWall = []; // Menyimpan semua objek dinding yang aktif
let targetMusuhHitbox = null; 

// ─── PROSEDURAL TEKSTUR RUMPUT (100% AMAN TANPA LINK LUAR) ────────────────────
function buatTeksturRumput() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Warna dasar hijau rumput lapangan
    ctx.fillStyle = '#284d22';
    ctx.fillRect(0, 0, 256, 256);
    
    // Bikin efek serat-serat rumput acak
    for (let i = 0; i < 5000; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#33662c' : '#1e3819';
        ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 6);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(20, 20); // Mengulang tekstur agar map terlihat luas
    return texture;
}

// ─── MODEL KARAKTER HUMAN / STICKMAN 3D ──────────────────────────────────────
function buatModelStickman(warnaKulit) {
    const grupKarakter = new THREE.Group();
    
    // Kepala (Sphere)
    const kepalaGeo = new THREE.SphereGeometry(0.25, 16, 16);
    const matKarakter = new THREE.MeshStandardMaterial({ color: warnaKulit, roughness: 0.7 });
    const kepala = new THREE.Mesh(kepalaGeo, matKarakter);
    kepala.position.y = 1.7;
    grupKarakter.add(kepala);
    
    // Badan/Torso (Cylinder)
    const badanGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8);
    const badan = new THREE.Mesh(badanGeo, matKarakter);
    badan.position.y = 1.1;
    grupKarakter.add(badan);
    
    // Kaki Kiri & Kanan
    const kakiGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8);
    const kakiKiri = new THREE.Mesh(kakiGeo, matKarakter);
    kakiKiri.position.set(-0.15, 0.35, 0);
    const kakiKanan = kakiKiri.clone();
    kakiKanan.position.x = 0.15;
    grupKarakter.add(kakiKiri, kakiKanan);
    
    // Tangan Kiri & Kanan
    const tanganGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8);
    const tanganKiri = new THREE.Mesh(tanganGeo, matKarakter);
    tanganKiri.position.set(-0.25, 1.1, 0);
    tanganKiri.rotation.z = Math.PI / 12;
    const tanganKanan = tanganKiri.clone();
    tanganKanan.position.x = 0.25;
    tanganKanan.rotation.z = -Math.PI / 12;
    grupKarakter.add(tanganKiri, tanganKanan);
    
    return grupKarakter;
}

// ─── INISIALISASI DUNIA 3D & INPUT ───────────────────────────────────────────
function init3DWorld() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x73a1c9); // Warna langit cerah
    scene.fog = new THREE.FogExp2(0x73a1c9, 0.015);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Pencahayaan Luar Ruangan
    const light = new THREE.AmbientLight(0xffffff, 0.7); scene.add(light);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8); dirLight.position.set(20, 50, 20); scene.add(dirLight);

    // Tanah dengan Tekstur Rumput Lapangan Sesuai Request
    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshStandardMaterial({ map: buatTeksturRumput(), roughness: 0.9 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Karakter Kita (Local) — Diposisikan tak terlihat oleh kamera diri sendiri
    playerLocal = new THREE.Group();
    playerLocal.position.set(0, 0, 0);
    scene.add(playerLocal);

    // TAMPILAN POV PAS DI MATA (FPS STYLE)
    camera.position.set(0, 1.6, 0); // Tinggi mata manusia rata-rata 1.6 unit
    playerLocal.add(camera);

    // Event Kontrol Mouse & Keyboard
    window.addEventListener('keydown', (e) => handleKeyboard(e, true));
    window.addEventListener('keyup', (e) => handleKeyboard(e, false));
    window.addEventListener('click', () => { if(!isDead) tembakSenjata(); });
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', onWindowResize, false);

    // Pasang UI Darah dan Peluru Tambahan Otomatis
    buatSistemUIDinamis();

    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        aktifkanTombolMobile();
    }

    animate();
}

// Mengatur rotasi kamera FPS menggunakan pergerakan mouse kiri-kanan
function handleMouseMove(e) {
    if (isDead) return;
    // Jika klik layar (atau pointer lock), kamera akan berputar bebas ke samping
    if (document.pointerProcessed || e.buttons === 1 || 'ontouchstart' in window) {
        sudutPandangY -= e.movementX * 0.003;
        playerLocal.rotation.y = sudutPandangY;
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function handleKeyboard(e, isDown) {
    if (isDead) return;
    if (e.key === 'w' || e.key === 'W') keys.w = isDown;
    if (e.key === 'a' || e.key === 'A') keys.a = isDown;
    if (e.key === 's' || e.key === 'S') keys.s = isDown;
    if (e.key === 'd' || e.key === 'D') keys.d = isDown;
    if (e.key === 'Shift') keys.Shift = isDown;
    if (e.key === ' ') { 
        if(isDown && isGrounded) { loncatVelocity = 0.18; isGrounded = false; }
    }
    if (e.key === 'e' || e.key === 'E') { if(isDown) pasangGlooWall(); }
    if (e.key === 'r' || e.key === 'R') { if(isDown) reloadSenjata(); }
}

function gantiSenjata(nama) {
    if (isDead || isReloading) return;
    senjataSekarang = nama;
    document.getElementById('slot-sg2').classList.toggle('active', nama === 'SG2');
    document.getElementById('slot-mp40').classList.toggle('active', nama === 'MP40');
    updateTeksUI();
}

// ─── LOGIKA PASANG GLOO WALL & SYSTEM HP NYA ─────────────────────────────────
function pasangGlooWall() {
    if (isDead) return;
    
    // Hitung posisi koordinat tepat di depan pandangan FPS player
    const jarakDinding = 2.5;
    const depanX = playerLocal.position.x - Math.sin(sudutPandangY) * jarakDinding;
    const depanZ = playerLocal.position.z - Math.cos(sudutPandangY) * jarakDinding;

    const wallId = Math.random().toString(36).substring(5);
    const wallGeo = new THREE.BoxGeometry(3.5, 2, 0.3);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x89b4fa, transparent: true, opacity: 0.85, roughness: 0.3 });
    const glooWall = new THREE.Mesh(wallGeo, wallMat);
    
    glooWall.position.set(depanX, 1, depanZ);
    glooWall.rotation.y = sudutPandangY;
    
    // Custom properties logic HP Glowal biar bisa hancur saat ditembak
    glooWall.userData = { id: wallId, hp: 300, tipe: 'gloo' }; 
    
    scene.add(glooWall);
    daftarGlooWall.push(glooWall);

    kirimDataKeMusuh({ 
        aksi: 'gloo', 
        idWall: wallId, 
        x: glooWall.position.x, 
        z: glooWall.position.z, 
        rotY: glooWall.rotation.y 
    });
}

// ─── LOGIKA TEMBAK SENJATA & CALC DAMAGE (RAYCASTER) ─────────────────────────
function tembakSenjata() {
    const senjata = statsSenjata[senjataSekarang];
    if (senjata.currentAmmo <= 0) {
        reloadSenjata();
        return;
    }

    senjata.currentAmmo--;
    updateTeksUI();

    // Visual Efek Garis Tembakan Laser FPS
    const arahTembakan = new THREE.Vector3();
    camera.getWorldDirection(arahTembakan);

    const posisiMata = new THREE.Vector3();
    camera.getWorldPosition(posisiMata);

    const titikAkhirLaser = new THREE.Vector3().copy(posisiMata).addScaledVector(arahTembakan, senjata.range);

    const laserGeo = new THREE.BufferGeometry().setFromPoints([posisiMata, titikAkhirLaser]);
    const laserMat = new THREE.LineBasicMaterial({ color: senjata.warna, linewidth: 3 });
    const laser = new THREE.Line(laserGeo, laserMat);
    scene.add(laser);
    setTimeout(() => scene.remove(laser), 60);

    // PROSES MENCARI TARGET YANG TERKENA DAMAGE (RAYCASTING)
    const raycaster = new THREE.Raycaster(posisiMata, arahTembakan, 0, senjata.range);
    
    // Kumpulkan objek target (Gloo Wall + Hitbox Musuh)
    let targetDaftar = [...daftarGlooWall];
    if (targetMusuhHitbox) targetDaftar.push(targetMusuhHitbox);

    const hasilSenggolan = raycaster.intersectObjects(targetDaftar);

    if (hasilSenggolan.length > 0) {
        const targetKena = hasilSenggolan[0].object;

        // 1. Jika peluru menghantam Gloo Wall
        if (targetKena.userData && targetKena.userData.tipe === 'gloo') {
            targetKena.userData.hp -= senjata.damage;
            kirimDataKeMusuh({ aksi: 'gloo_hit', idWall: targetKena.userData.id, dmg: senjata.damage });
            
            if (targetKena.userData.hp <= 0) {
                hancurkanGlooWall(targetKena.userData.id);
            }
        }
        // 2. Jika peluru telak menghantam tubuh Musuh
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

// ─── LOGIKA MEDKIT 5 DETIK DELAY ─────────────────────────────────────────────
function gunakanMedkit() {
    if (isDead || isHealing || jumlahMedkit <= 0 || myHp >= maxHp) return;

    isHealing = true;
    let sisaWaktu = 5;
    const btn = document.getElementById('btn-medkit-ui');
    btn.innerText = `💉 Memakai (${sisaWaktu}s)`;

    const hitungMundur = setInterval(() => {
        sisaWaktu--;
        if (sisaWaktu > 0) {
            btn.innerText = `💉 Memakai (${sisaWaktu}s)`;
        } else {
            clearInterval(hitungMundur);
            
            // Tambahkan Darah +100
            myHp = Math.min(maxHp, myHp + 100);
            jumlahMedkit--;
            isHealing = false;
            
            btn.innerText = `💉 MEDKIT (${jumlahMedkit})`;
            updateTeksUI();
            
            kirimDataKeMusuh({ aksi: 'sync_hp', hpTerbaru: myHp });
        }
    }, 1000);
}

// ─── UTILITY PENGURUS GLOO WALL & DAMAGE HANCUR ──────────────────────────────
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
        document.getElementById('ui-status').innerText = "🔴 KAMU ELIMINASI (0 HP)";
        alert("Kamu Mati! Refresh halaman untuk hidup kembali.");
        kirimDataKeMusuh({ aksi: 'mati_total' });
    }
}

// ─── ENGINE LOOP ANIMASI GAMEPLAY FPS ────────────────────────────────────────
function animate() {
    requestAnimationFrame(animate);

    if (!playerLocal || isDead) return;

    // Kecepatan Bergerak Maju/Mundur/Kiri/Kanan
    playerKecepatan = keys.Shift ? 0.14 : 0.07;

    // Kalkulasi arah gerak relatif berdasarkan hadapan kamera sudut pandang FPS
    const lintasanMaju = Math.sin(sudutPandangY) * playerKecepatan;
    const lintasanSamping = Math.cos(sudutPandangY) * playerKecepatan;

    if (keys.w) { playerLocal.position.z -= lintasanSamping; playerLocal.position.x -= lintasanMaju; }
    if (keys.s) { playerLocal.position.z += lintasanSamping; playerLocal.position.x += lintasanMaju; }
    if (keys.a) { playerLocal.position.x -= lintasanSamping; playerLocal.position.z += lintasanMaju; }
    if (keys.d) { playerLocal.position.x += lintasanSamping; playerLocal.position.z -= lintasanMaju; }

    // Sistem Fisika Gravitasi Lompat Sederhana
    if (!isGrounded) {
        playerLocal.position.y += loncatVelocity;
        loncatVelocity -= 0.01;
        if (playerLocal.position.y <= 0) {
            playerLocal.position.y = 0;
            isGrounded = true;
            loncatVelocity = 0;
        }
    }

    // Kirim Koordinat Sinkronisasi Jaringan Realtime ke Musuh
    if(roomCode !== "" && socket && socket.connected) {
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

// ─── LOGIKA JARINGAN MULTIPLAYER NETWORKING ──────────────────────────────────
function hubungkanJaringan() {
    socket = io();

    socket.on('connect', () => {
        socket.emit('join_game', { room: roomCode, id: myId, username: "Player STAS" });
        document.getElementById('ui-status').innerText = "Mencari Lawan Duel...";
    });

    socket.on('player_joined', (data) => {
        document.getElementById('ui-status').innerText = "Musuh Ditemukan! Selamat Bertarung.";
        buatKarakterMusuh();
    });

    socket.on('player_updated', (data) => {
        // 1. Sinkronisasi Posisi Gerak & Rotasi Hadap Musuh (Stickman)
        if (data.aksi === 'gerak') {
            if (!musuhRemote) buatKarakterMusuh();
            if (musuhRemote) {
                musuhRemote.position.set(data.x, data.y, data.z);
                musuhRemote.rotation.y = data.rotY;
            }
        } 
        // 2. Sinkronisasi Musuh Pasang Gloo Wall
        else if (data.aksi === 'gloo') {
            const wallGeo = new THREE.BoxGeometry(3.5, 2, 0.3);
            const wallMat = new THREE.MeshStandardMaterial({ color: 0xf38ba8, transparent: true, opacity: 0.6 });
            const enemyWall = new THREE.Mesh(wallGeo, wallMat);
            enemyWall.position.set(data.x, 1, data.z);
            enemyWall.rotation.y = data.rotY;
            enemyWall.userData = { id: data.idWall, hp: 300, tipe: 'gloo' };
            
            scene.add(enemyWall);
            daftarGlooWall.push(enemyWall);
        } 
        // 3. Sinkronisasi Saat Dinding Dihujani Tembakan Peluru
        else if (data.aksi === 'gloo_hit') {
            const targetWall = daftarGlooWall.find(w => w.userData.id === data.idWall);
            if (targetWall) {
                targetWall.userData.hp -= data.dmg;
                if (targetWall.userData.hp <= 0) hancurkanGlooWall(data.idWall);
            }
        } 
        // 4. Menerima Damage dari Tembakan Musuh yang Akurat
        else if (data.aksi === 'berikan_damage') {
            terimaDamagePenyakit(data.besarDamage);
        } 
        // 5. Musuh Mati Total
        else if (data.aksi === 'mati_total') {
            document.getElementById('ui-status').innerText = "👑 BOOYAH! Kamu Menang Duel!";
            if (musuhRemote) scene.remove(musuhRemote);
        }
    });
}

function buatKarakterMusuh() {
    if (musuhRemote) return;
    // Bikin bentuk model orang / stickman warna merah untuk musuh kita
    musuhRemote = buatModelStickman(0xff5555);
    musuhRemote.position.set(0, 0, -8);
    
    // Pasang invisible hitbox silinder berukuran manusia untuk kebutuhan deteksi tembakan peluru
    const hitboxGeo = new THREE.CylinderGeometry(0.4, 0.4, 2, 8);
    const hitboxMat = new THREE.MeshBasicMaterial({ visible: false }); // Gak kelihatan, murni deteksi raycast
    targetMusuhHitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
    targetMusuhHitbox.name = "hitbox_musuh";
    targetMusuhHitbox.position.y = 1; // Center pas di badan stickman
    
    musuhRemote.add(targetMusuhHitbox);
    scene.add(musuhRemote);
}

function kirimDataKeMusuh(payload) {
    if (!socket || !socket.connected) return;
    payload.room = roomCode;
    payload.id = myId;
    socket.emit('update_player', payload);
}

// ─── OTOMATISASI DAN IMPLEMENTASI COMPONENT UI DINAMIS ───────────────────────
function buatSistemUIDinamis() {
    // Container UI Overlay utama
    const wadahUI = document.createElement('div');
    wadahUI.style.position = 'absolute';
    wadahUI.style.bottom = '20px';
    wadahUI.style.left = '50%';
    wadahUI.style.transform = 'translateX(-50%)';
    wadahUI.style.zIndex = '999';
    wadahUI.style.textAlign = 'center';
    wadahUI.style.fontFamily = 'monospace';

    // 1. Tampilan Bar Darah (Max 200) Sesuai Request
    const barDarahContainer = document.createElement('div');
    barDarahContainer.style.width = '250px';
    barDarahContainer.style.height = '20px';
    barDarahContainer.style.backgroundColor = '#444';
    barDarahContainer.style.border = '2px solid white';
    barDarahContainer.style.borderRadius = '5px';
    barDarahContainer.style.overflow = 'hidden';
    barDarahContainer.style.marginBottom = '8px';

    const isiDarahBar = document.createElement('div');
    isiDarahBar.id = 'ui-hp-bar';
    isiDarahBar.style.width = '100%';
    isiDarahBar.style.height = '100%';
    isiDarahBar.style.backgroundColor = '#ff3333';
    isiDarahBar.style.transition = 'width 0.1s ease';
    barDarahContainer.appendChild(isiDarahBar);

    const teksTandaHP = document.createElement('div');
    teksTandaHP.id = 'ui-hp-text';
    teksTandaHP.style.color = 'white';
    teksTandaHP.style.fontWeight = 'bold';
    teksTandaHP.style.marginTop = '-20px';
    teksTandaHP.style.fontSize = '12px';
    teksTandaHP.innerText = 'HP: 200 / 200';
    barDarahContainer.appendChild(teksTandaHP);

    // 2. Status Sisa Peluru Aktif
    const infoPeluru = document.createElement('div');
    infoPeluru.id = 'ui-ammo-display';
    infoPeluru.style.color = '#ffff00';
    infoPeluru.style.fontSize = '20px';
    infoPeluru.style.fontWeight = 'bold';
    infoPeluru.style.textShadow = '1px 1px 2px black';
    infoPeluru.innerText = 'AMMO: 2 / 2';

    // 3. Tombol Medkit 5 Detik
    const tombolMedkit = document.createElement('button');
    tombolMedkit.id = 'btn-medkit-ui';
    tombolMedkit.style.marginTop = '10px';
    tombolMedkit.style.padding = '8px 16px';
    tombolMedkit.style.fontSize = '14px';
    tombolMedkit.style.fontWeight = 'bold';
    tombolMedkit.style.backgroundColor = '#22c55e';
    tombolMedkit.style.color = 'white';
    tombolMedkit.style.border = 'none';
    tombolMedkit.style.borderRadius = '5px';
    tombolMedkit.style.cursor = 'pointer';
    tombolMedkit.innerText = `💉 MEDKIT (${jumlahMedkit})`;
    tombolMedkit.addEventListener('click', gunakanMedkit);

    wadahUI.appendChild(barDarahContainer);
    wadahUI.appendChild(infoPeluru);
    wadahUI.appendChild(tombolMedkit);
    document.body.appendChild(wadahUI);
    
    updateTeksUI();
}

function updateTeksUI() {
    const senjata = statsSenjata[senjataSekarang];
    // Sync nilai bar darah visual
    const persentaseHp = (myHp / maxHp) * 100;
    const bar = document.getElementById('ui-hp-bar');
    if (bar) bar.style.width = `${persentaseHp}%`;
    
    const teksHp = document.getElementById('ui-hp-text');
    if (teksHp) teksHp.innerText = `HP: ${myHp} / ${maxHp}`;

    // Sync info kapasitas sisa peluru aktif
    const ammoUI = document.getElementById('ui-ammo-display');
    if (ammoUI && !isReloading) {
        ammoUI.innerText = `${senjataSekarang} AMMO: ${senjata.currentAmmo} / ${senjata.maxAmmo}`;
    }
}

function buatEfekHitmarker() {
    // Bikin kilatan silang merah kecil di tengah layar tanda tembakan masuk target
    const penanda = document.createElement('div');
    penanda.style.position = 'absolute';
    penanda.style.top = '50%';
    penanda.style.left = '50%';
    penanda.style.transform = 'translate(-50%, -50%)';
    penanda.style.color = '#ff3333';
    penanda.style.fontSize = '30px';
    penanda.style.fontWeight = 'bold';
    penanda.style.pointerEvents = 'none';
    penanda.innerText = '✕';
    document.body.appendChild(penanda);
    setTimeout(() => penanda.remove(), 120);
}

function aktifkanTombolMobile() {
    // Pengikat aksi sentuhan HP agar tidak bentrok dengan mouse pointer lock
    document.getElementById('btn-shoot').addEventListener('touchstart', (e) => { e.preventDefault(); tembakSenjata(); });
    document.getElementById('btn-gloo').addEventListener('touchstart', (e) => { e.preventDefault(); pasangGlooWall(); });
}

// Override fungsi bawaan klik lobby agar sinkronisasi data urutan berjalan aman
document.getElementById('btn-join').addEventListener('click', () => {
    const inputRoom = document.getElementById('room-id').value.trim();
    if (inputRoom !== "") {
        roomCode = inputRoom;
        document.getElementById('ui-room-text').innerText = roomCode;
        document.getElementById('lobby').style.display = 'none';
        document.getElementById('hud-senjata').style.display = 'flex';
        
        // Pemicu pointer lock otomatis di desktop pas masuk game biar nyaman kontrol kameranya
        if (document.body.requestPointerLock) {
            document.body.addEventListener('click', () => {
                if(!isDead && roomCode !== "") document.body.requestPointerLock();
            });
        }
        
        hubungkanJaringan();
        init3DWorld();
    } else {
        alert("Masukkan kode room terlebih dahulu!");
    }
});
