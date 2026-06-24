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

app = Flask(__name__)
app.secret_key = "STAS_SUPER_SECRET_KEY_PERMANENT"

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


# ─── HELPER BACA/TULIS FILE ────────────────────────────────────────────────────
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
            
            # Cari file deskripsi secara case-insensitive
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
    
    # Mencari file di folder database secara case-insensitive
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
    
    # Mencari file di folder database secara case-insensitive
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


# ─── ROUTE WEB UTAMA ───────────────────────────────────────────────────────────
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

@app.route('/login', methods=['GET', 'POST'])
def login():
    if 'member' in session:
        return redirect(url_for('index'))
    error = None
    if request.method == 'POST':
        username_input = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()
        
        if verify_member(username_input, password):
            # Cari kecocokan nama asli file (misal input 'isan' -> dapet 'Isan')
            session_username = username_input
            if os.path.isdir(NAME_DIR):
                for fname in os.listdir(NAME_DIR):
                    if fname.lower() == f"{username_input}.txt".lower():
                        session_username = fname[:-4]
                        break
                        
            session['member']   = session_username
            
            # Membaca file nama menggunakan case asli yang ditemukan
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


# ─── ROUTE KHUSUS FILE & MEMBER ────────────────────────────────────────────────
@app.route('/stas/galery/<path:filename>')
@login_required
def custom_gallery_route(filename):
    return send_from_directory(GALERY_DIR, filename)

@app.route('/api/member/<username>')
@login_required
def api_member(username):
    # Penanganan pencarian file name & desk secara case-insensitive
    real_username = username
    if os.path.isdir(NAME_DIR):
        for fname in os.listdir(NAME_DIR):
            if fname.lower() == f"{username}.txt".lower():
                real_username = fname[:-4]
                break

    name = read_file(os.path.join(NAME_DIR, f'{real_username}.txt'))
    
    # Cari file deskripsi
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


# ─── API CHAT KOMUNITAS (DENGAN PROTEKSI STRUKTUR DATA & ALIAS) ────────────────
@app.route('/api/chat', methods=['GET'])
@login_required
def chat_get():
    chat_data = load_chat()
    
    # 🛡️ AUTO-NORMALIZATION
    for msg in chat_data:
        if 'id' not in msg:
            msg['id'] = str(uuid.uuid4())
        if 'username' not in msg:
            msg['username'] = msg.get('sender', 'unknown').lower()
        if 'type' not in msg:
            msg['type'] = 'text'
        if 'file_url' not in msg:
            msg['file_url'] = ''
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


# 🔗 ALIAS UPLOAD
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
    if ext in ['mp4', 'webm', 'mov']:
        file_type = 'video'
    elif ext in ['wav', 'mp3', 'ogg'] or 'vn' in file.filename:
        file_type = 'audio'

    return jsonify({"file_url": f"/stas/galery/{filename}", "type": file_type})


# 🔗 ALIAS REAKSI EMOJI
@app.route('/api/chat/react', methods=['POST'])
@app.route('/api/chat/reaction', methods=['POST'])
@app.route('/api/react', methods=['POST'])
@login_required
def chat_react():
    if session.get('is_guest'):
        return jsonify({"error": "Tamu tidak bisa react"}), 403

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
                        if username in msg['reactions'][emo]:
                            msg['reactions'][emo].remove(username)
                    msg['reactions'][emoji].append(username)
            break
            
    save_chat(chat_data)
    return jsonify({"status": "success"})


# 🔗 ALIAS HAPUS CHAT
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
        else:
            return jsonify({"status": "error", "message": "Akses ditolak"}), 403
    return jsonify({"status": "error", "message": "Pesan tidak ditemukan"}), 404


# ─── API: STAS-AI ROUTE ────────────────────────────────────────────────────────
@app.route('/api/ai', methods=['POST'])
@login_required
def api_ai_assistant():
    return jsonify({'reply': "Pesan diterima backend STAS, mencari jawaban terbaik..."}), 200


# ─── ADMIN ROUTES & DASHBOARD ──────────────────────────────────────────────────
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
    if session.get('is_admin'):
        return redirect(url_for('admin_dashboard'))

    if 'captcha' not in session:
        session['captcha'] = generate_captcha()

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

    return render_template('admin_login.html',
                           error=error,
                           captcha=session.get('captcha', ''))

@app.route('/admin/dashboard')
@admin_required
def admin_dashboard():
    members = get_all_members()
    return render_template('admin_dashboard.html', members=members)

@app.route('/admin/logout')
def admin_logout():
    session.pop('is_admin', None)
    return redirect(url_for('admin_login'))


# ─── RUN SERVER ────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    try:
        port = int(os.environ.get("PORT", 5000))
        app.run(debug=True, host='0.0.0.0', port=port)
    except Exception as e:
        app.run(debug=True, host='0.0.0.0')
