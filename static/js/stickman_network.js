/* ============================================================================
   STAS ARENA — STICKMAN NETWORK (STUB MULTIPLAYER)
   ----------------------------------------------------------------------------
   Tugas file ini:
   1. Baca query string URL: ?room=xxx&username=yyy
   2. Kalau room terdeteksi DAN bukan "offline" -> mode ONLINE:
        - Render log koneksi "Menghubungi Arena Room [Nama Room]..." di UI
        - (Stub) coba konek ke Socket.IO kalau library-nya ada & server hidup
        - Kalau Socket.IO gak tersedia / gagal connect -> fallback ke
          "simulasi lokal" (mensimulasikan musuh online) BIAR TETAP BISA DEMO
        - Trigger sync gerakan dasar P2 dari data simulasi/remote
   3. Kalau room = "offline" (atau gak ada param sama sekali) -> serahkan
      sepenuhnya kontrol P2 ke AI Bot lokal yang sudah ada di stickman_engine.js
      (alias: file ini gak ngapa-ngapain ke P2, biarin AI jalan sendiri)

   File ini SENGAJA dibuat gak nge-block kalau STASEngine belum siap atau
   Socket.IO belum dipasang di server Flask kalian — semua dibungkus try/catch
   dan fallback yang aman, jadi gak bikin game crash pas demo, cuks.

   Cara pakai di HTML (taruh SETELAH stickman_engine.js):
     <script src="{{ url_for('static', filename='js/stickman_engine.js') }}"></script>
     <script src="{{ url_for('static', filename='js/stickman_network.js') }}"></script>
     <script>
       STASEngine.init('arenaCanvas');
       STASNetwork.init(STASEngine); // <-- penting, kasih tau network siapa engine-nya
       STASEngine.start();
     </script>

   Elemen log opsional di HTML (kalau ada, network bakal nulis status ke situ):
     <div id="networkLog"></div>
   ============================================================================ */

(function (window) {
  "use strict";

  const NET_CONFIG = {
    logElementId: "networkLog",
    socketIoCdnTimeoutMs: 2500, // batas waktu nunggu socket.io ready sebelum fallback
    simTickIntervalMs: 700,     // interval gerak simulasi musuh online (fallback mode)
    reconnectDelayMs: 3000,
    maxReconnectAttempts: 3,
    syncEmitIntervalMs: 80,     // seberapa sering kirim snapshot lokal ke room (~12x/detik)
  };

  /* ============================================================
     UTIL
     ============================================================ */
  function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      room: (params.get("room") || "").trim(),
      username: (params.get("username") || "").trim(),
    };
  }

  function nowStr() {
    const d = new Date();
    return d.toLocaleTimeString("id-ID", { hour12: false });
  }

  /* ============================================================
     CLASS: STICKMAN NETWORK
     ============================================================ */
  class StickmanNetwork {
    constructor() {
      this.engine = null;
      this.mode = "offline"; // "offline" | "online-socket" | "online-sim"
      this.room = null;
      this.username = null;
      this.socket = null;
      this.connected = false;
      this.reconnectAttempts = 0;

      this._simTimer = null;
      this._simState = { dir: 1, x: 0, lastAttack: 0 };
      this._syncTimer = null;

      this._logEl = null;

      // Hook eksternal (boleh dioverride dari luar/HTML)
      this.onLog = null;            // (text) => {}
      this.onConnected = null;      // (roomName) => {}
      this.onDisconnected = null;   // () => {}
      this.onOpponentJoined = null; // (username) => {}
    }

    /* ---------------------------------------------------------
       INIT
       --------------------------------------------------------- */
    init(engineInstance) {
      this.engine = engineInstance || window.STASEngine || null;
      this._logEl = document.getElementById(NET_CONFIG.logElementId);

      const { room, username } = getQueryParams();
      this.room = room || "offline";
      this.username = username || "Player_" + Math.floor(Math.random() * 9000 + 1000);

      this._log(`Inisialisasi network module. Room terdeteksi: "${this.room}", username: "${this.username}".`);

      if (!this.engine) {
        this._log("Waduh cuks, STASEngine belum di-init duluan. Network nunggu sampai engine ready.");
      }

      if (this._isOfflineRoom(this.room)) {
        this._goOffline();
      } else {
        this._goOnline(this.room, this.username);
      }

      return this;
    }

    _isOfflineRoom(room) {
      if (!room) return true;
      const normalized = room.toLowerCase();
      return normalized === "offline" || normalized === "local" || normalized === "";
    }

    /* ---------------------------------------------------------
       LOGGING (ke console + ke elemen HTML kalau ada)
       --------------------------------------------------------- */
    _log(text) {
      const line = `[${nowStr()}] ${text}`;
      console.log(`%c[STAS-NET] ${line}`, "color:#00f5d4;font-weight:bold;");

      if (this._logEl) {
        const p = document.createElement("div");
        p.className = "net-log-line";
        p.textContent = line;
        this._logEl.appendChild(p);
        // auto-scroll ke bawah biar log terbaru selalu kelihatan
        this._logEl.scrollTop = this._logEl.scrollHeight;

        // biar log gak numpuk sampe bikin lag, batasi 60 baris terakhir
        while (this._logEl.children.length > 60) {
          this._logEl.removeChild(this._logEl.firstChild);
        }
      }

      if (typeof this.onLog === "function") {
        this.onLog(line);
      }
    }

    /* ============================================================
       MODE OFFLINE — AI Bot lokal yang ambil alih (sudah dihandle
       stickman_engine.js secara default). Di sini kita cuma mastiin
       flag-nya bener dan kasih log informatif.
       ============================================================ */
    _goOffline() {
      this.mode = "offline";
      this.connected = false;
      this._log("Mode OFFLINE aktif. AI Bot lokal yang bakal gerakin Player 2. Gas latihan dulu, cuks!");

      if (this.engine && this.engine.player2) {
        this.engine.player2.isAI = true;
        this.engine.player2.isRemote = false;
        this.engine.player2.name = "AI BOT";
      } else if (this.engine) {
        // Engine ada tapi player2 belum dibuat (kemungkinan init() belum dipanggil)
        // Pasang listener ringan: begitu engine siap, kita set ulang.
        this._waitForEngineThen(() => {
          this.engine.player2.isAI = true;
          this.engine.player2.isRemote = false;
          this.engine.player2.name = "AI BOT";
        });
      }
    }

    _waitForEngineThen(callback, attempts) {
      attempts = attempts || 0;
      if (this.engine && this.engine.player2) {
        callback();
        return;
      }
      if (attempts > 50) {
        this._log("Engine gak kunjung siap setelah ditunggu. Cek urutan script di HTML ya, cuks.");
        return;
      }
      setTimeout(() => this._waitForEngineThen(callback, attempts + 1), 100);
    }

    /* ============================================================
       MODE ONLINE — coba Socket.IO dulu, fallback ke simulasi lokal
       kalau library/server gak tersedia. Tetap UX-friendly buat demo.
       ============================================================ */
    _goOnline(room, username) {
      this.room = room;
      this.username = username;
      this._log(`Menghubungi Arena Room "${room}"...`);
      this._log(`Login sebagai "${username}". Nyiapin koneksi...`);

      if (this.engine) {
        this.engine.player2.isAI = false; // matiin AI lokal, nunggu data remote
        this.engine.player2.isRemote = true;
      } else {
        this._waitForEngineThen(() => {
          this.engine.player2.isAI = false;
          this.engine.player2.isRemote = true;
        });
      }

      const hasSocketIO = typeof window.io === "function";

      if (hasSocketIO) {
        this._connectSocketIO(room, username);
      } else {
        this._log(
          "Library Socket.IO gak kedetect di halaman ini (client belum include socket.io.js). " +
            "Lanjut pakai mode SIMULASI biar tetep bisa dicoba dulu, cuks."
        );
        this._startSimulationMode(room, username);
      }
    }

    /* ---------------------------------------------------------
       SOCKET.IO REAL CONNECTION
       --------------------------------------------------------- */
    _connectSocketIO(room, username) {
      this.mode = "online-socket";
      try {
        this.socket = window.io({
          query: { room, username },
          timeout: NET_CONFIG.socketIoCdnTimeoutMs,
          reconnectionAttempts: NET_CONFIG.maxReconnectAttempts,
        });

        const connectTimeout = setTimeout(() => {
          if (!this.connected) {
            this._log("Koneksi Socket.IO timeout. Server mungkin belum nyala. Fallback ke mode simulasi, cuks.");
            this._safeDisconnectSocket();
            this._startSimulationMode(room, username);
          }
        }, NET_CONFIG.socketIoCdnTimeoutMs);

        this.socket.on("connect", () => {
          clearTimeout(connectTimeout);
          this.connected = true;
          this.reconnectAttempts = 0;
          this._log(`Berhasil konek ke server! Join room "${room}" sebagai "${username}".`);
          this.socket.emit("join_room", { room, username });
          if (typeof this.onConnected === "function") this.onConnected(room);
          this._startSyncLoop();
        });

        this.socket.on("opponent_joined", (data) => {
          const opponentName = (data && data.username) || "Lawan";
          this._log(`"${opponentName}" join ke room. Siap-siap berantem, cuks!`);
          if (this.engine) this.engine.setPlayerName("p2", opponentName);
          if (typeof this.onOpponentJoined === "function") this.onOpponentJoined(opponentName);
        });

        this.socket.on("opponent_state", (snapshot) => {
          if (this.engine) {
            this.engine.applyRemoteSnapshot(snapshot);
          }
        });

        this.socket.on("opponent_left", () => {
          this._log("Lawan keluar dari room. Balik ke mode AI lokal sementara biar gak nge-freeze.");
          if (this.engine) {
            this.engine.player2.isAI = true;
            this.engine.player2.isRemote = false;
          }
        });

        this.socket.on("disconnect", () => {
          this.connected = false;
          this._log("Koneksi ke server kepustus. Nyoba reconnect...");
          if (typeof this.onDisconnected === "function") this.onDisconnected();
          this._stopSyncLoop();
        });

        this.socket.on("connect_error", (err) => {
          this.reconnectAttempts++;
          this._log(
            `Gagal konek (percobaan ke-${this.reconnectAttempts}): ${
              (err && err.message) || "unknown error"
            }`
          );
          if (this.reconnectAttempts >= NET_CONFIG.maxReconnectAttempts) {
            clearTimeout(connectTimeout);
            this._log("Udah nyoba beberapa kali tapi tetep gagal. Fallback ke mode simulasi aja dulu, cuks.");
            this._safeDisconnectSocket();
            this._startSimulationMode(room, username);
          }
        });
      } catch (err) {
        this._log(`Error pas nyoba Socket.IO: ${err.message}. Fallback ke simulasi.`);
        this._startSimulationMode(room, username);
      }
    }

    _safeDisconnectSocket() {
      try {
        if (this.socket) {
          this.socket.removeAllListeners && this.socket.removeAllListeners();
          this.socket.disconnect();
        }
      } catch (e) {
        // diem aja, ini cuma cleanup best-effort
      }
      this.socket = null;
      this.connected = false;
    }

    /* ---------------------------------------------------------
       SYNC LOOP — kirim snapshot posisi lokal (P1) ke server
       berkala, biar lawan online bisa lihat gerakan kita.
       --------------------------------------------------------- */
    _startSyncLoop() {
      this._stopSyncLoop();
      this._syncTimer = setInterval(() => {
        if (!this.connected || !this.socket || !this.engine) return;
        try {
          const snapshot = this.engine.getLocalSnapshot();
          this.socket.emit("player_state", { room: this.room, username: this.username, snapshot });
        } catch (e) {
          // skip tick ini kalau ada error sesaat, gak usah berisik di log tiap tick
        }
      }, NET_CONFIG.syncEmitIntervalMs);
    }

    _stopSyncLoop() {
      if (this._syncTimer) {
        clearInterval(this._syncTimer);
        this._syncTimer = null;
      }
    }

    /* ============================================================
       MODE SIMULASI (FALLBACK) — dipakai kalau Socket.IO gak ada
       atau server belum nyala. Tujuannya biar developer/demo tetap
       bisa lihat "pergerakan sync dasar" walau belum ada backend
       multiplayer beneran.
       ============================================================ */
    _startSimulationMode(room, username) {
      this.mode = "online-sim";
      this.connected = true; // dianggap "tersambung" secara simulasi
      this._log(`Mode SIMULASI ONLINE aktif untuk room "${room}". Musuh dummy bakal gerak otomatis.`);
      this._log('Begitu backend Socket.IO Flask kalian siap, mode ini otomatis kepake duluan oleh "online-socket".');

      if (typeof this.onConnected === "function") this.onConnected(room);

      this._waitForEngineThen(() => {
        this.engine.setPlayerName("p2", "Lawan (Simulasi)");
        this.engine.player2.isAI = false;
        this.engine.player2.isRemote = true;
        this._simState.x = this.engine.player2.x;

        setTimeout(() => {
          this._log(`"Lawan (Simulasi)" join ke room. Pergerakan sync dasar dimulai.`);
          if (typeof this.onOpponentJoined === "function") this.onOpponentJoined("Lawan (Simulasi)");
        }, 800);
      });

      this._stopSimLoop();
      this._simTimer = setInterval(() => this._simTick(), NET_CONFIG.simTickIntervalMs);
    }

    _stopSimLoop() {
      if (this._simTimer) {
        clearInterval(this._simTimer);
        this._simTimer = null;
      }
    }

    /**
     * Satu "tick" simulasi: gerakin player2 bolak-balik dan sesekali
     * nge-trigger attack, biar keliatan kayak ada lawan beneran yang
     * gerak walau sebenernya cuma scripted dummy.
     */
    _simTick() {
      if (!this.engine || !this.engine.player2) return;
      const f = this.engine.player2;
      const p1 = this.engine.player1;
      if (!p1) return;

      const dist = p1.x - f.x;
      const absDist = Math.abs(dist);

      // Snapshot baru hasil "logika lawan" sederhana
      const snapshot = {
        x: f.x,
        y: f.y,
        vx: 0,
        vy: f.vy,
        facing: dist >= 0 ? 1 : -1,
        hp: f.hp,
        state: undefined,
      };

      if (absDist > 90) {
        const dir = dist > 0 ? 1 : -1;
        snapshot.x = f.x + dir * 18; // loncat posisi tiap tick (sync kasar, bukan smooth)
        snapshot.state = this.engine.STATE ? this.engine.STATE.MOVE : "move";
      } else if (Date.now() - this._simState.lastAttack > 1400) {
        this._simState.lastAttack = Date.now();
        snapshot.state = this.engine.STATE ? this.engine.STATE.ATTACK : "attack";
        // Manual trigger attack lewat input biar lewat jalur collision yang sama dengan AI
        f.input.attack = true;
        setTimeout(() => {
          f.input.attack = false;
        }, 120);
      } else {
        snapshot.state = this.engine.STATE ? this.engine.STATE.IDLE : "idle";
      }

      this.engine.applyRemoteSnapshot(snapshot);
      this._log(`Sync posisi lawan simulasi -> x:${Math.round(snapshot.x)}, state:${snapshot.state}`);
    }

    /* ============================================================
       PUBLIC API TAMBAHAN
       ============================================================ */

    /**
     * Dipanggil manual kalau user klik tombol "Putuskan Koneksi" di UI.
     */
    disconnect() {
      this._log("Memutus koneksi arena online...");
      this._stopSimLoop();
      this._stopSyncLoop();
      this._safeDisconnectSocket();
      this.connected = false;
      this.mode = "offline";

      if (this.engine && this.engine.player2) {
        this.engine.player2.isAI = true;
        this.engine.player2.isRemote = false;
        this.engine.player2.name = "AI BOT";
      }
      this._log("Balik ke mode offline. AI lokal ambil alih lagi.");
    }

    /**
     * Info ringkas status koneksi, berguna buat ditampilin di badge UI.
     */
    getStatus() {
      return {
        mode: this.mode,
        room: this.room,
        username: this.username,
        connected: this.connected,
      };
    }
  }

  /* ============================================================
     EXPORT GLOBAL
     ============================================================ */
  window.STASNetwork = new StickmanNetwork();

  console.log(
    "%c[STAS-NET] stickman_network.js loaded. Panggil STASNetwork.init(STASEngine) setelah engine di-init, cuks.",
    "color:#00f5d4;font-weight:bold;"
  );
})(window);
