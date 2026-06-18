"""
STAS — Sang Tuan Alhidayah Sutam
A file-based community member system built with Flask.

Members are not stored in a database. Instead, each member is represented
by three plain-text files sharing the same filename (username) across:

    stas/nama/{username}.txt      -> display name
    stas/desk/{username}.txt      -> short description / role
    stas/database/{username}.txt  -> freeform profile info (bio, contact, etc.)

The app scans stas/nama/ on every request to discover members, so adding a
new member is as simple as dropping three .txt files on disk.
"""

import os
from functools import wraps

from flask import (
    Flask,
    render_template,
    request,
    redirect,
    url_for,
    session,
    flash,
    jsonify,
)

# ---------------------------------------------------------------------------
# App configuration
# ---------------------------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STAS_DIR = os.path.join(BASE_DIR, "stas")
NAMA_DIR = os.path.join(STAS_DIR, "nama")
DESK_DIR = os.path.join(STAS_DIR, "desk")
DATABASE_DIR = os.path.join(STAS_DIR, "database")

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "stas-dev-secret-key-change-me")

# Ensure the required folders always exist, even on a fresh deploy.
for d in (NAMA_DIR, DESK_DIR, DATABASE_DIR):
    os.makedirs(d, exist_ok=True)

# ---------------------------------------------------------------------------
# Simple file-based auth
# ---------------------------------------------------------------------------
# For a real deployment, swap this dict for a proper user store. Per the
# spec this is intentionally a simple/fake user system since STAS itself is
# a member directory, not an account management system.

USERS = {
    "admin": "stas2026",
    "sutam": "alhidayah",
    "guest": "guest",
}


def login_required(view_func):
    @wraps(view_func)
    def wrapped(*args, **kwargs):
        if not session.get("logged_in"):
            return redirect(url_for("login", next=request.path))
        return view_func(*args, **kwargs)

    return wrapped


# ---------------------------------------------------------------------------
# File helpers
# ---------------------------------------------------------------------------


def _safe_read(path):
    """Read a text file's contents, returning an empty string if missing."""
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read().strip()
    except (FileNotFoundError, OSError):
        return ""


def _list_usernames():
    """Derive usernames from the .txt filenames inside stas/nama/."""
    if not os.path.isdir(NAMA_DIR):
        return []

    usernames = []
    for filename in os.listdir(NAMA_DIR):
        if filename.lower().endswith(".txt"):
            username = filename[:-4]
            if username:
                usernames.append(username)

    return sorted(usernames, key=str.lower)


def load_members():
    """
    Scan the filesystem and build the full list of community members.

    For every username discovered in stas/nama/, this combines:
      - nama/{user}.txt      -> member["nama"]      (display name)
      - desk/{user}.txt      -> member["desk"]       (short description)
      - database/{user}.txt  -> member["database"]   (extended profile info)

    Returns a list of dicts, each shaped like:
        {
            "id": "username",
            "nama": "Display Name",
            "desk": "Short description",
            "database": "Extended info...",
            "initial": "D"
        }
    """
    members = []

    for username in _list_usernames():
        nama_path = os.path.join(NAMA_DIR, f"{username}.txt")
        desk_path = os.path.join(DESK_DIR, f"{username}.txt")
        db_path = os.path.join(DATABASE_DIR, f"{username}.txt")

        nama = _safe_read(nama_path) or username.title()
        desk = _safe_read(desk_path) or "No description provided yet."
        database = _safe_read(db_path) or "No additional profile information yet."

        initial = nama.strip()[0].upper() if nama.strip() else "?"

        members.append(
            {
                "id": username,
                "nama": nama,
                "desk": desk,
                "database": database,
                "initial": initial,
            }
        )

    return members


def get_member(user_id):
    """Fetch a single member by id, or None if not found."""
    for member in load_members():
        if member["id"] == user_id:
            return member
    return None


# ---------------------------------------------------------------------------
# Routes — Auth
# ---------------------------------------------------------------------------


@app.route("/login", methods=["GET", "POST"])
def login():
    if session.get("logged_in"):
        return redirect(url_for("index"))

    error = None

    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")

        if username in USERS and USERS[username] == password:
            session["logged_in"] = True
            session["username"] = username
            next_url = request.args.get("next") or url_for("index")
            return redirect(next_url)

        error = "Invalid username or password. Please try again."

    return render_template("login.html", error=error)


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))


# ---------------------------------------------------------------------------
# Routes — Community
# ---------------------------------------------------------------------------


@app.route("/")
@login_required
def index():
    query = request.args.get("q", "").strip().lower()
    members = load_members()

    if query:
        members = [m for m in members if query in m["nama"].lower() or query in m["desk"].lower()]

    return render_template(
        "index.html",
        members=members,
        query=request.args.get("q", ""),
        total_members=len(load_members()),
        username=session.get("username"),
    )


@app.route("/api/members")
@login_required
def api_members():
    """JSON endpoint used for instant client-side search/filtering."""
    return jsonify(load_members())


@app.route("/user/<user_id>")
@login_required
def profile(user_id):
    member = get_member(user_id)
    if member is None:
        flash("That member could not be found.", "error")
        return redirect(url_for("index"))

    return render_template("profile.html", member=member, username=session.get("username"))


# ---------------------------------------------------------------------------
# Error handlers
# ---------------------------------------------------------------------------


@app.errorhandler(404)
def not_found(_e):
    return render_template("login.html", error=None), 404


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
