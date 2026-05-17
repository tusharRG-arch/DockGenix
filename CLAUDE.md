 
```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```

Deploys happen automatically when `main` is pushed to GitHub (Pages builds from the repo root).

## Architecture

The site is three files plus assets — keep it that way unless there's a reason not to.

- **`index.html`** — single-page site. All content lives here as in-page sections anchored by `id` (`#about`, `#services`, `#engine`, `#offers`, `#metaboagent`, `#industries`, `#library`, `#proof`, `#team`, `#contact`). The header nav in `#primary-nav` links to these anchors; if you add or rename a section, update both the nav and any in-page links. JSON-LD `Organization` / `WebSite` schema sits in the `<head>` — keep it in sync with visible copy (name, URL, description, foundingDate).
- **`styles.css`** — hand-rolled design system. Tokens are CSS custom properties on `:root` (accent copper/gold `--accent: #c4944e`, dark/light palettes, radius scale, `--section-pad`). Two surface modes — default light and `.section-dark` (also `.section-soft`) — and many components override colours under `.section-dark` (e.g. `.section-dark .overline`, `.section-dark .btn-outline`). When adding a component used on dark backgrounds, add the matching `.section-dark` override.
- **`script.js`** — single IIFE, vanilla JS, no dependencies. Wires up: mobile menu (focus trap + `body.nav-open` scroll lock + Escape/outside-click close), header shadow on scroll, IntersectionObserver-based active-nav highlight, `.reveal` scroll-in animation (toggled via the `.in` class with a staggered `transition-delay`), and the contact form. The contact form **does not POST anywhere** — it validates fields, then opens the user's mail client via `mailto:info@dockgenix.in` with a pre-filled subject/body. Status updates go to `#form-status`.
- **`assets/`** — `dockgenix_logo.png`, `DockGenix_Panel.png`. Both are preloaded in the `<head>`; if you rename or remove them, update the `<link rel="preload">` tags and the OG/Twitter `og:image` meta tags too.

### Conventions worth knowing

- The mobile/desktop breakpoint is `860px`, defined in `script.js` (`isDesktop()`) and matched in CSS media queries — change both together.
- Any element with class `.reveal` is picked up by the IntersectionObserver and animated in. Adding new sections? Add `.reveal` to the cards/articles you want to animate.
- The active-nav-link highlight reads `entry.target.getAttribute("id")` and matches `href="#<id>"`. New `section[id]` elements automatically participate; nav links need the matching hash href.
- The MetaboAgent section embeds YouTube via `youtube-nocookie.com` with a visible fallback link — keep that fallback when touching the embed (recent commit `23ca1fe` hardened it).
- Fonts (Inter, Playfair Display) load from Google Fonts via `<link rel="preconnect">` + stylesheet. `--font-display` (Playfair) is for headings; `--font-sans` (Inter) for body.
