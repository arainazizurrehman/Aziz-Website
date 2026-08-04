/**
 * Aziz Ur Rehman — Portfolio interactions
 * Premium motion layer + nav, reveals, count-up, modal
 */

(function () {
  "use strict";

  const reducedMotion =
    typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch =
    matchMedia("(hover: none) and (pointer: coarse)").matches ||
    "ontouchstart" in window;
  const isMobileViewport = () =>
    window.innerWidth <= 1024 || isTouch;

  /* ---------- Ambient morphing gradient mesh (CSS blobs) ---------- */
  (function injectAmbientMesh() {
    if (document.querySelector(".ambient-mesh")) return;
    // Mobile: skip animated mesh — too expensive while scrolling
    if (isMobileViewport()) return;
    const mesh = document.createElement("div");
    mesh.className = "ambient-mesh";
    mesh.setAttribute("aria-hidden", "true");
    for (let i = 1; i <= 4; i++) {
      const b = document.createElement("div");
      b.className = "ambient-mesh__blob ambient-mesh__blob--" + i;
      mesh.appendChild(b);
    }
    const grain = document.querySelector(".grain");
    if (grain && grain.parentNode === document.body) {
      document.body.insertBefore(mesh, grain);
    } else {
      document.body.prepend(mesh);
    }
  })();

  /* ---------- Full-page wave lines + ambient particles (canvas) ---------- */
  (function initFlowBg() {
    document.querySelectorAll(".ambient").forEach(function (el) {
      el.remove();
    });

    // Mobile: no continuous canvas — major scroll/jank fix
    if (isMobileViewport() || reducedMotion) {
      const existing = document.getElementById("flow-bg");
      if (existing) existing.remove();
      return;
    }

    let canvas = document.getElementById("flow-bg");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "flow-bg";
      canvas.setAttribute("aria-hidden", "true");
      const mesh = document.querySelector(".ambient-mesh");
      if (mesh && mesh.parentNode) {
        mesh.after(canvas);
      } else {
        document.body.prepend(canvas);
      }
    }

    const ctx = canvas.getContext("2d");
    let w = 0;
    let h = 0;
    let dpr = 1;
    let scrollFade = 1;
    let t = 0;
    let raf = 0;
    let particles = [];
    let scrollPending = false;

    const LINES = 28;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.width = Math.floor(innerWidth * dpr);
      h = canvas.height = Math.floor(innerHeight * dpr);
      canvas.style.width = innerWidth + "px";
      canvas.style.height = innerHeight + "px";
      seedParticles();
    }

    function updateScrollFade() {
      const heroH = Math.max(innerHeight * 0.85, 1);
      const p = Math.min(window.scrollY / heroH, 1);
      scrollFade = 1 - p * 0.55;
    }

    const rand = function (x, y) {
      const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
      return s - Math.floor(s);
    };

    function noise(x, y) {
      const xi = Math.floor(x);
      const yi = Math.floor(y);
      const xf = x - xi;
      const yf = y - yi;
      const a = rand(xi, yi);
      const b = rand(xi + 1, yi);
      const c = rand(xi, yi + 1);
      const d = rand(xi + 1, yi + 1);
      const u = xf * xf * (3 - 2 * xf);
      const v = yf * yf * (3 - 2 * yf);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    }

    function seedParticles() {
      const count = 48;
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: (0.6 + Math.random() * 1.4) * dpr,
          vx: (Math.random() - 0.5) * 0.15 * dpr,
          vy: (Math.random() - 0.5) * 0.12 * dpr,
          a: 0.08 + Math.random() * 0.18,
          hue: 265 + Math.random() * 80,
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      const step = 24 * dpr;
      const amp = 70 * dpr;
      const baseAlpha = 0.2 * scrollFade;

      for (let i = 0; i < LINES; i++) {
        const py = (i / LINES) * h;
        const hue = 265 + (i / LINES) * 100;
        const edgeFade = Math.max(1 - Math.abs(i / LINES - 0.5) * 1.4, 0);
        const alpha = edgeFade * baseAlpha;
        if (alpha < 0.01) continue;

        ctx.beginPath();
        for (let x = 0; x <= w; x += step) {
          const n = noise(x * 0.0025, i * 0.35 + t);
          const y = py + n * amp - amp * 0.5;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = "hsla(" + hue + ", 85%, 65%, " + alpha + ")";
        ctx.lineWidth = 1.15 * dpr;
        ctx.lineJoin = "round";
        ctx.stroke();
      }

      const pAlpha = scrollFade;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
        ctx.beginPath();
        ctx.fillStyle =
          "hsla(" + p.hue + ", 90%, 70%, " + p.a * pAlpha * 0.85 + ")";
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      t += 0.0018;
      raf = requestAnimationFrame(draw);
    }

    function start() {
      if (raf) cancelAnimationFrame(raf);
      updateScrollFade();
      raf = requestAnimationFrame(draw);
    }

    resize();
    start();
    addEventListener("resize", function () {
      if (isMobileViewport()) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        if (canvas && canvas.parentNode) canvas.remove();
        return;
      }
      resize();
    });
    // Scroll fade only — throttled; never redraw from scroll handler
    addEventListener(
      "scroll",
      function () {
        if (scrollPending) return;
        scrollPending = true;
        requestAnimationFrame(function () {
          updateScrollFade();
          scrollPending = false;
        });
      },
      { passive: true }
    );
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      } else if (!isMobileViewport()) {
        start();
      }
    });
  })();

  /* ---------- Core UI ---------- */
  const nav = document.getElementById("nav");
  const navToggle = document.getElementById("navToggle");
  const navMobile = document.getElementById("navMobile");
  const yearEl = document.getElementById("year");

  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  // Throttle nav scroll class toggles (avoid work every scroll frame)
  let navScrollPending = false;
  function updateNavScroll() {
    if (!nav) return;
    nav.classList.toggle("is-scrolled", window.scrollY > 24);
  }
  updateNavScroll();
  window.addEventListener(
    "scroll",
    function () {
      if (navScrollPending) return;
      navScrollPending = true;
      requestAnimationFrame(function () {
        updateNavScroll();
        navScrollPending = false;
      });
    },
    { passive: true }
  );

  function setMenuOpen(open) {
    if (!nav || !navToggle || !navMobile) return;
    nav.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (open) {
      navMobile.removeAttribute("hidden");
      document.body.style.overflow = "hidden";
    } else {
      navMobile.setAttribute("hidden", "");
      document.body.style.overflow = "";
    }
  }

  if (navToggle) {
    navToggle.addEventListener("click", function () {
      setMenuOpen(!nav.classList.contains("is-open"));
    });
  }
  if (navMobile) {
    navMobile.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setMenuOpen(false);
      });
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (e) {
      const id = anchor.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.pushState(null, "", id);
    });
  });

  /* ---------- 3D tilt on profile photo ---------- */
  (function initPhotoTilt() {
    const card = document.querySelector(".photo-card");
    if (!card || reducedMotion || isTouch) return;

    const max = 9;

    card.addEventListener("mousemove", function (e) {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      const rx = (-py * max * 2).toFixed(2);
      const ry = (px * max * 2).toFixed(2);
      card.classList.add("is-tilting");
      card.style.transform =
        "perspective(900px) rotateX(" +
        rx +
        "deg) rotateY(" +
        ry +
        "deg) scale3d(1.02,1.02,1.02)";
    });

    card.addEventListener("mouseleave", function () {
      card.classList.remove("is-tilting");
      card.style.transform =
        "perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
    });
  })();

  /* ---------- Magnetic primary CTAs ---------- */
  (function initMagnetic() {
    if (reducedMotion || isTouch) return;
    const magnets = document.querySelectorAll(
      ".btn--primary, .btn--gradient, .btn--outline, a.btn--primary, a.btn--gradient, a.btn--outline"
    );
    const strength = 0.28;
    const radius = 70;

    magnets.forEach(function (btn) {
      // Skip float-wa (not primary magnetic intent) if needed — user asked for CTA buttons
      if (btn.classList.contains("float-wa")) return;

      btn.addEventListener("mousemove", function (e) {
        const r = btn.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > radius * 1.6) {
          btn.style.transform = "";
          return;
        }
        const pull = Math.max(0, 1 - dist / (radius * 1.6));
        const tx = (dx * strength * pull).toFixed(2);
        const ty = (dy * strength * pull).toFixed(2);
        btn.style.transform =
          "translate3d(" + tx + "px, " + ty + "px, 0) scale(1.03)";
      });

      btn.addEventListener("mouseleave", function () {
        btn.style.transform = "";
      });
    });
  })();

  /* ---------- Scroll reveal — once only + stagger ---------- */
  const revealEls = document.querySelectorAll(".reveal");

  // Direction + stagger within grids
  document.querySelectorAll("section").forEach(function (section, sectionIndex) {
    const items = section.querySelectorAll(".reveal");
    items.forEach(function (el, itemIndex) {
      if (
        !el.classList.contains("reveal--left") &&
        !el.classList.contains("reveal--right")
      ) {
        const fromLeft = (sectionIndex + itemIndex) % 2 === 0;
        el.classList.add(fromLeft ? "reveal--left" : "reveal--right");
      }
      // Stagger card groups (service cards, portfolio, timeline, etc.)
      if (
        el.classList.contains("service-card") ||
        el.classList.contains("portfolio-card") ||
        el.closest(".services-grid") ||
        el.closest(".portfolio-grid") ||
        el.closest(".timeline") ||
        el.closest(".certs__grid")
      ) {
        el.setAttribute("data-stagger", String(Math.min(itemIndex, 7)));
      }
    });
  });

  // Also stagger grids of reveals that share a parent
  document
    .querySelectorAll(".services-grid, .portfolio-grid, .timeline, .certs__grid")
    .forEach(function (grid) {
      grid.querySelectorAll(".reveal").forEach(function (el, i) {
        el.setAttribute("data-stagger", String(Math.min(i, 7)));
      });
    });

  if (reducedMotion) {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else if ("IntersectionObserver" in window && revealEls.length) {
    // Mobile/tablet: trigger earlier so fade is clearly felt while scrolling
    const mobileReveal = window.matchMedia("(max-width: 1024px)").matches;
    const revealOpts = mobileReveal
      ? { threshold: 0.01, rootMargin: "120px 0px 60px 0px" }
      : { threshold: 0.12, rootMargin: "0px 0px -40px 0px" };

    const revealObs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          // Re-trigger every enter: remove when leaving, add when entering
          entry.target.classList.toggle("is-visible", entry.isIntersecting);
        });
      },
      revealOpts
    );
    revealEls.forEach(function (el) {
      revealObs.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ---------- Count-up ($25,000) — replays every time it enters viewport ---------- */
  const COUNTUP_DURATION = reducedMotion ? 0 : 1500;

  function formatNumber(n) {
    return Math.round(n).toLocaleString("en-US");
  }

  function cancelCountUp(el) {
    if (el._countupRaf != null) {
      cancelAnimationFrame(el._countupRaf);
      el._countupRaf = null;
    }
  }

  function startCountUp(el) {
    cancelCountUp(el);
    const target = parseInt(el.getAttribute("data-target") || "0", 10);
    if (COUNTUP_DURATION <= 0) {
      el.textContent = formatNumber(target);
      return;
    }
    const start = performance.now();
    el.textContent = formatNumber(0);
    function frame(now) {
      const progress = Math.min((now - start) / COUNTUP_DURATION, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      el.textContent = formatNumber(target * eased);
      if (progress < 1) {
        el._countupRaf = requestAnimationFrame(frame);
      } else {
        el.textContent = formatNumber(target);
        el._countupRaf = null;
      }
    }
    el._countupRaf = requestAnimationFrame(frame);
  }

  function resetCountUp(el) {
    cancelCountUp(el);
    el.textContent = formatNumber(0);
  }

  // Separate observer from .reveal — re-triggers on every enter/exit
  const countEls = document.querySelectorAll(".countup");
  if ("IntersectionObserver" in window && countEls.length) {
    const countObs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            startCountUp(entry.target);
          } else {
            resetCountUp(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    countEls.forEach(function (el) {
      countObs.observe(el); // never unobserve
    });
  } else {
    countEls.forEach(function (el) {
      startCountUp(el);
    });
  }

  /* ---------- Expandable AI sub-service cards ---------- */
  document.querySelectorAll("[data-expand]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const isOpen = btn.classList.contains("is-open");
      const grid = btn.closest(".subservice-grid");
      if (grid) {
        grid.querySelectorAll("[data-expand].is-open").forEach(function (openBtn) {
          if (openBtn !== btn) {
            openBtn.classList.remove("is-open");
            openBtn.setAttribute("aria-expanded", "false");
          }
        });
      }
      btn.classList.toggle("is-open", !isOpen);
      btn.setAttribute("aria-expanded", !isOpen ? "true" : "false");
    });
  });

  /* ---------- Certificate lightbox ---------- */
  const certModal = document.getElementById("certModal");
  const certOpen = document.getElementById("certOpen");

  function openCertModal() {
    if (!certModal) return;
    certModal.hidden = false;
    certModal.setAttribute("aria-hidden", "false");
    void certModal.offsetWidth;
    certModal.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function closeCertModal() {
    if (!certModal) return;
    certModal.classList.remove("is-open");
    certModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    const onEnd = function (e) {
      if (e.target !== certModal) return;
      if (!certModal.classList.contains("is-open")) {
        certModal.hidden = true;
      }
      certModal.removeEventListener("transitionend", onEnd);
    };
    certModal.addEventListener("transitionend", onEnd);
  }

  if (certOpen) {
    certOpen.addEventListener("click", openCertModal);
  }
  if (certModal) {
    certModal.querySelectorAll("[data-cert-close]").forEach(function (el) {
      el.addEventListener("click", closeCertModal);
    });
  }

  window.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (certModal && certModal.classList.contains("is-open")) {
        closeCertModal();
      }
      setMenuOpen(false);
    }
  });
})();
