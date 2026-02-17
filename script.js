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
    const focusableSelector = "a[href], button:not([disabled]), textarea, input, select";
    let previousFocus = null;

    function isDesktop() {
      return window.matchMedia("(min-width: 860px)").matches;
    }

    function lockBodyScroll(lock) {
      document.body.classList.toggle("nav-open", lock);
    }

    function openMenu() {
      if (!menuButton || !nav || isDesktop()) return;
      previousFocus = document.activeElement;
      nav.dataset.open = "true";
      menuButton.setAttribute("aria-expanded", "true");
      lockBodyScroll(true);
      const focusable = nav.querySelectorAll(focusableSelector);
      if (focusable.length) {
        focusable[0].focus();
      }
    }

    function closeMenu(returnFocus = false) {
      if (!menuButton || !nav) return;
      nav.dataset.open = "false";
      menuButton.setAttribute("aria-expanded", "false");
      lockBodyScroll(false);
      if (returnFocus && previousFocus instanceof HTMLElement) {
        previousFocus.focus();
      }
    }

    function trapFocus(event) {
      if (!nav || nav.dataset.open !== "true" || event.key !== "Tab") return;
      const focusable = Array.from(nav.querySelectorAll(focusableSelector));
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement;

      if (event.shiftKey && current === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    }

    if (menuButton && nav) {
      menuButton.addEventListener("click", () => {
        const isOpen = nav.dataset.open === "true";
        if (isOpen) {
          closeMenu(true);
        } else {
          openMenu();
        }
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
        if (!nav.contains(target) && !menuButton.contains(target)) {
          closeMenu(false);
        }
      });

      window.addEventListener("resize", () => {
        if (isDesktop()) {
          nav.dataset.open = "false";
          menuButton.setAttribute("aria-expanded", "false");
          lockBodyScroll(false);
        }
      });
    }

    const revealElements = Array.from(document.querySelectorAll(".reveal"));
    if ("IntersectionObserver" in window && revealElements.length) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("in");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12 }
      );
      revealElements.forEach((item) => observer.observe(item));
    } else {
      revealElements.forEach((item) => item.classList.add("in"));
    }

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

        const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (!emailValid) {
          statusText.textContent = "Please enter a valid email address.";
          return;
        }

        const subject = encodeURIComponent(`DockGenix inquiry: ${projectType} (${organization})`);
        const body = encodeURIComponent(
          `Name: ${name}\n` +
          `Email: ${email}\n` +
          `Organization: ${organization}\n` +
          `Project type: ${projectType}\n\n` +
          `Project brief:\n${message}`
        );

        const mailtoUrl = `mailto:info@dockgenix.in?subject=${subject}&body=${body}`;
        statusText.textContent = "Opening your email client. If it does not open, email info@dockgenix.in directly.";

        try {
          window.location.href = mailtoUrl;
          window.setTimeout(() => {
            statusText.textContent = "If your email client did not open, please send your inquiry manually to info@dockgenix.in.";
          }, 1400);
        } catch (error) {
          statusText.textContent = "Could not open your email client. Please send your request to info@dockgenix.in.";
        }
      });
    }
  });
})();
