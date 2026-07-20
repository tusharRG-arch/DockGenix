import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { pages } from "./src/data/pages.mjs";

const root = process.cwd();
const read = (path) => readFile(join(root, path), "utf8");
const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll('"', "&quot;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");

function outputPath(route) {
  if (route === "/") return "index.html";
  if (route === "/404.html") return "404.html";
  return join(route.slice(1), "index.html");
}

function schemaFor(page) {
  const graph = [];

  if (page.route === "/") {
    graph.push({
      "@type": "Organization",
      "@id": "https://dockgenix.in/#organization",
      name: "DockGenix",
      url: "https://dockgenix.in/",
      logo: "https://dockgenix.in/assets/dockgenix_logo.png",
      email: "info@dockgenix.in",
      slogan: "In Silico to Wet Lab"
    }, {
      "@type": "WebSite",
      "@id": "https://dockgenix.in/#website",
      name: "DockGenix",
      url: "https://dockgenix.in/",
      publisher: { "@id": "https://dockgenix.in/#organization" }
    });
  }

  if (page.breadcrumbs?.length) {
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: page.breadcrumbs.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: `https://dockgenix.in${item.route}`
      }))
    });
  }

  if (page.schemaType) {
    graph.push({
      "@type": page.schemaType,
      name: page.title,
      description: page.description,
      url: `https://dockgenix.in${page.route}`
    });
  }

  return graph.length
    ? `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": graph })}</script>`
    : "";
}

function render(template, values) {
  return template.replace(/\{\{([a-zA-Z]+)\}\}/g, (_, key) => values[key] ?? "");
}

const [layout, header, footer] = await Promise.all([
  read("src/partials/layout.html"),
  read("src/partials/header.html"),
  read("src/partials/footer.html")
]);

for (const page of pages) {
  const content = await read(`src/pages/${page.file}`);
  const canonical = page.route === "/404.html" ? "" : `https://dockgenix.in${page.route}`;
  const html = render(layout, {
    title: escapeHtml(page.title),
    description: escapeHtml(page.description),
    canonical: canonical ? `<link rel="canonical" href="${canonical}">` : "",
    robots: page.noindex ? '<meta name="robots" content="noindex, follow">' : "",
    ogUrl: canonical || "https://dockgenix.in/404.html",
    header,
    content,
    footer,
    schema: schemaFor(page)
  });
  const destination = join(root, outputPath(page.route));
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, html, "utf8");
}

const sitemapRoutes = pages.filter((page) => !page.noindex && page.route !== "/404.html");
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapRoutes.map((page) => `  <url>
    <loc>https://dockgenix.in${page.route}</loc>
    <lastmod>2026-07-15</lastmod>
  </url>`).join("\n")}
</urlset>
`;
await writeFile(join(root, "sitemap.xml"), sitemap, "utf8");

console.log(`Built ${pages.length} static pages.`);
