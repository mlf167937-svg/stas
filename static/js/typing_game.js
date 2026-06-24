document.addEventListener('DOMContentLoaded', () => {
    const KUMPULAN_TEKS = [
        "struktur data json sangat berguna untuk menyimpan informasi dan database sistem",
        "belajar coding di komunitas stas membuat kita berkembang menjadi programmer andal",
        "pastikan tidak ada sintaksis yang eror sebelum melakukan deploy ke server produksi",
        "belajar mengetik dapat membantu pekerjaan anda sehari hari",
        "kecepatan mengetik sepuluh jari adalah keahlian penting bagi seorang developer",
        "jangan lupa untuk selalu menjaga postur tubuh saat sedang memprogram aplikasi",
        "fungsi decorator pada flask digunakan untuk memproteksi rute halaman website kita",
        "javascript dan python adalah dua bahasa pemrograman paling populer di dunia saat ini",
        "kreativitas tanpa batas digabungkan dengan logika algoritma akan menghasilkan karya hebat",
        "menguasai framework modern akan mempercepat proses pengembangan antarmuka web interaktif"
    ];

    let timerInterval = null;
    let countdownInterval = null;
    let waktuMaksimal = 60; 
    let waktuSisa = waktuMaksimal;
    let gameTypingBerjalan = false;
    let isCountingDown = false;
    let teksTargetSekarang = "";

    const elTarget = document.getElementById('text-target');
    const elInput = document.getElementById('text-input');
    const elWps = document.getElementById('stat-wps');
    const elWpm = document.getElementById('stat-wpm');
    const elAcc = document.getElementById('stat-acc');
    const elTime = document.getElementById('stat-time');
    const btnTypingStart = document.getElementById('btn-typing-start');
    const btnTypingReset = document.getElementById('btn-typing-reset');

    function acakTeks() {
        const index = Math.floor(Math.random() * KUMPULAN_TEKS.length);
        teksTargetSekarang = KUMPULAN_TEKS[index];
        elTarget.style.justifyContent = "flex-start";
        elTarget.innerHTML = teksTargetSekarang.split('').map((char, i) => {
            if(i === 0) return `<span class="char-current">${char}</span>`;
            return `<span>${char}</span>`;
        }).join('');
    }

    function persiapanMulai() {
        if (gameTypingBerjalan || isCountingDown) return;
        isCountingDown = true;
        btnTypingStart.disabled = true;
        acakTeks();
        elInput.disabled = true;
        elInput.value = "";
        let hitungMundur = 3;
        elInput.placeholder = `Bersiap... Anda dapat mengetik dalam ${hitungMundur} detik`;
        
        countdownInterval = setInterval(() => {
            hitungMundur--;
            if (hitungMundur > 0) {
                elInput.placeholder = `Bersiap... Anda dapat mengetik dalam ${hitungMundur} detik`;
            } else {
                clearInterval(countdownInterval);
                isCountingDown = false;
                elInput.placeholder = "Mulai mengetik di sini...";
                startTypingGame(); 
            }
        }, 1000);
    }

    function startTypingGame() {
        gameTypingBerjalan = true;
        waktuSisa = waktuMaksimal;
        elInput.disabled = false;
        elInput.focus();
        btnTypingStart.disabled = false;
        
        timerInterval = setInterval(() => {
            waktuSisa--;
            elTime.innerText = waktuSisa + "s";
            if (waktuSisa <= 10) elTime.style.color = "#f38ba8"; 
            hitungSkorTyping();
            if (waktuSisa <= 0) endTypingGame();
        }, 1000);
    }

    function hitungSkorTyping() {
        const teksKetik = elInput.value;
        const karakterTarget = teksTargetSekarang.split('');
        const spanKarakter = elTarget.querySelectorAll('span');
        let salahKetik = 0, benarKetik = 0;

        for (let i = 0; i < spanKarakter.length; i++) {
            const charKetik = teksKetik[i];
            if (charKetik == null) {
                spanKarakter[i].className = (i === teksKetik.length) ? 'char-current' : '';
            } else if (charKetik === karakterTarget[i]) {
                spanKarakter[i].className = 'char-correct';
                benarKetik++;
            } else {
                spanKarakter[i].className = 'char-incorrect';
                salahKetik++;
            }
        }

        let jumlahKataBenar = benarKetik / 5;
        let waktuBerjalan = (waktuMaksimal - waktuSisa);
        if (waktuBerjalan <= 0) waktuBerjalan = 0.1; 

        let wps = jumlahKataBenar / waktuBerjalan;
        let wpm = Math.round(wps * 60);

        elWps.innerText = wps.toFixed(2);
        elWpm.innerText = wpm;

        let totalKetik = benarKetik + salahKetik;
        let akurasi = totalKetik > 0 ? Math.round((benarKetik / totalKetik) * 100) : 100;
        elAcc.innerText = akurasi + "%";

        if (teksKetik.length >= teksTargetSekarang.length && akurasi >= 90) {
            elInput.value = "";
            acakTeks();
        }
    }

    function endTypingGame() {
        clearInterval(timerInterval);
        gameTypingBerjalan = false;
        elInput.disabled = true;
        alert(`Waktu Habis!\n\nStatistik:\nKecepatan: ${elWps.innerText} WPS (${elWpm.innerText} WPM)\nAkurasi: ${elAcc.innerText}`);
    }

    elInput.addEventListener('input', () => {
        if (gameTypingBerjalan) hitungSkorTyping();
    });
    btnTypingStart.addEventListener('click', persiapanMulai);
    btnTypingReset.addEventListener('click', () => {
        clearInterval(timerInterval); clearInterval(countdownInterval);
        gameTypingBerjalan = false; isCountingDown = false;
        elInput.value = ""; elInput.disabled = true; btnTypingStart.disabled = false;
        elWps.innerText = "0.00"; elWpm.innerText = "0"; elAcc.innerText = "100%";
        elTime.innerText = "60s"; elTime.style.color = "#f9e2af";
        elTarget.style.justifyContent = "center"; elTarget.innerHTML = "Klik 'Mulai Tes' untuk bersiap...";
    });
});
