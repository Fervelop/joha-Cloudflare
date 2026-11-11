/* Une las fichas del panel en los archivos que lee la página.
   - content/tipos/*.json     -> <salida>/data/tipos.json
   - content/productos/*.json -> <salida>/data/productos.json
   Lo usa scripts/build.js en cada publicación. Uso directo: node scripts/compilar.js [carpeta-salida] */
"use strict";
const fs = require("fs");
const path = require("path");

const RAIZ = path.join(__dirname, "..");
const SALIDA = path.resolve(process.argv[2] || path.join(RAIZ, "dist"));
const leerCarpeta = dir => {
  const d = path.join(RAIZ, dir);
  if (!fs.existsSync(d)) return [];
  return fs.readdirSync(d).filter(f => f.endsWith(".json")).sort().map(f => {
    try { return { slug: f.replace(/\.json$/, ""), datos: JSON.parse(fs.readFileSync(path.join(d, f), "utf8")) }; }
    catch (e) { console.warn(`Archivo con formato inválido omitido: ${dir}/${f}`); return null; }
  }).filter(Boolean);
};
// Rutas de imagen propias del sitio (se aceptan nombres con mayúsculas, espacios codificados, etc.)
const IMG = /^\/images\/[^"'<>?#\\]+\.(png|jpe?g|webp|avif|gif)$/i;
const okImg = s => typeof s === "string" && IMG.test(s) && !s.includes("..");
const num = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);

/* ---------- tipos ---------- */
const tipos = leerCarpeta("content/tipos").map(({ slug, datos }) => ({
  slug,
  nombre: String(datos.nombre || slug).trim().slice(0, 40),
  etiqueta: String(datos.etiqueta || datos.nombre || slug).trim().slice(0, 60),
  orden: num(datos.orden, 999)
}));
const porSlug = new Map(tipos.map(t => [t.slug, t]));

/* ---------- productos ---------- */
const productos = [];
let omitidos = 0, sinTipo = 0;
for (const { slug, datos: p } of leerCarpeta("content/productos")) {
  const nombre = String(p.nombre || "").trim().slice(0, 60);
  if (!nombre || !okImg(p.image)) {
    omitidos++;
    console.warn(`Producto omitido (${slug}): falta el nombre o la foto principal no es válida (${p.image || "vacía"}).`);
    continue;
  }
  let tipo = String(p.tipo || "");
  if (!porSlug.has(tipo)) {
    sinTipo++;
    console.warn(`Producto «${nombre}» con tipo desconocido («${tipo}»): se muestra en «Otros».`);
    tipo = "otros";
  }
  const extra = (Array.isArray(p.galeria) ? p.galeria : [])
    .map(g => (g && typeof g === "object" ? g.foto : g))
    .filter(okImg);
  productos.push({
    nombre, tipo,
    para: ["mujer", "hombre", "unisex"].includes(p.para) ? p.para : "mujer",
    foto: p.image,
    fotos: [p.image, ...extra].slice(0, 6),
    agotado: p.agotado === true,
    destacado: p.destacado === true,
    orden: num(p.orden, 999)
  });
}
if (sinTipo && !porSlug.has("otros")) tipos.push({ slug: "otros", nombre: "Otros", etiqueta: "Otros", orden: 9999 });

productos.sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre, "es"));
productos.forEach(p => delete p.orden);
tipos.sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre, "es"));
tipos.forEach(t => delete t.orden);

fs.mkdirSync(path.join(SALIDA, "data"), { recursive: true });
fs.writeFileSync(path.join(SALIDA, "data", "tipos.json"), JSON.stringify({ tipos }, null, 2) + "\n");
fs.writeFileSync(path.join(SALIDA, "data", "productos.json"), JSON.stringify({ productos }, null, 2) + "\n");
console.log(`Catálogo compilado: ${productos.length} productos en ${tipos.length} tipos` +
  (omitidos ? `, ${omitidos} omitidos` : "") + (sinTipo ? `, ${sinTipo} sin tipo` : "") + ".");
