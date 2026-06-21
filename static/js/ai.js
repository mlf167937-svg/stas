// ─── Selector Elemen STAS-AI Assistant ──────────────────────────
const aiChatbox = document.getElementById('ai-chatbox');
const aiInput   = document.getElementById('ai-input');
const aiSend    = document.getElementById('ai-send');
const aiLog     = document.getElementById('ai-log');

// ─── Helper Log (Tanpa if-else) ─────────────────────────────────
function addSystemLog(message) {
  const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const logEntry = document.createElement('div');
  logEntry.className = "log-entry"; // Biar lu gampang styling di CSS
  logEntry.style.fontSize = '0.7rem';
  logEntry.style.color = 'var(--text-muted)';
  logEntry.style.fontFamily = 'monospace';
  logEntry.innerText = `[${time}] ${message}`;
  aiLog.appendChild(logEntry);
  aiLog.scrollTop = aiLog.scrollHeight;
}

// ─── Helper Tampilan Chat AI & User (Tanpa if-else) ─────────────
function renderUserMsg(text) {
  const msgDiv = document.createElement('div');
  msgDiv.className = "ai-msg-wrap user";
  msgDiv.style.marginBottom = '0.75rem';
  msgDiv.style.display = 'flex';
  msgDiv.style.flexDirection = 'column';
  msgDiv.style.alignItems = 'flex-end'; // User di kanan

  msgDiv.innerHTML = `
    <div style="padding: 0.55rem 0.75rem; border-radius: 8px; font-size: 0.85rem; max-width: 85%; background: var(--bg-surface); color: var(--green-neon); word-break: break-word;">
      ${text}
    </div>
  `;
  aiChatbox.appendChild(msgDiv);
  aiChatbox.scrollTop = aiChatbox.scrollHeight;
}

function renderBotMsg(text) {
  const msgDiv = document.createElement('div');
  msgDiv.className = "ai-msg-wrap bot";
  msgDiv.style.marginBottom = '0.75rem';
  msgDiv.style.display = 'flex';
  msgDiv.style.flexDirection = 'column';
  msgDiv.style.alignItems = 'flex-start'; // AI di kiri

  msgDiv.innerHTML = `
    <div style="padding: 0.55rem 0.75rem; border-radius: 8px; font-size: 0.85rem; max-width: 85%; background: rgba(191, 95, 255, 0.1); border: 1px solid rgba(191, 95, 255, 0.2); color: var(--text-main); word-break: break-word;">
      ${text}
    </div>
  `;
  aiChatbox.appendChild(msgDiv);
  aiChatbox.scrollTop = aiChatbox.scrollHeight;
}

// ─── Fungsi Kirim Data (CUMA 1 TEMPAT IF-ELSE DI SINI) ───────────
async function handleAiSend() {
  const query = aiInput.value.trim();
  if (!query) return; // Validasi standar biar gak kirim chat kosong

  renderUserMsg(query);
  aiInput.value = '';
  addSystemLog(`Mengirim prompt ke AI...`);

  try {
    const res = await fetch('/api/ai', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: query })
    });
    const data = await res.json();
    
    // ─── SILAHKAN MASUKKAN KODE IF ELSE LU DI SINI ───
    {
    // ==========================================
    // 1. SAPAAN & GREETING (CHATBOT META)
    // ==========================================
  const chatbotDatabase = {
    sapaan: {
        keywords: ['halo', 'hai', 'hei', 'hi', 'hlo', 'p', 'assalamualaikum', 'oy', 'pagi', 'siang', 'malam', 'hello', 'hey', 'yo', 'hola'],
        reply: "Halo juga, cuks! 🙌 Ada yang bisa dibantu seputar dunia Informatika? Dari coding, web dev, database, sampe cybersecurity, aku siap bantu!"
    },

    apa_itu_ai_stas: {
        keywords: ['siapa', 'apa itu ai stas', 'tentang stas', 'siapa itu stas', 'fungsi stas', 'kegunaan stas', 'untuk apa stas'],
        reply: "Yo cuks! Aku adalah AI STAS, chatbot lokal yang diadain buat komunitas IT. Aku dibuat buat membantu cuks ngejawab pertanyaan seputar Informatika, dari basic coding sampe cybersecurity. Aku bukan AI cloud, tapi AI lokal yang jauh lebih cepat dan aman!"
    },

    creator_stas: {
        keywords: ['siapa yang buat stas', 'pembuat stas', 'creator', 'author', 'developer stas', 'who made stas'],
        reply: "AI STAS diciptakan dengan penuh dedikasi buat komunitas IT lokal cuks! Dibuat oleh engineer yang passionate ngasih edukasi berkualitas tanpa harus nunggu cloud server. Solid banget!"
    },

    // ==========================================
    // 2. DASAR INFORMATIKA & CODING
    // ==========================================
    apa_itu_programming: {
        keywords: ['apa itu programming', 'apa itu coding', 'apa bedanya programming coding', 'programming vs coding', 'pengertian programming'],
        reply: "Programming (pemrograman) adalah proses menulis instruksi dalam bahasa yang komputer mengerti buat menyelesaikan masalah. Coding adalah aktivitas menulis kode itu sendiri. Jadi coding adalah bagian dari programming. Intinya: kita kasih perintah ke komputer pake bahasa khusus supaya dia bisa execute apa yang kita mau, cuks!"
    },

    bahasa_pemrograman_apa: {
        keywords: ['bahasa pemrograman apa yang populer', 'bahasa pemrograman yang bagus', 'bahasa pemrograman untuk pemula', 'bahasa pemrograman mana yang dipilih', 'recommended bahasa pemrograman'],
        reply: "Tergantung tujuan cuks! Untuk web: JavaScript, Python, PHP. Untuk mobile: Java, Swift, Kotlin. Untuk desktop: C++, Java, C#. Untuk data science: Python. Tapi rekomendasi pemula: mulai dari Python (mudah dipahami) atau JavaScript (bisa langsung bikin web). Pilih sesuai passion dan tujuan mu!"
    },

    algoritma_adalah: {
        keywords: ['apa itu algoritma', 'definisi algoritma', 'algoritma itu apa', 'pengertian algoritma', 'algoritma dalam programming'],
        reply: "Algoritma adalah kumpulan instruksi step-by-step yang terurut buat menyelesaikan suatu masalah. Bayangin kaya resep masak, cuks! Step 1: potong bawang, Step 2: panaskan minyak, dst. Dalam coding, algoritma adalah logika program yang kita bikin. Algoritma yang bagus = program yang efisien dan cepat!"
    },

    data_structure_apa: {
        keywords: ['apa itu data structure', 'struktur data', 'data structure dalam programming', 'mengapa data structure penting', 'macam macam data structure'],
        reply: "Data structure adalah cara kita organize dan store data dalam program. Macam-macamnya: Array (list), Object/Dictionary (key-value), Stack (LIFO), Queue (FIFO), Linked List, Tree, Graph. Memilih data structure yang tepat = program yang efisien. Bayangin kaya lemari, cuks - gimana kamu organize barang di dalamnya biar mudah dicari!"
    },

    array_vs_object: {
        keywords: ['array vs object', 'perbedaan array dan object', 'kapan pakai array kapan object', 'array apa object'],
        reply: "Array: collection data dengan index (0,1,2,...), cocok buat list berurutan. Contoh: [1,2,3,4]. Object: collection data dengan key-value, cocok buat data dengan property. Contoh: {nama: 'Andi', umur: 25}. Singkat: pakai array buat list, pakai object buat data terstruktur dengan label!"
    },

    loop_adalah: {
        keywords: ['apa itu loop', 'loop dalam programming', 'for loop', 'while loop', 'kapan pakai loop', 'mengapa loop penting'],
        reply: "Loop adalah struktur yang bikin code berjalan berulang kali sampai kondisi terpenuhi. Ada 3 jenis: FOR (looping dengan jumlah pasti), WHILE (looping selama kondisi true), DO-WHILE (looping minimal 1x). Contoh: looping array buat print setiap elemen. Tanpa loop, kita bakal nulis kode ratusan kali, cuks! 😅"
    },

    kondisional_if: {
        keywords: ['apa itu if statement', 'kondisional if', 'if else elif', 'switch case', 'cara pakai if', 'pengertian kondisional'],
        reply: "If statement adalah struktur buat bikin keputusan dalam program. Jika kondisi benar → jalankan kode A, jika salah → jalankan kode B. Syntax: if(kondisi) { } else { }. Ada juga else if buat multiple kondisi dan switch case buat lebih rapi. Intinya: program bisa 'mikir' dan pilih action yang sesuai!"
    },

    fungsi_adalah: {
        keywords: ['apa itu fungsi', 'function dalam programming', 'pengertian fungsi', 'mengapa pakai fungsi', 'parameter dan return'],
        reply: "Fungsi adalah blok code yang bisa dipakai berkali-kali. Definisikan sekali, panggil berkali-kali. Syntax: function nama(param) { return hasil; }. Fungsi bisa terima input (parameter) dan kasih output (return value). Manfaat: code lebih rapi, reusable, mudah di-debug. Bayangin fungsi seperti 'resep' yang bisa dipakai berulang kali, cuks!"
    },

    variabel_adalah: {
        keywords: ['apa itu variabel', 'pengertian variabel', 'variabel dalam coding', 'var let const', 'perbedaan var let const'],
        reply: "Variabel adalah tempat nyimpen data dalam program. Syntax: var/let/const nama = nilai. Bedanya: VAR (global scope, bisa di-redefine), LET (block scope, bisa di-redefine), CONST (block scope, gak bisa di-redefine). Best practice: gunakan CONST default, LET jika butuh reassign, hindari VAR. Bayangin variabel seperti kotak buat nyimpen barang, cuks!"
    },

    oop_adalah: {
        keywords: ['apa itu oop', 'object oriented programming', 'pengertian oop', 'konsep oop', 'oop dalam praktik', 'class dan object'],
        reply: "OOP (Object-Oriented Programming) adalah paradigma programming yang fokus pada 'object'. Konsep utama: Class (blueprint), Object (instance), Inheritance (turunan), Polymorphism (banyak bentuk), Encapsulation (pembungkus data). Contoh: Class 'Mobil' punya property (warna, merek) dan method (nyalain, mati). OOP bikin code lebih terstruktur dan maintainable, cuks!"
    },

    class_dan_object: {
        keywords: ['apa itu class', 'apa itu object', 'perbedaan class dan object', 'cara bikin class', 'cara bikin object dari class'],
        reply: "Class adalah blueprint/template buat bikin object. Object adalah instance dari class. Analogi: Class 'Rumah' adalah blueprint, rumahmu sendiri adalah object dari class itu. Syntax: class Rumah { constructor(pintu) { this.pintu = pintu; } }. Object: const rumahKu = new Rumah(2). Class = rencana, Object = hasil nyata!"
    },

    inheritance_adalah: {
        keywords: ['apa itu inheritance', 'pewarisan dalam oop', 'extends class', 'parent child class', 'mengapa inheritance penting'],
        reply: "Inheritance adalah konsep OOP di mana class bisa 'mewarisi' property dan method dari class lain. Syntax: class Anak extends Parent { }. Manfaat: reuse code, avoid duplikasi, bikin hierarchy class yang jelas. Contoh: Class 'Kendaraan' punya method 'jalan()', class 'Mobil' inherit dari Kendaraan dan bisa langsung pakai method 'jalan()'. Smart banget, cuks!"
    },

    polymorphism_adalah: {
        keywords: ['apa itu polymorphism', 'polimorfisme', 'method overriding', 'banyak bentuk dalam oop'],
        reply: "Polymorphism adalah kemampuan object buat 'mengubah bentuk' tergantung konteks. Ada 2 jenis: Compile-time (method overloading, overriding) dan Runtime (dynamic dispatch). Contoh: method 'bermain()' di class 'Anak' override method 'bermain()' di class 'Manusia' dengan cara berbeda. Jadi object yang sama bisa punya behavior berbeda!"
    },

    encapsulation_adalah: {
        keywords: ['apa itu encapsulation', 'pembungkus data', 'private public protected', 'access modifier'],
        reply: "Encapsulation adalah konsep OOP untuk 'membungkus' data (private) dan kasih akses via method (public). Tujuan: proteksi data, avoid perubahan tidak valid, increase security. Syntax: private data = 5; public getData() { return this.data; }. Jadi kita control gimana data bisa diakses. Kayak lemari kunci, cuks - hanya bisa ambil barang lewat pintu yang udah ditentuin!"
    },

    // ==========================================
    // 3. WEB DEVELOPMENT - FRONTEND
    // ==========================================
    html_adalah: {
        keywords: ['apa itu html', 'html itu apa', 'pengertian html', 'html dalam web', 'struktur html'],
        reply: "HTML (HyperText Markup Language) adalah bahasa buat struktur dan konten website. Gunanya: define elemen seperti heading, paragraph, button, form, dll. Syntax: <tag>konten</tag>. HTML adalah fondasi web, CSS styling-nya, JavaScript adalah interaksi-nya. HTML sendiri gak bisa styling, hanya struktur. Bayangin HTML seperti 'skeleton' website, cuks!"
    },

    css_adalah: {
        keywords: ['apa itu css', 'css dalam web', 'styling website', 'apa fungsi css', 'perbedaan html css'],
        reply: "CSS (Cascading Style Sheets) adalah bahasa buat styling dan design website. Gunanya: warna, font, layout, responsive design, animasi, dll. Syntax: selector { property: value; }. Contoh: .btn { background: blue; }. CSS bikin website cantik dan user-friendly. Tanpa CSS, website cuma plain text! Ada 3 cara pakai CSS: Inline, Internal, External (recommended)."
    },

    javascript_adalah: {
        keywords: ['apa itu javascript', 'javascript dalam web', 'fungsi javascript', 'javascript vs java', 'javascript adalah'],
        reply: "JavaScript adalah bahasa programming buat interaktivitas website. Gunanya: handle event (click, input), validasi form, animasi, fetch data, DOM manipulation, dll. JavaScript berjalan di browser (client-side). Penting: JavaScript ≠ Java, dua bahasa berbeda! JS sederhana buat web, Java kompleks buat backend. JS adalah 'otak' interaktif website, cuks!"
    },

    dom_adalah: {
        keywords: ['apa itu dom', 'dom manipulation', 'document object model', 'mengapa dom penting', 'cara akses dom'],
        reply: "DOM (Document Object Model) adalah representasi struktur HTML dalam bentuk tree. Dengan DOM, JavaScript bisa akses, modify, delete elemen HTML. Cara akses: document.getElementById(), querySelector(), etc. Contoh: document.getElementById('tombol').addEventListener('click', function(){}). DOM bikin JavaScript bisa 'sentuh' HTML dan buat interaksi. Powerful, cuks!"
    },

    event_listener: {
        keywords: ['apa itu event listener', 'addEventListener', 'event handler', 'event dalam javascript', 'onclick event'],
        reply: "Event Listener adalah mekanisme buat 'dengarkan' aksi user seperti click, hover, input, scroll, dll. Syntax: element.addEventListener('event', function(){}). Event yang umum: click, mouseover, mouseout, change, input, submit. Contoh: button.addEventListener('click', () => { alert('Diklik!'); }). Tanpa event listener, website gak bisa interactive!"
    },

    fetch_api_adalah: {
        keywords: ['apa itu fetch api', 'fetch dalam javascript', 'cara pakai fetch', 'fetch vs ajax', 'async await fetch'],
        reply: "Fetch API adalah cara modern buat request HTTP dalam JavaScript (async). Syntax: fetch(url).then(res => res.json()).then(data => { }); atau pakai async/await. Gunanya: ambil data dari server/API tanpa refresh page. Fetch mengembalikan Promise, jadi bisa di-chain dengan .then() atau pakai await. Ini adalah 'jembatan' antara frontend dan backend!"
    },

    async_await: {
        keywords: ['apa itu async await', 'async function', 'await dalam javascript', 'cara pakai async await', 'promise vs async await'],
        reply: "Async/Await adalah syntax buat handle asynchronous code (operasi yang butuh waktu seperti fetch). Async bikin function return Promise, await bikin code tunggu sampai Promise settled. Contoh: async function getdata() { const res = await fetch(url); return res.json(); }. Lebih clean daripada .then() chain. Penting: await hanya bisa di function yang async, cuks!"
    },

    promise_adalah: {
        keywords: ['apa itu promise', 'promise dalam javascript', 'resolve reject promise', 'cara pakai promise', 'promise.all'],
        reply: "Promise adalah object JavaScript yang represent hasil async operation yang mungkin available sekarang, later, atau never. Ada 3 state: Pending (belum selesai), Fulfilled (success), Rejected (error). Syntax: new Promise((resolve, reject) => {}). Promise punya method: .then(), .catch(), .finally(). Dengan Promise, async code jadi lebih terstruktur dan mudah di-handle, cuks!"
    },

    react_adalah: {
        keywords: ['apa itu react', 'react framework', 'mengapa pakai react', 'react vs vue', 'react dalam web dev'],
        reply: "React adalah JavaScript library buat bikin UI dengan pendekatan component-based. Gunanya: reusable components, virtual DOM (fast rendering), state management, unidirectional data flow. Syntax: JSX (HTML dalam JavaScript). React sangat populer buat SPA (Single Page Application) karena performa dan developer experience yang bagus. Dibuat oleh Facebook/Meta, cuks!"
    },

    component_react: {
        keywords: ['apa itu component', 'react component', 'functional component', 'class component', 'cara bikin component react'],
        reply: "Component adalah building block React - reusable piece of UI. Ada 2 jenis: Functional Component (function yang return JSX, recommended modern), Class Component (class yang extends React.Component, old style). Contoh functional: function Button({ text }) { return <button>{text}</button>; }. Component bisa menerima props (input) dan punya state (data internal), cuks!"
    },

    props_dan_state: {
        keywords: ['apa itu props', 'apa itu state', 'perbedaan props state', 'props dalam react', 'state dalam react'],
        reply: "Props: data yang di-pass parent component ke child, read-only, immutable. State: data internal component yang bisa berubah. Props = parameter function, State = variable lokal. Contoh: <Child name='Andi' /> - 'name' adalah props. useState('Andi') - value dalam state bisa di-set. Props buat communication parent->child, state buat manage component's own data, cuks!"
    },

    hooks_react: {
        keywords: ['apa itu hooks', 'react hooks', 'usestate', 'useeffect', 'custom hooks', 'common hooks'],
        reply: "Hooks adalah function yang bikin functional component bisa use state dan lifecycle features. Common hooks: useState (manage state), useEffect (side effects), useContext (context), useReducer (complex state), Custom hooks (reusable logic). Contoh: const [count, setCount] = useState(0); - 'count' adalah state, 'setCount' adalah function buat update. Hooks revolutionize React development!"
    },

    vue_adalah: {
        keywords: ['apa itu vue', 'vue framework', 'vue vs react', 'mengapa pakai vue', 'vue dalam web dev'],
        reply: "Vue adalah JavaScript framework buat bikin UI dengan syntax yang lebih intuitif dibanding React. Fitur: component-based, reactive data binding, directives (v-if, v-for), simple template syntax, progressive framework. Vue lebih mudah dipelajari pemula dibanding React, tapi React lebih banyak ecosystem dan job market. Pilih sesuai preferensi dan project kebutuhan, cuks!"
    },

    nodejs_adalah: {
        keywords: ['apa itu nodejs', 'node js', 'nodejs dalam backend', 'mengapa pakai nodejs', 'nodejs vs php'],
        reply: "Node.js adalah runtime JavaScript buat backend (server-side). Sebelum Node.js, JavaScript hanya jalan di browser. Node.js bikin JavaScript bisa buat web server, API, CLI tools, etc. Event-driven, non-blocking I/O, cocok buat real-time application. Package manager Node.js: NPM (Node Package Manager). Framework populer: Express.js, Next.js, Nestjs. Modern dan flexible, cuks!"
    },

    npm_adalah: {
        keywords: ['apa itu npm', 'npm dalam node', 'package manager', 'cara pakai npm', 'npm install npm start'],
        reply: "NPM (Node Package Manager) adalah package manager buat Node.js. Fungsi: install dependency, manage package, run scripts. Command penting: npm init (bikin project baru), npm install (install dependency), npm start (run project), npm uninstall (hapus package). File penting: package.json (list dependency), package-lock.json (version lock). NPM membuat management library jadi super mudah, cuks!"
    },

    api_adalah: {
        keywords: ['apa itu api', 'api dalam web', 'fungsi api', 'pengertian api', 'bagaimana api bekerja'],
        reply: "API (Application Programming Interface) adalah 'jembatan' komunikasi antar program. Frontend request data ke Backend via API, Backend kasih response. API define rules dan format komunikasi (endpoint, method, data format). Bayangin API seperti waiter di restoran - customer (client) kasih order ke waiter (API), waiter bawa ke kitchen (server), kasih kembali hasil. Essential buat web modern, cuks!"
    },

    rest_api: {
        keywords: ['apa itu rest api', 'restful api', 'rest dalam api', 'http method rest', 'cara bikin rest api'],
        reply: "REST API adalah standard architecture buat bikin API pakai HTTP method (GET, POST, PUT, DELETE). Guideline: resource-based URL, stateless, cacheable. Contoh endpoint: GET /api/users (fetch semua user), POST /api/users (buat user baru), PUT /api/users/1 (update user id 1), DELETE /api/users/1 (hapus user id 1). REST adalah standard de-facto buat API modern dan paling banyak dipakai industry, cuks!"
    },

    json_adalah: {
        keywords: ['apa itu json', 'json format', 'json dalam api', 'cara pakai json', 'json vs xml'],
        reply: "JSON (JavaScript Object Notation) adalah format data standard buat komunikasi API. Format: key-value pairs. Syntax: { \"nama\": \"Andi\", \"umur\": 25, \"hobi\": [\"coding\", \"gaming\"] }. JSON lightweight, readable, supported oleh semua bahasa programming. Cara convert: JSON.stringify() (object to JSON), JSON.parse() (JSON to object). JSON adalah lingua franca komunikasi web modern!"
    },

    // ==========================================
    // 4. DATABASE
    // ==========================================
    database_adalah: {
        keywords: ['apa itu database', 'database dalam aplikasi', 'fungsi database', 'mengapa butuh database', 'jenis jenis database'],
        reply: "Database adalah sistem organized buat store, retrieve, manage data. Fungsi: simpan data persistent, query cepat, security, concurrency control. Ada 2 tipe: Relational (SQL - structured data), NoSQL (unstructured/semi-structured). Bayangin database seperti filing cabinet digital - organize folder, bikin index, cari file jadi instant. Essential buat aplikasi yang handle banyak data, cuks!"
    },

    sql_vs_nosql: {
        keywords: ['sql vs nosql', 'perbedaan sql nosql', 'kapan pakai sql kapan nosql', 'relational vs nonrelational', 'sql dan nosql perbedaan'],
        reply: "SQL: Relational database, structured schema, ACID properties, good buat data terstruktur. Contoh: MySQL, PostgreSQL. NoSQL: Non-relational, flexible schema, eventual consistency, good buat data tidak terstruktur. Contoh: MongoDB, Firebase. SQL = spreadsheet yang ketat, NoSQL = flexible folder. Pilih SQL buat data yang pasti struktur (financial), NoSQL buat data dynamic (social media), cuks!"
    },

    mysql_adalah: {
        keywords: ['apa itu mysql', 'mysql database', 'cara pakai mysql', 'mysql dalam web', 'mysql dan php'],
        reply: "MySQL adalah relational database management system (RDBMS) paling populer. Open-source, stable, reliable. Syntax: SQL (Structured Query Language). Dipakai buat: WordPress, Magento, dll. MySQL organize data dalam tables dengan rows dan columns. Primary key identify unique row, foreign key create relationship antar table. MySQL + PHP + Apache = LAMP stack yang legendary, cuks!"
    },

    postgresql_adalah: {
        keywords: ['apa itu postgresql', 'postgresql database', 'postgresql vs mysql', 'keunikan postgresql', 'advanced features postgresql'],
        reply: "PostgreSQL adalah advanced relational database, more powerful dibanding MySQL. Fitur: JSONB support, full-text search, array types, custom data types, strong compliance dengan SQL standard. PostgreSQL cocok buat aplikasi kompleks yang butuh features advanced. Sedikit lebih resource-heavy dibanding MySQL, tapi lebih reliable dan scalable. Pilihan buat startup yang serius, cuks!"
    },

    mongodb_adalah: {
        keywords: ['apa itu mongodb', 'mongodb database', 'mongodb vs mysql', 'nosql mongodb', 'dokumen database'],
        reply: "MongoDB adalah NoSQL document database yang store data dalam JSON-like format (BSON). Fleksibel - schema tidak harus ketat, bisa ada field berbeda di setiap document. Cocok buat data yang structure-nya sering berubah (user profile, social media). Pake query language sendiri (bukan SQL). MongoDB + Node.js = MEAN/MERN stack populer. Modern dan developer-friendly, cuks!"
    },

    query_database: {
        keywords: ['apa itu query', 'database query', 'cara query database', 'sql query', 'select insert update delete'],
        reply: "Query adalah request ke database buat retrieve/modify data. Ada 4 operation dasar (CRUD): Create (INSERT - tambah data baru), Read (SELECT - ambil data), Update (UPDATE - ubah data), Delete (DELETE - hapus data). Contoh: SELECT * FROM users WHERE id = 1; Buat MongoDB: db.users.find({ _id: 1 }). Query adalah 'bahasa' kita ngobrol sama database, cuks!"
    },

    select_statement: {
        keywords: ['apa itu select', 'select statement', 'cara pakai select', 'select dari database', 'where clause'],
        reply: "SELECT adalah statement buat retrieve data dari database. Basic syntax: SELECT kolom FROM tabel WHERE kondisi. Contoh: SELECT nama, email FROM users WHERE id = 1; Modifiers: DISTINCT (unik), ORDER BY (sorting), LIMIT (batasi jumlah), JOIN (combine tables). SELECT adalah query paling sering dipake. Dimulai dari simple SELECT, terus advanced dengan JOIN dan subquery, cuks!"
    },

    join_dalam_database: {
        keywords: ['apa itu join', 'join dalam database', 'inner join', 'left join', 'right join', 'outer join'],
        reply: "JOIN adalah operasi combine data dari 2+ tables berdasarkan relationship. Jenis: INNER JOIN (kesamaan doang), LEFT JOIN (semua left + kesamaan), RIGHT JOIN (semua right + kesamaan), FULL OUTER JOIN (semua dari kedua). Syntax: SELECT * FROM users JOIN orders ON users.id = orders.user_id; JOIN crucial buat relational database, tanpa JOIN data jadi redundant, cuks!"
    },

    primary_key: {
        keywords: ['apa itu primary key', 'primary key dalam database', 'unique identifier', 'primary key dan index'],
        reply: "Primary Key adalah kolom yang unique identifier setiap row dalam table. Karakteristik: unique (tidak boleh duplicate), not null, hanya 1 per table. Biasanya kolom 'id' yang auto-increment. Fungsi: guarantee data integrity, speed up query, relationship foundation. Bayangin primary key seperti nomor induk siswa - setiap siswa punya nomor unik yang tidak boleh sama. Essential dalam database design, cuks!"
    },

    foreign_key: {
        keywords: ['apa itu foreign key', 'foreign key dalam database', 'relationship antar table', 'primary key vs foreign key'],
        reply: "Foreign Key adalah kolom yang reference primary key dari table lain. Fungsi: create relationship antar table, maintain data integrity (referential integrity). Contoh: table orders punya kolom user_id yang reference users.id. Syntax: ALTER TABLE orders ADD FOREIGN KEY (user_id) REFERENCES users(id); Foreign key adalah 'lem' yang hubungin antar table, cuks!"
    },

    index_dalam_database: {
        keywords: ['apa itu index', 'index database', 'mengapa butuh index', 'index dan performa', 'cara bikin index'],
        reply: "Index adalah struktur data yang speed up query retrieval, kayak index di buku. Dengan index, database tidak perlu scan semua data buat cari. Trade-off: query cepat, tapi insert/update jadi lambat dan butuh more storage. Best practice: index kolom yang sering di-query (WHERE clause) dan foreign key. Tapi jangan index semua kolom, harus strategic, cuks!"
    },

    normalization_database: {
        keywords: ['apa itu normalization', 'database normalization', 'normal forms', '1nf 2nf 3nf', 'mengapa normalisasi penting'],
        reply: "Normalization adalah process organize database schema buat minimize redundancy dan dependency. Ada levels (1NF sampai 5NF). 1NF: atomic values, 2NF: no partial dependency, 3NF: no transitive dependency. Bayangin normalisasi seperti organize file - hapus duplikasi, arrange dengan rapi, mudah maintain. Good design = less data redundancy = faster query + save storage. Important skill buat database architect, cuks!"
    },

    transaction_database: {
        keywords: ['apa itu transaction', 'database transaction', 'acid properties', 'commit rollback', 'atomicity consistency isolation durability'],
        reply: "Transaction adalah sequence operasi database yang treated sebagai single unit (all or nothing). ACID properties: Atomicity (semua or none), Consistency (valid state), Isolation (independent), Durability (persistent setelah commit). Syntax: BEGIN, COMMIT (save changes), ROLLBACK (undo changes). Transaction crucial buat data integrity terutama operasi multiple steps. Contoh: transfer uang - debit akun A dan credit akun B harus atomic, cuks!"
    },

    // ==========================================
    // 5. NETWORKING & INTERNET
    // ==========================================
    internet_cara_kerja: {
        keywords: ['bagaimana internet bekerja', 'cara kerja internet', 'internet adalah', 'internet fundamentals', 'infrastruktur internet'],
        reply: "Internet adalah global network dari networks yang connect melalui standardized protocols (TCP/IP). Flow: user buka website → browser send request ke server via internet (through ISP, router, dll) → server process dan send response → browser render response. Internet made dari cables (fiber optic, copper), routers, servers, dan devices. Internet democratize information access, cuks!"
    },

    ip_address: {
        keywords: ['apa itu ip address', 'ipv4 ipv6', 'ip address dalam networking', 'cara kerja ip address', 'private public ip'],
        reply: "IP Address adalah unique identifier buat device dalam network. Format: IPv4 (32-bit, contoh: 192.168.1.1), IPv6 (128-bit, lebih banyak address). Ada 2 jenis: Public IP (internet-facing), Private IP (internal network). Bayangin IP Address seperti nomor telepon - tiap device punya nomor unik buat komunikasi. DNS translate IP address ke domain name (google.com -> IP address). Essential buat internet communication, cuks!"
    },

    dns_adalah: {
        keywords: ['apa itu dns', 'domain name system', 'cara kerja dns', 'dns server', 'dns lookup'],
        reply: "DNS (Domain Name System) adalah 'phonebook' internet - translate domain name (google.com) ke IP address (142.251.x.x). Flow: browser request ke DNS server → DNS server cari IP → kasih balik ke browser → browser connect ke IP tersebut. Tanpa DNS, kita harus hafal IP address setiap website, repot banget! DNS buat internet usable. Jika DNS down, internet seperti jalan tanpa tanda jalan, cuks!"
    },

    http_https: {
        keywords: ['http vs https', 'perbedaan http https', 'mengapa pakai https', 'secure connection', 'ssl certificate'],
        reply: "HTTP: HyperText Transfer Protocol, plain text communication, unsecure. HTTPS: HTTP + SSL/TLS encryption, secure communication. Bedanya: HTTPS encrypt data dalam transmission, jadi man-in-the-middle tidak bisa sniff password/data sensitif. Setiap website modern harus pakai HTTPS. Browser tampilin padlock icon buat HTTPS, warning buat HTTP. SSL certificate di-issue oleh CA (Certificate Authority) dan verify authenticity website, cuks!"
    },

    ssl_certificate: {
        keywords: ['apa itu ssl certificate', 'ssl vs tls', 'cara kerja ssl', 'self-signed certificate', 'mengapa butuh ssl'],
        reply: "SSL/TLS Certificate adalah credential yang verify identity website dan enable encryption. Certificate contain: domain name, public key, issuer info, validity period. Cara kerja: client request ke server → server kirim certificate → client verify dengan CA → establish encrypted connection. Ada 3 jenis: Domain Validated (basic), Organization Validated (verify company), Extended Validation (highest trust). Good practice: always use HTTPS dengan valid certificate, cuks!"
    },

    osi_layer: {
        keywords: ['apa itu osi layer', 'osi model', '7 layer osi', 'osi layers explained', 'network model osi'],
        reply: "OSI (Open Systems Interconnection) adalah model dengan 7 layer yang describe network communication: Layer 1 Physical (cables), Layer 2 Data Link (MAC), Layer 3 Network (IP routing), Layer 4 Transport (TCP UDP), Layer 5 Session (connection management), Layer 6 Presentation (encryption), Layer 7 Application (HTTP DNS). Flow: user input di layer 7 → process turun ke layer 1 → transmit → naik balik sampai layer 7. Understand OSI = understand network, cuks!"
    },

    tcp_ip: {
        keywords: ['apa itu tcp', 'apa itu ip', 'tcp ip protocol', 'tcp vs udp', 'cara kerja tcp ip'],
        reply: "TCP/IP adalah protocol suite yang backbone internet. TCP (Transmission Control Protocol): reliable, connection-oriented, slow (confirm setiap packet), cocok buat data penting (browsing, email). UDP (User Datagram Protocol): unreliable, connectionless, fast (no confirm), cocok buat real-time (video call, gaming). Analogi: TCP = pengiriman kilat dengan tracking setiap paket, UDP = pengiriman biasa tanpa tracking, cuks!"
    },

    port_dalam_networking: {
        keywords: ['apa itu port', 'port dalam networking', 'port number', 'common ports', 'port dan service'],
        reply: "Port adalah logical endpoint dalam networking (0-65535). Port specify yang service/application menerima traffic. Common ports: 80 (HTTP), 443 (HTTPS), 22 (SSH), 3306 (MySQL), 5432 (PostgreSQL), 6379 (Redis). Bayangin port seperti pintu rumah - tiap pintu (port) bisa handle service berbeda. Syntax: ip_address:port buat connect ke specific service. Understanding ports crucial buat networking troubleshooting, cuks!"
    },

    router_firewall: {
        keywords: ['apa itu router', 'apa itu firewall', 'perbedaan router firewall', 'cara kerja router', 'cara kerja firewall'],
        reply: "Router: network device yang forward packet antar network (connect ke internet/LAN). Router assign IP address, create local network, control traffic. Firewall: security device yang filter incoming/outgoing traffic berdasarkan rules. Bayangin: Router = pintu rumah yang connect ke jalan raya (internet), Firewall = security guard yang check siapa boleh masuk-keluar. Modern router punya built-in firewall. Router + Firewall = network perimeter security, cuks!"
    },

    bandwidth_latency: {
        keywords: ['apa itu bandwidth', 'apa itu latency', 'perbedaan bandwidth latency', 'ping response time', 'speed internet'],
        reply: "Bandwidth: jumlah data yang bisa transfer per unit time (measured in Mbps/Gbps). Latency: delay dalam komunikasi (measured in milliseconds). Bayangin highway: bandwidth = lebar jalan (bisa banyak mobil), latency = waktu perjalanan. High bandwidth dengan high latency tetap slow (e.g., download cepat tapi lag saat browse). Optimal performance = high bandwidth + low latency. Internet speed bukan hanya bandwidth doang, cuks!"
    },

    // ==========================================
    // 6. CYBERSECURITY & PROTECTION
    // ==========================================
    cybersecurity_adalah: {
        keywords: ['apa itu cybersecurity', 'keamanan cyber', 'cybersecurity basics', 'mengapa cybersecurity penting', 'cyber threats'],
        reply: "Cybersecurity adalah practice melindungi system/data dari cyber attacks. Aspek: network security, application security, data security, user security. Threats: hacking, malware, phishing, ransomware, DDoS, injection, XSS, dll. Defense: firewall, antivirus, encryption, authentication, authorization, security update. Cybersecurity bukan 100% proteksi, tapi reduce risk dan mitigation. Essential di era digital di mana cyber attacks constantly evolving, cuks!"
    },

    sql_injection: {
        keywords: ['apa itu sql injection', 'sql injection attack', 'cara prevent sql injection', 'security sql injection', 'prepared statement'],
        reply: "SQL Injection adalah attack dengan input malicious SQL query dalam form field. Attacker bisa access/modify/delete database data. Contoh vulnerable code: query = 'SELECT * FROM users WHERE name = ' + userInput; jika userInput = \"admin' OR '1'='1\", query jadi dangerous. Prevention: use prepared statement/parameterized query, validate/sanitize input, least privilege database user. Always treat user input as untrusted, cuks!"
    },

    xss_attack: {
        keywords: ['apa itu xss', 'cross site scripting', 'xss attack', 'prevent xss', 'stored reflected xss'],
        reply: "XSS (Cross-Site Scripting) adalah attack dengan inject malicious script (JavaScript) dalam website. Ada 2 jenis: Reflected (immediate), Stored (persistent dalam database). Attacker bisa steal cookies/session, redirect user, deface website. Prevention: sanitize output, use content security policy (CSP), escape special characters, validate input. Jangan trust user input, jangan langsung render ke HTML tanpa sanitize, cuks!"
    },

    csrf_attack: {
        keywords: ['apa itu csrf', 'cross site request forgery', 'csrf protection', 'prevent csrf', 'token csrf'],
        reply: "CSRF (Cross-Site Request Forgery) adalah attack yang trick user buat trigger action pada website lain tanpa realizing. Attacker membuat malicious form yang auto-submit saat user visit, bisa change password, transfer money, dll. Prevention: CSRF token (random string dalam form), SameSite cookie attribute, verify origin header. Modern framework seperti Rails/Laravel built-in CSRF protection, cuks!"
    },

    phishing_adalah: {
        keywords: ['apa itu phishing', 'phishing attack', 'phishing email', 'how phishing works', 'avoid phishing'],
        reply: "Phishing adalah social engineering attack yang trick user buat reveal sensitive info (password, credit card) atau click malicious link. Usually via fake email/website yang look legitimate. Attacker could be anyone dengan basic web knowledge. Prevention: verify sender, check URL carefully, don't click suspicious link, use 2FA, educate yourself. Phishing adalah still most effective attack karena target manusia, bukan system, cuks!"
    },

    malware_adalah: {
        keywords: ['apa itu malware', 'virus trojan worm', 'jenis jenis malware', 'protection malware', 'bagaimana malware bekerja'],
        reply: "Malware adalah software berbahaya yang damage/exploit system. Jenis: Virus (self-replicate, attach ke file), Trojan (disguise sebagai legitimate, execute malicious code), Worm (self-replicate, spread via network), Ransomware (encrypt data, demand ransom), Spyware (spy aktivitas user). Prevention: antivirus, keep software updated, backup data, avoid untrusted download, suspicious email. Malware semakin sophisticated dan targeted, cuks!"
    },

    ddos_attack: {
        keywords: ['apa itu ddos', 'distributed denial of service', 'ddos attack', 'ddos protection', 'bot net ddos'],
        reply: "DDoS (Distributed Denial of Service) adalah attack yang overload server dengan massive traffic dari multiple source, jadi server gak bisa handle legitimate request. Attacker gunakan botnet (compromised devices). Impact: website down, service unavailable, revenue loss. Mitigation: rate limiting, CDN, WAF (Web Application Firewall), DDoS mitigation service. DDoS sulit buat prevent total, tapi bisa reduce impact dengan good preparation, cuks!"
    },

    secure_password: {
        keywords: ['cara membuat password aman', 'secure password', 'password best practice', 'strong password', 'password manager'],
        reply: "Password aman: minimal 12 character, mix uppercase/lowercase/number/special char, unique per account, avoid dictionary words. Don't: share password, use simple password (123456, qwerty), reuse password, store dalam plain text. Best practice: use password manager (LastPass, 1Password, Bitwarden), enable 2FA, change password regularly, use passphrase (mudah diinget, sulit di-crack). Password adalah first line of defense, cuks!"
    },

    two_factor_authentication: {
        keywords: ['apa itu 2fa', 'two factor authentication', 'mfa authentication', 'security 2fa', 'cara pakai 2fa'],
        reply: "2FA (Two-Factor Authentication) adalah security layer tambahan beyond password. Factor: something you know (password), something you have (phone/token), something you are (biometric). Methods: SMS OTP, authenticator app (Google Authenticator, Authy), security key (hardware token). 2FA significantly increase security walaupun password compromise. Recommended: enable 2FA terutama di account penting (email, banking, social media), cuks!"
    },

    encryption_data: {
        keywords: ['apa itu encryption', 'enkripsi data', 'symmetric asymmetric encryption', 'cara kerja encryption', 'encryption dalam security'],
        reply: "Encryption adalah process convert data ke format unreadable tanpa key (cipher text). 2 jenis: Symmetric (same key buat encrypt/decrypt, cepat), Asymmetric (public/private key, slower but secure). Encryption protect data saat rest (stored) dan transit (network). Common algorithms: AES (symmetric), RSA (asymmetric). HTTPS pakai encryption buat protect data. Encryption bukan magic - weak implementation bisa tetap vulnerable, cuks!"
    },

    amankan_website: {
        keywords: ['cara amankan website', 'website security', 'secure website', 'website protection', 'security checklist website'],
        reply: "Website security checklist: 1) Use HTTPS dengan valid certificate, 2) Input validation & sanitize, 3) Use prepared statement buat SQL, 4) Implement CSRF protection, 5) Security headers (CSP, X-Frame-Options), 6) Keep software updated, 7) Implement authentication/authorization, 8) Backup data regularly, 9) Use WAF, 10) Monitoring & logging. Security adalah ongoing process, bukan one-time. Regular security audit dan penetration testing buat ensure protection, cuks!"
    },

    vulnerability_scanning: {
        keywords: ['vulnerability scanning', 'security testing', 'penetration testing', 'vuln assessment', 'cara test security'],
        reply: "Vulnerability scanning adalah automated process cari weaknesses dalam system. Tools: Nessus, OpenVAS, Burp Suite, OWASP ZAP. Penetration testing: manual testing lebih in-depth, simulate real attack. Bug bounty: invite ethical hackers buat report vulnerabilities. Regular scanning = proactive security. Best practice: scan sebelum deploy, schedule regular scanning, fix vulnerability sesuai priority, cuks!"
    },

    // ==========================================
    // 7. PERTANYAAN ERROR DAN TROUBLESHOOTING
    // ==========================================
    error_404: {
        keywords: ['error 404', '404 not found', 'what is 404', '404 error meaning'],
        reply: "Error 404 berarti 'Not Found' - resource yang request tidak exist di server. Penyebab: URL typo, page sudah dihapus, broken link. Client error (4xx series), bukan server error. Solusi: check URL, buat redirect, implement proper error handling. Developer bisa customize 404 page buat user experience lebih baik. Error 404 normal dalam browsing, chill, cuks!"
    },

    error_500: {
        keywords: ['error 500', 'internal server error', '500 error', 'what is 500 error'],
        reply: "Error 500 berarti 'Internal Server Error' - ada problem di server saat process request. Penyebab: bug dalam code, database down, server resource exhausted, infinite loop, unhandled exception. Server error (5xx series), lebih serious dibanding client error. Solusi: check server logs, debug code, restart service, allocate more resource. User tidak bisa fix 500 error, harus contact developer, cuks!"
    },

    reference_error: {
        keywords: ['uncaught referenceerror', 'reference error', 'is not defined', 'variable not defined'],
        reply: "ReferenceError: terjadi saat reference variable/function yang belum declare atau out of scope. Contoh: console.log(x) tanpa var x = ... akan error 'x is not defined'. Penyebab: typo nama variable, forget declare, scope issue. Solusi: declare variable, check nama (case-sensitive!), understand scope (global vs local vs block). Error ini common buat pemula, debug dengan console.log atau debugger, cuks!"
    },

    syntax_error: {
        keywords: ['syntax error', 'invalid syntax', 'parsing error', 'unexpected token'],
        reply: "SyntaxError: terjadi saat code tidak follow language syntax. Contoh: missing bracket, wrong quote, typo keyword. Browser/interpreter tidak bisa parse code sebelum execute. Penyebab: typo, copy-paste dari source yang berbeda format, IDE setting yang salah. Solusi: read error message carefully (biasanya specify line number), use IDE dengan syntax highlighting, format code dengan prettier/eslint. Syntax error prevent code dari running, cuks!"
    },

    git_adalah: {
        keywords: ['apa itu git', 'git dalam development', 'git version control', 'git workflow', 'mengapa pakai git'],
        reply: "Git adalah version control system buat track code changes. Fungsi: track history, collaborate dengan team, revert ke previous version, branch untuk feature development. Basic workflow: git init (create repo), git add (stage changes), git commit (save snapshot), git push (upload ke remote). Git adalah industry standard dan pretty much mandatory skill buat developer. Tanpa git, collaboration jadi nightmare, cuks!"
    },

    github_adalah: {
        keywords: ['apa itu github', 'github vs git', 'github dalam development', 'github repository', 'github workflow'],
        reply: "GitHub adalah cloud platform buat host Git repository. Git = local version control, GitHub = cloud collaboration. Fitur: repository hosting, pull request (code review), issue tracking, wiki, CI/CD integration. GitHub jadi de-facto platform buat open source dan team collaboration. Alternative: GitLab, Gitea (self-hosted), Bitbucket. Penting buat portfolio - show your code di GitHub, cuks!"
    },

    git_commit: {
        keywords: ['apa itu git commit', 'cara commit git', 'good commit message', 'commit best practice'],
        reply: "Git commit adalah snapshot dari code changes. Syntax: git commit -m 'message'. Good commit message: clear, concise, describe what changed dan why. Format: 'Fix login bug' lebih baik dari 'fixed stuff'. Best practice: commit frequently, small changes per commit (atomic), meaningful message buat mudah track history. Commit adalah dokumentasi development, tuliskan dengan serius, cuks!"
    },

    git_branch: {
        keywords: ['apa itu git branch', 'branching strategy', 'main dev branch', 'feature branch', 'cara pakai branch'],
        reply: "Git branch adalah separate line of development. Main branch biasanya 'main' atau 'master' (production). Buat feature baru: git checkout -b feature-name. Branch let you work isolated tanpa affect main code. Workflow: create branch → develop → commit → push → pull request → review → merge ke main. Branching strategy (Git Flow, GitHub Flow) organize team development. Branch adalah powerful tool buat collaboration, cuks!"
    },

    pull_request: {
        keywords: ['apa itu pull request', 'pr dalam git', 'code review', 'merge pull request', 'pull request workflow'],
        reply: "Pull Request (PR) adalah mechanism buat propose code changes dan request review. Flow: push branch → create PR → team review → discuss/request changes → approve → merge. PR facilitate code review, catch bugs before merge, document why changes dibuat. Best practice: PR kecil (easy review), clear description, test sebelum PR, respond ke feedback. PR adalah core dari collaborative development, cuks!"
    },

    docker_adalah: {
        keywords: ['apa itu docker', 'docker container', 'containerization', 'docker dalam development', 'docker vs vm'],
        reply: "Docker adalah containerization platform yang package aplikasi + dependency dalam container. Container = lightweight VM dengan consistent environment. Keuntungan: works on my machine finally works (same env everywhere!), easy deploy, scale, easy share. Docker vs VM: Docker lebih lightweight, faster, VM lebih isolated. Dockerfile = recipe buat build image, image = template, container = running instance. Docker revolutionize deployment, cuks!"
    },

    dockerfile: {
        keywords: ['apa itu dockerfile', 'cara membuat dockerfile', 'dockerfile syntax', 'docker image'],
        reply: "Dockerfile adalah text file yang contain instructions buat build Docker image. Format: FROM (base image), RUN (execute command), COPY (copy file), WORKDIR (working directory), CMD (default command). Contoh: FROM node:14, COPY . /app, WORKDIR /app, RUN npm install, CMD npm start. Docker build menggunakan Dockerfile buat create image, yang bisa di-run jadi container. Understanding Dockerfile essential buat containerization, cuks!"
    },

    // ==========================================
    // 8. DASAR INFORMATIKA LANJUTAN
    // ==========================================
    sorting_algorithm: {
        keywords: ['apa itu sorting algorithm', 'bubble sort quick sort', 'algoritma sorting', 'jenis sorting', 'time complexity sorting'],
        reply: "Sorting adalah algoritma arrange data dalam order (ascending/descending). Jenis populer: Bubble Sort (simple, slow O(n²)), Quick Sort (fast O(n log n)), Merge Sort (stable O(n log n)), Heap Sort, Selection Sort. Pilihan tergantung: data size, stability requirement, memory available. Quick Sort umumnya fastest dalam praktik. Understanding sorting = understand algorithm complexity, cuks!"
    },

    search_algorithm: {
        keywords: ['linear search binary search', 'apa itu search algorithm', 'cara kerja binary search', 'search vs sorting'],
        reply: "Search adalah algoritma find specific element dalam data. Linear Search: iterate satu-satu O(n), simple. Binary Search: divide and conquer O(log n), cepat tapi data harus sorted. Contoh: linear search array [1,5,3,8], cari 8 → iterate sampai ketemu. Binary search sorted array [1,3,5,8], cari 8 → start middle, 5 < 8, search right half. Binary search jauh lebih cepat buat data besar, cuks!"
    },

    big_o_notation: {
        keywords: ['apa itu big o', 'time complexity', 'big o notation', 'algoritma complexity', 'o(n) o(1) o(log n)'],
        reply: "Big O adalah notation buat describe algorithm efficiency (worst-case scenario). Common: O(1) constant, O(log n) logarithmic, O(n) linear, O(n log n) linearithmic, O(n²) quadratic, O(2ⁿ) exponential, O(n!) factorial. O(1) adalah fastest, O(n!) adalah slowest. Contoh: linear search O(n), binary search O(log n), bubble sort O(n²). Analyzing Big O crucial buat optimize code performance, cuks!"
    },

    recursion_adalah: {
        keywords: ['apa itu recursion', 'recursive function', 'cara kerja recursion', 'base case recursive'],
        reply: "Recursion adalah function yang call itself. Struktur: base case (stop condition), recursive case (call self dengan different parameter). Contoh: factorial(n) = n * factorial(n-1), stop saat n=0. Recursion bisa bikin code elegant tapi butuh careful handling buat avoid infinite loop dan stack overflow. Trade-off: elegant code vs potentially slower + memory overhead. Understanding recursion important buat advanced programming, cuks!"
    },

    // ==========================================
    // 9. FRAMEWORK & TOOLS POPULER
    // ==========================================
    express_adalah: {
        keywords: ['apa itu express', 'express js', 'express framework', 'express dalam nodejs', 'cara pakai express'],
        reply: "Express adalah lightweight web framework buat Node.js. Gunanya: route management, middleware, request/response handling, template engine integration. Minimal setup: const app = express(); app.listen(3000). Express super flexible dan minimalist - banyak freedom tapi butuh setup banyak. Many frameworks build on top Express. Express adalah de-facto standard buat Node.js backend, cuks!"
    },

    laravel_adalah: {
        keywords: ['apa itu laravel', 'laravel framework', 'laravel php', 'mengapa pakai laravel', 'laravel vs symfony'],
        reply: "Laravel adalah modern PHP framework buat web development. Fitur: MVC architecture, Eloquent ORM (database easy), Blade template engine, migration, authentication built-in. Laravel sangat developer-friendly dengan excellent documentation. Syntax elegant dan intuitive. Alternative PHP framework: Symfony (enterprise), CodeIgniter (lightweight). Laravel adalah most loved PHP framework dikalangan modern developers, cuks!"
    },

    django_adalah: {
        keywords: ['apa itu django', 'django framework', 'django python', 'mengapa pakai django', 'django vs flask'],
        reply: "Django adalah full-featured Python web framework. Fitur: ORM (Django ORM), admin panel, authentication, migration, template engine (Django Template), security features built-in. Django 'batteries included' - sudah include banyak tools siap pakai. Alternative Python framework: Flask (lightweight), FastAPI (modern async). Django cocok buat large projects dengan team, cuks!"
    },

    flask_adalah: {
        keywords: ['apa itu flask', 'flask framework', 'flask python', 'flask vs django', 'microframework flask'],
        reply: "Flask adalah lightweight microframework Python. Minimal, flexible, learn-as-you-go. Perfect buat learning, small projects, API. Kita pick sendiri tools yang dipakai. Syntax: from flask import Flask; app = Flask(__name__). Flask powerful dengan ecosystem (extensions). Dibanding Django yang 'batteries included', Flask adalah 'bring your own batteries'. Flask cocok buat experimentation dan custom needs, cuks!"
    },

    webpack_adalah: {
        keywords: ['apa itu webpack', 'bundler webpack', 'build tool webpack', 'webpack dalam web dev', 'why webpack important'],
        reply: "Webpack adalah module bundler buat JavaScript projects. Fungsi: bundle JS/CSS/assets, transpile modern JS ke compatible, minify, lazy load. Configuration: webpack.config.js. Webpack analyze dependency, create optimized bundle. Modern development almost always pakai bundler - webpack, Vite, esbuild, Parcel. Understanding bundler important buat optimize performance dan deployment, cuks!"
    },

    babel_adalah: {
        keywords: ['apa itu babel', 'babel transpiler', 'babel dalam javascript', 'es6 transpiling', 'modern javascript babel'],
        reply: "Babel adalah JavaScript transpiler yang convert modern JavaScript (ES6+) ke older compatible version (ES5) buat support older browsers. Gunanya: use modern syntax today, support legacy browsers. Configuration: .babelrc atau babel.config.js. Babel juga enable JSX compilation (React). Babel crucial buat modern web development, almost setiap project pakai Babel. Development = modern syntax, production = compatible version, cuks!"
    },

    eslint_prettier: {
        keywords: ['apa itu eslint', 'apa itu prettier', 'eslint prettier', 'code quality linting', 'code formatter'],
        reply: "ESLint: linter yang analyze code buat find bugs dan style issues (customizable rules). Prettier: code formatter yang auto-format code buat consistent style. Usage together: ESLint check logic, Prettier handle formatting. Best practice: integrate dalam CI/CD pipeline, auto-format on save. ESLint + Prettier = professional code quality. Every serious project harus pakai dua tools ini, cuks!"
    },

    // ==========================================
    // 10. ADVANCED TOPICS
    // ==========================================
    microservices: {
        keywords: ['apa itu microservices', 'microservices architecture', 'monolithic vs microservices', 'microservices advantages'],
        reply: "Microservices adalah architecture style dengan bikin aplikasi dari small, independent services. Tiap service: own database, own codebase, deployable independently. Keuntungan: scalability, flexibility, fast deployment, easy to maintain. Tantangan: complexity, distributed system issues, eventual consistency. Microservices cocok buat large, complex applications. Trade-off: simplicity vs scalability. Modern architecture trend adalah microservices, cuks!"
    },

    api_gateway: {
        keywords: ['apa itu api gateway', 'api gateway dalam microservices', 'gateway pattern', 'why api gateway'],
        reply: "API Gateway adalah entry point tunggal untuk semua client requests dalam microservices architecture. Fungsi: routing, load balancing, authentication, rate limiting, logging, request transformation. Bayangin API Gateway seperti receptionist - terima semua request, forward ke service yang tepat. Popular: Kong, AWS API Gateway, Nginx. API Gateway simplify client code dan add security layer, cuks!"
    },

    caching_strategy: {
        keywords: ['apa itu caching', 'caching strategy', 'redis caching', 'cache invalidation', 'performance caching'],
        reply: "Caching adalah store frequently accessed data di memory buat faster retrieval. Levels: browser cache, CDN cache, server cache, database cache. Tools: Redis, Memcached. Strategy: cache busting (update cache), TTL (time-to-live), invalidation. Challenge: cache invalidation (hard problem dalam CS). Caching dramatically improve performance. Contoh: Google hasil search di-cache browser, next search instant, cuks!"
    },

    load_balancing: {
        keywords: ['apa itu load balancing', 'load balancer', 'distribusi traffic', 'scaling horizontal', 'high availability'],
        reply: "Load Balancing adalah distribute incoming traffic ke multiple servers. Algoritma: Round Robin (bergilir), Least Connections (server paling sepi), IP Hash. Load balancer jadi single point of entry. Keuntungan: high availability, scalability, performance. Tools: Nginx, HAProxy, AWS Load Balancer. Load balancing essential buat handle traffic besar dan ensure uptime, cuks!"
    },

    continuous_integration: {
        keywords: ['apa itu ci', 'continuous integration', 'ci cd pipeline', 'automated testing', 'jenkins github actions'],
        reply: "CI (Continuous Integration) adalah practice merging code frequent dengan automated testing. Flow: developer push code → automated build → automated test → if pass merge ke main. Tools: Jenkins, GitHub Actions, GitLab CI, Travis CI. CI catch bugs early, ensure code quality. CI essential buat team development - prevent broken code di production. Modern workflow: CI/CD bukan optional lagi, cuks!"
    },

    testing_strategies: {
        keywords: ['unit test integration test', 'testing dalam development', 'test coverage', 'jest vitest', 'why testing important'],
        reply: "Testing: proses verify code works correctly. Jenis: Unit Test (function level), Integration Test (component interaction), E2E Test (user journey). TDD (Test-Driven Development): write test first, code after. Tools: Jest (JavaScript), Pytest (Python), unittest (Java). Best practice: good test coverage (70%+), test important functionality, automate testing. Tests prevent regressions, improve code quality, enable refactoring safely, cuks!"
    },

    rest_graphql: {
        keywords: ['rest vs graphql', 'apa itu graphql', 'graphql query language', 'rest advantages graphql advantages'],
        reply: "REST: standard API architecture pakai HTTP method + resource-based URL. GraphQL: query language buat API dengan specify exact data yang diinginkan. Perbedaan: REST fixed structure, GraphQL flexible queries. REST: simple, standard, banyak tools. GraphQL: efficient, flexible, reduce over-fetching. Pilihan tergantung use case. REST masih dominan, GraphQL growing adoption, cuks!"
    },

    websocket_realtime: {
        keywords: ['apa itu websocket', 'real-time communication', 'websocket vs http', 'socket.io', 'live updates'],
        reply: "WebSocket adalah protocol buat bi-directional communication (full-duplex) antara client-server. Client-server bisa send message anytime, kapan saja. Gunakan: real-time notification, live chat, collaborative editing, live dashboard. HTTP one-way request-response, WebSocket two-way continuous. Libraries: Socket.IO (JavaScript), Strophe.js. WebSocket enable truly interactive experiences, cuks!"
    },

    progressive_web_app: {
        keywords: ['apa itu pwa', 'progressive web app', 'offline capability', 'service worker', 'installable app'],
        reply: "PWA (Progressive Web App) adalah web application dengan capabilities mirip native app. Features: offline support (Service Worker), installable, push notification, responsive. User bisa install PWA di home screen. Teknologi: Service Worker (cache management), Web App Manifest (metadata), HTTPS, responsive design. PWA give best dari web dan native world. Growth besar di market, cuks!"
    },

    // ==========================================
    // 11. PEMBELAJARAN & MINDSET
    // ==========================================
    cara_belajar_coding: {
        keywords: ['bagaimana cara belajar coding', 'belajar programming', 'tips belajar coding', 'resource coding', 'dari mana mulai belajar'],
        reply: "Cara belajar coding: 1) Pick language (Python/JS buat pemula), 2) Learn fundamentals (variable, function, loop, conditional), 3) Build projects (small sampai besar), 4) Read code orang lain (GitHub), 5) Practice daily (consistency >> intensity), 6) Contribute open source, 7) Join community. Resources: YouTube, Codecademy, freeCodeCamp, Udemy, documentation. Belajar coding takes patience dan persistence - tidak ada shortcut. Build things, cuks!"
    },

    project_based_learning: {
        keywords: ['project based learning', 'belajar dengan bikin project', 'build project', 'portfolio project', 'learning by doing'],
        reply: "Project-based learning adalah paling effective cara belajar programming. Steps: 1) Pick project (TODO app, blog, e-commerce), 2) Identify features needed, 3) Research/learn skills required, 4) Build iteratively, 5) Deploy, 6) Iterate based on feedback. Projects teach practical skills, provide portfolio pieces, motivate dengan visible results. Belajar dari documentation/tutorial hanya sampe sini, projects bring it together. Every great developer start dari small projects, cuks!"
    },

    debugging_techniques: {
        keywords: ['cara debug code', 'debugging', 'troubleshooting code', 'console log debugging', 'breakpoint debugger'],
        reply: "Debugging: process find dan fix bugs. Techniques: 1) Console.log/print (basic), 2) Browser DevTools (inspect, debugger), 3) IDE debugger (breakpoint, step-through), 4) Unit tests (preventive), 5) Rubber duck debugging (explain code ke orang/duck), 6) Divide and conquer (isolate problem). Mindset: approach calmly, read error message carefully, understand root cause (bukan gejala). Debugging skill differentiate junior vs senior developer, cuks!"
    },

    code_optimization: {
        keywords: ['optimasi code', 'code performance', 'performance optimization', 'efficient code', 'profiling'],
        reply: "Code optimization: improve speed/efficiency. Steps: 1) Identify bottleneck (profiling), 2) Analyze (Big O, database queries), 3) Optimize (algorithm, caching, indexing), 4) Measure improvement, 5) Repeat. Common optimizations: reduce loop complexity, use efficient data structure, implement caching, lazy loading, CDN, minimize HTTP request. Premature optimization = bad, profile dulu baru optimize. Focus: correctness first, optimization later, cuks!"
    },

    clean_code: {
        keywords: ['clean code', 'readable code', 'best practices coding', 'code quality', 'refactoring'],
        reply: "Clean Code adalah code yang readable, maintainable, testable. Principles: meaningful names, small functions, DRY (Don't Repeat Yourself), SOLID, comments when necessary (code should self-explain). Refactoring: improve code tanpa change functionality. Benefits: easier maintain, easier collaborate, fewer bugs, easier extend. 'Code is read more often than written' - prioritize readability. Invest di clean code, future you akan grateful, cuks!"
    },

    // ==========================================
    // 12. EASTER EGGS & HUMOR
    // ==========================================
    programmer_joke: {
        keywords: ['joke programmer', 'humor programming', 'funny code', 'programmer meme', 'candaan programmer'],
        reply: "Why do programmers prefer dark mode? Karena light attracts bugs! 🐛 Atau... There are 10 types of people: those who understand binary and those who don't! 😂 Atau classic: A SQL query goes into a bar, walks up to two tables and asks in a loud voice... \"Can I join you?\" Coding bisa ngena kalau tau humor nya, cuks! 😄"
    },

    error_404_joke: {
        keywords: ['404 joke', 'error 404 funny', 'girlfriend 404', '404 humor'],
        reply: "Error 404: Girlfriend not found... (sedih). Atau joke favorit: Developer 404 = trying to find bug di own code selama 3 hari, ternyata typo 1 huruf. Atau 'It works on my machine' kemudian deployed prod, error 404 everywhere. Error banyak, stress pun banyak, tapi laugh juga penting buat survive di dev world, cuks! 😅"
    },

    coding_at_night: {
        keywords: ['ngoding malam', 'coding late night', 'programmer malam', 'deep work coding', 'night owl programmer'],
        reply: "Programmer kebiasaan ngoding malam: jam 11PM 'cuma bikin feature kecil', jam 3AM masih di-zone flow 'hampir kelar!', jam 6AM realisasi ngoding 7 jam nonstop. Hasil: kode jelek, ngantuk, bug banyak. Besok harus refactor lagi 😴 Tapi banyak programmer yang produktif malam hari, quiet environment, less distraction. Balance work-life penting, jangan korbankan kesehatan buat code, cuks! 💻"
    },

    programmer_language: {
        keywords: ['bahasa programmer', 'programmer conversation', 'programmer slang', 'terminology programmer'],
        reply: "Programmer punya bahasa sendiri: 'It's a feature not a bug' (excuse favorit), 'Works for me' (actually doesn't), 'Have you tried turning it off and on again' (universal fix), 'Let me Google it' (honest answer), 'I'll fix it later' (famous last words). Atau 'Nobody reads my code' - true banyak dev 😅 Atau 'Ship it!' (push kode tanpa test, pray hard). Code community punya humor characteristic sendiri, cuks!"
    },

    variable_naming: {
        keywords: ['nama variable', 'variable naming problem', 'bad variable name', 'variable foo bar', 'naming convention'],
        reply: "Phil Karlton: 'There are only two hard things in Computer Science: cache invalidation dan naming things'. Variable yang buruk: x, data, temp, foo, bar, result. Variable yang bagus: userName, isLoading, getProductPrice(). Buruk code sering karena nama variable/function yang ngaco. Spend time naming things dengan baik, save countless hours debugging nanti. Good naming = code self-document. Naming bukan trivial, cuks! 🎯"
    },

    infinite_loop: {
        keywords: ['infinite loop', 'endless loop', 'ngaco infinite loop', 'force quit program', 'ctrl c'],
        reply: "Setiap programmer pernah kena infinite loop - loop tanpa exit condition. Program freeze, fan spin keras, komputer panas 🔥 Solution: force quit (Ctrl+C atau Task Manager), reboot kalau butuh. Prevention: always ada exit condition dalam loop, test loop logika, use timeout. Classic mistake: while(true) tanpa break. Infinite loop adalah rite of passage programmer, telah lewat?, cuks! 😄"
    },

    copy_paste_code: {
        keywords: ['copy paste code', 'stackoverflow solution', 'ctrl c ctrl v', 'copilot code', 'code generated'],
        reply: "Developer workflow: stuck problem → Google → find Stack Overflow answer → copy paste → paste di code → works! 🎉 (sometimes). Blind copy-paste dangerous - punya bug, tidak understand logic, jadi tech debt. Better: understand solution dulu, adapt ke case kamu, test thoroughly. Modern: GitHub Copilot auto-complete code - helpful tapi jangan laziness, validate generated code. Copy-paste acceptable kalau understand apa yang di-paste, cuks!"
    },

    comment_kod: {
        keywords: ['comment code', 'code documentation', 'bad comment', 'self documenting code', 'when to comment'],
        reply: "Comment baiknya explain WHY bukan WHAT. Bad: // add 1 to count (obvious dari code). Good: // reserve 1 slot untuk metadata header (explain intent). Best: code yang self-explanatory tanpa perlu comment (good naming, clean code). Comment harus update seiring code berubah, kalo tidak outdated dan confusing. 'Good code bukan perlu banyak comment' - if explain dengan comment, refactor jadi clear tanpa comment, cuks!"
    },

    production_bug: {
        keywords: ['bug production', 'production down', 'live issue', 'hot fix', 'deploy gone wrong'],
        reply: "Production bug = nightmare scenario. 2AM phone rang 📞, production down, user marah, team panic. Bisanya silly mistake: hardcoded value, forgot remove debug code, environment variable salah. Prevention: test sebelum deploy, staging environment, monitoring alert, gradual rollout. Solusi: quick fix (hot fix), deploy, monitor, post-mortem (learn dari mistake). Every dev pernah through ini experience, part of learning, cuks! 😓"
    },

    // ==========================================
    // 13. CAREER & INDUSTRY
    // ==========================================
    junior_vs_senior: {
        keywords: ['junior developer', 'senior developer', 'pengalaman developer', 'career progression', 'junior to senior'],
        reply: "Junior: < 2 tahun, belajar fundamentals, need mentoring. Mid-level: 2-5 tahun, independen, able lead small project. Senior: 5+ tahun, technical leader, mentor junior, system design, keputusan architecture. Bukan cuma experience, tapi maturity, problem-solving skill, communication. Good senior help junior grow. Progression: consistent learning, complete projects, mentorship, understand business. Track: individual contributor vs management. Pick path yang sesuai passion, cuks!"
    },

    tech_debt: {
        keywords: ['apa itu tech debt', 'technical debt', 'debt programming', 'refactor code', 'legacy code'],
        reply: "Tech Debt: code yang dibuat dengan 'shortcut' buat launch cepat, tapi maintenance jadi susah. Contoh: tanpa test, bad design, hardcoded values. Like financial debt - butuh bayar dengan bunga (dev time, bugs, slow). Minimize: prioritize quality, refactor regularly, don't shortcut. Tech debt dangerous: accumulate over time, jadi codebase unmaintainable. Acknowledge debt, make plan repay. Balance speed vs quality important, cuks!"
    },

    job_market: {
        keywords: ['programmer job', 'developer career', 'demand programmer', 'salary developer', 'job di tech'],
        reply: "Programmer job market sangat high demand 📈 Salary competitive, remote opportunities banyak, company mana mana butuh developer. Skill in demand: JavaScript/Python, React/Vue, system design, cloud (AWS/GCP). Build portfolio buat impressive saat interview. Networking important - attend meetup, contribute open source, maintain GitHub. Remote work revolutionize industry - bisa kerja dari mana saja. Industry booming, good time jadi programmer, cuks!"
    },

    imposter_syndrome: {
        keywords: ['imposter syndrome', 'merasa tidak capable', 'self doubt developer', 'feeling inadequate', 'programmer confidence'],
        reply: "Imposter syndrome: feeling tidak layak meskipun qualified, think others lebih smart. Most developers pernah experience ini. Realitasnya: setiap orang struggling (tidak bisa public), siapa pun bisa Google, senior juga belajar. Solution: celebrate wins, contribute open source (share knowledge), mentor junior (realize how much you know), keep learning. Confidence grow dengan practice. You belong di tech world, cuks! 💪"
    },

    // ==========================================
    // 14. COMMAND LINE & GIT
    // ==========================================
    terminal_command: {
        keywords: ['command line', 'terminal command', 'bash command', 'cd ls mkdir', 'command dasar linux'],
        reply: "Command line basics: cd (change directory), ls (list file), mkdir (create folder), cp (copy), mv (move/rename), rm (remove), cat (view file), nano/vim (text editor), pwd (current path), clear (clear screen), sudo (admin), chmod (permission). Windows: cmd/PowerShell punya command berbeda. Mastering CLI speed up workflow banyak. Keyboard navigation lebih cepat daripada GUI buat developer. CLI adalah power user skill, cuks!"
    },

    git_workflow: {
        keywords: ['git workflow', 'daily git', 'git pull push', 'merge conflict', 'git rebase'],
        reply: "Daily workflow: git pull (update local), develop, git add (stage), git commit (save), git push (upload). Merge conflict: resolve secara manual, test, commit resolution. Merge vs rebase: merge keep history intact, rebase clean history. Best practice: frequent commit, clear message, pull sebelum push, push sering (avoid conflict). Git intimidating awal tapi powerful sekali dipahami. Invest waktu master git, ROI besar, cuks!"
    },

    ssh_key: {
        keywords: ['ssh key', 'github ssh', 'public private key', 'authentication github', 'ssh setup'],
        reply: "SSH Key: pair kunci (public + private) buat secure authentication. Public key di GitHub, private key di lokal. Setup: ssh-keygen → add public key ke GitHub → clone pakai git@github.com:username/repo.git → no password prompt. SSH lebih secure dibanding HTTPS password. SSH prevent credential trong git history. Setup sekali, smooth sailing selamanya, cuks!"
    },

    // ==========================================
    // 15. DEPLOYMENT & HOSTING
    // ==========================================
    hosting_provider: {
        keywords: ['web hosting', 'cloud hosting', 'heroku vercel netlify', 'deploy website', 'cloud provider'],
        reply: "Hosting options: Traditional hosting (Bluehost, GoDaddy - cheap), Cloud (AWS, GCP, Azure - flexible), Platform (Heroku, Vercel, Netlify - dev-friendly). Pilihan tergantung: budget, scalability, complexity. Heroku: simple deploy, Vercel: optimized React, Netlify: static + serverless, AWS: powerful but complex. Pemula: Vercel atau Netlify buat cepat. Enterprise: AWS atau GCP. Free tier many platforms buat learning, cuks!"
    },

    serverless: {
        keywords: ['apa itu serverless', 'serverless architecture', 'function as service', 'lambda aws', 'pay per use'],
        reply: "Serverless: cloud provider manage server/infrastructure, kamu cuma deploy function. Pay per execution (bukan monthly fee). Keuntungan: scalable, cost-effective, focus code. Kekurangan: cold start (delay pertama execution), vendor lock-in, complexity debugging. Services: AWS Lambda, Google Cloud Functions, Azure Functions. Serverless cocok buat event-driven application, microservices. Modern trend dalam cloud, cuks!"
    },

    // ==========================================
    // 16. ADVANCED JAVASCRIPT
    // ==========================================
    closure_javascript: {
        keywords: ['apa itu closure', 'closure dalam javascript', 'lexical scope', 'function scope', 'closure example'],
        reply: "Closure adalah function yang 'remember' variable dari outer scope meskipun outer function sudah return. Closure = function + reference ke outer scope. Contoh: function outer() { let x=10; return function inner() { return x; } }. Closure powerful buat data privacy, factory function, callback. Closure banyak dipake tanpa realize - event listener, setTimeout, promise.then. Understand closure = unlock JavaScript power, cuks!"
    },

    prototype_inheritance: {
        keywords: ['prototype dalam javascript', 'prototype inheritance', 'proto chain', 'object prototype'],
        reply: "JavaScript pakai prototype-based inheritance (bukan class-based). Tiap object punya hidden [[Prototype]] yang reference ke object lain. Prototype chain: object → prototype → object → ... → null. Kamu bisa add property ke prototype buat inherit semua instance. Modern class syntax = syntactic sugar atas prototype. Understanding prototype = understand JavaScript deeply. Prototype gak begitu penting practical modern JS, tapi bagus dipahami, cuks!"
    },

    spread_operator: {
        keywords: ['spread operator', '... operator', 'destructuring', 'rest parameter', 'copy array object'],
        reply: "Spread operator (...) expand iterable (array/string) di tempat expect zero+ element. Usage: copy array ([...arr]), merge array ([...arr1, ...arr2]), function argument (func(...arr)). Rest parameter: function func(...args) → args jadi array. Destructuring: const [a, b] = array. Syntax powerful buat clean code modern. Difference spread vs rest: spread expand, rest collect. Gunakan buat tidy code, cuks!"
    },

    // ==========================================
    // 17. TANYA JAWAB SAMBILAN
    // ==========================================
    portfolio_penting: {
        keywords: ['portfolio programmer', 'portfolio project', 'github portfolio', 'showcase code', 'project buat portfolio'],
        reply: "Portfolio adalah GitHub profile + beberapa project showcase. Lebih important daripada resume buat programmer job. Content: code quality, project description, README bagus, live demo, contribute open source. Employer lihat code kamu, assess skill langsung. Semakin banyak high-quality project, semakin impressive. Portfolio bukan sekadar kumpulan code, tapi showcase problem-solving skill, cuks!"
    },

    menjadi_programmer_gaji: {
        keywords: ['gaji programmer', 'berapa gaji developer', 'programmer berkembang', 'income stream programmer'],
        reply: "Programmer salary varies: junior 5-15M, mid 15-30M, senior 30-50M+ (Rp). Remote work bisa lebih tinggi (USD rate). Plus: bonus, stock option, freelance income. Gaji bukan semua - company culture, learning opportunity, work-life balance penting juga. Skill in demand = higher salary (system design, AI, cloud). Negotiate salary important. Some programmer juga punya side income (freelance, course, consulting). Salary good, terus develop skill, cuks!"
    },

    productivity_developer: {
        keywords: ['produktivitas developer', 'developer tips', 'focus programming', 'deep work', 'time management programmer'],
        reply: "Produktivitas tips: 1) Deep work (no distraction, 2-4 jam fokus), 2) Break regular (Pomodoro), 3) Organized workspace (physical + digital), 4) Priority clear (todoist, notion), 5) Avoid multitasking, 6) Exercise (buat brain), 7) Sleep enough (crucial!). Distraction: notification, Slack, meeting. Time blocking effective. Different orang productive di waktu berbeda - morning person vs night owl. Find personal rhythm, cuks!"
    },

    passion_programming: {
        keywords: ['passion programming', 'love coding', 'programmer yang happy', 'passion vs job'],
        reply: "Passion programming bukan requirement - ada yang passionate, ada yang work-to-live. Both valid. Best: passionate sekaligus bayar bagus. Jika tidak passionate, cari aspek yang sesuai (problem-solving, helping user, cool technology). Passion grow dengan competence - jadi bagus di skill → enjoy → semakin passionate. Atau jika truly don't enjoy → explore career path berbeda (tidak ada shame). Life terlalu short buat unhappy job, cuks!"
    },

    // ==========================================
    // 18. PERTANYAAN UMUM
    // ==========================================
    berapa_lama_belajar_coding: {
        keywords: ['berapa lama belajar coding', 'lama belajar programming', 'kapan expert programmer', 'timeline belajar coding'],
        reply: "Fundamentals: 3-6 bulan (konsisten learning). Competent: 1-2 tahun (practice + real project). Expert: 10+ tahun (Gladwell rule). Tapi learning never stop - teknologi terus berubah. Timeline depends: starting point, hours/week dedicated, learning method, intensity. Some people 6 bulan bisa bikin app decent, others 2 tahun struggling. Consistency > intensity penting. Think long-term, jangan rush. Quality learning investment, cuks!"
    },

    belajar_coding_susah: {
        keywords: ['coding susah', 'programming difficult', 'overcome coding challenge', 'stuck dalam coding'],
        reply: "Coding terasa susah awal because: abstract concept, many tools, syntax errors frustrating. Normal! Semua developer pernah through ini. Fase: confused → clarity tiba-tiba → enjoy. Tips: start simple, build project kecil, debug methodically, don't give up. Stuck 2 jam di problem? Step away 30 min, balik dengan fresh mind. Community sangat supportive - ask di forum, orang willing bantu. Persisten, cuks!"
    },

    mana_bahasa_pertama: {
        keywords: ['bahasa programming mana pilih', 'first programming language', 'bahasa pemula', 'python vs javascript pemula'],
        reply: "Rekomendasi pertama: Python (simple syntax, readable, good buat logic) atau JavaScript (practical, bikin web instant, fun). Avoid: C/C++ pertama (complexity tinggi). Jangan overthink - pick one, commit, learn well. Setelah bahasa pertama lancar, bahasa kedua lebih mudah (concept sama, syntax berbeda). Focus fundamentals (variable, function, loop, conditional), language secondary. Pilih dan mulai, cuks!"
    },

    // ==========================================
    // 19. SOFT SKILLS PROGRAMMER
    // ==========================================
    communication_skill: {
        keywords: ['komunikasi developer', 'soft skill programmer', 'presentasi code', 'explain coding', 'teamwork programmer'],
        reply: "Communication crucial buat developer. Explain code ke non-technical, discuss dengan team, documentation clear, ask help specific (not vague). Good developer bukan cuma code bagus, tapi communicate well. Write README yang user-friendly, comment code explain intent, presentation skills penting. Remote work → communication lebih penting (no face-to-face). Invest di communication skill, ROI sangat besar, cuks!"
    },

    problem_solving_skill: {
        keywords: ['problem solving programmer', 'cara mikir programmer', 'analisis masalah', 'approach problem'],
        reply: "Problem-solving approach: 1) Understand problem fully (ask, clarify), 2) Break down (subproblem), 3) Think solution (multiple approaches), 4) Code, 5) Test, 6) Optimize. Don't jump code langsung. Whiteboard thinking powerful. Research/Google bukan cheating - smart programmer tahu resources. Problem-solving skill develop dengan practice - bikin project, debug issue, contribute open source. Good problem-solver > memorize syntax, cuks!"
    },

    learning_mindset: {
        keywords: ['growth mindset', 'lifelong learning', 'belajar terus', 'stay relevant programmer', 'keep improving'],
        reply: "Tech industry constant change - tools, framework, best practice. Programmer harus growth mindset (learn terus), bukan fixed mindset (already know enough). Stay relevant: read documentation, follow blog, attend conference, side project explore new tech. Jangan fear baru tools - fundamentals timeless, syntax temporary. Curiosity dan passion learning differentiate good dari great developer. Keep learning, cuks! 📚"
    },

    // ==========================================
    // 20. FINAL MOTIVATIONAL & MISC
    // ==========================================
    why_programming: {
        keywords: ['kenapa programming', 'alasan jadi programmer', 'programming purpose', 'meaning programming', 'impact programmer'],
        reply: "Programming impact besar: apps yang millions use, automation yang save millions hours, system yang critical infrastructure, education yang change lives. Programmer bisa: solve real problem, create value, impact society, make good income, remote flexibility. Programming exciting - always challenge baru, never boring. Your code bisa reach millions people. Why programming? Karena bisa bikin perbedaan, cuks! 🚀"
    },

    enjoy_coding: {
        keywords: ['enjoy coding', 'coding fun', 'love programming', 'passion code', 'why love coding'],
        reply: "Coding fun karena: creative outlet (problem=puzzle), immediate feedback (code work or not), build real things, constant learning, community supportive, problem solving satisfy, impact visible. Flow state coding adalah bliss - tiga jam terasa 30 menit. Setiap bug fix = small victory 🎉 Setiap project done = accomplishment. Enjoy journey, celebrate small win, cuks!"
    },

    kontribusi_open_source: {
        keywords: ['open source contribution', 'contribute github', 'open source project', 'why contribute open source'],
        reply: "Open source: contribute code buat project gratis, biasanya di GitHub. Benefit: portfolio, skill development, community, help others, give back. First contribution intimidating tapi welcoming environment usually. Start: find issue 'good first issue', baca documentation, submit PR. Contribution simple seperti documentation fix sampai complex feature. Open source culture core tech industry. Contribute buat learn, improve, network, cuks! ⭐"
    },

    kesalahan_umum_pemula: {
        keywords: ['kesalahan pemula programmer', 'beginner mistake', 'common error junior', 'avoid mistake coding'],
        reply: "Kesalahan umum: 1) Skip fundamentals (jump framework), 2) Copy-paste tanpa understand, 3) No project (teori doang), 4) Tidak test code, 5) Bad naming, 6) Over-engineering, 7) Tidak read error message, 8) Giveup cepat. Solusi: learn systematic, build project (learn by doing), test thoroughly, ask help, persist. Kesalahan adalah learning opportunity, tidak ada shame. Every expert pernah beginner, cuks!"
    },

    langkah_selanjutnya: {
        keywords: ['langkah selanjutnya programming', 'next step coding', 'setelah belajar dasar', 'apa yang harus dipelajari', 'progress roadmap'],
        reply: "Roadmap typical: 1) Pick language + fundamental (3-6 bulan), 2) Build projects kecil (3-6 bulan), 3) Learn framework populer (3-6 bulan), 4) Collaborate (open source / team), 5) System design (advanced), 6) Keep learning emerging tech. Jangan feel harus master semuanya - depth > breadth awal. Focus deep di area yang passionate. Consistent effort > brilliant bursts. You can do it, cuks! 🔥"
    },

    gapapa_tidak_tau: {
        keywords: ['tidak tau coding', 'forgot syntax', 'tidak ingat command', 'gapapa lupa', 'normal tidak tau'],
        reply: "Normal gak tau semuanya - tidak ada programmer yang know everything! Forget syntax? Google. Forgot command? Look documentation. Tidak understand concept? Reread. Jangan pressure diri memorize - think problem-solving. Good programmer tahu how to find answer, bukan all answer. Imposter syndrome often karena pikir 'seharusnya tau ini sudah'. Nope - industry dynamic, always learning. Self-compassion penting, cuks! 💚"
    },

    terimakasih_stas: {
        keywords: ['terima kasih stas', 'thanks ai stas', 'makasih', 'thanks for help', 'terima kasih bantuan'],
        reply: "Welcome, cuks! Senang bisa bantu. Semoga jawabannya useful buat journey programming kamu. Remember: consistency, patience, passion. Jangan hesitate ask lagi kalau ada pertanyaan - I'm always here buat help. You got this! Keep coding, keep learning, keep growing. AI STAS rooting untuk kamu! 🎉💪"
    }
};

// Export untuk Node.js/Module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = dataJawabanAI;
}
    // Contoh penggunaan di dalam if-else lu nanti:
    // renderBotMsg(data.reply); -> Buat nampilin chat dari AI
    // addSystemLog("Log pesan..."); -> Buat nambahin text ke system log
    
  } catch (e) {
    addSystemLog("Error: Gagal terhubung ke STAS-AI.");
    console.error(e);
  }
}

// ─── Event Listener Langsung Pasang (Tanpa if-else) ─────────────
aiSend.addEventListener('click', handleAiSend);
aiInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleAiSend(); });

// Log pembuka otomatis saat halaman komunitas di-load
addSystemLog("STAS-AI Core System initialized...");
