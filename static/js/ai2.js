document.addEventListener("DOMContentLoaded", () => {
  const chatInputBar = document.getElementById('chat-input');
  const chatSendBtn = document.getElementById('chat-send');
  
  if (!chatInputBar || !chatSendBtn) return;

  // Variabel buat nyimpen teks biar gak ilang pas tombol send diklik
  let capturedText = "";

  chatInputBar.addEventListener('input', (e) => {
    capturedText = e.target.value;
  });

  const jawabanGrup = [
    "Oit cuks! Ada apa nih manggil-manggil gua di grup? 😎",
    "Hadir komandan! Gua lagi mantau grup nih.",
    "Ampun sepuh, jangan di-tag mulu, mending push rank!",
    "Ada masalah apa di komunitas STAS? Sini cerita sama STAS-AI.",
    "Gua sih setuju-setuju aja sama pendapat lu, haha."
  ];

  function cekTagBot() {
    const text = capturedText.trim();
    capturedText = ""; // Reset setelah diklik biar gak dobel
    
    // Cek apakah ada tulisan @stasai
    if (text.toLowerCase().includes('@stasai')) {
      
      // Kasih delay 1.5 detik seolah bot lagi ngetik
      setTimeout(async () => {
        const randomReply = jawabanGrup[Math.floor(Math.random() * jawabanGrup.length)];
        
        // Tembak API chat grup tapi pake username 'stasai'
        await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text: randomReply, 
            type: 'text',
            username: 'stasai' // Ini yang nentuin namanya jadi 🤖 STAS-AI (Grup)
          })
        });
        
        // Paksa refresh chat layar lu
        if (typeof fetchChat === "function") fetchChat();
      }, 1500);
    }
  }

  chatSendBtn.addEventListener('click', cekTagBot);
  chatInputBar.addEventListener('keydown', (e) => {
    if(e.key === 'Enter') cekTagBot();
  });
});
