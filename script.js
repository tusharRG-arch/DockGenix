// DockGenix v2 interactions:
// - Mobile menu
// - Scroll reveal
// - Tabs
// - Animated counters
// - Simple form handler (front-end only)
// - Auto-close mobile menu on scroll

(function () {

  /* =========================
     Mobile menu
  ========================= */
  const menuBtn = document.getElementById("menuBtn");
  const menu = document.getElementById("menu");

  let menuOpen = false;
  let lastScrollTop = 0;

  if (!menuBtn || !menu) return;

  menuBtn.addEventListener("click", () => {
    menuOpen = !menuOpen;
    menu.hidden = !menuOpen;
    menuBtn.setAttribute("aria-expanded", String(menuOpen));
  });

  // Close menu when a link is clicked
  menu.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      menu.hidden = true;
      menuBtn.setAttribute("aria-expanded", "false");
      menuOpen = false;
    });
  });

  /* =========================
     Close mobile menu on scroll
  ========================= */
  window.addEventListener("scroll", () => {
    if (!menuOpen) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > lastScrollTop + 5) {
      // user scrolled down → close menu
      menu.hidden = true;
      menuBtn.setAttribute("aria-expanded", "false");
      menuOpen = false;
    }

    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  });

  /* =========================
     Scroll reveal
  ========================= */
  const revealEls = document.querySelectorAll(".reveal");

  if (revealEls.length) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    revealEls.forEach(el => revealObserver.observe(el));
  }

  /* =========================
     Tabs
  ========================= */
  const tabs = document.querySelectorAll(".tab");
  const panels = document.querySelectorAll(".tabpanel");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const targetId = tab.getAttribute("aria-controls");

      tabs.forEach(t => {
        const active = t === tab;
        t.classList.toggle("active", active);
        t.setAttribute("aria-selected", active ? "true" : "false");
      });

      panels.forEach(panel => {
        panel.classList.toggle("active", panel.id === targetId);
      });
    });
  });

  /* =========================
     Animated counters
  ========================= */
  const counters = document.querySelectorAll("[data-count]");
  let countersRan = false;

  function animateCount(el, to) {
    const duration = 900;
    const start = performance.now();

    function frame(now) {
      const progress = Math.min((now - start) / duration, 1);
      const value = Math.floor(to * progress);
      el.textContent = value + (to === 45 ? "%" : "");
      if (progress < 1) requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  const heroPanel = document.querySelector(".hero-panel");

  if (heroPanel && counters.length) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        if (!countersRan && entries.some(e => e.isIntersecting)) {
          countersRan = true;
          counters.forEach(el => {
            const to = parseInt(el.dataset.count, 10);
            animateCount(el, isNaN(to) ? 0 : to);
          });
          counterObserver.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    counterObserver.observe(heroPanel);
  }

  /* =========================
     Form handler (front-end only)
  ========================= */
  const leadForm = document.getElementById("leadForm");
  const formNote = document.getElementById("formNote");

  if (leadForm && formNote) {
    leadForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const payload = Object.fromEntries(new FormData(leadForm).entries());

      formNote.textContent =
        "Received (front-end demo). Payload: " +
        JSON.stringify(payload);

      leadForm.reset();
    });
  }

})();
