/**
 * app.js — STAS Web Frontend Logic
 * Handles: Member detail modal, smooth UI interactions
 */

document.addEventListener('DOMContentLoaded', () => {

  // ── Modal Elements ─────────────────────────────────────────
  const overlay    = document.getElementById('member-modal');
  const modalClose = document.getElementById('modal-close');
  const modalAvatar= document.getElementById('modal-avatar');
  const modalName  = document.getElementById('modal-name');
  const modalDesk  = document.getElementById('modal-desk');
  const modalDB    = document.getElementById('modal-db');
  const modalLoad  = document.getElementById('modal-loading');

  if (!overlay) return; // Bukan halaman index

  // ── Buka Modal ─────────────────────────────────────────────
  function openModal(username) {
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Reset state
    if (modalLoad) modalLoad.style.display = 'block';
    if (modalDB)   modalDB.textContent = '';

    fetch(`/api/member/${encodeURIComponent(username)}`)
      .then(r => {
        if (!r.ok) throw new Error('Gagal memuat data member');
        return r.json();
      })
      .then(data => {
        const initial = (data.name || username).charAt(0).toUpperCase();
        if (modalAvatar) modalAvatar.textContent = initial;
        if (modalName)   modalName.textContent   = data.name || username;
        if (modalDesk)   modalDesk.textContent   = data.desk || '-';
        if (modalDB)     modalDB.textContent     = data.db  || '(Data tidak tersedia)';
        if (modalLoad)   modalLoad.style.display = 'none';
      })
      .catch(err => {
        if (modalDB)   modalDB.textContent  = '⚠ ' + err.message;
        if (modalLoad) modalLoad.style.display = 'none';
      });
  }

  // ── Tutup Modal ────────────────────────────────────────────
  function closeModal() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  // ── Event Listeners ────────────────────────────────────────
  if (modalClose) modalClose.addEventListener('click', closeModal);

  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  // Delegasi klik ke setiap member card
  document.querySelectorAll('.member-card[data-username]').forEach(card => {
    card.addEventListener('click', () => {
      openModal(card.dataset.username);
    });

    // Aksesibilitas keyboard
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(card.dataset.username);
      }
    });
  });

  // ── Highlight nav link aktif ───────────────────────────────
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === currentPath) {
      a.classList.add('active');
    }
  });

  // ── Notifikasi flash (jika ada) ───────────────────────────
  const flashMsgs = document.querySelectorAll('.flash-msg');
  flashMsgs.forEach(el => {
    setTimeout(() => {
      el.style.transition = 'opacity .5s ease';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 500);
    }, 3500);
  });

});
