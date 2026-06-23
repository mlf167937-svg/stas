import os
import uuid
from datetime import datetime
from flask import Flask, render_template, request, jsonify, session, redirect, url_for

app = Flask(__name__)
app.secret_key = "STAS_SUPER_SECRET_KEY"
UPLOAD_FOLDER = 'static/uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Database Chat Sementara di Memori RAM
DATABASE_CHAT = []
MEMBERS_LIST = [
    {"username": "rauf"},
    {"username": "faisal"},
    {"username": "stasai"}
]

@app.route('/komunitas')
def komunitas():
    if 'member' not in session:
        # Dummy session kalau belum login buat testing, hapus baris bawah ini kalau sistem login lu udah ada
        session['member'] = 'rauf'
        session['fullname'] = 'Rauf Admin'
    return render_template('komunitas.html', members=MEMBERS_LIST)

# API Get & Post Chat Utama
@app.route('/api/chat', methods=['GET', 'POST'])
def handle_chat():
    global DATABASE_CHAT
    if request.method == 'GET':
        return jsonify(DATABASE_CHAT)
        
    if request.method == 'POST':
        data = request.json
        text = data.get('text', '')
        msg_type = data.get('type', 'text') # text, image, video, audio
        file_url = data.get('file_url', '')

        new_msg = {
            "id": str(uuid.uuid4()),
            "username": session.get('member'),
            "sender": session.get('fullname') or session.get('member'),
            "text": text,
            "type": msg_type,
            "file_url": file_url,
            "ts": datetime.now().strftime("%H:%M"),
            "reactions": {"👍": [], "❤️": [], "😂": [], "😮": [], "🙏": []}
        }
        DATABASE_CHAT.append(new_msg)
        return jsonify({"status": "success", "msg": new_msg})

# API Upload Media (Foto, Video, VN)
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

# API Reaksi Emoji
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

# API Hapus Pesan
@app.route('/api/chat/delete/<msg_id>', methods=['DELETE'])
def delete_message(msg_id):
    global DATABASE_CHAT
    DATABASE_CHAT = [msg for msg in DATABASE_CHAT if msg['id'] != msg_id]
    return jsonify({"status": "success"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
