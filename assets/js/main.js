/* ============================================================
   main.js — Scripts compartilhados (tema, navbar, progresso)
   ============================================================ */

(function () {
  "use strict";

  /* ---------- Tema Escuro / Claro ---------- */
  const THEME_KEY = "autista-theme";
  const htmlEl = document.documentElement;

  function applyTheme(theme) {
    htmlEl.setAttribute("data-theme", theme);
    const btn = document.getElementById("theme-toggle");
    if (!btn) return;
    btn.setAttribute("aria-label", theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro");
    btn.textContent = theme === "dark" ? "☀️ Claro" : "🌙 Escuro";
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = saved || (prefersDark ? "dark" : "light");
    applyTheme(theme);
  }

  window.toggleTheme = function () {
    const current = htmlEl.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  };

  /* ---------- Navbar hamburger ---------- */
  function initNavbar() {
    const hamburger = document.getElementById("hamburger");
    const navLinks = document.getElementById("nav-links");
    if (!hamburger || !navLinks) return;

    hamburger.addEventListener("click", () => {
      const open = navLinks.classList.toggle("open");
      hamburger.setAttribute("aria-expanded", String(open));
    });

    // Highlight active link
    const path = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".navbar-links a").forEach((a) => {
      const href = a.getAttribute("href") || "";
      if (href === path || (path === "" && href === "index.html")) {
        a.classList.add("active");
      }
    });
  }

  /* ---------- Scroll progress bar ---------- */
  function initScrollProgress() {
    const bar = document.getElementById("scroll-progress");
    if (!bar) return;
    window.addEventListener("scroll", () => {
      const scrolled = document.documentElement.scrollTop;
      const maxScroll =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      bar.style.width = maxScroll > 0 ? (scrolled / maxScroll) * 100 + "%" : "0%";
    }, { passive: true });
  }

  /* ---------- Collapsible sections ---------- */
  function initCollapsibles() {
    document.querySelectorAll(".collapsible-header").forEach((header) => {
      header.addEventListener("click", () => {
        const body = header.nextElementSibling;
        if (!body) return;
        const isOpen = body.classList.toggle("open");
        header.classList.toggle("open", isOpen);
        header.setAttribute("aria-expanded", String(isOpen));
      });
    });
  }

  /* ---------- Sidebar active section tracking ---------- */
  function initSidebarTracking() {
    const links = document.querySelectorAll(".sidebar-nav a[href^='#']");
    if (!links.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            links.forEach((l) => l.classList.remove("active"));
            const id = entry.target.getAttribute("id");
            const match = document.querySelector(`.sidebar-nav a[href="#${id}"]`);
            if (match) match.classList.add("active");
          }
        });
      },
      { rootMargin: "-80px 0px -60% 0px" }
    );

    links.forEach((l) => {
      const id = l.getAttribute("href").substring(1);
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
  }

  /* ---------- Toast helper ---------- */
  window.showToast = function (msg, duration = 3000) {
    let toast = document.getElementById("toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast";
      toast.className = "toast";
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.remove("show"), duration);
  };

  /* ---------- Smooth-scroll for anchor links ---------- */
  function initSmoothScroll() {
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a[href^='#']");
      if (!a) return;
      const id = a.getAttribute("href").substring(1);
      const el = document.getElementById(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  /* ---------- Init on DOM ready ---------- */
  function init() {
    initTheme();
    initNavbar();
    initScrollProgress();
    initCollapsibles();
    initSidebarTracking();
    initSmoothScroll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
