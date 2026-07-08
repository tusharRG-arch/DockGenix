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

    // --- Active nav link highlight (multi-page, pathname-based) ---
    if (navLinks.length) {
      const normalize = (path) => {
        let p = path.replace(/index\.html?$/i, "");
        if (!p.endsWith("/")) p += "/";
        return p;
      };
      const here = normalize(window.location.pathname);
      navLinks.forEach((link) => {
        let linkPath;
        try {
          linkPath = normalize(new URL(link.href).pathname);
        } catch (error) {
          return;
        }
        if (linkPath === here) link.setAttribute("aria-current", "page");
      });
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

    // --- Contact form (Web3Forms delivery with mailto fallback) ---
    if (contactForm && statusText) {
      const submitButton = contactForm.querySelector('button[type="submit"]');

      function buildMailto(fields) {
        const subject = encodeURIComponent(
          "DockGenix inquiry: " + fields.projectType + " (" + fields.organization + ")"
        );
        const body = encodeURIComponent(
          "Name: " + fields.name + "\n" +
          "Email: " + fields.email + "\n" +
          "Organization: " + fields.organization + "\n" +
          "Service Area: " + fields.projectType + "\n\n" +
          "Project Brief:\n" + fields.message
        );
        return "mailto:info@dockgenix.in?subject=" + subject + "&body=" + body;
      }

      contactForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(contactForm);
        const fields = {
          name: String(formData.get("name") || "").trim(),
          email: String(formData.get("email") || "").trim(),
          organization: String(formData.get("organization") || "").trim(),
          projectType: String(formData.get("projectType") || "").trim(),
          message: String(formData.get("message") || "").trim(),
        };

        if (!fields.name || !fields.email || !fields.organization || !fields.projectType || !fields.message) {
          statusText.textContent = "Please complete all required fields before submitting.";
          return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
          statusText.textContent = "Please enter a valid email address.";
          return;
        }

        statusText.textContent = "Sending your inquiry...";
        if (submitButton) submitButton.disabled = true;

        try {
          const response = await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            headers: { Accept: "application/json" },
            body: formData,
          });
          const data = await response.json().catch(() => ({}));

          if (response.ok && data.success) {
            statusText.textContent = "Thank you — your inquiry has been sent. We will respond shortly.";
            contactForm.reset();
          } else {
            throw new Error(data.message || "Submission failed");
          }
        } catch (error) {
          statusText.textContent = "We could not send it automatically — opening your email client as a fallback...";
          try {
            window.location.href = buildMailto(fields);
          } catch (mailError) {
            statusText.textContent = "Please email your inquiry directly to info@dockgenix.in.";
          }
        } finally {
          if (submitButton) submitButton.disabled = false;
        }
      });
    }
  });
})();
