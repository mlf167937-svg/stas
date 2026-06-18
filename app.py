from flask import Flask, render_template, request, redirect, session

app = Flask(__name__)
app.secret_key = "stas_community_key"

# komunitas user (fake database dulu)
users = {
    "rehan": "123",
    "admin": "admin",
    "member1": "111"
}

@app.route("/")
def index():
    if "user" in session:
        return redirect("/home")
    return redirect("/login")


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        u = request.form["username"]
        p = request.form["password"]

        if u in users and users[u] == p:
            session["user"] = u
            return redirect("/home")

        return render_template("login.html", error="Login gagal")

    return render_template("login.html")


@app.route("/home")
def home():
    if "user" not in session:
        return redirect("/login")

    return render_template("home.html", user=session["user"])


@app.route("/logout")
def logout():
    session.pop("user", None)
    return redirect("/login")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
