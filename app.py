import os
import sys
from flask import Flask, render_template, request, redirect, url_for, send_from_directory, jsonify, session
from flask_socketio import SocketIO, emit, join_room, leave_room

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "stas_super_secret_session_encryption_key_2026")

# Inisialisasi SocketIO untuk Real-time Multiplayer beda HP
socketio = SocketIO(app, cors_allowed_origins="*")

# =====================================================================
# 1. SETTING FOLDER DIREKTORI & KEY
# =====================================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STAS_DIR = os.path.join(BASE_DIR, 'stas')
NAMA_DIR = os.path.join(STAS_DIR, 'nama')
DESK_DIR = os.path.join(STAS_DIR, 'desk')
DB_DIR = os.path.join(STAS_DIR, 'database')
AVATAR_DIR = os.path.join(STAS_DIR, 'avatar')

for folder in [NAMA_DIR, DESK_DIR, DB_DIR, AVATAR_DIR]:
    os.makedirs(folder, exist_ok=True)

ADMIN_PASSWORD_KEY = "adminstas2026"

# Kumpulan Room Aktif untuk Multiplayer Beda HP
ACTIVE_ROOMS = {}

# =====================================================================
# 2. ENGINE AI LOKAL (DENGAN TRIGER "RUN GAME")
# =====================================================================
def respon_ai_lokal(pesan_user):
    pesan = pesan_user.lower().strip()
    
    if "run game" in pesan or "main game" in pesan or "buka game" in pesan:
        # Mengembalikan flag khusus berupa struktur json/teks agar di-render sebagai tombol oleh Javascript
        return "TRIGGER_GAME_BUTTON"
        
    elif "halo" in pesan or "hai" in pesan or "assalamualaikum" in pesan:
        return "Halo juga, cuks! Saya AI STAS lokal. Ada yang bisa saya bantu hari ini?"
    elif "siapa kamu" in pesan:
        return "Saya adalah AI STAS, program pintar pemandu komunitas Sang Tuan Alhidayah Sutam."
    elif "stas" in pesan or "komunitas" in pesan:
        return "STAS adalah komunitas tempat berkumpulnya para Tuan hebat untuk berbagi info dan teknologi."
    elif "admin" in pesan:
        return "Menu Admin UI digunakan untuk mengelola berkas database anggota menggunakan password khusus admin."
        
    return "Maaf cuks, AI STAS lokal belum paham maksudmu. Coba tanya hal lain atau ketik 'run game' jika ingin bermain!"

# =====================================================================
# 3. CONTROLLER UTILITIES (DATABASE FILE)
# =====================================================================
def load_members():
    members = []
    if not os.path.exists(NAMA_DIR): return members
    for filename in os.listdir(NAMA_DIR):
        if filename.endswith('.txt') and filename != '.gitkeep':
            user_id = filename[:-4]
            try:
                with open(os.path.join(NAMA_DIR, filename), 'r', encoding='utf-8') as f:
                    nama = f.read().strip()
                desk_path = os.path.join(DESK_DIR, filename)
                desk = ""
                if os.path.exists(desk_path):
                    with open(desk_path, 'r', encoding='utf-8') as f:
                        desk = f.read().strip()
                avatar_file = None
                for ext in ['.png', '.jpg', '.jpeg']:
                    if os.path.exists(os.path.join(AVATAR_DIR, f"{user_id}{ext}")):
                        avatar_file = f"{user_id}{ext}"
                        break
                members.append({
                    'id': user_id, 'nama': nama if nama else user_id,
                    'desk': desk if desk else "Anggota Komunitas STAS.",
                    'avatar': avatar_file, 'letter': nama[0].upper() if nama else '?'
                })
            except Exception: pass
    return sorted(members, key=lambda x: x['nama'].lower())

def verify_user_login(user_id, password_input):
    db_path = os.path.join(DB_DIR, f"{user_id}.txt")
    if not os.path.exists(db_path): return False
    try:
        with open(db_path, 'r', encoding='utf-8') as f:
            for line in f:
                if "PASSWORD:" in line.upper():
                    return line.split(":", 1)[1].strip() == password_input.strip()
    except Exception: return False
    return False

# =====================================================================
# 4. ROUTING WEB VIEW (NAVIGASI BARU: GENERAL, GAME, AI, ADMIN)
# =====================================================================
@app.route('/login', methods=['GET', 'POST'])
def login():
    if 'user' in session: return redirect(url_for('home'))
    error = None
    if request.method == 'POST':
        user_id = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()
        if verify_user_login(user_id, password):
            session['user'] = user_id
            return redirect(url_for('home'))
        error = "ID Anggota atau Password salah!"
    return render_template('login.html', error=error)

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/')
def index(): return redirect(url_for('home'))

@app.route('/home')
def home():
    if 'user' not in session: return redirect(url_for('login'))
    return render_template('index.html', members=load_members())

# PENGGANTI HALAMAN SEARCH (SEKARANG MENJADI SELECTION HUB MENU BANYAK GAMES)
@app.route('/games')
def games_hub():
    if 'user' not in session: return redirect(url_for('login'))
    return render_template('games_hub.html')

# ARENA GAME 1: STICKMAN WAR LAYOUT
@app.route('/games/stickman')
def game_stickman():
    if 'user' not in session: return redirect(url_for('login'))
    mode = request.args.get('mode', 'local') # 'local' (1 HP) atau 'online' (beda HP)
    room = request.args.get('room', 'default')
    return render_template('game_stickman.html', mode=mode, room=room, username=session['user'])

@app.route('/ai')
def ai():
    if 'user' not in session: return redirect(url_for('login'))
    return render_template('ai.html')

@app.route('/admin', methods=['GET', 'POST'])
def admin():
    if 'user' not in session: return redirect(url_for('login'))
    if session.get('admin_authed') == True:
        return render_template('admin.html', members=load_members())
    error = None
    if request.method == 'POST':
        if request.form.get('admin_password', '').strip() == ADMIN_PASSWORD_KEY:
            session['admin_authed'] = True
            return render_template('admin.html', members=load_members())
        error = "Password Akses Administrator Salah!"
    return render_template('admin_lock.html', error=error)

@app.route('/user/<user_id>')
def profile(user_id):
    if 'user' not in session: return redirect(url_for('login'))
    # Implementasi get_member ringkas
    nama_path = os.path.join(NAMA_DIR, f"{user_id}.txt")
    if not os.path.exists(nama_path): return "Tidak ditemukan", 404
    with open(nama_path, 'r', encoding='utf-8') as f: nama = f.read().strip()
    db_path = os.path.join(DB_DIR, f"{user_id}.txt")
    database = ""
    if os.path.exists(db_path):
        with open(db_path, 'r', encoding='utf-8') as f:
            database = "".join([l for l in f.readlines() if "PASSWORD:" not in l.upper()]).strip()
    return render_template('profile.html', member={'id': user_id, 'nama': nama, 'database': database})

@app.route('/avatar/<filename>')
def serve_avatar(filename): return send_from_directory(AVATAR_DIR, filename)

@app.route('/api/chat', methods=['POST'])
def api_chat():
    if 'user' not in session: return jsonify({'error': 'Unauthorized'}), 401
    data = request.get_json() or {}
    user_message = data.get('message', '').strip()
    if not user_message: return jsonify({'error': 'Pesan kosong.'}), 400
    
    jawaban = respon_ai_lokal(user_message)
    return jsonify({'reply': jawaban})

# =====================================================================
# 5. NETWORKING GAME LOGIC (SOCKET.IO MULTIPLAYER BEDA HP)
# =====================================================================
@socketio.on('join_game')
def on_join(data):
    room = data.get('room', 'default')
    username = data.get('username', 'Player')
    join_room(room)
    if room not in ACTIVE_ROOMS:
        ACTIVE_ROOMS[room] = []
    if username not in ACTIVE_ROOMS[room]:
        ACTIVE_ROOMS[room].append(username)
    
    # Tentukan apakah dia Player 1 atau Player 2 berdasarkan urutan join
    role = "player1" if ACTIVE_ROOMS[room].index(username) == 0 else "player2"
    emit('game_assigned', {'role': role, 'all_players': ACTIVE_ROOMS[room]}, room=room)

@socketio.on('update_player_state')
def on_update(data):
    # Teruskan koordinat stickman, gerakan analog, atau serangan ke HP musuh di room yang sama
    room = data.get('room', 'default')
    emit('enemy_moved', data, room=room, include_self=False)

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    # Ganti app.run dengan socketio.run agar fitur websocket aktif di Render
    socketio.run(app, host='0.0.0.0', port=port, debug=False)
