from flask import Flask, render_template
import os

app = Flask(__name__)

BASE_DIR = "stas"

def get_members():
    members = []

    nama_dir = os.path.join(BASE_DIR, "nama")
    desk_dir = os.path.join(BASE_DIR, "desk")
    db_dir = os.path.join(BASE_DIR, "database")

    files = os.listdir(nama_dir)

    for file in files:
        if not file.endswith(".txt"):
            continue

        user_id = file.replace(".txt", "")

        nama_path = os.path.join(nama_dir, file)
        desk_path = os.path.join(desk_dir, file)
        db_path = os.path.join(db_dir, file)

        try:
            with open(nama_path, "r", encoding="utf-8") as f:
                nama = f.read().strip()

            with open(desk_path, "r", encoding="utf-8") as f:
                desk = f.read().strip()

            with open(db_path, "r", encoding="utf-8") as f:
                db = f.read().strip()

            members.append({
                "id": user_id,
                "nama": nama,
                "desk": desk,
                "db": db
            })

        except:
            continue

    return members


@app.route("/")
def index():
    members = get_members()
    return render_template("index.html", members=members)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
