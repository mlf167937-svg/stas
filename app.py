import os
import random
import string
from datetime import datetime, timezone, timedelta
from flask import (
    Flask, render_template, request, redirect,
    url_for, session, jsonify, flash, send_from_directory
)

app = Flask(__name__)
app.secret_key = os.urandom(32)

# ─── Konstanta Path ────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
STAS_DIR   = os.path.join(BASE_DIR, 'stas')
DB_DIR     = os.path.join(STAS_DIR, 'database')
NAME_DIR   = os.path.join(STAS_DIR, 'name')
DESK_DIR   = os.path.join(STAS_DIR, 'desk')
GALERY_DIR = os.path.join(STAS_DIR, 'galery')

# Password Admin (ganti sesuai kebutuhan)
ADMIN_PASSWORD = "STAS@ayfuwb71iahy!"


# ─── Helper ────────────────────────────────────────────────────────────────────
def read_file(path):
    """Baca isi file teks, kembalikan string kosong jika tidak ada."""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return f.read().strip()
    except FileNotFoundError:
        return ''


def get_all_members():
    """Ambil daftar semua member dari folder name/."""
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
    """
    Baca isi database member, lalu HAPUS baris PASSWORD sebelum dikembalikan.
    Kembalikan None jika file tidak ditemukan.
    """
    db_path = os.path.join(DB_DIR, f'{username}.txt')
    content = read_file(db_path)
    if not content:
        return None
    # Saring baris yang mengandung PASSWORD
    lines = [
        line for line in content.splitlines()
        if not line.upper().startswith('PASSWORD')
    ]
    return '\n'.join(lines)


def verify_member(username, password):
    """Verifikasi username + password member. Return True/False."""
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
    """Buat string acak untuk CAPTCHA admin login."""
    chars = string.ascii_letters + string.digits
    return ''.join(random.choices(chars, k=length))


def login_required(f):
    """Decorator: redirect ke login jika belum login."""
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'member' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated


def admin_required(f):
    """Decorator: redirect ke admin_login jika bukan admin."""
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get('is_admin'):
            return redirect(url_for('admin_login'))
        return f(*args, **kwargs)
    return decorated


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
            return redirect(url_for('index'))
        error = 'Username atau password salah.'
    return render_template('login.html', error=error)


@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))


@app.route('/komunitas')
@login_required
def komunitas():
    return render_template('komunitas.html')


@app.route('/album')
@login_required
def album():
    # Kumpulkan file di galery/
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


# ─── ROUTE KHUSUS: Akses File stas/galery (FIX GAMBAR PECAH) ─────────────────────
@app.route('/stas/galery/<path:filename>')
@login_required
def custom_gallery_route(filename):
    """Mengizinkan Flask membaca file di luar folder static."""
    return send_from_directory(GALERY_DIR, filename)


# ─── API: detail member (tanpa password) ──────────────────────────────────────
@app.route('/api/member/<username>')
@login_required
def api_member(username):
    name    = read_file(os.path.join(NAME_DIR,  f'{username}.txt'))
    desk    = read_file(os.path.join(DESK_DIR,  f'{username}.txt'))
    db_data = get_member_db(username)
    if db_data is None:
        return jsonify({'error': 'Member tidak ditemukan'}), 404
    return jsonify({'username': username, 'name': name, 'desk': desk, 'db': db_data})


# ─── API: Komunitas Chat (simple in-memory) ───────────────────────────────────
chat_messages = []   # [{'sender': str, 'text': str, 'ts': str}]

@app.route('/api/chat', methods=['GET'])
@login_required
def chat_get():
    return jsonify(chat_messages[-50:])


@app.route('/api/chat', methods=['POST'])
@login_required
def chat_post():
    data = request.get_json(silent=True) or {}
    text = data.get('text', '').strip()
    if not text:
        return jsonify({'error': 'Pesan kosong'}), 400
    
    wib_timezone = timezone(timedelta(hours=7))
    waktu_sekarang = datetime.now(wib_timezone).strftime('%H:%M')
    
    msg = {
        'sender': session.get('fullname', session['member']),
        'text'  : text,
        'ts'    : waktu_sekarang
    }
    chat_messages.append(msg)
    return jsonify(msg), 201


# ─── API: STAS-AI ROUTE (FIX GAGAL TERHUBUNG) ─────────────────────────────────
@app.route('/api/ai', methods=['POST'])
@login_required
def api_ai_assistant():
    """Route fallback AI agar js tidak memicu status error merah."""
    data = request.get_json(silent=True) or {}
    prompt = data.get('prompt', '').strip().lower()
    
    # Berikan respon default jika tidak di-intercept oleh objek dataJawabanAI frontend
    return jsonify({
        'reply': "Pesan diterima backend STAS, mencari jawaban terbaik..."
    }), 200


# ─── Admin Routes ─────────────────────────────────────────────────────────────
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


# ─── Entry Point ──────────────────────────────────────────────────────────────
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
