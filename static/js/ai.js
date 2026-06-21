// ==========================================
// 1. SELECTOR ELEMEN
// ==========================================
const aiChatbox = document.getElementById('ai-chatbox');
const aiInput   = document.getElementById('ai-input');
const aiSend    = document.getElementById('ai-send');
const aiLog     = document.getElementById('ai-log');

// ==========================================
// 2. HELPER UI (Log & Chat Bubble)
// ==========================================
function addSystemLog(msg) {
  if (!aiLog) return;
  const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const div = document.createElement('div');
  div.style.fontSize = '0.7rem'; div.style.color = 'var(--text-muted)'; div.style.fontFamily = 'monospace';
  div.innerText = `[${time}] ${msg}`;
  aiLog.appendChild(div); aiLog.scrollTop = aiLog.scrollHeight;
}

function renderChat(text, isBot = false) {
  const div = document.createElement('div');
  div.style.marginBottom = '0.75rem'; div.style.display = 'flex'; div.style.flexDirection = 'column';
  div.style.alignItems = isBot ? 'flex-start' : 'flex-end';
  
  const bg = isBot ? 'rgba(191, 95, 255, 0.1)' : 'var(--bg-surface)';
  const border = isBot ? '1px solid rgba(191, 95, 255, 0.2)' : 'none';
  const color = isBot ? 'var(--text-main)' : 'var(--green-neon)';

  div.innerHTML = `<div style="padding: 0.55rem 0.75rem; border-radius: 8px; font-size: 0.85rem; max-width: 85%; background: ${bg}; border: ${border}; color: ${color}; word-break: break-word;">${text}</div>`;
  aiChatbox.appendChild(div); aiChatbox.scrollTop = aiChatbox.scrollHeight;
}

// ==========================================
// 3. FUNGSI UTAMA (If-Else Sedikit & Aman)
// ==========================================
async function handleAiSend() {
  const query = aiInput.value.trim().toLowerCase();
  if (!query) return;

  renderChat(aiInput.value.trim(), false); // Tampil chat user
  aiInput.value = '';
  addSystemLog(`Mencari jawaban...`);

  let jawaban = "";

  // -- IF ELSE SEDIKIT LU DI SINI --
  if (query.includes("halo") || query.includes("hai") || query.includes("p")) {
      jawaban = "Halo juga cuks! 🙌 Ada yang bisa STAS-AI bantu buat hari ini?";
  } 
  else if (query.includes("terima kasih") || query.includes("makasih")) {
      jawaban = "Yoi, sama-sama! Keep coding and stay awesome! 🔥";
  } 
  else if (query.includes("siapa kamu")) {
      jawaban = "Aku STAS-AI, asisten virtual penjaga web komunitas ini. 😎";
  } 
  // -- KALAU GAK ADA DI IF-ELSE, COBA KE SERVER --
  else {
      try {
          const res = await fetch('/api/ai', { 
              method: 'POST', 
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: query })
          });
          
          if (res.ok) {
              const data = await res.json();
              jawaban = data.reply || data.response || "Server AI merespon, tapi datanya kosong.";
          } else {
              // Kalau jalur /api/ai belum dibuat di Python, larinya kesini
              jawaban = "Maaf cuks, server backend AI lagi gak aktif, jadi aku cuma bisa jawab sapaan dasar aja dulu ya! 😅";
          }
      } catch (e) {
          jawaban = "Aduh, gagal terhubung ke server nih. Koneksi internet aman kan?";
      }
  }

  // Tampil chat AI
  renderChat(jawaban, true);
  addSystemLog("Respon selesai.");
}

// ==========================================
// 4. EVENT LISTENER
// ==========================================
if (aiSend) aiSend.addEventListener('click', handleAiSend);
if (aiInput) aiInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleAiSend(); });

addSystemLog("AI Siap digunakan (Kebal Error).");
