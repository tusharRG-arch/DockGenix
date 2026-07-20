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

(() => {
  const svg = document.querySelector(".orbit-diagram");
  if (!svg) return;

  const NS = "http://www.w3.org/2000/svg";
  const CX = 220;
  const CY = 150;

  // Orbital shells, outer -> inner. Slightly different tilt and eccentricity so
  // the set reads as a 3D system on a plane, not flat concentric circles.
  const shells = [
    { rx: 150, ry: 50, rot: -16, period: 58 },
    { rx: 110, ry: 44, rot: -9, period: 46 },
    { rx: 70, ry: 34, rot: -23, period: 34 },
  ];

  // Nodes: shell index, start angle (deg), whether it is an active/accent node,
  // and an optional annotation anchored to that specific node.
  const nodes = [
    { shell: 0, angle: 18, active: true, label: "TARGET" },
    { shell: 0, angle: 205, active: false },
    { shell: 1, angle: 120, active: true, label: "LEAD" },
    { shell: 1, angle: 300, active: false },
    { shell: 2, angle: 80, active: true },
  ];

  const make = (name, attrs) => {
    const node = document.createElementNS(NS, name);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    return node;
  };

  const pointOn = (shell, deg) => {
    const t = (deg * Math.PI) / 180;
    const f = (shell.rot * Math.PI) / 180;
    const x0 = shell.rx * Math.cos(t);
    const y0 = shell.ry * Math.sin(t);
    return {
      x: CX + x0 * Math.cos(f) - y0 * Math.sin(f),
      y: CY + x0 * Math.sin(f) + y0 * Math.cos(f),
    };
  };

  const rings = make("g", {});
  const ticks = make("g", {});
  const back = make("g", {});
  const core = make("g", {});
  const front = make("g", {});
  const labels = make("g", {});
  for (const layer of [rings, ticks, back, core, front, labels]) svg.appendChild(layer);

  for (const shell of shells) {
    rings.appendChild(make("ellipse", {
      class: "orbit-ring",
      cx: CX, cy: CY, rx: shell.rx, ry: shell.ry,
      transform: `rotate(${shell.rot} ${CX} ${CY})`,
    }));
  }

  // Faint tick marks and principal axes on the outer shell only.
  const outer = shells[0];
  for (let deg = 0; deg < 360; deg += 30) {
    const p = pointOn(outer, deg);
    const nx = p.x - CX;
    const ny = p.y - CY;
    const len = Math.hypot(nx, ny) || 1;
    const major = deg % 90 === 0;
    const reach = major ? 7 : 3;
    ticks.appendChild(make("line", {
      class: major ? "orbit-tick orbit-tick--major" : "orbit-tick",
      x1: p.x, y1: p.y,
      x2: p.x + (nx / len) * reach,
      y2: p.y + (ny / len) * reach,
    }));
  }
  for (const [a, b] of [[0, 180], [90, 270]]) {
    const pa = pointOn(outer, a);
    const pb = pointOn(outer, b);
    ticks.appendChild(make("line", { class: "orbit-axis", x1: pa.x, y1: pa.y, x2: pb.x, y2: pb.y }));
  }

  // Central core — the only larger element.
  core.appendChild(make("circle", { class: "orbit-core-ring", cx: CX, cy: CY, r: 11 }));
  core.appendChild(make("circle", { class: "orbit-core", cx: CX, cy: CY, r: 4.6 }));

  const bodies = nodes.map((node) => {
    const dot = make("circle", {
      class: node.active ? "node node--active" : "node node--muted",
      r: node.active ? 3.6 : 3.2, cx: CX, cy: CY,
    });
    let leader = null;
    let label = null;
    if (node.label) {
      leader = make("line", { class: "orbit-leader" });
      label = make("text", { class: "orbit-label", x: CX, y: CY });
      label.textContent = node.label;
      labels.appendChild(leader);
      labels.appendChild(label);
    }
    return { node, dot, leader, label, parent: null };
  });

  const place = (body, deg) => {
    const shell = shells[body.node.shell];
    const p = pointOn(shell, deg);
    body.dot.setAttribute("cx", p.x.toFixed(2));
    body.dot.setAttribute("cy", p.y.toFixed(2));
    // Lower half of a top-down tilt sits nearer the viewer; the far side passes
    // behind the core and dims slightly to read as depth.
    const isFront = p.y >= CY;
    body.dot.setAttribute("opacity", isFront ? "1" : "0.5");
    const target = isFront ? front : back;
    if (body.parent !== target) {
      target.appendChild(body.dot);
      body.parent = target;
    }
    if (body.label) {
      const nx = p.x - CX;
      const ny = p.y - CY;
      const len = Math.hypot(nx, ny) || 1;
      const lx = p.x + (nx / len) * 15;
      const ly = p.y + (ny / len) * 15;
      const toRight = p.x >= CX;
      body.leader.setAttribute("x1", p.x.toFixed(2));
      body.leader.setAttribute("y1", p.y.toFixed(2));
      body.leader.setAttribute("x2", lx.toFixed(2));
      body.leader.setAttribute("y2", ly.toFixed(2));
      body.label.setAttribute("x", (lx + (toRight ? 4 : -4)).toFixed(2));
      body.label.setAttribute("y", (ly + 3).toFixed(2));
      body.label.setAttribute("text-anchor", toRight ? "start" : "end");
    }
  };

  for (const body of bodies) place(body, body.node.angle);

  const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;

  const step = (now) => {
    const t = now / 1000;
    for (const body of bodies) {
      const shell = shells[body.node.shell];
      place(body, body.node.angle + (360 / shell.period) * t);
    }
    window.requestAnimationFrame(step);
  };
  window.requestAnimationFrame(step);
})();
