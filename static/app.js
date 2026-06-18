/* ==========================================================================
   STAS — app.js
   Handles: deterministic avatar colors, live client-side search filtering
   (with graceful fallback to backend ?q= search), small UX polish.
   ========================================================================== */

(function () {
  "use strict";

  const AVATAR_COLORS = [
    "#6e7bff", // indigo
    "#3fb97f", // green
    "#f0a93f", // amber
    "#f0556b", // red
    "#4fc3d9", // cyan
    "#c66fe0", // violet
  ];

  /**
   * Deterministically pick a color for a given string (username or name),
   * so the same member always gets the same avatar color across pages.
   */
  function colorForKey(key) {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = (hash << 5) - hash + key.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
  }

  function applyAvatarColors() {
    document.querySelectorAll("[data-avatar-key]").forEach((el) => {
      const key = el.getAttribute("data-avatar-key") || el.textContent || "?";
      el.style.background = colorForKey(key);
    });
  }

  /**
   * Live search: filters the already-rendered member cards in the DOM
   * instantly as the user types, without waiting for a server round-trip.
   * Falls back gracefully — if JS fails, the form still submits normally
   * to the backend ?q= search on Enter.
   */
  function setupLiveSearch() {
    const input = document.getElementById("search-input");
    const grid = document.getElementById("member-grid");
    const emptyState = document.getElementById("empty-state");
    const searchMeta = document.getElementById("search-meta");

    if (!input || !grid) return;

    const cards = Array.from(grid.querySelectorAll(".member-card"));

    input.addEventListener("input", () => {
      const term = input.value.trim().toLowerCase();
      let visibleCount = 0;

      cards.forEach((card) => {
        const name = (card.getAttribute("data-name") || "").toLowerCase();
        const desk = (card.getAttribute("data-desk") || "").toLowerCase();
        const matches = !term || name.includes(term) || desk.includes(term);
        card.style.display = matches ? "" : "none";
        if (matches) visibleCount++;
      });

      if (emptyState) {
        emptyState.style.display = visibleCount === 0 ? "flex" : "none";
      }

      if (searchMeta) {
        searchMeta.textContent = term
          ? `Showing ${visibleCount} of ${cards.length} members matching "${input.value.trim()}"`
          : `Showing all ${cards.length} members`;
      }
    });
  }

  function setupCardNavigation() {
    document.querySelectorAll(".member-card[data-href]").forEach((card) => {
      card.addEventListener("click", () => {
        window.location.href = card.getAttribute("data-href");
      });
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          window.location.href = card.getAttribute("data-href");
        }
      });
    });
  }

  function autoDismissFlashes() {
    document.querySelectorAll(".flash").forEach((el, i) => {
      setTimeout(() => {
        el.style.transition = "opacity 0.3s ease, transform 0.3s ease";
        el.style.opacity = "0";
        el.style.transform = "translateX(8px)";
        setTimeout(() => el.remove(), 320);
      }, 4000 + i * 200);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    applyAvatarColors();
    setupLiveSearch();
    setupCardNavigation();
    autoDismissFlashes();
  });
})();
