import os
import uuid
from datetime import datetime
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from werkzeug.utils import secure_filename

# Library untuk AI
import google.generativeai as gemini
from openai import OpenAI

app = Flask(__name__)
app.secret_key = "STAS_SUPER_SECRET_KEY" # Ganti bebas
UPLOAD_FOLDER = 'static/uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ─── KONFIGURASI API KEY AI ───
gemini.configure(api_key="AQ.Ab8RN6LMdyBv4_f-6EEgsAniMBK8Z9J97pF9TPdd6n5ERtTzKA")
openai_client = OpenAI(api_key="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")

# Mock Database untuk simulasi (Ganti pakai database asli lu kalau ada)
DATABASE_CHAT = []
MEMBERS_LIST = [
    {"username": "rauf"},
    {"username": "faisal"},
    {"username": "stasai"}
]

@app.route('/komunitas')
def komunitas():
    # Pastikan session login aman
    if 'member' not in session:
        return redirect(url_for('login'))
    return render_template('komunitas.html', members=MEMBERS_LIST)


# ─── 1. API UTAMA CHAT KOMUNITAS (FITUR LAMA) ───

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

        # Struktur data chat lengkap (termasuk penampung reaksi emoji)
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

# Fitur Upload Media (Foto, Video, VN Audio)
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
    
    # Deteksi tipe file untuk frontend
    file_type = 'image'
    if ext in ['mp4', 'webm', 'mov']:
        file_type = 'video'
    elif ext in ['wav', 'mp3', 'ogg', 'webm'] or 'vn' in file.filename:
        file_type = 'audio'

    return jsonify({
        "file_url": f"/static/uploads/{filename}",
        "type": file_type
    })

# Fitur Teken Chat buat Reaksi Emoji
@app.route('/api/chat/react', methods=['POST'])
def handle_react():
    data = request.json
    msg_id = data.get('msg_id')
    emoji = data.get('emoji')
    username = session.get('member')

    for msg in DATABASE_CHAT:
        if msg['id'] == msg_id:
            # Jika user sudah pernah kasi emoji yang sama, hapus (toggle)
            if username in msg['reactions'][emoji]:
                msg['reactions'][emoji].remove(username)
            else:
                # Hapus user dari emoji lain dulu biar gak dobel reaksi
                for emo in msg['reactions']:
                    if username in msg['reactions'][emo]:
                        msg['reactions'][emo].remove(username)
                # Tambah reaksi baru
                msg['reactions'][emoji].append(username)
            break
            
    return jsonify({"status": "success"})

# Fitur Hapus Pesan Khusus Admin (Rauf)
@app.route('/api/chat/delete/<msg_id>', methods=['DELETE'])
def delete_message(msg_id):
    global DATABASE_CHAT
    if session.get('member') != 'rauf':
        return jsonify({"error": "Unauthorized"}), 403
        
    DATABASE_CHAT = [msg for msg in DATABASE_CHAT if msg['id'] != msg_id]
    return jsonify({"status": "success"})


# ─── 2. JALUR BARU: API AI KEDUA BOT (GEMINI & OPENAI) ───

# Route AI Privat Bawah (Pakai Gemini)
@app.route('/api/ai-privat', methods=['POST'])
def ai_privat():
    data = request.json
    pesan_user = data.get('prompt', '')
    try:
        model = gemini.GenerativeModel('gemini-pro')
        response = model.generate_content(pesan_user)
        return jsonify({"reply": response.text})
    except Exception as e:
        return jsonify({"reply": f"Gemini Error: {str(e)}"}), 500

# Route AI Grup Atas (Pakai OpenAI)
@app.route('/api/ai-grup', methods=['POST'])
def ai_grup():
    data = request.json
    pesan_user = data.get('prompt', '')
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Kamu adalah STAS-AI, asisten bot yang asyik di grup komunitas STAS."},
                {"role": "user", "content": pesan_user}
            ]
        )
        return jsonify({"reply": response.choices[0].message.content})
    except Exception as e:
        return jsonify({"reply": f"OpenAI Error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
