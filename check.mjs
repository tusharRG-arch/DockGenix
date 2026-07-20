import { access, readFile } from "node:fs/promises";
import { dirname, join, normalize } from "node:path";
import { pages } from "./src/data/pages.mjs";

const root = process.cwd();
const errors = [];

function outputPath(route) {
  if (route === "/") return "index.html";
  if (route === "/404.html") return "404.html";
  return join(route.slice(1), "index.html");
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

for (const page of pages) {
  const relative = outputPath(page.route);
  const file = join(root, relative);
  if (!(await exists(file))) {
    errors.push(`${relative}: generated page is missing`);
    continue;
  }

  const html = await readFile(file, "utf8");
  const h1Count = (html.match(/<h1(?:\s|>)/g) || []).length;
  if (h1Count !== 1) errors.push(`${relative}: expected one h1, found ${h1Count}`);
  if (!/<title>[^<]+<\/title>/.test(html)) errors.push(`${relative}: missing title`);
  if (!/<meta name="description" content="[^"]+">/.test(html)) errors.push(`${relative}: missing description`);
  if (!/<main id="main-content">/.test(html)) errors.push(`${relative}: missing main landmark`);
  if (html.includes("YOUR_WEB3FORMS_ACCESS_KEY")) errors.push(`${relative}: placeholder form key remains`);
  if (/<[^>]+\sstyle=/.test(html)) errors.push(`${relative}: inline style attribute found`);

  for (const match of html.matchAll(/<a\b([^>]*?)target="_blank"([^>]*)>/g)) {
    if (!/rel="[^"]*noopener[^"]*"/.test(`${match[1]} ${match[2]}`)) {
      errors.push(`${relative}: target=_blank link lacks noopener`);
    }
  }

  for (const match of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
    const raw = match[1].split(/[?#]/)[0];
    if (!raw || raw === "/") continue;
    const target = raw.endsWith("/") ? join(root, raw.slice(1), "index.html") : join(root, raw.slice(1));
    if (!(await exists(normalize(target)))) errors.push(`${relative}: unresolved internal reference ${raw}`);
  }
}

for (const required of ["styles.css", "script.js", "robots.txt", "sitemap.xml", "CNAME"]) {
  if (!(await exists(join(root, required)))) errors.push(`${required}: required deployment file is missing`);
}

const sitemap = await readFile(join(root, "sitemap.xml"), "utf8");
for (const page of pages.filter((item) => !item.noindex && item.route !== "/404.html")) {
  const expected = `<loc>https://dockgenix.in${page.route}</loc>`;
  if (!sitemap.includes(expected)) errors.push(`sitemap.xml: missing ${page.route}`);
}
if (sitemap.includes("404.html")) errors.push("sitemap.xml: 404 page must not be indexed");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Checked ${pages.length} pages: headings, metadata, links, assets, and placeholders pass.`);
}
