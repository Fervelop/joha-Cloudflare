/* Construye el sitio en dist/ para Cloudflare Pages.
   - copia public/ (página, panel, fotos, textos y ajustes)
   - compila el catálogo (tipos y productos) en dist/data/
   - completa la dirección del sitio en las etiquetas para compartir, robots y sitemap
   Comando de compilación en Cloudflare: npm run build   ·   Carpeta de salida: dist */
"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const RAIZ = path.join(__dirname, "..");
const DIST = path.join(RAIZ, "dist");
const SITE_URL = String(process.env.SITE_URL || "https://joha-cloudflare.pages.dev").replace(/\/+$/, "");
if (!/^https:\/\/[a-z0-9.-]+$/i.test(SITE_URL)) throw new Error(`SITE_URL no válida: ${SITE_URL}`);

fs.rmSync(DIST, { recursive: true, force: true });
fs.cpSync(path.join(RAIZ, "public"), DIST, { recursive: true });

execFileSync(process.execPath, [path.join(__dirname, "compilar.js"), DIST], { stdio: "inherit" });

const reemplazar = f => {
  const p = path.join(DIST, f);
  fs.writeFileSync(p, fs.readFileSync(p, "utf8").replace(/%%SITE_URL%%/g, SITE_URL));
};
reemplazar("index.html");
fs.writeFileSync(path.join(DIST, "robots.txt"), `User-agent: *\nDisallow: /admin/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
fs.writeFileSync(path.join(DIST, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${SITE_URL}/</loc></url></urlset>\n`);

console.log(`Sitio listo en dist/ para ${SITE_URL}`);
