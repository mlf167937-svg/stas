import os
import sys
from flask import Flask, render_template, request, redirect, url_for, send_from_directory, jsonify, session
from openai import OpenAI

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "stas_super_secret_session_encryption_key_2026")

# =====================================================================
# 1. FILE SYSTEM SETUP & AUTOMATIC DIRECTORY CREATION
# =====================================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STAS_DIR = os.path.join(BASE_DIR, 'stas')
NAMA_DIR = os.path.join(STAS_DIR, 'nama')
DESK_DIR = os.path.join(STAS_DIR, 'desk')
DB_DIR = os.path.join(STAS_DIR, 'database')
AVATAR_DIR = os.path.join(STAS_DIR, 'avatar')

for folder in [NAMA_DIR, DESK_DIR, DB_DIR, AVATAR_DIR]:
    os.makedirs(folder, exist_ok=True)

# =====================================================================
# 2. OPENAI CLIENT INITIALIZATION
# =====================================================================
OPENAI_KEY = os.environ.get("OPENAI_API_KEY")
try:
    client = OpenAI(api_key=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) if OPENAI_KEY else None
except Exception as e:
    client = None

# =====================================================================
# 3. CONTROLLER UTILITIES (PASSWORD CHECKER INCLUDED)
# =====================================================================
def load_members():
    members = []
    if not os.path.exists(NAMA_DIR):
        return members
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
            except Exception:
                pass
    return sorted(members, key=lambda x: x['nama'].lower())

def verify_user_login(user_id, password_input):
    """Reads the member's database file to parse their unique password line."""
    db_path = os.path.join(DB_DIR, f"{user_id}.txt")
    if not os.path.exists(db_path):
        return False
    try:
        with open(db_path, 'r', encoding='utf-8') as f:
            for line in f:
                if "PASSWORD:" in line.upper():
                    stored_pw = line.split(":", 1)[1].strip()
                    return stored_pw == password_input.strip()
    except Exception:
        return False
    return False

def get_member(user_id):
    nama_path = os.path.join(NAMA_DIR, f"{user_id}.txt")
    if not os.path.exists(nama_path):
        return None
    try:
        with open(nama_path, 'r', encoding='utf-8') as f:
            nama = f.read().strip()
        desk_path = os.path.join(DESK_DIR, f"{user_id}.txt")
        desk = ""
        if os.path.exists(desk_path):
            with open(desk_path, 'r', encoding='utf-8') as f:
                desk = f.read().strip()
        db_path = os.path.join(DB_DIR, f"{user_id}.txt")
        database = ""
        if os.path.exists(db_path):
            with open(db_path, 'r', encoding='utf-8') as f:
                # Filter password string out of view so it stays hidden on the profile screen
                lines = f.readlines()
                database = "".join([l for l in lines if "PASSWORD:" not in l.upper()]).strip()
        avatar_file = None
        for ext in ['.png', '.jpg', '.jpeg']:
            if os.path.exists(os.path.join(AVATAR_DIR, f"{user_id}{ext}")):
                avatar_file = f"{user_id}{ext}"
                break
        return {
            'id': user_id, 'nama': nama, 'desk': desk, 'database': database,
            'avatar': avatar_file, 'letter': nama[0].upper() if nama else '?'
        }
    except Exception:
        return None

# =====================================================================
# 4. AUTHENTICATION ROUTING CONTROLLERS
# =====================================================================
@app.route('/login', methods=['GET', 'POST'])
def login():
    if 'user' in session:
        return redirect(url_for('home'))
    error = None
    if request.method == 'POST':
        user_id = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()
        if verify_user_login(user_id, password):
            session['user'] = user_id
            return redirect(url_for('home'))
        else:
            error = "ID Anggota atau Password salah!"
    return render_template('login.html', error=error)

@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('login'))

@app.route('/')
def index():
    return redirect(url_for('home'))

@app.route('/home')
def home():
    if 'user' not in session: return redirect(url_for('login'))
    return render_template('index.html', members=load_members())

@app.route('/search')
def search():
    if 'user' not in session: return redirect(url_for('login'))
    return render_template('search.html', members=load_members())

@app.route('/ai')
def ai():
    if 'user' not in session: return redirect(url_for('login'))
    return render_template('ai.html')

@app.route('/admin')
def admin():
    if 'user' not in session: return redirect(url_for('login'))
    return render_template('admin.html', members=load_members())

@app.route('/user/<user_id>')
def profile(user_id):
    if 'user' not in session: return redirect(url_for('login'))
    member = get_member(user_id)
    if not member: return "Anggota tidak ditemukan.", 404
    return render_template('profile.html', member=member)

@app.route('/avatar/<filename>')
def serve_avatar(filename):
    return send_from_directory(AVATAR_DIR, filename)

@app.route('/api/chat', methods=['POST'])
def api_chat():
    if 'user' not in session: return jsonify({'error': 'Unauthorized'}), 401
    data = request.get_json() or {}
    user_message = data.get('message', '').strip()
    if not user_message: return jsonify({'error': 'Pesan kosong.'}), 400
    if client is None:
        return jsonify({'reply': 'Sistem AI Terbuka Terputus: Silakan konfigurasi nilai "OPENAI_API_KEY" pada menu Dashboard Environment Render Anda.'}), 200
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Anda adalah AI STAS, asisten pintar untuk sistem komunitas Sang Tuan Alhidayah Sutam (STAS)."},
                {"role": "user", "content": user_message}
            ],
            max_tokens=400
        )
        return jsonify({'reply': response.choices[0].message.content.strip()})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
