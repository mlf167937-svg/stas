import os
import random
import string
import uuid
from datetime import datetime, timezone, timedelta
from flask import (
    Flask, render_template, request, redirect,
    url_for, session, jsonify, flash, send_from_directory
)
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.secret_key = os.urandom(32)

# ─── Konstanta Path ────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
STAS_DIR   = os.path.join(BASE_DIR, 'stas')
DB_DIR     = os.path.join(STAS_DIR, 'database')
NAME_DIR   = os.path.join(STAS_DIR, 'name')
DESK_DIR   = os.path.join(STAS_DIR, 'desk')
GALERY_DIR = os.path.join(STAS_DIR, 'galery')

# Pastikan folder galery ada untuk menampung file chat upload
os.makedirs(GALERY_DIR, exist_ok=True)

ADMIN_PASSWORD = "STAS@ayfuwb71iahy!"

# ─── Helper ────────────────────────────────────────────────────────────────────
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
            desk     = read_file(os.path.join(DESK_DIR, f'{username}.txt'))
            members.append({'username': username, 'name': name, 'desk': desk})
    return members

def get_member_db(username):
    db_path = os.path.join(DB_DIR, f'{username}.txt')
    content = read_file(db_path)
    if not content:
        return None
    lines = [line for line in content.splitlines() if not line.upper().startswith('PASSWORD')]
    return '\n'.join(lines)

def verify_member(username, password):
    db_path = os.path.join(DB_DIR, f'{username}.txt')
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

def login_required(f):
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'member' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get('is_admin'):
            return redirect(url_for('admin_login'))
        return f(*args, **kwargs)
    return decorated

# ─── In-Memory Database Chat Global ───────────────────────────────────────────
# Struktur baru dengan ID dan Reaksi Emoji
chat_messages = []   

# ─── Routes ────────────────────────────────────────────────────────────────────

@app.route('/')
@login_required
def index():
    members = get_all_members()
    return render_template('index.html', members=members)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if 'member' in session:
        return redirect(url_for('index'))
    error = None
    if request.method == 'POST':
        username = request.form.get('username', '').strip().lower()
        password = request.form.get('password', '').strip()
        if verify_member(username, password):
            session['member']   = username
            session['fullname'] = read_file(os.path.join(NAME_DIR, f'{username}.txt'))
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
    members = get_all_members() # Dibutuhkan untuk list data tagging @ di frontend
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
                files.append({'name': fname, 'type': ftype})
    return render_template('album.html', files=files)

@app.route('/games')
@login_required
def games():
    return render_template('games.html')

@app.route('/stas/galery/<path:filename>')
@login_required
def custom_gallery_route(filename):
    return send_from_directory(GALERY_DIR, filename)

# ─── API KOMUNITAS UPGRADED ───────────────────────────────────────────────────

@app.route('/api/chat', methods=['GET'])
@login_required
def chat_get():
    return jsonify(chat_messages[-100:])

@app.route('/api/chat', methods=['POST'])
@login_required
def chat_post():
    if session.get('is_guest'):
        return jsonify({'error': 'Akses ditolak'}), 403

    data = request.get_json(silent=True) or {}
    text = data.get('text', '').strip()
    msg_type = data.get('type', 'text')
    file_url = data.get('file_url', '')

    if not text and not file_url:
        return jsonify({'error': 'Pesan kosong'}), 400
    
    wib_timezone = timezone(timedelta(hours=7))
    waktu_sekarang = datetime.now(wib_timezone).strftime('%H:%M')
    
    msg_id = str(uuid.uuid4())
    msg = {
        'id': msg_id,
        'username': session['member'],
        'sender': session.get('fullname', session['member']),
        'text'  : text,
        'type'  : msg_type,
        'file_url': file_url,
        'ts'    : waktu_sekarang,
        'reactions': {} # Format: {'👍': ['user1', 'user2'], '❤️': []}
    }
    chat_messages.append(msg)

    # SISTEM UPGRADE: Cek Apakah Ada Tag @stasai di Chat Bersama
    if '@stasai' in text.lower():
        prompt_bersama = text.lower().replace('@stasai', '').strip()
        ai_msg_id = str(uuid.uuid4())
        
        # Logika dummy respons grup AI (Nanti di-intercept frontend atau langsung gemini)
        ai_reply = f"Halo {msg['sender']}! Ada apa panggil saya di grup? Soal '{prompt_bersama}', backend STAS siap membantu!"
        if not prompt_bersama:
            ai_reply = f"Yoi {msg['sender']}! Ketik perintah setelah @stasai biar saya jawab ya."

        ai_msg = {
            'id': ai_msg_id,
            'username': 'stas_ai_bot',
            'sender': '🤖 STAS-AI (Grup)',
            'text': ai_reply,
            'type': 'text',
            'file_url': '',
            'ts': datetime.now(wib_timezone).strftime('%H:%M'),
            'reactions': {}
        }
        chat_messages.append(ai_msg)

    return jsonify(msg), 201

# API UPLOAD MEDIA (Foto, Video, Voice Note)
@app.route('/api/chat/upload', methods=['POST'])
@login_required
def chat_upload():
    if session.get('is_guest'):
        return jsonify({'error': 'Tamu dilarang upload'}), 403
        
    if 'file' not in request.files:
        return jsonify({'error': 'Tidak ada berkas'}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Nama berkas kosong'}), 400

    ext = file.filename.rsplit('.', 1)[-1].lower()
    # Atur penamaan berkas agar unik & aman
    filename = f"chat_{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(GALERY_DIR, filename)
    file.save(file_path)

    # Tentukan jenis tipe pesan galeri
    msg_type = 'image'
    if ext in ('mp4', 'webm', 'mov', '3gp'):
        msg_type = 'video'
    elif ext in ('wav', 'mp3', 'ogg', 'webm', 'm4a'):
        msg_type = 'audio' # Voice Note masuk ke tipe ini

    file_url = f"/stas/galery/{filename}"
    return jsonify({'file_url': file_url, 'type': msg_type}), 200

# API KASIH REAKSI EMOT
@app.route('/api/chat/react', methods=['POST'])
@login_required
def chat_react():
    data = request.get_json(silent=True) or {}
    msg_id = data.get('msg_id')
    emoji = data.get('emoji')
    username = session['member']

    if not msg_id or not emoji:
        return jsonify({'error': 'Data tidak lengkap'}), 400

    for msg in chat_messages:
        if msg['id'] == msg_id:
            if emoji not in msg['reactions']:
                msg['reactions'][emoji] = []
            
            # Jika user sudah pasang emot tersebut, hapus (Toggle sistem)
            if username in msg['reactions'][emoji]:
                msg['reactions'][emoji].remove(username)
                if not msg['reactions'][emoji]:
                    msg['reactions'].pop(emoji)
            else:
                msg['reactions'][emoji].append(username)
            return jsonify({'status': 'success', 'reactions': msg['reactions']})
            
    return jsonify({'error': 'Pesan tidak ditemukan'}), 404

# API HAPUS PESAN (KHUSUS MEMBER 'rauf')
@app.route('/api/chat/delete/<msg_id>', methods=['DELETE'])
@login_required
def chat_delete(msg_id):
    if session['member'] != 'rauf':
        return jsonify({'error': 'Hanya member rauf (Admin) yang bisa menghapus!'}), 403

    global chat_messages
    original_len = len(chat_messages)
    chat_messages = [msg for msg in chat_messages if msg['id'] != msg_id]
    
    if len(chat_messages) < original_len:
        return jsonify({'status': 'deleted'}), 200
    return jsonify({'error': 'Pesan tidak ditemukan'}), 404

# ─── API LAINNYA ──────────────────────────────────────────────────────────────
@app.route('/api/member/<username>')
@login_required
def api_member(username):
    name    = read_file(os.path.join(NAME_DIR,  f'{username}.txt'))
    desk    = read_file(os.path.join(DESK_DIR,  f'{username}.txt'))
    db_data = get_member_db(username)
    if db_data is None:
        return jsonify({'error': 'Member tidak ditemukan'}), 404
    return jsonify({'username': username, 'name': name, 'desk': desk, 'db': db_data})

@app.route('/api/ai', methods=['POST'])
@login_required
def api_ai_assistant():
    data = request.get_json(silent=True) or {}
    return jsonify({'reply': "Pesan diterima backend STAS, mencari jawaban terbaik..."}), 200

# ─── Admin Area ───────────────────────────────────────────────────────────────
@app.route('/admin/chat', methods=['POST'])
@admin_required
def admin_chat_broadcast():
    data = request.get_json(silent=True) or {}
    text = data.get('text', '').strip()
    if text:
        wib_timezone = timezone(timedelta(hours=7))
        msg = {
            'id': str(uuid.uuid4()),
            'username': 'system_admin',
            'sender': '🛡️ SYSTEM',
            'text': f"📢 PENGUMUMAN: {text}", 
            'type': 'text',
            'file_url': '',
            'ts': datetime.now(wib_timezone).strftime('%H:%M'),
            'reactions': {}
        }
        chat_messages.append(msg)
    return jsonify({'status': 'ok'})

@app.route('/admin/clear_chat', methods=['POST'])
@admin_required
def admin_clear_chat():
    chat_messages.clear() 
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

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
