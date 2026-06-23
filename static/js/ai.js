document.addEventListener("DOMContentLoaded", () => {
  const aiInput = document.getElementById('ai-input');
  const aiSend = document.getElementById('ai-send');
  const aiChatbox = document.getElementById('ai-chatbox');

  if (!aiInput || !aiSend || !aiChatbox) return;

  // Daftar jawaban acak simulasi
  const jawabanPrivat = [
    "Siap cuks, ada yang bisa gua bantu lagi?",
    "Wah gua kurang ngerti, coba ceritain lebih detail.",
    "Boleh banget! Mau bahas apa kita sekarang?",
    "Menurut gua sih mending santai aja dulu, nikmatin ngodingnya.",
    "Gua asisten pribadi lu, perintah aja bosku!"
  ];

  function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function triggerPrivateAI() {
    const text = aiInput.value.trim();
    if(!text) return;
    
    // Nampilin pesan lu di layar
    aiChatbox.innerHTML += `
      <div class="wa-bubble-wrap own" style="margin-bottom:8px;">
        <div class="wa-bubble" style="background:#2e3047; color:#f1f1f6;">${escapeHtml(text)}</div>
      </div>`;
    aiInput.value = '';
    aiChatbox.scrollTop = aiChatbox.scrollHeight;

    // Delay bot ngetik balasan 1 detik
    setTimeout(() => {
      const randomReply = jawabanPrivat[Math.floor(Math.random() * jawabanPrivat.length)];
      aiChatbox.innerHTML += `
        <div class="wa-bubble-wrap" style="margin-bottom:8px;">
          <div class="wa-bubble" style="background:#1f202e; border-left: 4px solid var(--purple-neon);">
            <div style="color:var(--purple-neon); font-size:0.75rem; font-weight:700; margin-bottom:4px;">🤖 STAS-AI PRIVAT</div>
            <div style="color:#e1e2ec;">${randomReply}</div>
          </div>
        </div>`;
      aiChatbox.scrollTop = aiChatbox.scrollHeight;
    }, 1000);
  }

  aiSend.addEventListener('click', triggerPrivateAI);
  aiInput.addEventListener('keydown', e => { 
    if(e.key === 'Enter') triggerPrivateAI(); 
  });
});
