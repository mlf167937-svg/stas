// ai.js - AI Privat Sederhana (Kotak Bawah)
const aiInput = document.getElementById('ai-input');
const aiSend = document.getElementById('ai-send');
const aiChatbox = document.getElementById('ai-chatbox');

// Kumpulan respon acak AI Privat
const jawabanPrivat = [
  "Siap cuks, ada yang bisa gua bantu lagi?",
  "Waduh gua lagi mabar, bentar ya haha.",
  "Maksud lu gimana tuh? Coba jelasin lagi.",
  "Lu keren banget hari ini, beneran!",
  "Gua asisten pribadi lu yang paling setia nih."
];

aiSend.addEventListener('click', () => {
  const text = aiInput.value.trim();
  if(!text) return;
  
  // Tampilkan chat kita
  aiChatbox.innerHTML += `
    <div class="wa-bubble-wrap own">
      <div class="wa-bubble">${text}</div>
    </div>`;
  aiInput.value = '';
  aiChatbox.scrollTop = aiChatbox.scrollHeight;

  // Efek ngetik bentar (delay 1 detik) terus balas
  setTimeout(() => {
    const randomReply = jawabanPrivat[Math.floor(Math.random() * jawabanPrivat.length)];
    aiChatbox.innerHTML += `
      <div class="wa-bubble-wrap">
        <div class="wa-bubble" style="background:#252a3d; border-left: 3px solid #bf5fff;">
          <span style="color:#bf5fff; font-size:0.75rem; font-weight:700;">🤖 STAS-AI PRIVAT</span><br>
          ${randomReply}
        </div>
      </div>`;
    aiChatbox.scrollTop = aiChatbox.scrollHeight;
  }, 1000);
});

// Biar bisa enter
aiInput.addEventListener('keydown', e => { if(e.key === 'Enter') aiSend.click(); });
