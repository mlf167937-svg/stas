import os
import random
import string
import json
import uuid
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

# Database Chat biar chat gak ilang
CHAT_FILE  = os.path.join(STAS_DIR, 'chat_history.json')

# Pastikan semua folder ada (biar gak error kalau baru di-clone)
for d in [STAS_DIR, DB_DIR, NAME_DIR, DESK_DIR, GALERY_DIR]:
    os.makedirs(d, exist_ok=True)

# Bikin file chat kosong kalau belum ada
if not os.path.exists(CHAT_FILE):
    with open(CHAT_FILE, 'w', encoding='utf-8') as f:
        json.dump([], f)

# Password Admin (ganti sesuai kebutuhan)
ADMIN_PASSWORD = "STAS@ayfuwb71iahy!"


# ─── Helper File & Database ────────────────────────────────────────────────────
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
    """Baca isi database member, lalu HAPUS baris PASSWORD sebelum dikembalikan."""
    db_path = os.path.join(DB_DIR, f'{username}.txt')
    content = read_file(db_path)
    if not content:
        return None
    lines = [line for line in content.splitlines() if not line.upper().startswith('PASSWORD')]
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

# Helper baca/tulis chat persisten
def load_chat():
    try:
        with open(CHAT_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return []

def save_chat(data):
    with open(CHAT_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)


# ─── Routes Web Utama ──────────────────────────────────────────────────────────
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
                # Menambahkan 'url' dan memastikan format sesuai kebutuhan frontend terbaru lu
                files.append({'name': fname, 'type': ftype, 'url': f'/stas/galery/{fname}'})
    return render_template('album.html', files=files)

@app.route('/games')
@login_required
def games():
    return render_template('games.html')

# ─── ROUTE KHUSUS: Akses File stas/galery ─────────────────────────────────────
@app.route('/stas/galery/<path:filename>')
@login_required
def custom_gallery_route(filename):
