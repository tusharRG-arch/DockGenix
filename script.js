(() => {
  const header = document.querySelector("[data-header]");
  const menu = document.querySelector("[data-menu]");
  const toggle = document.querySelector("[data-menu-toggle]");
  const label = document.querySelector("[data-menu-label]");
  const progress = document.querySelector("[data-scroll-progress]");

  if (header && menu && toggle && label) {
    header.dataset.enhanced = "true";
    toggle.hidden = false;
    menu.dataset.open = "false";
    let previousFocus = null;

    const focusableSelector = "a[href], button:not([disabled])";
    const isDesktop = () => window.matchMedia("(min-width: 860px)").matches;

    function setMenu(open, returnFocus = false) {
      menu.dataset.open = String(open);
      toggle.setAttribute("aria-expanded", String(open));
      label.textContent = open ? "Close menu" : "Open menu";
      document.body.classList.toggle("menu-open", open);

      for (const sibling of [document.querySelector("main"), document.querySelector("footer")]) {
        if (!sibling) continue;
        if (open) sibling.setAttribute("inert", "");
        else sibling.removeAttribute("inert");
      }

      if (open) {
        previousFocus = document.activeElement;
        window.requestAnimationFrame(() => menu.querySelector(focusableSelector)?.focus());
      } else if (returnFocus && previousFocus instanceof HTMLElement) {
        previousFocus.focus();
      }
    }

    toggle.addEventListener("click", () => setMenu(menu.dataset.open !== "true", true));
    menu.addEventListener("click", (event) => {
      if (!isDesktop() && event.target instanceof HTMLAnchorElement) setMenu(false);
    });

    document.addEventListener("keydown", (event) => {
      if (menu.dataset.open !== "true") return;
      if (event.key === "Escape") {
        setMenu(false, true);
        return;
      }
      if (event.key !== "Tab") return;
      const items = [toggle, ...menu.querySelectorAll(focusableSelector)];
      const first = items[0];
      const last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    document.addEventListener("click", (event) => {
      if (isDesktop() || menu.dataset.open !== "true" || !(event.target instanceof Node)) return;
      if (!header.contains(event.target)) setMenu(false);
    });

    window.addEventListener("resize", () => {
      if (isDesktop() && menu.dataset.open === "true") setMenu(false);
    });
  }

  const path = window.location.pathname.replace(/index\.html$/, "");
  for (const link of document.querySelectorAll(".primary-nav a[href]")) {
    const linkPath = new URL(link.href).pathname;
    const isCurrent = linkPath === path || (linkPath !== "/" && path.startsWith(linkPath));
    if (isCurrent) link.setAttribute("aria-current", "page");
  }

  if (header) {
    let scrollFrame = 0;
    const updateHeader = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 12);
      if (progress) {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const ratio = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
        progress.style.transform = `scaleX(${ratio})`;
      }
      scrollFrame = 0;
    };
    updateHeader();
    window.addEventListener("scroll", () => {
      if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateHeader);
    }, { passive: true });
  }
})();
