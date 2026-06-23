// Menembak ke route /api/ai-grup (OpenAI) pas ada yang ngetag @stasai
const chatInputBar = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send');

chatSendBtn.addEventListener('click', async () => {
  const text = chatInputBar.value.trim();
  
  // Jika di kolom chat utama ada tulisan @stasai
  if (text.toLowerCase().includes('@stasai')) {
    // Jalankan fetch ke OpenAI
    const res = await fetch('/api/ai-grup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: text })
    });
    const data = await res.json();
    
    // Setelah dapet balasan dari OpenAI, otomatis post balasan itu ke database chat grup
    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text: `🤖 @stasai replied: ${data.reply}`, 
        type: 'text' 
      })
    });
    
    // Refresh chat grup biar langsung muncul
    if (typeof fetchChat === "function") fetchChat();
  }
});
