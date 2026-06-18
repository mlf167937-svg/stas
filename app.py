import os
from flask import Flask, render_template, request, redirect, url_for, send_from_directory, jsonify
from openai import OpenAI

app = Flask(__name__)

# Initialize OpenAI Client (Reads OPENAI_API_KEY environment variable)
client = OpenAI(api_key=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)

# Constants for file paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STAS_DIR = os.path.join(BASE_DIR, 'stas')
NAMA_DIR = os.path.join(STAS_DIR, 'nama')
DESK_DIR = os.path.join(STAS_DIR, 'desk')
DB_DIR = os.path.join(STAS_DIR, 'database')
AVATAR_DIR = os.path.join(STAS_DIR, 'avatar')

# Ensure directories exist to prevent crashes on startup
for d in [NAMA_DIR, DESK_DIR, DB_DIR, AVATAR_DIR]:
    os.makedirs(d, exist_ok=True)

def load_members():
    """Scans the filesystem and returns a structured list of members."""
    members = []
    if not os.path.exists(NAMA_DIR):
        return members

    for filename in os.listdir(NAMA_DIR):
        if filename.endswith('.txt'):
            user_id = filename[:-4]
            
            # Read Name
            with open(os.path.join(NAMA_DIR, filename), 'r', encoding='utf-8') as f:
                nama = f.read().strip()
                
            # Read Description
            desk_path = os.path.join(DESK_DIR, filename)
            desk = ""
            if os.path.exists(desk_path):
                with open(desk_path, 'r', encoding='utf-8') as f:
                    desk = f.read().strip()
                    
            # Check for Avatar
            avatar_file = None
            for ext in ['.png', '.jpg', '.jpeg']:
                if os.path.exists(os.path.join(AVATAR_DIR, f"{user_id}{ext}")):
                    avatar_file = f"{user_id}{ext}"
                    break
                    
            members.append({
                'id': user_id,
                'nama': nama,
                'desk': desk,
                'avatar': avatar_file,
                'letter': nama[0].upper() if nama else '?'
            })
            
    return sorted(members, key=lambda x: x['nama'].lower())

def get_member(user_id):
    """Fetches full details for a single member, including database content."""
    nama_path = os.path.join(NAMA_DIR, f"{user_id}.txt")
    if not os.path.exists(nama_path):
        return None
        
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
        return "User tidak ditemukan", 404
    return render_template('profile.html', member=member)

@app.route('/avatar/<filename>')
def serve_avatar(filename):
    return send_from_directory(AVATAR_DIR, filename)

@app.route('/api/chat', methods=['POST'])
def api_chat():
    """Secure endpoint communicating with OpenAI API."""
    data = request.get_json() or {}
    user_message = data.get('message', '').strip()

    if not user_message:
        return jsonify({'error': 'Pesan tidak boleh kosong'}), 400

    if not os.environ.get("OPENAI_API_KEY"):
        return jsonify({'reply': 'Sistem AI belum siap: API Key OpenAI belum dikonfigurasi di server.'}), 200

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Anda adalah AI STAS, asisten pintar untuk komunitas Sang Tuan Alhidayah Sutam (STAS). Jawab pertanyaan dengan sopan, akrab, dan informatif menggunakan bahasa Indonesia."},
                {"role": "user", "content": user_message}
            ],
            max_tokens=500
        )
        ai_reply = response.choices[0].message.content.strip()
        return jsonify({'reply': ai_reply})
        
    except Exception as e:
        return jsonify({'error': f"Terjadi masalah komunikasi dengan OpenAI: {str(e)}"}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
