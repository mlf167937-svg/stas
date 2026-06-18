import os
import sys
from flask import Flask, render_template, request, redirect, url_for, send_from_directory, jsonify
from openai import OpenAI

app = Flask(__name__)

# =====================================================================
# 1. FILE SYSTEM SETUP & AUTOMATIC DIRECTORY CREATION
# =====================================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STAS_DIR = os.path.join(BASE_DIR, 'stas')
NAMA_DIR = os.path.join(STAS_DIR, 'nama')
DESK_DIR = os.path.join(STAS_DIR, 'desk')
DB_DIR = os.path.join(STAS_DIR, 'database')
AVATAR_DIR = os.path.join(STAS_DIR, 'avatar')

# Ensure all nested directories exist cleanly upon server bootup
for folder in [NAMA_DIR, DESK_DIR, DB_DIR, AVATAR_DIR]:
    try:
        os.makedirs(folder, exist_ok=True)
    except Exception as e:
        print(f"Error creating system folder {folder}: {str(e)}", file=sys.stderr)

# =====================================================================
# 2. OPENAI CLIENT INITIALIZATION (SAFE METHOD FOR PRODUCTION)
# =====================================================================
OPENAI_KEY = os.environ.get("OPENAI_API_KEY")

# We wrap this safely so a bad or missing key doesn't crash the server boot process
try:
    if OPENAI_KEY:
        client = OpenAI(api_key=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)
    else:
        client = None
        print("WARNING: OPENAI_API_KEY environment variable is not set. AI page will be in placeholder fallback mode.", file=sys.stderr)
except Exception as e:
    client = None
    print(f"CRITICAL: Failed to initialize OpenAI Client: {str(e)}", file=sys.stderr)

# =====================================================================
# 3. CONTROLLER UTILITIES (FILE DATABASE LOADER)
# =====================================================================
def load_members():
    """Scans the stas/nama/ directory and pairs matching metadata configurations."""
    members = []
    if not os.path.exists(NAMA_DIR):
        return members

    try:
        for filename in os.listdir(NAMA_DIR):
            if filename.endswith('.txt') and filename != '.gitkeep':
                user_id = filename[:-4]
                
                # 1. Fetch Name Text Layer
                with open(os.path.join(NAMA_DIR, filename), 'r', encoding='utf-8') as f:
                    nama = f.read().strip()
                    
                # 2. Fetch Description Text Layer
                desk_path = os.path.join(DESK_DIR, filename)
                desk = ""
                if os.path.exists(desk_path):
                    with open(desk_path, 'r', encoding='utf-8') as f:
                        desk = f.read().strip()
                        
                # 3. Check for Custom Avatar File Extensions
                avatar_file = None
                for ext in ['.png', '.jpg', '.jpeg']:
                    if os.path.exists(os.path.join(AVATAR_DIR, f"{user_id}{ext}")):
                        avatar_file = f"{user_id}{ext}"
                        break
                        
                members.append({
                    'id': user_id,
                    'nama': nama if nama else user_id,
                    'desk': desk if desk else "Anggota Komunitas STAS.",
                    'avatar': avatar_file,
                    'letter': nama[0].upper() if nama else '?'
                })
    except Exception as e:
        print(f"Database Read Exception occurred: {str(e)}", file=sys.stderr)
            
    return sorted(members, key=lambda x: x['nama'].lower())

def get_member(user_id):
    """Retrieves single core user database records including full data stream entry."""
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
                database = f.read().strip()
                
        avatar_file = None
        for ext in ['.png', '.jpg', '.jpeg']:
            if os.path.exists(os.path.join(AVATAR_DIR, f"{user_id}{ext}")):
                avatar_file = f"{user_id}{ext}"
                break
                
        return {
            'id': user_id,
            'nama': nama,
            'desk': desk,
            'database': database,
            'avatar': avatar_file,
            'letter': nama[0].upper() if nama else '?'
        }
    except Exception as e:
        print(f"Error loading unique member profile ({user_id}): {str(e)}", file=sys.stderr)
        return None

# =====================================================================
# 4. WEB VIEW ROUTING CONTROLLERS
# =====================================================================
@app.route('/')
def index():
    return redirect(url_for('home'))

@app.route('/home')
def home():
    members = load_members()
    return render_template('index.html', members=members)

@app.route('/search')
def search():
    members = load_members()
    return render_template('search.html', members=members)

@app.route('/ai')
def ai():
    return render_template('ai.html')

@app.route('/admin')
def admin():
    members = load_members()
    return render_template('admin.html', members=members)

@app.route('/user/<user_id>')
def profile(user_id):
    member = get_member(user_id)
    if not member:
        return "Anggota tidak ditemukan atau file ID salah.", 404
    return render_template('profile.html', member=member)

@app.route('/avatar/<filename>')
def serve_avatar(filename):
    return send_from_directory(AVATAR_DIR, filename)

# =====================================================================
# 5. ASYNC OPENAI ENDPOINT CONTROLLER
# =====================================================================
@app.route('/api/chat', methods=['POST'])
def api_chat():
    """Secure JSON transaction pipeline feeding clean text strings to GPT model."""
    data = request.get_json() or {}
    user_message = data.get('message', '').strip()

    if not user_message:
        return jsonify({'error': 'Pesan input kosong.'}), 400

    if client is None:
        return jsonify({
            'reply': 'Sistem AI Terbuka Terputus: Silakan konfigurasi nilai "OPENAI_API_KEY" pada menu Dashboard Environment Render Anda.'
        }), 200

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Anda adalah AI STAS, asisten pintar untuk sistem komunitas Sang Tuan Alhidayah Sutam (STAS). Jawab pertanyaan pengguna dengan ramah, informatif, dan ringkas menggunakan Bahasa Indonesia."},
                {"role": "user", "content": user_message}
            ],
            max_tokens=400
        )
        ai_reply = response.choices[0].message.content.strip()
        return jsonify({'reply': ai_reply})
        
    except Exception as e:
        return jsonify({'error': f"Gagal memproses respons API OpenAI: {str(e)}"}), 500

# =====================================================================
# 6. RENDER ENVIRONMENT RUNTIME BINDING
# =====================================================================
if __name__ == '__main__':
    # Force production network listener parameters
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
