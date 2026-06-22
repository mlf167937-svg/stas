// ============================================================================
// BASIS DATA JAWABAN MENGGUNAKAN OBJECT MAPPING (DICTIONARY)
// ============================================================================

const basisDataJawaban = {
  salam: {
    keywords: ["halo", "hai", "hello", "assalamualaikum", "pagi", "siang", "malam", "good morning", "p"],
    jawaban: `Assalamu'alaikum wa rahmatullahi wa barakatuh,

Kami ucapkan terima kasih yang sebesar-besarnya atas kedatangan Anda di Sistem STAS (Sistem Tanya Jawab Otomatis). Kami dengan senang hati siap membantu menjawab berbagai pertanyaan yang Anda miliki mengenai Teknologi Informasi, Pengembangan Perangkat Lunak, Database, Framework Web, dan berbagai topik teknis lainnya.

Jika Anda memiliki pertanyaan spesifik atau membutuhkan bantuan mengenai suatu topik tertentu, mohon sampaikan dengan jelas dan detail. Tim sistem kami akan berusaha memberikan jawaban yang komprehensif dan mendalam untuk mendukung pemahaman Anda.

Semoga sistem ini dapat memberikan kontribusi positif bagi pengembangan pengetahuan dan keterampilan teknis Anda. Terima kasih telah mempercayai kami.

Salam hormat,
Sistem STAS`
  },

  terima_kasih: {
    keywords: ["terima kasih", "thanks", "thank you", "terimakasih", "syukran", "appreciate", "makasih"],
    jawaban: `Kami yang seharusnya mengucapkan terima kasih kepada Anda atas kepercayaan dan kesempatan untuk membantu.

Dukungan dan masukan dari pengguna seperti Anda sangat berharga dalam upaya kami untuk terus meningkatkan kualitas layanan dan akurasi jawaban yang kami berikan. Kepuasan Anda dalam menggunakan Sistem STAS adalah prioritas utama kami.

Apabila di kemudian hari Anda memiliki pertanyaan tambahan atau membutuhkan clarification lebih lanjut mengenai topik yang telah kami jelaskan, jangan ragu untuk menghubungi kami kembali. Kami akan dengan senang hati memberikan penjelasan yang lebih detail dan mendalam.

Kami berkomitmen untuk terus berinovasi dan meningkatkan layanan demi kepuasan dan kesejahteraan Anda. Terima kasih atas perhatian dan dukungan yang luar biasa.

Salam hormat,
Sistem STAS`
  },

  database: {
    keywords: ["database", "sql", "mysql", "postgresql", "mongodb", "data", "query", "table", "relational"],
    jawaban: `Database adalah sebuah sistem terstruktur yang dirancang untuk menyimpan, mengelola, dan mengambil data dengan cara yang efisien dan terorganisir. 

Dalam konteks Teknologi Informasi modern, database memainkan peran yang sangat krusial sebagai fondasi dari sebagian besar aplikasi perangkat lunak. Terdapat dua kategori utama database yang perlu Anda pahami:

1. Database Relasional (Relational Database Management System - RDBMS)
   Database relasional mengorganisir data dalam bentuk tabel yang saling terhubung melalui kunci relasi. Contoh implementasi populer termasuk MySQL, PostgreSQL, dan Microsoft SQL Server. Keunggulan database relasional meliputi integritas data yang kuat, konsistensi transaksi (ACID), dan kemampuan query yang powerful melalui SQL.

2. Database NoSQL
   Database NoSQL dirancang untuk menangani data yang tidak terstruktur atau semi-terstruktur. Implementasi seperti MongoDB, Redis, dan Firebase menawarkan fleksibilitas yang tinggi dan skalabilitas horizontal yang superior. Database jenis ini sangat sesuai untuk aplikasi yang membutuhkan throughput tinggi dan handling data yang kompleks.

Pemilihan jenis database harus mempertimbangkan kebutuhan spesifik aplikasi, volume data, pola akses, dan persyaratan performa yang diharapkan.

Semoga penjelasan ini memberikan wawasan yang bermanfaat bagi Anda.`
  },

  flask: {
    keywords: ["flask", "python", "web framework", "routing", "blueprint", "werkzeug"],
    jawaban: `Flask adalah sebuah micro web framework yang ditulis dalam bahasa pemrograman Python, dirancang dengan filosofi kesederhanaan namun tetap powerful dalam mengembangkan aplikasi web.

Karakteristik Utama Flask:
1. Micro Framework
   Flask memberikan fungsionalitas inti untuk menangani routing HTTP, templating, dan session management tanpa membebani developer dengan dependensi yang berlebihan. Arsitektur yang ringkas memungkinkan Anda memilih library tambahan sesuai kebutuhan spesifik.

2. Routing yang Fleksibel
   Sistem routing Flask memudahkan Anda untuk mendeklarasikan endpoint dengan decorator @app.route(), mendukung berbagai metode HTTP (GET, POST, PUT, DELETE), dan parameter dinamis dalam URL.

3. Integrasi dengan Werkzeug
   Flask dibangun di atas Werkzeug WSGI toolkit yang memberikan kestabilan, performa, dan reliability dalam menangani request-response HTTP.

4. Template Engine Jinja2
   Flask mengintegrasikan Jinja2 sebagai template engine, memungkinkan rendering HTML yang dinamis dengan sintaks yang intuitif dan aman.

Untuk mengembangkan aplikasi Flask yang robust, Anda perlu memahami konsep Blueprint, Context Management, Error Handling, dan best practices dalam struktur proyek yang scalable.

Semoga penjelasan ini membantu Anda dalam perjalanan belajar Flask.`
  },

  gunicorn: {
    keywords: ["gunicorn", "wsgi", "server", "production", "deployment", "application server"],
    jawaban: `Gunicorn (Green Unicorn) adalah sebuah WSGI HTTP Server yang dirancang untuk menjalankan aplikasi Python, khususnya aplikasi web framework seperti Flask dan Django, dalam lingkungan production.

Peran Krusial Gunicorn:
1. WSGI Application Server
   Gunicorn bertindak sebagai gateway antara web server (seperti Nginx) dan aplikasi Python Anda. Server ini mengelola multiple worker processes untuk menangani concurrent requests dengan efisien.

2. Proses Worker Management
   Anda dapat mengkonfigurasi jumlah worker processes sesuai dengan spesifikasi hardware server. Setiap worker menjalankan instance aplikasi secara independent, meningkatkan throughput dan reliability.

3. Automatic Restart
   Jika terjadi crash pada salah satu worker process, Gunicorn secara otomatis melakukan restart, memastikan aplikasi tetap available untuk melayani requests.

Best Practice untuk production deployment meliputi integrasi dengan Nginx sebagai reverse proxy, implementasi load balancing, monitoring sistem, dan strategic logging untuk troubleshooting.

Semoga penjelasan ini memberikan panduan yang komprehensif.`
  },

  render: {
    keywords: ["render", "deploy", "cloud", "hosting", "platform", "free tier"],
    jawaban: `Render adalah sebuah platform cloud computing modern yang menyediakan solusi hosting dan deployment yang terintegrasi untuk aplikasi web, static sites, dan background jobs.

Keunggulan Platform Render:
1. Kemudahan Deployment
   Render menyediakan integrasi seamless dengan GitHub dan GitLab, memungkinkan automatic deployment setiap kali Anda melakukan push ke repository. Proses deployment menjadi sangat sederhana dan tidak memerlukan konfigurasi kompleks.

2. Zero Configuration
   Platform ini mendeteksi teknologi yang Anda gunakan secara otomatis (Python, Node.js, Ruby, Go, Rust) dan menjalankan build process yang sesuai tanpa memerlukan konfigurasi manual yang rumit.

3. Environment Variables & Secrets Management
   Anda dapat dengan mudah mengatur environment variables dan sensitive secrets melalui dashboard, meningkatkan security dan flexibility konfigurasi.

Semoga Render dapat menjadi pilihan hosting yang tepat untuk kebutuhan aplikasi Anda.`
  },

  komunitas: {
    keywords: ["komunitas", "community", "forum", "diskusi", "collaborate", "networking"],
    jawaban: `Komunitas adalah aset yang sangat berharga dalam ekosistem pengembangan perangkat lunak dan teknologi informasi modern.

Nilai Strategis Komunitas:
1. Knowledge Sharing & Collective Learning
   Melalui komunitas, para profesional dan learner dapat berbagi pengalaman, best practices, dan insights yang telah mereka akumulasi.
2. Networking & Career Opportunities
   Komunitas memberikan platform untuk membangun koneksi profesional, menemukan mentor, dan membuka peluang karir yang beragam.

Kami mengundang Anda untuk bergabung dengan berbagai komunitas teknologi. Investasi waktu dalam community engagement akan memberikan return yang berkelanjutan bagi career dan knowledge development Anda.`
  },

  ai: {
    keywords: ["ai", "artificial intelligence", "machine learning", "deep learning", "neural network", "nlp"],
    jawaban: `Artificial Intelligence (AI) dan Machine Learning (ML) adalah bidang yang telah merevolusi cara kita membangun aplikasi dan menyelesaikan masalah kompleks.

Landscape AI Modern:
1. Machine Learning Fundamentals: Cabang AI yang fokus pada pengembangan algoritma yang belajar dari data.
2. Deep Learning: Menggunakan artificial neural networks dengan multiple layers untuk memproses data kompleks seperti image dan text.
3. Large Language Models (LLMs): Seperti GPT, Claude, dan Gemini yang mendominasi pemrosesan bahasa alami modern saat ini.

Semoga Anda dapat memanfaatkan kekuatan AI untuk menciptakan solusi yang innovative dan impactful.`
  },

  error_404: {
    keywords: ["404", "not found", "halaman tidak ditemukan", "endpoint", "route"],
    jawaban: `Error HTTP 404 (Not Found) adalah response status code yang menunjukkan bahwa server tidak dapat menemukan resource atau rute halaman yang Anda minta.

Penyebab Umum Error 404:
- URL yang tidak sesuai dengan routing yang tersedia di file backend (app.py)
- Typo dalam penulisan path atau nama endpoint pada berkas kode HTML/JS
- Resource atau file teks database yang dituju telah dihapus atau dipindahkan.

Silakan periksa kembali kecocokan deklarasi route handler @app.route() Anda pada backend Python.`
  },

  error_500: {
    keywords: ["500", "internal server error", "server error", "exception", "crash", "bug"],
    jawaban: `Error HTTP 500 (Internal Server Error) adalah response status code yang menunjukkan bahwa server mengalami kondisi kesalahan internal yang tidak terduga di sisi backend.

Langkah Mitigasi Debugging:
1. Periksa terminal atau application logs secara detail pada dashboard cloud hosting Render Anda.
2. Identifikasi file log letak terjadinya unhandled exception atau bug syntax Python.
3. Pastikan penulisan perkondisian data logic atau pemanggilan fungsi database TXT telah ter-cover menggunakan blok try-except secara aman.`
  }
};

// ============================================================================
// SELECTOR ELEMEN ASLI WEB STAS (FIXED ID MATCHING)
// ============================================================================
const aiChatbox = document.getElementById('ai-chatbox');
const aiInput   = document.getElementById('ai-input');
const aiSend    = document.getElementById('ai-send');
const aiLog     = document.getElementById('ai-log');

// ============================================================================
// HELPER UI (Log & Chat Bubble)
// ============================================================================
function addSystemLog(msg) {
  if (!aiLog) return;
  const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const div = document.createElement('div');
  div.style.fontSize = '0.7rem'; div.style.color = 'var(--text-muted)'; div.style.fontFamily = 'monospace';
  div.innerText = `[${time}] ${msg}`;
  aiLog.appendChild(div); aiLog.scrollTop = aiLog.scrollHeight;
}

function renderChat(text, isBot = false) {
  if (!aiChatbox) return;
  const div = document.createElement('div');
  div.style.marginBottom = '0.75rem'; div.style.display = 'flex'; div.style.flexDirection = 'column';
  div.style.alignItems = isBot ? 'flex-start' : 'flex-end';
  
  const bg = isBot ? 'rgba(191, 95, 255, 0.1)' : 'var(--bg-surface)';
  const border = isBot ? '1px solid rgba(191, 95, 255, 0.2)' : 'none';
  const color = isBot ? 'var(--text-main)' : 'var(--green-neon)';

  // Ganti newline dengan <br> untuk format teks panjang
  const formattedText = text.replace(/\n/g, "<br>");

  div.innerHTML = `<div style="padding: 0.55rem 0.75rem; border-radius: 8px; font-size: 0.85rem; max-width: 85%; background: ${bg}; border: ${border}; color: ${color}; word-break: break-word; line-height: 1.4;">${formattedText}</div>`;
  aiChatbox.appendChild(div); aiChatbox.scrollTop = aiChatbox.scrollHeight;
}

// ============================================================================
// FUNGSI PENCARIAN JAWABAN (LOOPING DICTIONARY)
// ============================================================================
function cariJawabanLokal(queryLower) {
  for (const kategori in basisDataJawaban) {
    const { keywords, jawaban } = basisDataJawaban[kategori];
    const isMatch = keywords.some(keyword => queryLower.includes(keyword.toLowerCase()));
    if (isMatch) {
      return jawaban;
    }
  }
  return null;
}

// ============================================================================
// FUNGSI UTAMA: HANDLE AI SEND
// ============================================================================
async function handleAiSend() {
  if (!aiInput) return;
  const rawQuery = aiInput.value.trim();
  const queryLower = rawQuery.toLowerCase();
  if (!rawQuery) return;

  renderChat(rawQuery, false); // Tampilkan chat asli milik user
  aiInput.value = '';
  addSystemLog(`Mencari analisis jawaban...`);

  let jawaban = "";

  // 1. Cek pencarian di Object Mapping basis data lokal
  const jawabanLokal = cariJawabanLokal(queryLower);

  if (jawabanLokal) {
    jawaban = jawabanLokal;
    addSystemLog("Respon ditemukan dari basis data lokal.");
  } 
  // 2. Jika tidak ada yang cocok, larikan sebagai Fallback ke Server Python
  else {
    addSystemLog("Data lokal tidak cocok, menghubungkan ke server...");
    try {
      const res = await fetch('/api/ai', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: queryLower })
      });
      
      if (res.ok) {
          const data = await res.json();
          jawaban = data.reply || data.response || data.jawaban || "Sistem mendelegasikan bahwa respon server kosong.";
      } else {
          jawaban = "Pemberitahuan Sistem: Koneksi eksternal backend server database saat ini sedang tidak aktif. Mohon ajukan pertanyaan sesuai modul panduan standar.";
      }
    } catch (e) {
        jawaban = "Kesalahan Jaringan: Gagal mengirimkan paket data menuju server utama STAS. Pastikan interkoneksi internet perangkat Anda stabil.";
    }
  }

  // Tampilkan chat AI ke layar
  renderChat(jawaban, true);
  addSystemLog("Proses enkapsulasi respon selesai.");
}

// ============================================================================
// EVENT LISTENER SETUP
// ============================================================================
if (aiSend) aiSend.addEventListener('click', handleAiSend);
if (aiInput) {
  aiInput.addEventListener('keydown', e => { 
    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault();
      handleAiSend(); 
    } 
  });
}

addSystemLog("Sistem STAS-AI Siap Digunakan (Mode Keamanan Tinggi).");
