import os
import sys
from flask import Flask, render_template, request, redirect, url_for, send_from_directory, jsonify, session

app = Flask(__name__)
# Key untuk enkripsi session login web
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "stas_super_secret_session_encryption_key_2026")

# =====================================================================
# 1. SETTING FOLDER DIREKTORI
# =====================================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STAS_DIR = os.path.join(BASE_DIR, 'stas')
NAMA_DIR = os.path.join(STAS_DIR, 'nama')
DESK_DIR = os.path.join(STAS_DIR, 'desk')
DB_DIR = os.path.join(STAS_DIR, 'database')
AVATAR_DIR = os.path.join(STAS_DIR, 'avatar')

for folder in [NAMA_DIR, DESK_DIR, DB_DIR, AVATAR_DIR]:
    os.makedirs(folder, exist_ok=True)

# PASSWORD KHUSUS UNTUK MEMBUKA ADMIN UI (Silakan ganti sesuai keinginan)
ADMIN_PASSWORD_KEY = "adminstas2026"

# =====================================================================
# 2. ENGINE AI LOKAL (LOGIKA IF-ELSE)
# =====================================================================
def respon_ai_lokal(pesan_user):
    """Menggantikan OpenAI API dengan logika deteksi kata kunci berbasis If-Else."""
    pesan = pesan_user.lower().strip()
    
    # Deteksi Kata Kunci & Jawaban Otomatis
    if "halo" in pesan or "hai" in pesan or "assalamualaikum" in pesan:
        return "Halo juga, cuks! Saya AI STAS lokal. Ada yang bisa saya bantu untuk komunitas hari ini?"
        
    elif "siapa kamu" in pesan or "artinya ai" in pesan:
        return "Saya adalah AI STAS, sebuah program pintar berbasis logika lokal yang dibuat khusus untuk memandu anggota Sang Tuan Alhidayah Sutam."
        
    elif "stas" in pesan or "komunitas" in pesan:
        return "STAS (Sang Tuan Alhidayah Sutam) adalah komunitas tempat berkumpulnya para Tuan hebat. Di sini kita berbagi informasi, teknologi, dan mempererat solidaritas."
        
    elif "password" in pesan or "login" in pesan:
        return "Untuk login, gunakan nama file database kamu sebagai ID (misal: 'rauf') dan pastikan teks 'PASSWORD: pw_kamu' sudah tertulis di dalam file stas/database/nama_kamu.txt."
        
    elif "admin" in pesan or "ui admin" in pesan:
        return "Halaman Admin UI digunakan untuk mengelola data direktori file. Untuk masuk, diperlukan password administrator khusus."
        
    elif "game" in pesan or "main" in pesan:
        return "Waduh untuk fitur Game lagi dipersiapkan sama pengembang nih, cuks! Ditunggu saja ya pembaruan berikutnya."
        
    # Jawaban Standar jika tidak ada kata kunci yang cocok
    return "Maaf cuks, AI STAS lokal belum paham maksudmu. Coba tanya hal lain seputar 'STAS', 'Login', 'Admin UI', atau sapa dengan 'Halo'."

# =====================================================================
# 3. UTILITAS DATABASE FILE
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
# 4. ROUTING ROUTE & PROTEKSI LOGIN
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
    session.pop('admin_authed', None) # Bersihkan status admin pas logout
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

# =====================================================================
# 5. ADMIN UI WITH SEPARATE PASSWORD PROTECT
# =====================================================================
@app.route('/admin', methods=['GET', 'POST'])
def admin():
    if 'user' not in session: 
        return redirect(url_for('login'))
        
    # Jika admin sudah berhasil memasukkan password sebelumnya di sesi ini
    if session.get('admin_authed') == True:
        return render_template('admin.html', members=load_members())
        
    error = None
    if request.method == 'POST':
        admin_pw = request.form.get('admin_password', '').strip()
        if admin_pw == ADMIN_PASSWORD_KEY:
            session['admin_authed'] = True
            return render_template('admin.html', members=load_members())
        else:
            error = "Password Akses Administrator Salah!"
            
    # Tampilkan template form khusus gembok password admin jika belum diautentikasi
    return render_template('admin_lock.html', error=error)

@app.route('/user/<user_id>')
def profile(user_id):
    if 'user' not in session: return redirect(url_for('login'))
    member = get_member(user_id)
    if not member: return "Anggota tidak ditemukan.", 404
    return render_template('profile.html', member=member)

@app.route('/avatar/<filename>')
def serve_avatar(filename):
    return send_from_directory(AVATAR_DIR, filename)

# =====================================================================
# 6. ENDPOINT CHAT API (MENGGUNAKAN LOGIKA LOKAL)
# =====================================================================
@app.route('/api/chat', methods=['POST'])
def api_chat():
    if 'user' not in session: return jsonify({'error': 'Unauthorized'}), 401
    data = request.get_json() or {}
    user_message = data.get('message', '').strip()
    
    if not user_message: 
        return jsonify({'error': 'Pesan kosong.'}), 400
        
    # Mengambil respons dari fungsi if-else di atas
    jawaban = respon_ai_lokal(user_message)
    return jsonify({'reply': jawaban})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
