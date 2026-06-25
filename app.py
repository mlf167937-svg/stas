import os
import random
import string
import json
import uuid
from datetime import datetime, timezone, timedelta
from functools import wraps
from flask import (
    Flask, render_template, request, redirect,
    url_for, session, jsonify, flash, send_from_directory
)
# Import Flask-SocketIO
from flask_socketio import SocketIO, emit, join_room, leave_room

app = Flask(__name__)
app.secret_key = "STAS_SUPER_SECRET_KEY_PERMANENT"

# FIX: Menggunakan async_mode='gevent' agar kompatibel penuh dengan Python 3.14 Render
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='gevent')

# ─── KONSTANTA PATH & FOLDER ───────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
STAS_DIR   = os.path.join(BASE_DIR, 'stas')
DB_DIR     = os.path.join(STAS_DIR, 'database')
NAME_DIR   = os.path.join(STAS_DIR, 'name')
DESK_DIR   = os.path.join(STAS_DIR, 'desk')
GALERY_DIR = os.path.join(STAS_DIR, 'galery')

# Database Chat (Persisten)
CHAT_FILE  = os.path.join(STAS_DIR, 'chat_history.json')

# Bikin folder otomatis kalau belum ada
for d in [STAS_DIR, DB_DIR, NAME_DIR, DESK_DIR, GALERY_DIR]:
    os.makedirs(d, exist_ok=True)

# Bikin file chat kosong kalau belum ada
if not os.path.exists(CHAT_FILE):
    with open(CHAT_FILE, 'w', encoding='utf-8') as f:
        json.dump([], f)

# Password Admin
ADMIN_PASSWORD = "STAS@ayfuwb71iahy!"


# ─── MULTIPLAYER ADVANCED ROOM STATE MANAGEMENT ───────────────────────────────
game_rooms = {}       # { room_code: GameRoom Instance }
player_sessions = {}  # { socket_id: { id, room, username } }

class GameRoom:
    """Merepresentasikan satu room arena pertandingan (Maksimal 2 Player / Duel)"""
    def __init__(self, code):
        self.code = code
        self.players = []
        self.gloo_walls = {}  # Memori pelindung taktikal { idWall: {x, z, rotY, hp} }
        self.created_at = datetime.now()
        self.is_active = False
        self.player_count = 0
        
    def add_player(self, player_id, username):
        """Menambahkan player ke dalam room state"""
        self.players.append({
            'id': player_id,
            'username': username,
            'hp': 200,
            'status': 'alive',
            'x': 0, 'y': 0, 'z': 0,
            'rotY': 0
        })
        self.player_count = len(self.players)
        
    def remove_player(self, player_id):
        """Menghapus player dari room state"""
        self.players = [p for p in self.players if p['id'] != player_id]
        self.player_count = len(self.players)
        
    def get_player(self, player_id):
        """Mendapatkan informasi lengkap salah satu player"""
        for p in self.players:
            if p['id'] == player_id:
                return p
        return None
    
    def is_full(self):
        return self.player_count >= 2
    
    def is_empty(self):
        return self.player_count == 0


# ─── HELPER BACA/TULIS FILE WEB UTAMA ──────────────────────────────────────────
def read_file(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return f.read().strip()
    except FileNotFoundError:
        return ''

def get_all_members():
    members = []
    if not os.path.isdir(NAME_DIR):
        return members
    for filename in sorted(os.listdir(NAME_DIR)):
        if filename.endswith('.txt'):
            username = filename[:-4]
            name     = read_file(os.path.join(NAME_DIR, filename))
            
            desk_content = ''
            if os.path.isdir(DESK_DIR):
                for d_fname in os.listdir(DESK_DIR):
                    if d_fname.lower() == f'{username}.txt'.lower():
                        desk_content = read_file(os.path.join(DESK_DIR, d_fname))
                        break
                        
            members.append({'username': username, 'name': name, 'desk': desk_content})
    return members

def get_member_db(username):
    target_file = f"{username}.txt"
    real_filename = None
    
    if os.path.isdir(DB_DIR):
        for fname in os.listdir(DB_DIR):
            if fname.lower() == target_file.lower():
                real_filename = fname
                break
                
    if not real_filename:
        return None
        
    db_path = os.path.join(DB_DIR, real_filename)
    content = read_file(db_path)
    if not content:
        return None
    lines = [line for line in content.splitlines() if not line.upper().startswith('PASSWORD')]
    return '\n'.join(lines)

def verify_member(username, password):
    target_file = f"{username}.txt"
    real_filename = None
    
    if os.path.isdir(DB_DIR):
        for fname in os.listdir(DB_DIR):
            if fname.lower() == target_file.lower():
                real_filename = fname
                break
                
    if not real_filename:
        return False
        
    db_path = os.path.join(DB_DIR, real_filename)
    content = read_file(db_path)
    if not content:
        return False
        
    for line in content.splitlines():
        if line.upper().startswith('PASSWORD'):
            stored_pass = line.split(':', 1)[-1].strip()
            return stored_pass == password
    return False

def generate_captcha(length=6):
    chars = string.ascii_letters + string.digits
    return ''.join(random.choices(chars, k=length))

def load_chat():
    try:
        with open(CHAT_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return []

def save_chat(data):
    with open(CHAT_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)


# ─── DECORATOR LOGIN ───────────────────────────────────────────────────────────
def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'member' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get('is_admin'):
            return redirect(url_for('admin_login'))
        return f(*args, **kwargs)
    return decorated


# ─── ROUTE WEB UTAMA & GAMES ───────────────────────────────────────────────────
@app.route('/')
@login_required
def index():
    members = get_all_members()
    return render_template('index.html', members=members)

@app.route('/games')
@login_required
def games():
    return render_template('games.html')

@app.route('/games/typing')
@login_required
def game_typing():
    return render_template('typing_game.html')

@app.route('/games/blockblast')
@login_required
def game_blockblast():
    return render_template('block_blast.html')

@app.route('/games/3d')
@login_required
def game_3d():
    return render_template('game_3d.html')


# ─── LOGIKA MULTIPLAYER REALTIME SOCKET.IO (GABUNGAN MATANG) ──────────────────
@socketio.on('connect')
def handle_connect():
    print(f"[CONNECT] Client terhubung ke game: {request.sid}")

@socketio.on('join_game')
def handle_join_game(data):
    room = data.get('room', '').strip().upper()
    player_id = data.get('id', '')
    
    # Ambil username asli dari session login website agar sinkron, jika tdk ada gunakan fallback data
    username = session.get('fullname') or session.get('member') or data.get('username', 'Unknown Player')
    
    if not room or len(room) < 3:
        emit('error', {'message': 'Kode room tidak valid!'})
        return
    
    if not player_id:
        emit('error', {'message': 'Player ID terdeteksi kosong!'})
        return
    
    # Buat instance room baru jika belum ada di RAM server
    if room not in game_rooms:
        game_rooms[room] = GameRoom(room)
    
    room_obj = game_rooms[room]
    
    if room_obj.is_full():
        emit('error', {'message': 'Room penuh! Maksimal duel adalah 2 player.'})
        return
    
    join_room(room)
    room_obj.add_player(player_id, username)
    
    # Daftarkan ke global session tracking
    player_sessions[request.sid] = {
        'id': player_id,
        'room': room,
        'username': username,
        'socket_id': request.sid
    }
    
    print(f"[JOIN] {username} bergabung ke arena room {room} ({room_obj.player_count}/2)")
    
    # Beritahu musuh di dalam room
    emit('player_joined', {
        'player_id': player_id,
        'username': username,
        'players_in_room': room_obj.player_count
    }, room=room)
    
    # KUNCI SINKRONISASI: Kirim data sisa Gloo Wall yang aktif di server ke player baru
    for wall_id, wall_data in room_obj.gloo_walls.items():
        emit('player_updated', {
            'aksi': 'gloo',
            'idWall': wall_id,
            'x': wall_data['x'],
            'z': wall_data['z'],
            'rotY': wall_data['rotY']
        }, to=request.sid)
    
    # Jika room sudah pas berdua, pemicu game start dilepas
    if room_obj.is_full():
        room_obj.is_active = True
        emit('game_ready', {
            'message': 'Musuh ditemukan! Pertempuran dimulai...',
            'players': room_obj.player_count
        }, room=room)

@socketio.on('update_player')
def handle_player_update(data):
    room = data.get('room', '').strip().upper()
    player_id = data.get('id', '')
    aksi = data.get('aksi', '')
    
    if room not in game_rooms:
        return
    
    room_obj = game_rooms[room]
    player = room_obj.get_player(player_id)
    
    if not player:
        return
    
    # 1. Olah Posisi Navigasi Koordinat 3D
    if aksi == 'gerak':
        player['x'] = data.get('x', player['x'])
        player['y'] = data.get('y', player['y'])
        player['z'] = data.get('z', player['z'])
        player['rotY'] = data.get('rotY', player['rotY'])
    
    # 2. Olah Sistem Tempur & Pemasangan Gloo Wall Taktis
    elif aksi == 'gloo':
        room_obj.gloo_walls[data['idWall']] = {
            'x': data['x'],
            'z': data['z'],
            'rotY': data['rotY'],
            'hp': 300
        }
    elif aksi == 'gloo_hit':
        wall_id = data.get('idWall')
        if wall_id in room_obj.gloo_walls:
            room_obj.gloo_walls[wall_id]['hp'] -= data.get('dmg', 0)
            if room_obj.gloo_walls[wall_id]['hp'] <= 0:
                room_obj.gloo_walls.pop(wall_id, None)
                
    # 3. Olah Damage System & Eliminasi Playzone/Senjata
    elif aksi == 'berikan_damage':
        damage = data.get('besarDamage', 0)
        player['hp'] = max(0, player['hp'] - damage)
        if player['hp'] <= 0:
            player['status'] = 'dead'
            
    elif aksi == 'mati_total':
        player['status'] = 'eliminated'
        print(f"[ELIMINATED] {player['username']} gugur di room {room}")
        
    # Teruskan packet data realtime ke client lawan di room tersebut
    emit('player_updated', data, room=room, include_self=False)

@socketio.on('room_stats')
def handle_room_stats(data):
    room = data.get('room', '').strip().upper()
    if room not in game_rooms:
        emit('room_stats_response', {'error': 'Room tidak ditemukan'})
        return
    room_obj = game_rooms[room]
    emit('room_stats_response', {
        'code': room,
        'players': room_obj.player_count,
        'active': room_obj.is_active,
        'created': str(room_obj.created_at),
        'player_list': [{'id': p['id'], 'username': p['username'], 'hp': p['hp'], 'status': p['status']} for p in room_obj.players]
    })

@socketio.on('disconnect')
def handle_disconnect():
    socket_id = request.sid
    if socket_id in player_sessions:
        session_data = player_sessions[socket_id]
        player_id = session_data['id']
        room = session_data['room']
        username = session_data['username']
        
        print(f"[DISCONNECT] {username} keluar/terputus dari room {room}")
        
        if room in game_rooms:
            room_obj = game_rooms[room]
            room_obj.remove_player(player_id)
            
            # Perintahkan musuh untuk langsung menghapus model karakter leaver dari map
            emit('player_updated', {
                'aksi': 'mati_total',
                'id': player_id
            }, room=room, include_self=False)
            
            # Kirim sinyal rincian diskoneksi ke lawan
            emit('opponent_disconnected', {
                'message': f'Musuh ({username}) meninggalkan permainan.',
                'player_id': player_id
            }, room=room, include_self=False)
            
            # Bersihkan RAM Server dari room kosong
            if room_obj.is_empty():
                game_rooms.pop(room, None)
                print(f"[CLEANUP] Room {room} berhasil dihapus dari server karena kosong.")
                
        player_sessions.pop(socket_id, None)


# ─── ROUTE UNTUK MONITORING HEALTH SERVER (DARI CLAUDE) ──────────────────────
@app.route('/health')
def health_check():
    return {
        'status': 'ok',
        'active_rooms': len(game_rooms),
        'active_players': len(player_sessions),
        'timestamp': datetime.now().isoformat()
    }, 200

@app.route('/stats')
def get_stats():
    return {
        'status': 'running',
        'active_rooms': len(game_rooms),
        'active_players': len(player_sessions),
        'rooms': [
            {
                'code': r.code,
                'players': r.player_count,
                'active': r.is_active,
                'created': str(r.created_at)
            } for r in game_rooms.values()
        ]
    }, 200


# ─── AUTHENTICATION ROUTES ─────────────────────────────────────────────────────
@app.route('/login', methods=['GET', 'POST'])
def login():
    if 'member' in session:
        return redirect(url_for('index'))
    error = None
    if request.method == 'POST':
        username_input = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()
        
        if verify_member(username_input, password):
            session_username = username_input
            if os.path.isdir(NAME_DIR):
                for fname in os.listdir(NAME_DIR):
                    if fname.lower() == f"{username_input}.txt".lower():
                        session_username = fname[:-4]
                        break
                        
            session['member']   = session_username
            name_path = os.path.join(NAME_DIR, f'{session_username}.txt')
            session['fullname'] = read_file(name_path) if os.path.exists(name_path) else session_username
            session['is_guest'] = False
            return redirect(url_for('index'))
            
        error = 'Username atau password salah.'
    return render_template('login.html', error=error)

@app.route('/login-guest')
def login_guest():
    if 'member' in session:
        return redirect(url_for('index'))
    guest_id = random.randint(1000, 9999)
    session['member']   = f'guest_{guest_id}'
    session['fullname'] = f'Tamu_{guest_id}'
    session['is_guest'] = True 
    return redirect(url_for('index'))

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/komunitas')
@login_required
def komunitas():
    members = get_all_members() 
    return render_template('komunitas.html', members=members)

@app.route('/album')
@login_required
def album():
    files = []
    if os.path.isdir(GALERY_DIR):
        for fname in sorted(os.listdir(GALERY_DIR)):
            ext = fname.rsplit('.', 1)[-1].lower()
            if ext in ('jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'mov'):
                ftype = 'video' if ext in ('mp4', 'webm', 'mov') else 'image'
                files.append({'name': fname, 'type': ftype, 'url': f'/stas/galery/{fname}'})
    return render_template('album.html', files=files)


# ─── ROUTE KHUSUS FILE & MEMBER API ────────────────────────────────────────────
@app.route('/stas/galery/<path:filename>')
@login_required
def custom_gallery_route(filename):
    return send_from_directory(GALERY_DIR, filename)

@app.route('/api/member/<username>')
@login_required
def api_member(username):
    real_username = username
    if os.path.isdir(NAME_DIR):
        for fname in os.listdir(NAME_DIR):
            if fname.lower() == f"{username}.txt".lower():
                real_username = fname[:-4]
                break

    name = read_file(os.path.join(NAME_DIR, f'{real_username}.txt'))
    
    desk_filename = f'{real_username}.txt'
    if os.path.isdir(DESK_DIR):
        for fname in os.listdir(DESK_DIR):
            if fname.lower() == f"{real_username}.txt".lower():
                desk_filename = fname
                break
                
    desk = read_file(os.path.join(DESK_DIR, desk_filename))
    db_data = get_member_db(real_username)
    
    if db_data is None:
        return jsonify({'error': 'Member tidak ditemukan'}), 404
    return jsonify({'username': real_username, 'name': name, 'desk': desk, 'db': db_data})


# ─── API CHAT KOMUNITAS PERSISTEN ──────────────────────────────────────────────
@app.route('/api/chat', methods=['GET'])
@login_required
def chat_get():
    chat_data = load_chat()
    for msg in chat_data:
        if 'id' not in msg: msg['id'] = str(uuid.uuid4())
        if 'username' not in msg: msg['username'] = msg.get('sender', 'unknown').lower()
        if 'type' not in msg: msg['type'] = 'text'
        if 'file_url' not in msg: msg['file_url'] = ''
        if 'reactions' not in msg or not isinstance(msg['reactions'], dict):
            msg['reactions'] = {"👍": [], "❤️": [], "😂": [], "😮": [], "🙏": []}
    return jsonify(chat_data[-50:])

@app.route('/api/chat', methods=['POST'])
@login_required
def chat_post():
    data = request.get_json(silent=True) or {}
    text = data.get('text', '').strip()
    msg_type = data.get('type', 'text')
    file_url = data.get('file_url', '')

    if not text and not file_url:
        return jsonify({'error': 'Pesan kosong'}), 400
    
    wib_timezone = timezone(timedelta(hours=7))
    waktu_sekarang = datetime.now(wib_timezone).strftime('%H:%M')
    
    if data.get('username') == 'stasai':
        username = 'stasai'
        sender = '🤖 STASAI'
    else:
        username = session.get('member')
        sender = session.get('fullname', session.get('member'))
    
    msg = {
        'id': str(uuid.uuid4()),
        'username': username,
        'sender': sender,
        'text': text,
        'type': msg_type,
        'file_url': file_url,
        'ts': waktu_sekarang,
        'reactions': {"👍": [], "❤️": [], "😂": [], "😮": [], "🙏": []}
    }
    
    chat_data = load_chat()
    chat_data.append(msg)
    save_chat(chat_data)
    return jsonify(msg), 201

@app.route('/api/chat/upload', methods=['POST'])
@app.route('/api/upload', methods=['POST'])
@login_required
def chat_upload():
    if session.get('is_guest'):
        return jsonify({"error": "Tamu tidak bisa upload"}), 403
    if 'file' not in request.files:
        return jsonify({"error": "No file"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    ext = file.filename.rsplit('.', 1)[-1].lower()
    filename = f"{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(GALERY_DIR, filename)
    file.save(filepath)
    
    file_type = 'image'
    if ext in ['mp4', 'webm', 'mov']: file_type = 'video'
    elif ext in ['wav', 'mp3', 'ogg'] or 'vn' in file.filename: file_type = 'audio'
    return jsonify({"file_url": f"/stas/galery/{filename}", "type": file_type})

@app.route('/api/chat/react', methods=['POST'])
@app.route('/api/chat/reaction', methods=['POST'])
@app.route('/api/react', methods=['POST'])
@login_required
def chat_react():
    if session.get('is_guest'): return jsonify({"error": "Tamu tidak bisa react"}), 403
    data = request.json or {}
    msg_id = data.get('msg_id')
    emoji = data.get('emoji')
    username = session.get('member')

    chat_data = load_chat()
    for msg in chat_data:
        if msg.get('id') == msg_id:
            if 'reactions' not in msg or not isinstance(msg['reactions'], dict):
                msg['reactions'] = {"👍": [], "❤️": [], "😂": [], "😮": [], "🙏": []}
            if emoji in msg['reactions']:
                if username in msg['reactions'][emoji]:
                    msg['reactions'][emoji].remove(username)
                else:
                    for emo in msg['reactions']:
                        if username in msg['reactions'][emo]: msg['reactions'][emo].remove(username)
                    msg['reactions'][emoji].append(username)
            break
    save_chat(chat_data)
    return jsonify({"status": "success"})

@app.route('/api/chat/delete/<msg_id>', methods=['DELETE'])
@app.route('/api/delete/<msg_id>', methods=['DELETE'])
@login_required
def chat_delete(msg_id):
    chat_data = load_chat()
    msg_to_delete = next((m for m in chat_data if m.get('id') == msg_id), None)
    if msg_to_delete:
        if msg_to_delete.get('username') == session.get('member') or session.get('is_admin'):
            chat_data = [msg for msg in chat_data if msg.get('id') != msg_id]
            save_chat(chat_data)
            return jsonify({"status": "success"})
        return jsonify({"status": "error", "message": "Akses ditolak"}), 403
    return jsonify({"status": "error", "message": "Pesan tidak ditemukan"}), 404

@app.route('/api/ai', methods=['POST'])
@login_required
def api_ai_assistant():
    return jsonify({'reply': "Pesan diterima backend STAS, mencari jawaban terbaik..."}), 200


# ─── ADMIN ROUTES & DASHBOARD SYSTEM ───────────────────────────────────────────
@app.route('/admin/chat', methods=['POST'])
@admin_required
def admin_chat_broadcast():
    data = request.get_json(silent=True) or {}
    text = data.get('text', '').strip()
    if text:
        wib_timezone = timezone(timedelta(hours=7))
        waktu_sekarang = datetime.now(wib_timezone).strftime('%H:%M')
        msg = {
            'id': str(uuid.uuid4()),
            'username': 'admin_system',
            'sender': '🛡️ SYSTEM',
            'text': f"📢 PENGUMUMAN: {text}", 
            'type': 'text',
            'file_url': '',
            'ts': waktu_sekarang,
            'reactions': {"👍": [], "❤️": [], "😂": [], "😮": [], "🙏": []}
        }
        chat_data = load_chat()
        chat_data.append(msg)
        save_chat(chat_data)
    return jsonify({'status': 'ok'})

@app.route('/admin/clear_chat', methods=['POST'])
@admin_required
def admin_clear_chat():
    save_chat([])
    return jsonify({'status': 'ok'})

@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if session.get('is_admin'): return redirect(url_for('admin_dashboard'))
    if 'captcha' not in session: session['captcha'] = generate_captcha()
    error = None
    if request.method == 'POST':
        password       = request.form.get('password', '').strip()
        captcha_input  = request.form.get('captcha', '').strip()
        captcha_stored = session.get('captcha', '')

        if captcha_input != captcha_stored:
            session['captcha'] = generate_captcha()
            error = 'Kode verifikasi salah.'
        elif password == ADMIN_PASSWORD:
            session['is_admin'] = True
            session['member'] = 'admin'
            session.pop('captcha', None)
            return redirect(url_for('admin_dashboard'))
        else:
            session['captcha'] = generate_captcha()
            error = 'Password admin salah.'
    return render_template('admin_login.html', error=error, captcha=session.get('captcha', ''))

@app.route('/admin/dashboard')
@admin_required
def admin_dashboard():
    members = get_all_members()
    return render_template('admin_dashboard.html', members=members)

@app.route('/admin/logout')
def admin_logout():
    session.pop('is_admin', None)
    return redirect(url_for('admin_login'))


# ─── RUN SERVER ENTRYPOINT ────────────────────────────────────────────────────
if __name__ == '__main__':
    print("🎮 SERVER GABUNGAN WEB & MULTIPLAYER 3D TELAH AKTIF (PORT 5000) 🟢")
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
