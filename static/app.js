document.addEventListener('DOMContentLoaded', () => {
    // 1. Live Client-Side Search Filtering
    const searchInput = document.getElementById('live-search-input');
    const searchCards = document.querySelectorAll('.search-card');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            searchCards.forEach(card => {
                const name = card.getAttribute('data-name');
                if (name.includes(query)) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            });
        });
    }

    // 2. Functional OpenAI Communication & Interactive Layout
    const aiBtn = document.getElementById('ai-btn');
    const aiInput = document.getElementById('ai-input');
    const chatWindow = document.getElementById('chat-window');

    if (aiBtn && aiInput && chatWindow) {
        const handleSendMessage = async () => {
            const txt = aiInput.value.trim();
            if (!txt) return;

            // Render user message bubble
            appendBubble('User', txt, 'user-msg');
            aiInput.value = '';

            // Render temporary loading indicator
            const tempId = 'loading-' + Date.now();
            appendBubble('AI', 'Memikirkan jawaban...', 'system-msg', tempId);

            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: txt })
                });
                const resData = await response.json();
                
                // Clear loading indicator element
                const loadingEl = document.getElementById(tempId);
                if (loadingEl) loadingEl.remove();

                if (resData.reply) {
                    appendBubble('AI', resData.reply, 'system-msg');
                } else if (resData.error) {
                    appendBubble('AI', `Gagal: ${resData.error}`, 'system-msg');
                }
            } catch (err) {
                const loadingEl = document.getElementById(tempId);
                if (loadingEl) loadingEl.remove();
                appendBubble('AI', 'Gagal terhubung dengan server.', 'system-msg');
            }
        };

        aiBtn.addEventListener('click', handleSendMessage);
        aiInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSendMessage();
            }
        });
    }

    function appendBubble(sender, text, className, id = '') {
        const wrapper = document.createElement('div');
        wrapper.className = `ai-message ${className}`;
        if (id) wrapper.id = id;

        const icon = document.createElement('div');
        icon.className = sender === 'User' ? 'avatar-fallback' : 'avatar-fallback ai-avatar';
        icon.textContent = sender === 'User' ? 'U' : 'AI';
        if (sender === 'User') icon.style.backgroundColor = '#30363d';

        const bubble = document.createElement('div');
        bubble.className = 'msg-bubble';
        bubble.textContent = text;

        wrapper.appendChild(icon);
        wrapper.appendChild(bubble);
        chatWindow.appendChild(wrapper);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }
});
