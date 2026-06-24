let scene, camera, renderer, socket;
let roomCode = "";
let myId = Math.random().toString(36).substring(7);
let playerLocal, musuhRemote;

let senjataSekarang = "SG2";
let keys = { w: false, a: false, s: false, d: false, Shift: false, space: false };
let playerKecepatan = 0.1;
let loncatVelocity = 0;
let isGrounded = true;

// Inisialisasi Dunia 3D
function init3DWorld() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a24);
    scene.fog = new THREE.FogExp2(0x1a1a24, 0.015);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Pencahayaan
    const light = new THREE.AmbientLight(0xffffff, 0.6); scene.add(light);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8); dirLight.position.set(20, 40, 20); scene.add(dirLight);

    // Tanah / Map Simple
    const groundGeo = new THREE.PlaneGeometry(100, 100);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x313244, roughness: 0.8 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Karakter Kita (Box Representasi Sementara)
    const pGeo = new THREE.BoxGeometry(1, 2, 1);
    const pMat = new THREE.MeshStandardMaterial({ color: 0xcba6f7 });
    playerLocal = new THREE.Mesh(pGeo, pMat);
    playerLocal.position.set(0, 1, 0);
    scene.add(playerLocal);

    // Mengatur Posisi Kamera di Belakang Karakter (Third Person View)
    camera.position.set(0, 5, 7);
    camera.lookAt(playerLocal.position);

    // Event Input Keyboard
    window.addEventListener('keydown', (e) => handleKeyboard(e, true));
    window.addEventListener('keyup', (e) => handleKeyboard(e, false));
    window.addEventListener('click', tembakSenjata);

    // Deteksi jika HP, munculkan tombol touch
    if ('ontouchstart' in window) {
        document.getElementById('btn-shoot').style.display = 'flex';
        document.getElementById('btn-gloo').style.display = 'flex';
        document.getElementById('btn-jump').style.display = 'flex';
        document.getElementById('dpad').style.display = 'flex';
        setupTouchControls();
    }

    animate();
}

// Logika Gerakan & Input
function handleKeyboard(e, isDown) {
    if (e.key === 'w' || e.key === 'W') keys.w = isDown;
    if (e.key === 'a' || e.key === 'A') keys.a = isDown;
    if (e.key === 's' || e.key === 'S') keys.s = isDown;
    if (e.key === 'd' || e.key === 'D') keys.d = isDown;
    if (e.key === 'Shift') keys.Shift = isDown;
    if (e.key === ' ') { 
        if(isDown && isGrounded) { loncatVelocity = 0.2; isGrounded = false; }
    }
    if (e.key === 'e' || e.key === 'E') { if(isDown) pasangGlooWall(); }
}

function gantiSenjata(nama) {
    senjataSekarang = nama;
    document.getElementById('slot-sg2').classList.toggle('active', nama === 'SG2');
    document.getElementById('slot-mp40').classList.toggle('active', nama === 'MP40');
}

function pasangGlooWall() {
    // Membuat Dinding Penghalang 3D di Depan Player
    const wallGeo = new THREE.BoxGeometry(3, 2, 0.3);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x89b4fa, transparent: true, opacity: 0.8 });
    const glooWall = new THREE.Mesh(wallGeo, wallMat);
    
    // Posisikan sedikit di depan player
    glooWall.position.set(playerLocal.position.x, 1, playerLocal.position.z - 2);
    scene.add(glooWall);

    // Kirim data gloo wall ke musuh lewat jaringan
    kirimDataKeMusuh({ aksi: 'gloo', x: glooWall.position.x, z: glooWall.position.z });

    // Hilang otomatis dalam 7 detik (biar gak penuh mapnya)
    setTimeout(() => { scene.remove(glooWall); }, 7000);
}

function tembakSenjata() {
    // Logika visual tembakan kilat (efek laser sederhana)
    const laserGeo = new THREE.BufferGeometry().setFromPoints([
        playerLocal.position,
        new THREE.Vector3(playerLocal.position.x, playerLocal.position.y, playerLocal.position.z - 15)
    ]);
    const laserMat = new THREE.LineBasicMaterial({ color: senjataSekarang === "SG2" ? 0xff5555 : 0xf1fa8c });
    const laser = new THREE.Line(laserGeo, laserMat);
    scene.add(laser);
    setTimeout(() => scene.remove(laser), 80);

    kirimDataKeMusuh({ aksi: 'tembak', jenis: senjataSekarang });
}

// Mobile Touch Control Setup Helper
function setupTouchControls() {
    document.getElementById('btn-shoot').addEventListener('touchstart', tembakSenjata);
    document.getElementById('btn-gloo').addEventListener('touchstart', pasangGlooWall);
    document.getElementById('btn-jump').addEventListener('touchstart', () => {
        if(isGrounded) { loncatVelocity = 0.2; isGrounded = false; }
    });
}

// Loop Animasi Konstan
function animate() {
    requestAnimationFrame(animate);

    // Atur Kecepatan (Lari vs Jalan)
    playerKecepatan = keys.Shift ? 0.2 : 0.08;

    // Gerakan WASD
    if (keys.w) playerLocal.position.z -= playerKecepatan;
    if (keys.s) playerLocal.position.z += playerKecepatan;
    if (keys.a) playerLocal.position.x -= playerKecepatan;
    if (keys.d) playerLocal.position.x += playerKecepatan;

    // Mekanika Lompat & Gravitasi Sederhana
    if (!isGrounded) {
        playerLocal.position.y += loncatVelocity;
        loncatVelocity -= 0.01; // Efek gaya gravitasi jatuh
        if (playerLocal.position.y <= 1) {
            playerLocal.position.y = 1;
            isGrounded = true;
            loncatVelocity = 0;
        }
    }

    // Kamera mengikuti player secara mulus
    camera.position.x = playerLocal.position.x;
    camera.position.z = playerLocal.position.z + 6;

    // Kirim koordinat posisi kita ke server biar musuh bisa melihat gerakan kita
    if(roomCode !== "") {
        kirimDataKeMusuh({
            aksi: 'gerak',
            x: playerLocal.position.x,
            y: playerLocal.position.y,
            z: playerLocal.position.z
        });
    }

    renderer.render(scene, camera);
}

// Jaringan Multiplayer (Socket.IO)
function hubungkanJaringan() {
    socket = io();

    socket.on('connect', () => {
        socket.emit('join_game', { room: roomCode, id: myId, username: "Player STAS" });
        document.getElementById('ui-status').innerText = "Mencari Musuh...";
    });

    socket.on('player_joined', (data) => {
        document.getElementById('ui-status').innerText = "Musuh Terhubung! Siap Tempur.";
        // Buat avatar untuk musuh (Box Merah)
        if (!musuhRemote) {
            const mGeo = new THREE.BoxGeometry(1, 2, 1);
            const mMat = new THREE.MeshStandardMaterial({ color: 0xff5555 });
            musuhRemote = new THREE.Mesh(mGeo, mMat);
            musuhRemote.position.set(0, 1, -5);
            scene.add(musuhRemote);
        }
    });

    socket.on('player_updated', (data) => {
        if (!musuhRemote) {
            const mGeo = new THREE.BoxGeometry(1, 2, 1);
            const mMat = new THREE.MeshStandardMaterial({ color: 0xff5555 });
            musuhRemote = new THREE.Mesh(mGeo, mMat);
            scene.add(musuhRemote);
        }

        // Terapkan aksi atau pergerakan yang dikirim oleh musuh
        if (data.aksi === 'gerak') {
            musuhRemote.position.set(data.x, data.y, data.z);
        } else if (data.aksi === 'gloo') {
            const wallGeo = new THREE.BoxGeometry(3, 2, 0.3);
            const wallMat = new THREE.MeshStandardMaterial({ color: 0x89b4fa, transparent:true, opacity:0.5 });
            const enemyWall = new THREE.Mesh(wallGeo, wallMat);
            enemyWall.position.set(data.x, 1, data.z);
            scene.add(enemyWall);
            setTimeout(() => scene.remove(enemyWall), 7000);
        } else if (data.aksi === 'tembak') {
            // Muncul efek tembakan musuh ke arah kita
            console.log("Musuh menembak menggunakan: " + data.jenis);
        }
    });
}

function kirimDataKeMusuh(payload) {
    payload.room = roomCode;
    payload.id = myId;
    socket.emit('update_player', payload);
}

// Tombol Masuk Lobby Event Listener
document.getElementById('btn-join').addEventListener('click', () => {
    const inputRoom = document.getElementById('room-id').value.trim();
    if (inputRoom !== "") {
        roomCode = inputRoom;
        document.getElementById('ui-room-text').innerText = roomCode;
        document.getElementById('lobby').style.display = 'none';
        document.getElementById('hud-senjata').style.display = 'flex';
        
        // Mulai Game & Koneksi Jaringan
        init3DWorld();
        hubungkanJaringan();
    } else {
        alert("Masukkan kode room terlebih dahulu!");
    }
});
