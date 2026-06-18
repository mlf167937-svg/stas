/**
 * STAS Arena - Stickman War 2D Jaringan Koneksi Sistem Modul
 */

(function() {
    const config = window.STAS_GAME_CFG;
    let socket = null;

    // Ambil referensi kontrol input DOM
    let inputP1 = { dx: 0, jump: false }, inputP2 = { dx: 0, jump: false };

    // =====================================================================
    // LOGIKA PENYETELAN JOYSTICK TOUCH SCREEN INTERACTIVE
    // =====================================================================
    function bindJoystickEvents(wrapId, knobId, onMoveCallback) {
        const wrap = document.getElementById(wrapId);
        const knob = document.getElementById(knobId);
        if(!wrap || !knob) return;
        
        let active = false, touchId = null, centerB = { x: 0, y: 0 };

        wrap.addEventListener('touchstart', (e) => {
            e.preventDefault(); let t = e.changedTouches[0];
            let r = wrap.getBoundingClientRect();
            centerB.x = r.left + r.width/2; centerB.y = r.top + r.height/2;
            active = true; touchId = t.identifier;
        });

        wrap.addEventListener('touchmove', (e) => {
            if (!active) return; e.preventDefault();
            let touch = Array.from(e.touches).find(t => t.identifier === touchId);
            if (!touch) return;

            let dx = touch.clientX - centerB.x; let dy = touch.clientY - centerB.y;
            let dist = Math.hypot(dx, dy);
            if (dist > 45) { dx = (dx/dist)*45; dy = (dy/dist)*45; }

            knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
            onMoveCallback(dx / 45, dy / 45);
        });

        const resetKnob = () => { active = false; knob.style.transform = 'translate(-50%, -50%)'; onMoveCallback(0, 0); };
        wrap.addEventListener('touchend', resetKnob); wrap.addEventListener('touchcancel', resetKnob);
    }

    // Ikat Event Joystick Player 1 (Kiri)
    bindJoystickEvents('js1', 'jk1', (x, y) => {
        inputP1.dx = x; if (y < -0.6) p1.jump();
    });

    document.getElementById('hitBtn1').addEventListener('touchstart', (e) => { e.preventDefault(); p1.attack(p2); });

    // Cek Kondisi Mode Laga Dari Konfigurasi STAS_GAME_CFG
    if (config.mode === 'online') {
        // Sembunyikan Analog Kanan untuk Mode Beda HP Online
        document.getElementById('ctrl-p2').classList.add('hidden');
        document.getElementById('p1Name').textContent = config.username;
        document.getElementById('p2Name').textContent = "MENUNGGU LAWAN...";

        // Hubungkan Socket Berbasis WebSocket Utama
        socket = io();

        socket.on('connect', () => {
            socket.emit('join_game', { room: config.room, username: config.username });
        });

        socket.on('game_assigned', (data) => {
            // Ubah label nama musuh jika room sudah penuh berdua
            if(data.all_players.length > 1) {
                let namaLawan = data.all_players.find(p => p !== config.username);
                document.getElementById('p2Name').textContent = namaLawan || "MUSUH";
            }
        });

        // Sinkronisasi data posisi koordinat yang dikirim balik oleh HP musuh
        socket.on('enemy_moved', (data) => {
            if (!p2) return;
            p2.x = data.x; p2.y = data.y; p2.hp = data.hp;
            p2.facing = data.flip ? -1 : 1;
            if (data.isAttacking && p2.cooldownTimer <= 0) { p2.attack(p1); }
        });

        // Mengirim paket koordinat kita secara berkala (Real-time Outbound Sync)
        setInterval(() => {
            if (socket && gameActive) {
                socket.emit('update_player_state', {
                    room: config.room, x: p1.x, y: p1.y, hp: p1.hp,
                    isAttacking: p1.swingTimer > 0, flip: p1.facing === -1
                });
            }
        }, 30); // 33ms interval = Sinkronisasi 30 Kali Per Detik (Sangat Mulus)

    } else {
        // JIKA MODE 1 HP (LOKAL) - Aktifkan Analog Kanan
        bindJoystickEvents('js2', 'jk2', (x, y) => {
            inputP2.dx = x; if (y < -0.6) p2.jump();
        });
        document.getElementById('hitBtn2').addEventListener('touchstart', (e) => { e.preventDefault(); p2.attack(p1); });
    }

    // Engine Penerap Input Per Frame Berjalan Paralel
    setInterval(() => {
        if (!gameActive) return; p1.move(inputP1.dx);
        if (config.mode !== 'online') { p2.move(inputP2.dx); }
    }, 1000 / 60);
})();
                                                                                                                 
