import os
from flask import Flask, render_template, request, session, redirect, url_for

# Inisialisasi Aplikasi Flask
app = Flask(__name__)

# Ini BUKAN API Key eksternal, melainkan kunci internal Flask buat ngamanin session login.
# Wajib ada kalau pakai fitur login/logout, isinya bebas aja buat sekarang.
app.secret_key = 'kunci_rahasia_stas_arena_cuks'

# ==============================================================================
# FUNGSI PERSIAPAN FOLDER LOCAL
# ==============================================================================
def siapkan_folder_lokal():
    folder_wajib = [
        'stas/nama',
        'stas/desk',
        'stas/database',
        'stas/avatar'
    ]
    for folder in folder_wajib:
        os.makedirs(folder, exist_ok=True)

siapkan_folder_lokal()

# ==============================================================================
# ROUTE OTENTIKASI (LOGIN & REGISTER)
# ==============================================================================
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # Simulasi login sederhana
        username = request.form.get('username', 'Player_STAS')
        session['username'] = username
        return redirect(url_for('index'))
    
    if 'username' in session:
        return redirect(url_for('index'))
        
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    return redirect(url_for('login'))

@app.route('/logout')
def logout():
    session.pop('username', None)
    session.pop('is_admin', None)
    return redirect(url_for('login'))

# ==============================================================================
# ROUTE UTAMA (DASHBOARD)
# ==============================================================================
@app.route('/')
@app.route('/home')
def index():
    if 'username' not in session:
        return redirect(url_for('login'))
    
    return render_template('index.html', 
                           username=session['username'],
                           total_members=150,
                           active_games=2,
                           online_now=12)

# ==============================================================================
# ROUTE AI CHATBOT (HANYA RENDER HALAMAN, LOGIKA 100% DI FILE JS LOKAL)
# ==============================================================================
@app.route('/ai', methods=['GET', 'POST'])
def ai():
    if 'username' not in session:
        return redirect(url_for('login'))
    return render_template('ai.html')

# ==============================================================================
# ROUTE GAMES HUB & ARENA
# ==============================================================================
@app.route('/games')
def games():
    if 'username' not in session:
        return redirect(url_for('login'))
    return render_template('games/games_hub.html')

@app.route('/play/blockblast')
def play_blockblast():
    if 'username' not in session:
        return redirect(url_for('login'))
    return render_template('games/games_blockblast.html')

@app.route('/play/local')
def play_local():
    if 'username' not in session:
        return redirect(url_for('login'))
    return render_template('games/game_stickman.html')

@app.route('/play/online')
def play_online():
    if 'username' not in session:
        return redirect(url_for('login'))
    
    room = request.args.get('room', 'Global_Arena')
    player_name = request.args.get('username', session.get('username'))
    
    return render_template('games/game_stickman.html', room=room, player_name=player_name)

# ==============================================================================
# ROUTE ADMIN PANEL
# ==============================================================================
@app.route('/admin/lock')
def admin_lock():
    if 'username' not in session:
        return redirect(url_for('login'))
    
    if session.get('is_admin'):
        return redirect(url_for('admin'))
        
    return render_template('admin_lock.html')

@app.route('/admin/verify', methods=['POST'])
def verify_admin():
    password_input = request.form.get('password')
    
    if password_input == 'admin123':
        session['is_admin'] = True
        return redirect(url_for('admin'))
    else:
        return redirect(url_for('admin_lock'))

@app.route('/admin')
def admin():
    if 'username' not in session:
        return redirect(url_for('login'))
    if not session.get('is_admin'):
        return redirect(url_for('admin_lock'))
    
    users_data = [
        {'id': 1, 'name': 'Tuan_Alhidayah', 'role': 'Founder', 'status': 'Active'},
        {'id': 2, 'name': 'Member_Satu', 'role': 'User', 'status': 'Active'},
    ]
    games_data = [
        {'id': 1, 'name': 'Stickman Arena', 'played': 430},
        {'id': 2, 'name': 'Block Blast', 'played': 215},
    ]
    logs_data = [
        {'time': '10:00', 'action': 'System Backup', 'status': 'Success'}
    ]
    stats_data = {
        'total_users': 150,
        'active_games': 2,
        'server_health': '99%',
        'total_revenue': 'Rp 0'
    }
    
    return render_template('admin.html', 
                           users=users_data, 
                           games=games_data, 
                           logs=logs_data, 
                           stats=stats_data)

# ==============================================================================
# ROUTE PROFILE
# ==============================================================================
@app.route('/profile')
def profile():
    if 'username' not in session:
        return redirect(url_for('login'))
    
    return render_template('profile.html', username=session['username'])

@app.route('/profile/update', methods=['POST'])
def update_profile():
    if 'username' not in session:
        return redirect(url_for('login'))
        
    return redirect(url_for('profile'))

# ==============================================================================
# EKSEKUSI RUN SERVER LOKAL
# ==============================================================================
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
