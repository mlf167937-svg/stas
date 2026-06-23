import os
import uuid
from datetime import datetime
from flask import Flask, render_template, request, jsonify, session, redirect, url_for, render_template_string

app = Flask(__name__)
app.secret_key = "STAS_SUPER_SECRET_KEY" # Wajib buat session
UPLOAD_FOLDER = 'static/uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ─── DATABASE SEMENTARA (RAM) ───
DATABASE_CHAT = []

# Daftar member buat sistem Tag (Mention)
MEMBERS_LIST = [
    {"username": "rauf"},
    {"username": "faisal"},
    {"username": "stasai"}
]

# ─── KREDENSIAL ADMIN ───
# Lu bisa ganti password adminnya di sini
ADMIN_USERS = {
    "rauf": "admin123",
    "admin": "admin123"
}

# ─── SISTEM LOGIN (ADMIN, MEMBER, TAMU) ───
@app.route('/login', methods=['GET', 'POST'])
def login():
    # Kalau udah login, lempar ke beranda
    if 'member' in session:
        return redirect(url_for('index'))

    error_msg = ""
    if request.method == 'POST':
        username = request.form.get('username', '').strip().lower()
        password = request.form.get('password', '')

        if not username:
            error_msg = "Username gak boleh kosong cuks!"
        else:
            # 1. LOGIKA LOGIN ADMIN (rauf)
            if username in ADMIN_USERS:
                if password == ADMIN_USERS[username]:
                    session['member'] = username
                    session['fullname'] = f"👑 {username.capitalize()} (Admin)"
                    session['is_guest'] = False
                    session['is_admin'] = True
                    return redirect(url_for('index'))
                else:
                    error_msg = "Password Admin salah!"
            
            # 2. LOGIKA LOGIN TAMU (Guest)
            elif username in ['tamu', 'guest']:
                session['member'] = username
                session['fullname'] = "Tamu"
                session['is_guest'] = True
                session['is_admin'] = False
                return redirect(url_for('index'))

            # 3. LOGIKA LOGIN MEMBER BIASA
            else:
                session['member'] = username
                session['fullname'] = username.capitalize()
                session['is_guest'] = False
                session['is_admin'] = False
                
                # Tambahin ke database list tag otomatis
                if not any(m['username'] == username for m in MEMBERS_LIST) and username != 'stasai':
                    MEMBERS_LIST.append({"username": username})

                return redirect(url_for('index'))

    # Render halaman login
    try:
        # Coba buka file login.html buatan lu
        return render_template('login.html', error=error_msg)
    except:
        # Kalau lu belum bikin file login.html, pakai tampilan darurat ini:
        html_darurat = '''
        <!DOCTYPE html>
        <html>
        <head><title>Login STAS</title></head>
        <body style="background:#12131a; color:white; font-family:sans-serif; text-align:center; padding-top:100px;">
            <h2>Login Komunitas STAS</h2>
            <div style="color:#ff4136; margin-bottom:15px;">{{ error_msg }}</div>
            <form method="POST">
                <input type="text" name="username" placeholder="Username (misal: rauf / tamu)" required style="padding:10px; width:200px; border-radius:5px; border:none;"><br><br>
                <input type="password" name="password" placeholder="Password (Khusus Admin)" style="padding:10px; width:200px; border-radius:5px; border:none;"><br><br>
                <button type="submit" style="padding:10px 20px; background:#7aa2f7; color:white; border:none; border-radius:5px; cursor:pointer;">Masuk</button>
            </form>
            <p style="font-size:12px; color:gray; margin-top:20px;">*Admin 'rauf' wajib isi password (admin123).<br>*Member biasa kosongin aja passwordnya.</p>
        </body>
        </html>
        '''
        return render_template_string(html_darurat, error_msg=error_msg)

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))


# ─── ROUTE HALAMAN UTAMA ───
@app.route('/')
def index():
    if 'member' not in session:
        return redirect(url_for('login'))
    
    # Render file beranda lu (pastikan ada file index.html / beranda.html di folder templates)
    try:
        return render_template('index.html')
    except:
        try:
            return render_template('beranda.html')
        except:
            return "File html untuk beranda belum ada. Tolong buat file index.html di dalam folder templates. <br><a href='/komunitas'>Pergi ke Komunitas aja</a>"

@app.route('/komunitas')
def komunitas():
    if 'member' not in session:
        return redirect(url_for('login'))
    return render_template('komunitas.html', members=MEMBERS_LIST)

@app.route('/album')
def album():
    if 'member' not in session:
        return redirect(url_for('login'))
    return render_template('album.html')

@app.route('/games')
def games():
    if 'member' not in session:
        return redirect(url_for('login'))
    return render_template('games.html')


# ─── API CHAT KOMUNITAS & MEDIA ───
@app.route('/api/chat', methods=['GET', 'POST'])
def handle_chat():
    global DATABASE_CHAT
    if request.method == 'GET':
        return jsonify(DATABASE_CHAT)
        
    if request.method == 'POST':
        data = request.json
        text = data.get('text', '')
        msg_type = data.get('type', 'text')
        file_url = data.get('file_url', '')

        sender_username = data.get('username', session.get('member'))
        
        # Penamaan khusus buat Bot AI
        if sender_username == 'stasai':
            sender_fullname = "🤖 STAS-AI (Grup)"
        else:
            sender_fullname = session.get('fullname') or sender_username

        new_msg = {
            "id": str(uuid.uuid4()),
            "username": sender_username,
            "sender": sender_fullname,
            "text": text,
            "type": msg_type,
            "file_url": file_url,
            "ts": datetime.now().strftime("%H:%M"),
            "reactions": {"👍": [], "❤️": [], "😂": [], "😮": [], "🙏": []}
        }
        DATABASE_CHAT.append(new_msg)
        return jsonify({"status": "success", "msg": new_msg})

@app.route('/api/chat/upload', methods=['POST'])
def handle_upload():
    if 'file' not in request.files:
        return jsonify({"error": "No file"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    ext = file.filename.split('.')[-1].lower()
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)
    
    file_type = 'image'
    if ext in ['mp4', 'webm', 'mov']:
        file_type = 'video'
    elif ext in ['wav', 'mp3', 'ogg', 'webm'] or 'vn' in file.filename:
        file_type = 'audio'

    return jsonify({"file_url": f"/static/uploads/{filename}", "type": file_type})

@app.route('/api/chat/react', methods=['POST'])
def handle_react():
    data = request.json
    msg_id = data.get('msg_id')
    emoji = data.get('emoji')
    username = session.get('member')

    for msg in DATABASE_CHAT:
        if msg['id'] == msg_id:
            # Toggle Emoji
            if username in msg['reactions'][emoji]:
                msg['reactions'][emoji].remove(username)
            else:
                for emo in msg['reactions']:
                    if username in msg['reactions'][emo]:
                        msg['reactions'][emo].remove(username)
                msg['reactions'][emoji].append(username)
            break
    return jsonify({"status": "success"})

# ─── API HAPUS CHAT (KHUSUS ADMIN) ───
@app.route('/api/chat/delete/<msg_id>', methods=['DELETE'])
def delete_message(msg_id):
    global DATABASE_CHAT
    # Keamanan Backend: Cek beneran admin gak nih yang ngehapus?
    if session.get('is_admin') or session.get('member') == 'rauf':
        DATABASE_CHAT = [msg for msg in DATABASE_CHAT if msg['id'] != msg_id]
        return jsonify({"status": "success"})
    else:
        return jsonify({"status": "error", "message": "Gak ada akses bos!"}), 403

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')
