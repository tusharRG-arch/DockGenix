# DockGenix Website

Dependency-free static website for `https://dockgenix.in/`.

## Requirements

- Node.js 20 or newer

No package installation is required.

## Commands

```bash
npm run build
npm run check
```

`npm run build` assembles the shared files in `src/partials/` with page content from `src/pages/`. It writes deployable HTML directly to the repository root and route directories, and regenerates `sitemap.xml`.

`npm run check` verifies generated routes, H1 usage, metadata, internal references, deployment files, external-link safety, and known placeholder form keys.

## Content Model

- `src/data/pages.mjs`: route and metadata registry
- `src/partials/`: shared document shell, header, and footer
- `src/pages/`: page-specific HTML content
- `styles.css`: global design system and responsive layouts
- `script.js`: mobile navigation, active routes, and header state

Generated HTML is committed because the current production origin serves the repository's static files directly.

## Safety Boundaries

- Do not add unverified clients, outcomes, facilities, instruments, credentials, certifications, or regulatory claims.
- Do not enable an online project-intake form until a reviewed endpoint, retention policy, abuse controls, and privacy notice are configured.
- Do not label MetaboAgent as live until automated health checks confirm availability.
- Preserve existing public URLs or add direct edge redirects before changing them.

See `DEPLOYMENT.md` for production requirements that are controlled outside this repository.
