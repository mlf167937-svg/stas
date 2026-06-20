/* ============================================================================
   STAS ARENA — GLOBAL APP UTILITIES
   Transisi halaman, animasi counter, hamburger menu, dan helper global lainnya.
   ============================================================================ */

(function (window) {
  "use strict";

  /* ============================================================
     1. KONFIGURASI GLOBAL
     ============================================================ */
  const APP_CONFIG = {
    transitionDuration: 300, // ms
    counterTickSpeed: 50,    // ms per tick animasi counter
    mobileBreakpoint: 768,   // pixel, threshold "hamburger mode"
    logPrefix: "[STAS-APP]",
  };

  /* ============================================================
     2. UTILITY — LOGGING & HELPER KECIL
     ============================================================ */
  function log(msg) {
    console.log(`%c${APP_CONFIG.logPrefix} ${msg}`, "color:#ffb703;font-weight:bold;");
  }

  function isMobile() {
    return window.innerWidth <= APP_CONFIG.mobileBreakpoint;
  }

  function onReady(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  /* ============================================================
     3. PAGE TRANSITION
     ============================================================ */
  class PageTransition {
    constructor() {
      this.currentPage = null;
      this.isTransitioning = false;
    }

    /**
     * Transisi halaman dengan fade out -> hidden -> fade in
     * @param {string} pageId - id halaman tujuan
     */
    goTo(pageId) {
      if (this.isTransitioning) return;
      this.isTransitioning = true;

      const targetPage = document.getElementById(pageId);
      if (!targetPage) {
        log(`Waduh cuks, halaman #${pageId} gak ketemu di DOM.`);
        this.isTransitioning = false;
        return;
      }

      // Cari halaman aktif sekarang
      const activePage = document.querySelector("[data-page].active");

      if (activePage && activePage.id !== pageId) {
        // Fade out halaman lama
        activePage.classList.remove("active");
        setTimeout(() => {
          activePage.setAttribute("hidden", "");

          // Fade in halaman baru
          targetPage.removeAttribute("hidden");
          targetPage.classList.add("active");

          this.currentPage = pageId;
          this.isTransitioning = false;

          // Scroll ke atas halaman baru
          window.scrollTo(0, 0);

          log(`Pindah ke halaman: #${pageId}`);
        }, APP_CONFIG.transitionDuration);
      } else if (!activePage) {
        // Page pertama kali
        targetPage.removeAttribute("hidden");
        targetPage.classList.add("active");
        this.currentPage = pageId;
        this.isTransitioning = false;
      } else {
        // Udah di halaman yang sama, gak perlu transisi
        this.isTransitioning = false;
      }
    }

    getCurrentPageId() {
      return this.currentPage;
    }
  }

  /* ============================================================
     4. ANIMATED COUNTER (untuk dashboard stats)
     Animasi angka naik-naik dari 0 ke target value
     ============================================================ */
  class AnimatedCounter {
    /**
     * @param {HTMLElement} element - elemen yang bakal ditampilin angkanya
     * @param {number} targetValue - nilai akhir
     * @param {Object} opts
     * @param {number} opts.duration - durasi animasi total (ms), default 1200
     * @param {boolean} opts.useSeparator - pakai pemisah ribuan (default true)
     */
    constructor(element, targetValue, opts = {}) {
      this.element = element;
      this.targetValue = Math.round(targetValue);
      this.currentValue = 0;
      this.duration = opts.duration || 1200;
      this.useSeparator = opts.useSeparator !== false;
      this.isAnimating = false;
      this.startTime = null;
      this.animationId = null;
    }

    start() {
      if (this.isAnimating) return;
      this.isAnimating = true;
      this.currentValue = 0;
      this.startTime = performance.now();
      this._tick();
    }

    stop() {
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
      }
      this.isAnimating = false;
    }

    _tick() {
      const now = performance.now();
      const elapsed = now - this.startTime;
      const progress = Math.min(elapsed / this.duration, 1);

      // Easing: ease-out-quad (mulai cepat, akhir melambat)
      const easeProgress = 1 - (1 - progress) * (1 - progress);
      this.currentValue = Math.round(this.targetValue * easeProgress);

      this._updateDisplay();

      if (progress < 1) {
        this.animationId = requestAnimationFrame(() => this._tick());
      } else {
        this.isAnimating = false;
      }
    }

    _updateDisplay() {
      let text = String(this.currentValue);
      if (this.useSeparator) {
        text = text.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      }
      this.element.textContent = text;
    }

    setValue(value) {
      this.stop();
      this.targetValue = Math.round(value);
      this.currentValue = this.targetValue;
      this._updateDisplay();
    }
  }

  /* ============================================================
     5. HAMBURGER MENU (Mobile)
     ============================================================ */
  class HamburgerMenu {
    constructor(toggleBtnId, navMenuId) {
      this.toggleBtn = document.getElementById(toggleBtnId);
      this.navMenu = document.getElementById(navMenuId);
      this.isOpen = false;

      if (!this.toggleBtn || !this.navMenu) {
        log(`Hamburger menu: tombol #${toggleBtnId} atau nav #${navMenuId} gak ketemu. Skip.`);
        return;
      }

      this._bindEvents();
    }

    _bindEvents() {
      this.toggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggle();
      });

      // Tutup menu kalau user klik di luar (backdrop)
      document.addEventListener("click", (e) => {
        if (this.isOpen && !this.navMenu.contains(e.target)) {
          this.close();
        }
      });

      // Link di menu: tutup menu saat diklik
      const links = this.navMenu.querySelectorAll("a");
      links.forEach((link) => {
        link.addEventListener("click", () => {
          this.close();
        });
      });

      // Responsive: tutup menu kalau window di-resize ke desktop
      window.addEventListener("resize", () => {
        if (!isMobile() && this.isOpen) {
          this.close();
        }
      });
    }

    toggle() {
      this.isOpen ? this.close() : this.open();
    }

    open() {
      this.isOpen = true;
      this.toggleBtn.classList.add("active");
      this.navMenu.classList.add("open");
    }

    close() {
      this.isOpen = false;
      this.toggleBtn.classList.remove("active");
      this.navMenu.classList.remove("open");
    }
  }

  /* ============================================================
     6. MODAL / DIALOG HELPER
     ============================================================ */
  class Modal {
    /**
     * @param {string} modalId - id elemen modal
     * @param {Object} opts
     * @param {string} opts.closeBtn - selector tombol close (auto-bind)
     */
    constructor(modalId, opts = {}) {
      this.modal = document.getElementById(modalId);
      this.isOpen = false;

      if (!this.modal) {
        log(`Modal #${modalId} gak ketemu di DOM.`);
        return;
      }

      if (opts.closeBtn) {
        const closeBtn = this.modal.querySelector(opts.closeBtn);
        if (closeBtn) {
          closeBtn.addEventListener("click", () => this.close());
        }
      }

      // Close saat klik backdrop (di luar modal content)
      this.modal.addEventListener("click", (e) => {
        if (e.target === this.modal) {
          this.close();
        }
      });
    }

    open() {
      if (!this.modal) return;
      this.isOpen = true;
      this.modal.classList.remove("hidden");
      this.modal.classList.add("visible");
      document.body.style.overflow = "hidden"; // Cegah scroll saat modal buka
    }

    close() {
      if (!this.modal) return;
      this.isOpen = false;
      this.modal.classList.remove("visible");
      this.modal.classList.add("hidden");
      document.body.style.overflow = "";
    }

    setContent(html) {
      if (!this.modal) return;
      const contentEl = this.modal.querySelector(".modal-content");
      if (contentEl) {
        contentEl.innerHTML = html;
      }
    }
  }

  /* ============================================================
     7. TOAST NOTIFICATION (temporary alert di corner)
     ============================================================ */
  class Toast {
    constructor() {
      this.toastContainer = null;
      this._init();
    }

    _init() {
      this.toastContainer = document.getElementById("toastContainer");
      if (!this.toastContainer) {
        this.toastContainer = document.createElement("div");
        this.toastContainer.id = "toastContainer";
        this.toastContainer.className = "toast-container";
        document.body.appendChild(this.toastContainer);
      }
    }

    /**
     * @param {string} message
     * @param {Object} opts
     * @param {string} opts.type - "success" | "error" | "info" | "warning"
     * @param {number} opts.duration - auto-close setelah berapa ms (0 = manual close)
     */
    show(message, opts = {}) {
      const type = opts.type || "info";
      const duration = opts.duration !== undefined ? opts.duration : 3000;

      const toast = document.createElement("div");
      toast.className = `toast toast-${type}`;
      toast.innerHTML = `
        <div class="toast-content">${message}</div>
        <button class="toast-close" aria-label="Close"><span>&times;</span></button>
      `;

      const closeBtn = toast.querySelector(".toast-close");
      closeBtn.addEventListener("click", () => {
        toast.classList.add("fade-out");
        setTimeout(() => toast.remove(), 300);
      });

      this.toastContainer.appendChild(toast);

      if (duration > 0) {
        setTimeout(() => {
          toast.classList.add("fade-out");
          setTimeout(() => toast.remove(), 300);
        }, duration);
      }

      return toast;
    }

    success(msg, duration) {
      return this.show(msg, { type: "success", duration });
    }

    error(msg, duration) {
      return this.show(msg, { type: "error", duration });
    }

    info(msg, duration) {
      return this.show(msg, { type: "info", duration });
    }

    warning(msg, duration) {
      return this.show(msg, { type: "warning", duration });
    }
  }

  /* ============================================================
     8. FORM VALIDATOR (simpel tapi cukup)
     ============================================================ */
  class FormValidator {
    /**
     * @param {HTMLFormElement} form
     * @param {Object} rules - { fieldName: [{ rule, message }, ...] }
     */
    constructor(form, rules = {}) {
      this.form = form;
      this.rules = rules;
      this.errors = {};
    }

    /**
     * Validasi field individual
     * @param {string} fieldName
     * @returns {boolean}
     */
    validateField(fieldName) {
      const input = this.form.elements[fieldName];
      if (!input) return true;

      const fieldRules = this.rules[fieldName] || [];
      const value = input.value.trim();
      this.errors[fieldName] = [];

      for (const ruleObj of fieldRules) {
        const { rule, message } = ruleObj;
        let isValid = true;

        if (rule === "required") {
          isValid = value.length > 0;
        } else if (rule === "email") {
          isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        } else if (rule === "minLength") {
          isValid = value.length >= ruleObj.min;
        } else if (rule === "maxLength") {
          isValid = value.length <= ruleObj.max;
        } else if (typeof rule === "function") {
          isValid = rule(value);
        }

        if (!isValid) {
          this.errors[fieldName].push(message);
        }
      }

      // Update visual feedback
      if (this.errors[fieldName].length > 0) {
        input.classList.add("is-invalid");
      } else {
        input.classList.remove("is-invalid");
      }

      return this.errors[fieldName].length === 0;
    }

    /**
     * Validasi semua field
     * @returns {boolean}
     */
    validate() {
      let isValid = true;
      for (const fieldName in this.rules) {
        if (!this.validateField(fieldName)) {
          isValid = false;
        }
      }
      return isValid;
    }

    getErrors() {
      return this.errors;
    }

    getErrorsAsString(separator = "; ") {
      const msgs = [];
      for (const field in this.errors) {
        msgs.push(...this.errors[field]);
      }
      return msgs.join(separator);
    }
  }

  /* ============================================================
     9. MAIN APP INITIALIZATION
     ============================================================ */
  class STASApp {
    constructor() {
      this.pageTransition = new PageTransition();
      this.hamburger = null;
      this.modals = {};
      this.toast = new Toast();
      this.counters = {};
      this.validators = {};
    }

    init() {
      onReady(() => {
        this._setupPageTransition();
        this._setupHamburgerMenu();
        this._setupModals();
        this._setupCounters();
        this._setupEventListeners();
        this._setupResponsive();

        log("App initialized. Siap dimainkan, cuks!");
      });
    }

    _setupPageTransition() {
      // Cari tombol navigasi yang punya data-page
      const navLinks = document.querySelectorAll("[data-page]");
      navLinks.forEach((link) => {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          const pageId = link.getAttribute("data-page");
          this.pageTransition.goTo(pageId);
        });
      });
    }

    _setupHamburgerMenu() {
      // Default id: hamburger, navbar
      this.hamburger = new HamburgerMenu("hamburger", "navbar");
    }

    _setupModals() {
      // Auto-discover semua modal yang ada di DOM
      const modals = document.querySelectorAll("[data-modal]");
      modals.forEach((modalEl) => {
        const modalId = modalEl.id;
        this.modals[modalId] = new Modal(modalId, { closeBtn: ".modal-close" });
      });
    }

    _setupCounters() {
      // Auto-discover semua elemen dengan class "counter"
      const counterEls = document.querySelectorAll(".counter");
      counterEls.forEach((el) => {
        const target = parseInt(el.getAttribute("data-target")) || 0;
        const counter = new AnimatedCounter(el, target);
        this.counters[el.id] = counter;
      });
    }

    _setupEventListeners() {
      // Open modal via tombol
      const modalTriggers = document.querySelectorAll("[data-modal-open]");
      modalTriggers.forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          const modalId = btn.getAttribute("data-modal-open");
          const modal = this.modals[modalId];
          if (modal) modal.open();
        });
      });

      // Close modal via tombol
      const modalClosers = document.querySelectorAll("[data-modal-close]");
      modalClosers.forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          const modalId = btn.getAttribute("data-modal-close");
          const modal = this.modals[modalId];
          if (modal) modal.close();
        });
      });
    }

    _setupResponsive() {
      window.addEventListener("resize", () => {
        // Bisa tambah logic responsive di sini kalau perlu
      });
    }

    // ===== PUBLIC API =====
    goToPage(pageId) {
      this.pageTransition.goTo(pageId);
    }

    getCurrentPageId() {
      return this.pageTransition.getCurrentPageId();
    }

    /**
     * Animasi counter mulai
     */
    startCounter(counterId) {
      const counter = this.counters[counterId];
      if (counter) counter.start();
    }

    /**
     * Animasi counter set value (tanpa animasi)
     */
    setCounterValue(counterId, value) {
      const counter = this.counters[counterId];
      if (counter) counter.setValue(value);
    }

    openModal(modalId) {
      const modal = this.modals[modalId];
      if (modal) modal.open();
    }

    closeModal(modalId) {
      const modal = this.modals[modalId];
      if (modal) modal.close();
    }

    showToast(message, type = "info", duration = 3000) {
      return this.toast.show(message, { type, duration });
    }

    /**
     * Helper untuk form validation
     */
    createValidator(formId, rules) {
      const form = document.getElementById(formId);
      if (!form) {
        log(`Form #${formId} gak ketemu.`);
        return null;
      }
      const validator = new FormValidator(form, rules);
      this.validators[formId] = validator;
      return validator;
    }

    /**
     * Dapatkan validator form
     */
    getValidator(formId) {
      return this.validators[formId] || null;
    }

    /**
     * Info debug: tampilkan status app sekarang
     */
    getStatus() {
      return {
        currentPage: this.pageTransition.getCurrentPageId(),
        isMobile: isMobile(),
        hamburgerOpen: this.hamburger?.isOpen || false,
      };
    }
  }

  /* ============================================================
     10. EXPORT GLOBAL
     ============================================================ */
  window.STASApp = new STASApp();

  // Export helper global juga kalau diperlukan
  window.STASApp.isMobile = isMobile;
  window.STASApp.AnimatedCounter = AnimatedCounter;
  window.STASApp.Modal = Modal;
  window.STASApp.Toast = Toast;
  window.STASApp.FormValidator = FormValidator;

  // Auto-init kalau script ini loaded (opsional, bisa juga manual init)
  if (document.readyState !== "loading") {
    window.STASApp.init();
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      window.STASApp.init();
    });
  }

  log("app.js loaded. STASApp siap dipakai, cuks!");
})(window);
