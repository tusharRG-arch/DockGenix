(() => {
  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
      return;
    }
    fn();
  }

  onReady(() => {
    const menuButton = document.getElementById("menu-toggle");
    const nav = document.getElementById("primary-nav");
    const navLinks = nav ? Array.from(nav.querySelectorAll("a")) : [];
    const contactForm = document.getElementById("contact-form");
    const statusText = document.getElementById("form-status");
    const header = document.querySelector(".site-header");
    const focusableSelector = "a[href], button:not([disabled]), textarea, input, select";
    let previousFocus = null;

    function isDesktop() {
      return window.matchMedia("(min-width: 860px)").matches;
    }

    function lockBodyScroll(lock) {
      document.body.classList.toggle("nav-open", lock);
    }

    // --- Mobile Menu ---
    function openMenu() {
      if (!menuButton || !nav || isDesktop()) return;
      previousFocus = document.activeElement;
      nav.dataset.open = "true";
      menuButton.setAttribute("aria-expanded", "true");
      lockBodyScroll(true);
      const focusable = nav.querySelectorAll(focusableSelector);
      if (focusable.length) focusable[0].focus();
    }

    function closeMenu(returnFocus) {
      if (!menuButton || !nav) return;
      nav.dataset.open = "false";
      menuButton.setAttribute("aria-expanded", "false");
      lockBodyScroll(false);
      if (returnFocus && previousFocus instanceof HTMLElement) previousFocus.focus();
    }

    function trapFocus(event) {
      if (!nav || nav.dataset.open !== "true" || event.key !== "Tab") return;
      const focusable = Array.from(nav.querySelectorAll(focusableSelector));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    if (menuButton && nav) {
      menuButton.addEventListener("click", () => {
        nav.dataset.open === "true" ? closeMenu(true) : openMenu();
      });

      navLinks.forEach((link) => {
        link.addEventListener("click", () => {
          if (!isDesktop()) closeMenu(false);
        });
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && nav.dataset.open === "true") {
          closeMenu(true);
          return;
        }
        trapFocus(event);
      });

      document.addEventListener("click", (event) => {
        if (isDesktop() || nav.dataset.open !== "true") return;
        const target = event.target;
        if (!(target instanceof Node)) return;
        if (!nav.contains(target) && !menuButton.contains(target)) closeMenu(false);
      });

      window.addEventListener("resize", () => {
        if (isDesktop()) {
          nav.dataset.open = "false";
          menuButton.setAttribute("aria-expanded", "false");
          lockBodyScroll(false);
        }
      });
    }

    // --- Header shadow on scroll ---
    if (header) {
      let ticking = false;
      window.addEventListener("scroll", () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            header.style.boxShadow = window.scrollY > 20
              ? "0 4px 24px rgba(16, 24, 40, 0.08)"
              : "none";
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });
    }

    // --- Active nav link highlight ---
    const sections = document.querySelectorAll("section[id]");
    if (sections.length && navLinks.length) {
      const observerNav = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const id = entry.target.getAttribute("id");
              navLinks.forEach((link) => {
                const isActive = link.getAttribute("href") === "#" + id;
                link.style.color = isActive ? "#c4944e" : "";
              });
            }
          });
        },
        { rootMargin: "-30% 0px -60% 0px" }
      );
      sections.forEach((s) => observerNav.observe(s));
    }

    // --- Reveal on scroll ---
    const revealElements = Array.from(document.querySelectorAll(".reveal"));
    if ("IntersectionObserver" in window && revealElements.length) {
      let revealIndex = 0;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.style.transitionDelay = (revealIndex % 4) * 0.08 + "s";
              entry.target.classList.add("in");
              observer.unobserve(entry.target);
              revealIndex++;
            }
          });
        },
        { threshold: 0.08 }
      );
      revealElements.forEach((item) => observer.observe(item));
    } else {
      revealElements.forEach((item) => item.classList.add("in"));
    }

    // --- Contact form ---
    if (contactForm && statusText) {
      contactForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const formData = new FormData(contactForm);
        const name = String(formData.get("name") || "").trim();
        const email = String(formData.get("email") || "").trim();
        const organization = String(formData.get("organization") || "").trim();
        const projectType = String(formData.get("projectType") || "").trim();
        const message = String(formData.get("message") || "").trim();

        if (!name || !email || !organization || !projectType || !message) {
          statusText.textContent = "Please complete all required fields before submitting.";
          return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          statusText.textContent = "Please enter a valid email address.";
          return;
        }

        const subject = encodeURIComponent("DockGenix inquiry: " + projectType + " (" + organization + ")");
        const body = encodeURIComponent(
          "Name: " + name + "\n" +
          "Email: " + email + "\n" +
          "Organization: " + organization + "\n" +
          "Service Area: " + projectType + "\n\n" +
          "Project Brief:\n" + message
        );

        statusText.textContent = "Opening your email client...";

        try {
          window.location.href = "mailto:info@dockgenix.in?subject=" + subject + "&body=" + body;
          window.setTimeout(() => {
            statusText.textContent = "If your email client did not open, please send your inquiry to info@dockgenix.in.";
          }, 1400);
        } catch (error) {
          statusText.textContent = "Could not open your email client. Please email info@dockgenix.in directly.";
        }
      });
    }
  });
})();
