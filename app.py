import os
import uuid
from datetime import datetime
from flask import Flask, render_template, request, jsonify, session, redirect, url_for

app = Flask(__name__)
app.secret_key = "STAS_SUPER_SECRET_KEY" # Ganti bebas
UPLOAD_FOLDER = 'static/uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ─── DATABASE SEMENTARA (RAM) ───
DATABASE_CHAT = []
MEMBERS_LIST = [
    {"username": "rauf"},
    {"username": "faisal"},
    {"username": "stasai"}
]

# ─── ROUTE HALAMAN WEB (Wajib ada biar gak eror Navbar) ───
@app.route('/')
def index():
    # Halaman beranda pura-pura (sesuaikan sama file asli lu)
    return "Ini Halaman Beranda. <a href='/komunitas'>Masuk Komunitas</a>"

@app.route('/login')
def login():
    # Dummy session buat ngetes kalau lu belum pasang sistem login DB
    session['member'] = 'rauf'
    session['fullname'] = 'Rauf Admin'
    session['is_guest'] = False
    return redirect(url_for('komunitas'))

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/album')
def album():
    return "Ini Halaman Album. <a href='/komunitas'>Kembali</a>"

@app.route('/games')
def games():
    return "Ini Halaman Games. <a href='/komunitas'>Kembali</a>"

@app.route('/komunitas')
def komunitas():
    # Cek login, kalau belum login lempar ke route /login
    if 'member' not in session:
        return redirect(url_for('login'))
    return render_template('komunitas.html', members=MEMBERS_LIST)


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

        # Deteksi siapa yang ngirim, kalau bot (stasai), ganti namanya
        sender_username = data.get('username', session.get('member'))
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
            if username in msg['reactions'][emoji]:
                msg['reactions'][emoji].remove(username)
            else:
                for emo in msg['reactions']:
                    if username in msg['reactions'][emo]:
                        msg['reactions'][emo].remove(username)
                msg['reactions'][emoji].append(username)
            break
    return jsonify({"status": "success"})

@app.route('/api/chat/delete/<msg_id>', methods=['DELETE'])
def delete_message(msg_id):
    global DATABASE_CHAT
    DATABASE_CHAT = [msg for msg in DATABASE_CHAT if msg['id'] != msg_id]
    return jsonify({"status": "success"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
