from flask import Flask, render_template
import os

app = Flask(__name__)

BASE = "stas"

def load_members():
    members = []

    nama_path = os.path.join(BASE, "nama")
    desk_path = os.path.join(BASE, "desk")
    db_path = os.path.join(BASE, "database")

    for file in os.listdir(nama_path):
        if file.endswith(".txt"):
            name = file.replace(".txt", "")

            try:
                with open(os.path.join(nama_path, file), "r", encoding="utf-8") as f:
                    nama = f.read().strip()

                with open(os.path.join(desk_path, file), "r", encoding="utf-8") as f:
                    desk = f.read().strip()

                with open(os.path.join(db_path, file), "r", encoding="utf-8") as f:
                    data = f.read().strip()

                members.append({
                    "id": name,
                    "nama": nama,
                    "desk": desk,
                    "data": data
                })

            except:
                pass

    return members


@app.route("/")
def index():
    members = load_members()
    return render_template("index.html", members=members)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
