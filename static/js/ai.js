// Menembak ke route /api/ai-privat (Gemini)
const aiInput = document.getElementById('ai-input');
const aiSend = document.getElementById('ai-send');
const aiChatbox = document.getElementById('ai-chatbox');

aiSend.addEventListener('click', async () => {
  const text = aiInput.value.trim();
  if(!text) return;
  
  aiChatbox.innerHTML += `<div class="wa-bubble-wrap own"><div class="wa-bubble">${text}</div></div>`;
  aiInput.value = '';

  const res = await fetch('/api/ai-privat', { 
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: text })
  });
  const data = await res.json();
  
  aiChatbox.innerHTML += `<div class="wa-bubble-wrap"><div class="wa-bubble" style="background:#7b2cbf;">🤖 (Gemini): ${data.reply}</div></div>`;
});
