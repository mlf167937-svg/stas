// ai2.js - AI Interseptor Grup (Kotak Atas)
const chatInputBar = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send');

// Kumpulan respon acak AI Grup
const jawabanGrup = [
  "Oit cuks! Ada apa manggil-manggil gua di grup? 😎",
  "Gua denger ada yang lagi ngomongin gua ya? Haha.",
  "Ampun sepuh, jangan di-tag mulu, gua lagi sibuk nge-render nyawa.",
  "Ada masalah apa di komunitas STAS? Sini cerita sama bot paling tampan.",
  "Gas mabar lah, malah nge-tag bot mending push rank!"
];

chatSendBtn.addEventListener('click', () => {
  const text = chatInputBar.value.trim();
  
  // Cek kalau ada tag @stasai
  if (text.toLowerCase().includes('@stasai')) {
    
    // Kasih delay 2 detik seolah-olah bot-nya lagi ngetik di grup
    setTimeout(async () => {
      const randomReply = jawabanGrup[Math.floor(Math.random() * jawabanGrup.length)];
      
      // Kirim jawaban bot langsung ke database chat utama grup
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: randomReply, 
          type: 'text' 
        })
      });
      
      // Kejutkan tampilan biar chat-nya langsung ke-refresh
      if (typeof fetchChat === "function") fetchChat();
    }, 2000);
  }
});
