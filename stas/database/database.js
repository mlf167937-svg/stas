(() => {
  const state = {
    users: [],
    session: null,
    route: "/",
    cache: new Map(),
    token: null
  };

  const utils = {
    id: () => Math.random().toString(36).substring(2, 10),
    hash: (str) => {
      let h = 0;
      for (let i = 0; i < str.length; i++) {
        h = (h << 5) - h + str.charCodeAt(i);
        h |= 0;
      }
      return h >>> 0;
    },
    delay: (ms) => new Promise(r => setTimeout(r, ms)),
    clone: (obj) => JSON.parse(JSON.stringify(obj))
  };

  const storage = {
    save(key, value) {
      state.cache.set(key, value);
    },
    load(key) {
      return state.cache.get(key);
    },
    remove(key) {
      state.cache.delete(key);
    }
  };

  const auth = {
    register(username, password) {
      const exists = state.users.find(u => u.username === username);
      if (exists) return { ok: false, msg: "user exists" };

      const user = {
        id: utils.id(),
        username,
        password: utils.hash(password),
        created: Date.now()
      };

      state.users.push(user);
      storage.save("users", state.users);

      return { ok: true, user };
    },

    login(username, password) {
      const user = state.users.find(u => u.username === username);
      if (!user) return { ok: false, msg: "not found" };

      if (user.password !== utils.hash(password)) {
        return { ok: false, msg: "wrong password" };
      }

      state.session = {
        userId: user.id,
        token: utils.id(),
        loginAt: Date.now()
      };

      state.token = state.session.token;
      return { ok: true, session: state.session };
    },

    logout() {
      state.session = null;
      state.token = null;
      return { ok: true };
    }
  };

  const router = {
    go(path) {
      state.route = path;
      render();
    }
  };

  const db = {
    createPost(title, content) {
      if (!state.session) return { ok: false };

      const post = {
        id: utils.id(),
        userId: state.session.userId,
        title,
        content,
        created: Date.now()
      };

      const posts = storage.load("posts") || [];
      posts.push(post);
      storage.save("posts", posts);

      return { ok: true, post };
    },

    getPosts() {
      return storage.load("posts") || [];
    }
  };

  const render = () => {
    const root = document.getElementById("app");
    if (!root) return;

    if (state.route === "/") {
      root.innerHTML = `
        <div>
          <h1>HOME</h1>
          <button onclick="APP.router.go('/login')">LOGIN</button>
          <button onclick="APP.router.go('/register')">REGISTER</button>
          <button onclick="APP.router.go('/feed')">FEED</button>
        </div>
      `;
    }

    if (state.route === "/login") {
      root.innerHTML = `
        <div>
          <h1>LOGIN</h1>
          <input id="u" placeholder="username"/>
          <input id="p" placeholder="password" type="password"/>
          <button onclick="APP.login()">submit</button>
        </div>
      `;
    }

    if (state.route === "/register") {
      root.innerHTML = `
        <div>
          <h1>REGISTER</h1>
          <input id="u" placeholder="username"/>
          <input id="p" placeholder="password" type="password"/>
          <button onclick="APP.register()">create</button>
        </div>
      `;
    }

    if (state.route === "/feed") {
      const posts = db.getPosts();

      root.innerHTML = `
        <div>
          <h1>FEED</h1>
          <button onclick="APP.router.go('/')">home</button>
          <button onclick="APP.logout()">logout</button>

          <div>
            <input id="t" placeholder="title"/>
            <input id="c" placeholder="content"/>
            <button onclick="APP.post()">post</button>
          </div>

          <div>
            ${posts.map(p => `
              <div>
                <h3>${p.title}</h3>
                <p>${p.content}</p>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }
  };

  const APP = {
    router,
    auth,
    db,

    register() {
      const u = document.getElementById("u").value;
      const p = document.getElementById("p").value;
      auth.register(u, p);
      router.go("/login");
    },

    login() {
      const u = document.getElementById("u").value;
      const p = document.getElementById("p").value;
      const res = auth.login(u, p);
      if (res.ok) router.go("/feed");
    },

    logout() {
      auth.logout();
      router.go("/");
    },

    post() {
      const t = document.getElementById("t").value;
      const c = document.getElementById("c").value;
      db.createPost(t, c);
      render();
    }
  };

  window.APP = APP;

  document.addEventListener("DOMContentLoaded", () => {
    render();
  });
})();
