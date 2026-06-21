/**
 * game_engine.js — STAS Mini Game Engine
 * Games: Snake, Cosmic Clicker, Tebak Angka
 */

/* ═══════════════════════════════════════════════════════════
   SNAKE GAME
═══════════════════════════════════════════════════════════ */
const SnakeGame = (() => {
  const CELL  = 18;
  const COLS  = 22;
  const ROWS  = 20;
  const W     = CELL * COLS;
  const H     = CELL * ROWS;

  let canvas, ctx, scoreEl;
  let snake, dir, nextDir, food, score, loop, running, gameOver;

  const COLORS = {
    bg      : '#050508',
    grid    : '#0d0d1a',
    snake   : '#00ff88',
    snakeDim: '#00cc6a',
    head    : '#ffffff',
    food    : '#bf5fff',
    foodGlow: 'rgba(191,95,255,.6)',
    text    : '#e8e8f0',
  };

  function init() {
    canvas  = document.getElementById('snake-canvas');
    if (!canvas) return;
    ctx     = canvas.getContext('2d');
    canvas.width  = W;
    canvas.height = H;
    scoreEl = document.getElementById('snake-score');
    resetGame();
    bindKeys();
    bindButtons();
  }

  function resetGame() {
    snake    = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    dir      = { x: 1, y: 0 };
    nextDir  = { x: 1, y: 0 };
    food     = spawnFood();
    score    = 0;
    running  = false;
    gameOver = false;
    updateScore();
    drawFrame();
    showMsg('Tekan MULAI atau ↑↓←→');
  }

  function spawnFood() {
    let pos;
    do {
      pos = {
        x: Math.floor(Math.random() * COLS),
        y: Math.floor(Math.random() * ROWS),
      };
    } while (snake.some(s => s.x === pos.x && s.y === pos.y));
    return pos;
  }

  function start() {
    if (running) return;
    if (gameOver) resetGame();
    running = true;
    loop = setInterval(tick, 120);
  }

  function tick() {
    dir = { ...nextDir };
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    // Tembok = game over
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
      endGame(); return;
    }
    // Nabrak badan sendiri
    if (snake.some(s => s.x === head.x && s.y === head.y)) {
      endGame(); return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      score++;
      updateScore();
      food = spawnFood();
    } else {
      snake.pop();
    }

    drawFrame();
  }

  function endGame() {
    clearInterval(loop);
    running  = false;
    gameOver = true;
    drawFrame();
    showMsg(`💀 Game Over! Skor: ${score}`);
  }

  function drawFrame() {
    // Background
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, W, H);

    // Grid samar
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth   = 0.3;
    for (let x = 0; x < COLS; x++) {
      ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, H); ctx.stroke();
    }
    for (let y = 0; y < ROWS; y++) {
      ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(W, y * CELL); ctx.stroke();
    }

    // Makanan dengan glow
    ctx.save();
    ctx.shadowColor = COLORS.foodGlow;
    ctx.shadowBlur  = 14;
    ctx.fillStyle   = COLORS.food;
    ctx.beginPath();
    ctx.arc(
      food.x * CELL + CELL / 2,
      food.y * CELL + CELL / 2,
      CELL / 2 - 2, 0, Math.PI * 2
    );
    ctx.fill();
    ctx.restore();

    // Snake
    snake.forEach((seg, i) => {
      ctx.save();
      ctx.fillStyle   = i === 0 ? COLORS.head : (i % 2 === 0 ? COLORS.snake : COLORS.snakeDim);
      ctx.shadowColor = i === 0 ? COLORS.snake : 'transparent';
      ctx.shadowBlur  = i === 0 ? 10 : 0;
      const pad = i === 0 ? 1 : 2;
      ctx.beginPath();
      ctx.roundRect(
        seg.x * CELL + pad, seg.y * CELL + pad,
        CELL - pad * 2, CELL - pad * 2,
        3
      );
      ctx.fill();
      ctx.restore();
    });
  }

  function showMsg(txt) {
    const el = document.getElementById('snake-msg');
    if (el) el.textContent = txt;
  }

  function updateScore() {
    if (scoreEl) scoreEl.textContent = `Skor: ${score}`;
  }

  function bindKeys() {
    document.addEventListener('keydown', e => {
      const map = {
        ArrowUp   : { x: 0, y: -1 },
        ArrowDown : { x: 0, y:  1 },
        ArrowLeft : { x: -1, y: 0 },
        ArrowRight: { x:  1, y: 0 },
      };
      if (map[e.key]) {
        const n = map[e.key];
        // Jangan balik arah 180°
        if (n.x !== -dir.x || n.y !== -dir.y) nextDir = n;
        e.preventDefault();
      }
    });
  }

  function bindButtons() {
    const btnStart = document.getElementById('btn-snake-start');
    const btnReset = document.getElementById('btn-snake-reset');
    if (btnStart) btnStart.addEventListener('click', start);
    if (btnReset) btnReset.addEventListener('click', () => {
      clearInterval(loop);
      running = false;
      resetGame();
    });
  }

  return { init };
})();


/* ═══════════════════════════════════════════════════════════
   COSMIC CLICKER
═══════════════════════════════════════════════════════════ */
const ClickerGame = (() => {
  let clicks = 0, cps = 0, autoInterval = null, autoLevel = 0;

  function init() {
    const btn    = document.getElementById('clicker-btn');
    const btnAuto= document.getElementById('btn-clicker-auto');
    const btnRst = document.getElementById('btn-clicker-reset');

    if (!btn) return;

    btn.addEventListener('click', () => {
      clicks++;
      updateDisplay();
      spawnFloat(btn);
    });

    if (btnAuto) btnAuto.addEventListener('click', () => {
      autoLevel++;
      updateDisplay();
      clearInterval(autoInterval);
      autoInterval = setInterval(() => {
        clicks += autoLevel;
        updateDisplay();
      }, 1000);
    });

    if (btnRst) btnRst.addEventListener('click', () => {
      clicks = 0; autoLevel = 0; cps = 0;
      clearInterval(autoInterval);
      updateDisplay();
    });

    updateDisplay();
  }

  function updateDisplay() {
    const el = document.getElementById('clicker-stats');
    if (el) {
      el.innerHTML = `
        Klik: <span>${clicks.toLocaleString()}</span> &nbsp;|&nbsp;
        Auto: <span>${autoLevel} lvl</span> &nbsp;|&nbsp;
        CPS : <span>${autoLevel}</span>
      `;
    }
  }

  function spawnFloat(target) {
    const el  = document.createElement('div');
    el.textContent = '+1';
    el.style.cssText = `
      position:fixed; font-size:.9rem; font-weight:700;
      color:#00ff88; pointer-events:none; z-index:9999;
      animation: floatUp .8s ease forwards;
    `;
    const rect = target.getBoundingClientRect();
    el.style.left = (rect.left + rect.width / 2 - 12) + 'px';
    el.style.top  = (rect.top  - 10) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);
  }

  return { init };
})();


/* ═══════════════════════════════════════════════════════════
   TEBAK ANGKA
═══════════════════════════════════════════════════════════ */
const GuessGame = (() => {
  let secret, attempts, maxAttempts = 7;

  function init() {
    const btnGuess = document.getElementById('btn-guess');
    const btnNew   = document.getElementById('btn-guess-new');
    const input    = document.getElementById('guess-input');

    if (!btnGuess) return;

    newGame();

    btnGuess.addEventListener('click', () => checkGuess(input));
    if (btnNew) btnNew.addEventListener('click', newGame);

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') checkGuess(input);
    });
  }

  function newGame() {
    secret   = Math.floor(Math.random() * 100) + 1;
    attempts = 0;
    setResult('Tebak angka 1–100! Kamu punya 7 kesempatan.', 'var(--text-muted)');
    setTries('');
    const input = document.getElementById('guess-input');
    if (input) { input.value = ''; input.disabled = false; }
    const btn = document.getElementById('btn-guess');
    if (btn) btn.disabled = false;
  }

  function checkGuess(input) {
    const val = parseInt(input.value, 10);
    if (isNaN(val) || val < 1 || val > 100) {
      setResult('⚠ Masukkan angka antara 1–100', 'var(--danger)');
      return;
    }
    attempts++;
    const left = maxAttempts - attempts;

    if (val === secret) {
      setResult(`🎉 BENAR! Angkanya ${secret}. Selesai dalam ${attempts} tebakan!`, 'var(--green-neon)');
      endRound(input);
    } else if (attempts >= maxAttempts) {
      setResult(`💀 Kehabisan kesempatan! Jawabannya: ${secret}`, 'var(--danger)');
      endRound(input);
    } else {
      const hint = val < secret ? '⬆ Terlalu kecil!' : '⬇ Terlalu besar!';
      setResult(`${hint}`, 'var(--purple-neon)');
      setTries(`Sisa kesempatan: ${left}`);
    }
    input.value = '';
  }

  function endRound(input) {
    input.disabled = true;
    const btn = document.getElementById('btn-guess');
    if (btn) btn.disabled = true;
  }

  function setResult(msg, color) {
    const el = document.getElementById('guess-result');
    if (el) { el.textContent = msg; el.style.color = color; }
  }

  function setTries(txt) {
    const el = document.getElementById('guess-tries');
    if (el) el.textContent = txt;
  }

  return { init };
})();


/* ═══════════════════════════════════════════════════════════
   INIT SEMUA GAME
═══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  // Inject keyframe floatUp sekali
  if (!document.getElementById('float-style')) {
    const s = document.createElement('style');
    s.id = 'float-style';
    s.textContent = `
      @keyframes floatUp {
        0%   { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-50px); }
      }
    `;
    document.head.appendChild(s);
  }

  SnakeGame.init();
  ClickerGame.init();
  GuessGame.init();

  // Toggle game containers via tab buttons
  document.querySelectorAll('.game-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.game-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.game-container').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const target = document.getElementById(tab.dataset.target);
      if (target) target.classList.add('active');
    });
  });
});
