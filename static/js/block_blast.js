document.addEventListener('DOMContentLoaded', () => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    function playSound(type) {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode); gainNode.connect(audioCtx.destination);
        const now = audioCtx.currentTime;
        
        if (type === 'place') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
            gainNode.gain.setValueAtTime(0.3, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now); osc.stop(now + 0.1);
        } else if (type === 'clear') {
            osc.type = 'square'; osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
            gainNode.gain.setValueAtTime(0.4, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now); osc.stop(now + 0.3);
        } else if (type === 'error') {
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(100, now);
            gainNode.gain.setValueAtTime(0.2, now); gainNode.gain.linearRampToValueAtTime(0.01, now + 0.2);
            osc.start(now); osc.stop(now + 0.2);
        }
    }

    const canvas = document.getElementById('block-canvas');
    const ctx = canvas.getContext('2d');
    const elBlockScore = document.getElementById('block-score');
    const btnBlockReset = document.getElementById('btn-block-reset');

    const BARIS = 8; const KOLOM = 8; const UKURAN_KOTAK = 32; 
    const OFFSET_X = 12; const OFFSET_Y = 15; 

    let papan = Array(BARIS).fill().map(() => Array(KOLOM).fill(0));
    let skorBlock = 0; let balokPilihan = []; 

    const SHAPES = [
        { color: '#ff6080', matrix: [[1]] },
        { color: '#ffb86c', matrix: [[1, 1]] },
        { color: '#8be9fd', matrix: [[1], [1]] },
        { color: '#50fa7b', matrix: [[1, 1], [1, 1]] },
        { color: '#bd93f9', matrix: [[1, 1, 1]] },
        { color: '#bd93f9', matrix: [[1], [1], [1]] },
        { color: '#ff79c6', matrix: [[1, 1], [1, 0]] },
        { color: '#f1fa8c', matrix: [[1, 1, 1, 1]] },
        { color: '#8be9fd', matrix: [[1, 0, 0], [1, 0, 0], [1, 1, 1]] },
        { color: '#ff5555', matrix: [[1, 1, 1], [0, 1, 0]] }
    ];

    function acakBalokBaru() {
        balokPilihan = [];
        for (let i = 0; i < 3; i++) {
            const acak = SHAPES[Math.floor(Math.random() * SHAPES.length)];
            balokPilihan.push({
                ...acak, used: false, isDragging: false,
                xAsli: 20 + (i * 85), yAsli: 300, x: 20 + (i * 85), y: 300
            });
        }
    }

    function gambarPapan() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let r = 0; r < BARIS; r++) {
            for (let c = 0; c < KOLOM; c++) {
                ctx.fillStyle = papan[r][c] ? papan[r][c] : '#212230';
                ctx.fillRect(OFFSET_X + c * UKURAN_KOTAK, OFFSET_Y + r * UKURAN_KOTAK, UKURAN_KOTAK - 2, UKURAN_KOTAK - 2);
            }
        }
        ctx.strokeStyle = '#313244'; ctx.lineWidth = 1; ctx.beginPath();
        ctx.moveTo(0, 280); ctx.lineTo(canvas.width, 280); ctx.stroke();

        balokPilihan.forEach((block) => {
            if (!block.used && !block.isDragging) gambarSebuahBalok(block, block.x, block.y, 16);
        });

        balokPilihan.forEach((block) => {
            if (block.isDragging) {
                if (block.y < 280) {
                    const snapCol = Math.floor((block.x - OFFSET_X + (UKURAN_KOTAK/2)) / UKURAN_KOTAK);
                    const snapRow = Math.floor((block.y - OFFSET_Y + (UKURAN_KOTAK/2)) / UKURAN_KOTAK);
                    if (snapRow >= 0 && snapRow < BARIS && snapCol >= 0 && snapCol < KOLOM) {
                        if (bisaTaruhBalok(snapRow, snapCol, block.matrix)) {
                            ctx.globalAlpha = 0.3;
                            gambarSebuahBalok({ ...block, color: '#ffffff' }, OFFSET_X + snapCol * UKURAN_KOTAK, OFFSET_Y + snapRow * UKURAN_KOTAK, UKURAN_KOTAK);
                            ctx.globalAlpha = 1.0;
                        }
                    }
                }
                gambarSebuahBalok(block, block.x, block.y, UKURAN_KOTAK);
            }
        });
    }

    function gambarSebuahBalok(block, px, py, size) {
        ctx.fillStyle = block.color;
        block.matrix.forEach((row, r) => {
            row.forEach((val, c) => {
                if (val) ctx.fillRect(px + c * size, py + r * size, size - 2, size - 2);
            });
        });
    }

    let dragBlockIndex = null; let dragOffsetX = 0; let dragOffsetY = 0;

    function getMousePos(evt) {
        const rect = canvas.getBoundingClientRect();
        const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
        const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    }

    function onPointerDown(e) {
        if (e.cancelable) e.preventDefault();
        const pos = getMousePos(e);
        for (let i = 0; i < balokPilihan.length; i++) {
            const b = balokPilihan[i];
            if (b.used) continue;
            const bWidth = b.matrix[0].length * 16; const bHeight = b.matrix.length * 16;
            if (pos.x >= b.xAsli - 10 && pos.x <= b.xAsli + bWidth + 10 && pos.y >= b.yAsli - 10 && pos.y <= b.yAsli + bHeight + 10) {
                dragBlockIndex = i; b.isDragging = true;
                dragOffsetX = (b.matrix[0].length * UKURAN_KOTAK) / 2; dragOffsetY = (b.matrix.length * UKURAN_KOTAK) / 2;
                b.x = pos.x - dragOffsetX; b.y = pos.y - dragOffsetY;
                gambarPapan(); break;
            }
        }
    }

    function onPointerMove(e) {
        if (dragBlockIndex !== null) {
            if (e.cancelable) e.preventDefault();
            const pos = getMousePos(e); const b = balokPilihan[dragBlockIndex];
            b.x = pos.x - dragOffsetX; b.y = pos.y - dragOffsetY;
            gambarPapan();
        }
    }

    function onPointerUp() {
        if (dragBlockIndex !== null) {
            const b = balokPilihan[dragBlockIndex]; b.isDragging = false;
            const snapCol = Math.floor((b.x - OFFSET_X + (UKURAN_KOTAK/2)) / UKURAN_KOTAK);
            const snapRow = Math.floor((b.y - OFFSET_Y + (UKURAN_KOTAK/2)) / UKURAN_KOTAK);

            if (snapRow >= 0 && snapRow < BARIS && snapCol >= 0 && snapCol < KOLOM && bisaTaruhBalok(snapRow, snapCol, b.matrix)) {
                taruhBalok(snapRow, snapCol, b); playSound('place');
                cekLedakanBarisDanKolom();
                if (balokPilihan.every(bl => bl.used)) acakBalokBaru();
                cekKondisiKalah();
            } else {
                if(snapRow >= 0 && snapRow < BARIS) playSound('error');
                b.x = b.xAsli; b.y = b.yAsli;
            }
            dragBlockIndex = null; gambarPapan();
        }
    }

    function bisaTaruhBalok(startRow, startCol, matrix) {
        for (let r = 0; r < matrix.length; r++) {
            for (let c = 0; c < matrix[r].length; c++) {
                if (matrix[r][c]) {
                    let papanR = startRow + r; let papanC = startCol + c;
                    if (papanR >= BARIS || papanC >= KOLOM || papan[papanR][papanC] !== 0) return false;
                }
            }
        }
        return true;
    }

    function taruhBalok(startRow, startCol, block) {
        block.matrix.forEach((row, r) => {
            row.forEach((val, c) => {
                if (val) { papan[startRow + r][startCol + c] = block.color; skorBlock += 10; }
            });
        });
        block.used = true;
    }

    function cekLedakanBarisDanKolom() {
        let barisHancur = []; let kolomHancur = [];
        for (let r = 0; r < BARIS; r++) { if (papan[r].every(cell => cell !== 0)) barisHancur.push(r); }
        for (let c = 0; c < KOLOM; c++) {
            let kolFull = true;
            for (let r = 0; r < BARIS; r++) { if (papan[r][c] === 0) { kolFull = false; break; } }
            if (kolFull) kolomHancur.push(c);
        }
        if (barisHancur.length > 0 || kolomHancur.length > 0) playSound('clear');
        barisHancur.forEach(r => { for (let c = 0; c < KOLOM; c++) papan[r][c] = 0; skorBlock += 100; });
        kolomHancur.forEach(c => { for (let r = 0; r < BARIS; r++) papan[r][c] = 0; skorBlock += 100; });
        elBlockScore.innerText = "Skor: " + skorBlock;
    }

    function cekKondisiKalah() {
        let masihBisaMain = false;
        for (let idx = 0; idx < balokPilihan.length; idx++) {
            if (balokPilihan[idx].used) continue;
            for (let r = 0; r < BARIS; r++) {
                for (let c = 0; c < KOLOM; c++) {
                    if (bisaTaruhBalok(r, c, balokPilihan[idx].matrix)) { masihBisaMain = true; break; }
                }
                if (masihBisaMain) break;
            }
            if (masihBisaMain) break;
        }
        if (!masihBisaMain) {
            setTimeout(() => { playSound('error'); alert("Game Over! Skor Akhir: " + skorBlock); resetBlockBlast(); }, 300);
        }
    }

    function resetBlockBlast() {
        papan = Array(BARIS).fill().map(() => Array(KOLOM).fill(0));
        skorBlock = 0; elBlockScore.innerText = "Skor: 0"; acakBalokBaru(); gambarPapan();
    }

    canvas.addEventListener('mousedown', onPointerDown); canvas.addEventListener('mousemove', onPointerMove); window.addEventListener('mouseup', onPointerUp);
    canvas.addEventListener('touchstart', onPointerDown, {passive: false}); canvas.addEventListener('touchmove', onPointerMove, {passive: false}); window.addEventListener('touchend', onPointerUp);
    btnBlockReset.addEventListener('click', resetBlockBlast);

    acakBalokBaru(); gambarPapan();
});
