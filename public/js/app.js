/* JOHA · catálogo
   Los productos y ajustes se editan desde el panel /admin
   (archivos data/productos.json y data/ajustes.json). */
"use strict";

// Tipos de producto: se cargan de data/tipos.json (editables en el panel).
// Estos valores solo se usan si ese archivo no se puede leer.
let CAT = { aretes: "Aretes", sets: "Set de collar y aretes", collares: "Collares y pulseras" };
let TIPOS = [
  { slug: "aretes", nombre: "Aretes" }, { slug: "sets", nombre: "Sets" }, { slug: "collares", nombre: "Collares y pulseras" }
];
const MSG = "Hola JOHA, me interesa saber más sobre tus accesorios 🌷";
let WHATSAPP = "573183623168";

/* ---------- utilidades ---------- */
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const waLink = msg => `https://wa.me/${WHATSAPP}?text=` + encodeURIComponent(msg);

/* Rutas de imagen: solo se aceptan archivos propios del sitio (carpeta images/).
   Las fotos llegan ya optimizadas: el panel las reduce y convierte a WebP al subirlas. */
function imgUrl(src, w) {
  src = String(src || "");
  if (!/^\/?images\/[^"'<>?#\\]+\.(png|jpe?g|webp|avif|gif)$/i.test(src) || src.includes("..")) return "";
  let path = src.startsWith("/") ? src : "/" + src;
  try { path = encodeURI(decodeURI(path)); } catch (e) { return ""; }
  return path;
}
const ph = (src, alt, w, lazy) => {
  const u = esc(imgUrl(src, w)), l = lazy ? ' loading="lazy" decoding="async"' : "";
  return `<div class="ph"><img class="fill" src="${u}" alt="" aria-hidden="true"${l}><img class="main" src="${u}" alt="${esc(alt)}"${l}></div>`;
};

async function cargar(ruta, porDefecto) {
  try {
    const r = await fetch(ruta, { cache: "no-cache" });
    if (!r.ok) throw new Error(r.status);
    return await r.json();
  } catch (e) {
    console.warn("No se pudo cargar", ruta, e);
    return porDefecto;
  }
}

/* ---------- modo claro / oscuro (oscuro por defecto) ---------- */
let temaSync = () => {};
let temaElegido = false;
try { temaElegido = !!localStorage.getItem("joha-tema"); } catch (e) {}
(() => {
  const root = document.documentElement, btn = $("tema");
  const sys = matchMedia("(prefers-color-scheme: dark)");
  const isDark = () => root.dataset.theme ? root.dataset.theme === "dark" : sys.matches;
  const sync = () => btn.setAttribute("aria-label", isDark() ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
  btn.addEventListener("click", () => {
    const t = isDark() ? "light" : "dark";
    root.dataset.theme = t;
    try { localStorage.setItem("joha-tema", t); } catch (e) {}
    temaElegido = true;
    sync();
  });
  sys.addEventListener("change", sync);
  temaSync = sync;
  sync();
})();

$("yr").textContent = new Date().getFullYear();

/* ---------- ventana de pieza ---------- */
const lb = $("lb");
function verFoto(src, alt) {
  const u = imgUrl(src, 1100), main = $("lb-img");
  main.classList.add("swap");
  const pre = new Image();
  pre.onload = pre.onerror = () => { main.src = u; $("lb-fill").src = u; main.alt = alt; main.classList.remove("swap"); };
  pre.src = u;
}
function abrir(p) {
  const fotos = (p.fotos && p.fotos.length ? p.fotos : [p.foto]).filter(f => imgUrl(f, 10));
  const u = imgUrl(fotos[0], 1100);
  $("lb-img").src = u; $("lb-fill").src = u; $("lb-img").alt = p.nombre;
  const th = $("lb-thumbs");
  th.textContent = "";
  th.hidden = fotos.length < 2;
  if (fotos.length > 1) fotos.forEach((f, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-label", `Foto ${i + 1} de ${fotos.length}`);
    b.setAttribute("aria-current", i === 0);
    b.innerHTML = `<img src="${esc(imgUrl(f, 160))}" alt="">`;
    b.addEventListener("click", () => {
      th.querySelectorAll("button").forEach(x => x.setAttribute("aria-current", x === b));
      verFoto(f, `${p.nombre}, foto ${i + 1}`);
    });
    th.appendChild(b);
  });
  $("lb-t").textContent = p.nombre;
  $("lb-c").textContent = CAT[p.tipo] || "";
  lb.querySelector(".lb").classList.toggle("agotado", !!p.agotado);
  $("lb-n").textContent = p.agotado
    ? "Esta pieza está agotada por ahora. Escríbenos y te avisamos cuando vuelva."
    : "Escríbenos y te confirmamos precio y disponibilidad de esta pieza.";
  $("lb-wa").href = waLink(`${MSG}\nPieza: ${p.nombre}`);
  const lc = $("lb-cot");
  if (p.agotado || !Carrito.activo()) { lc.hidden = true; delete lc.dataset.n; }
  else { lc.hidden = false; lc.dataset.n = p.nombre; }
  Carrito.pintar(false);
  lb.showModal();
}
$("lb-x").addEventListener("click", () => lb.close());
lb.addEventListener("click", e => { if (e.target === lb) lb.close(); });

/* ---------- Mi cotización (sin pagos: la lista se envía por WhatsApp) ---------- */
const Carrito = (() => {
  const KEY = "joha-seleccion";   // se mantiene la clave para no perder listas guardadas
  const MAX = 5;
  let items = [];                 // [{nombre, cant}]
  let porNombre = new Map();
  let activo = true;
  const leer = () => { try { const v = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(v) ? v : []; } catch (e) { return []; } };
  const guardar = () => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {} };
  const total = () => items.reduce((s, i) => s + i.cant, 0);
  const cant = n => (items.find(i => i.nombre === n) || {}).cant || 0;
  const piezas = n => `${n} ${n === 1 ? "pieza" : "piezas"}`;

  function iniciar(productos, on) {
    activo = on !== false;
    if (!activo) { document.documentElement.dataset.carrito = "off"; return; }
    porNombre = new Map(productos.map(p => [p.nombre, p]));
    items = leer().filter(i => i && porNombre.has(i.nombre) && !porNombre.get(i.nombre).agotado)
      .map(i => ({ nombre: i.nombre, cant: Math.min(MAX, Math.max(1, i.cant | 0)) }));
    guardar();
    $("cart-open").addEventListener("click", abrirCajon);
    $("cart-fab").addEventListener("click", abrirCajon);
    $("cart-x").addEventListener("click", cerrarCajon);
    $("cart").addEventListener("click", e => { if (e.target === $("cart")) cerrarCajon(); });
    $("cart").addEventListener("cancel", e => { e.preventDefault(); cerrarCajon(); });
    $("cart-vaciar").addEventListener("click", () => { items = []; guardar(); pintar(); });
    $("cart-nota").addEventListener("input", actualizarEnlace);
    // al enviar por WhatsApp, la cotización se vacía (con opción de recuperarla unos segundos)
    $("cart-enviar").addEventListener("click", () => {
      actualizarEnlace();
      const copia = { items: items.map(i => ({ ...i })), nota: $("cart-nota").value };
      setTimeout(() => {
        items = []; $("cart-nota").value = "";
        guardar(); pintar(false); cerrarCajon();
        aviso("¡Listo! Tu cotización se abrió en WhatsApp.", "Recuperar mi lista", () => {
          items = copia.items; $("cart-nota").value = copia.nota;
          guardar(); pintar(true);
        });
      }, 150);
    });
    // un solo escuchador para todos los controles de cantidad (tarjetas y detalle)
    document.addEventListener("click", e => {
      const b = e.target.closest(".cot [data-act]");
      if (!b) return;
      const n = b.closest(".cot").dataset.n;
      if (b.dataset.act === "add") cambiar(n, +1, true);
      else if (b.dataset.act === "mas") cambiar(n, +1, true);
      else if (b.dataset.act === "menos") cambiar(n, -1);
      // devolver el foco al control equivalente dentro del mismo contexto (tarjeta, detalle o carrito)
      const zona = b.closest("dialog") || $("grid");
      const sel = `.cot[data-n="${CSS.escape(n)}"]`;
      const nueva = zona.querySelector(`${sel} [data-act="${b.dataset.act === "add" ? "mas" : b.dataset.act}"]:not([disabled])`)
        || zona.querySelector(`${sel} [data-act]`);
      if (nueva) nueva.focus();
    });
    pintar(false);
  }

  function cambiar(nombre, d, animar) {
    const p = porNombre.get(nombre);
    if (!p || p.agotado) return;
    let it = items.find(i => i.nombre === nombre);
    if (!it && d > 0) { it = { nombre, cant: 0 }; items.push(it); }
    if (!it) return;
    it.cant = Math.min(MAX, it.cant + d);
    if (it.cant <= 0) items = items.filter(i => i !== it);
    guardar(); pintar(animar);
  }
  function quitar(nombre) { items = items.filter(i => i.nombre !== nombre); guardar(); pintar(false); }

  /* control que va debajo de cada tarjeta y en el detalle */
  function control(nombre) {
    const c = cant(nombre);
    if (!c) return `<button type="button" class="cot-add" data-act="add"><svg aria-hidden="true"><use href="#i-bag"/></svg>Añadir a mi cotización</button>`;
    return `<div class="cot-on"><div class="cot-step" role="group" aria-label="Cantidad de ${esc(nombre)} en tu cotización">
        <button type="button" data-act="menos" aria-label="${c === 1 ? "Quitar de la cotización" : "Quitar una"}">${c === 1 ? '<svg aria-hidden="true"><use href="#i-trash"/></svg>' : "−"}</button>
        <output aria-live="polite">${c}</output>
        <button type="button" data-act="mas" aria-label="Añadir una" ${c >= MAX ? "disabled" : ""}>+</button></div>
        <span class="cot-lbl">${c >= MAX ? `Máximo ${MAX} por pieza` : "En tu cotización"}</span></div>`;
  }

  /* sugerencias: piezas disponibles del mismo tipo que lo elegido (o destacadas) */
  function sugerir() {
    const box = $("cart-sug"), ul = $("sug-lista");
    if (!items.length) { box.hidden = true; return; }
    const elegidos = new Set(items.map(i => i.nombre));
    const tipos = new Set(items.map(i => (porNombre.get(i.nombre) || {}).tipo));
    const libres = [...porNombre.values()].filter(p => !p.agotado && !elegidos.has(p.nombre));
    const orden = p => (tipos.has(p.tipo) ? 0 : 2) + (p.destacado ? 0 : 1);
    const lista = libres.sort((a, b) => orden(a) - orden(b)).slice(0, 3);
    box.hidden = !lista.length;
    ul.textContent = "";
    lista.forEach(p => {
      const li = document.createElement("li");
      li.innerHTML = `<div class="mini"><img src="${esc(imgUrl(p.foto, 120))}" alt=""></div>
        <span class="nom">${esc(p.nombre)}</span>
        <div class="cot sug-cot" data-n="${esc(p.nombre)}"></div>`;
      ul.appendChild(li);
    });
  }

  function mensaje() {
    const lineas = items.map(i => `• ${i.cant} × ${i.nombre}`);
    const nota = $("cart-nota").value.trim();
    return `${MSG}\nQuiero cotizar:\n${lineas.join("\n")}` + (nota ? `\n\nNota: ${nota}` : "") + "\n\n¿Me cuentas precio y disponibilidad?";
  }
  function actualizarEnlace() { $("cart-enviar").href = waLink(mensaje()); }

  function pintar(animar) {
    if (!activo) return;
    const n = total(), c = $("cart-count");
    c.textContent = n; c.hidden = n === 0;
    if (animar && n) { c.classList.remove("pop"); void c.offsetWidth; c.classList.add("pop"); }
    const etiqueta = n ? `Mi cotización: ${piezas(n)}` : "Mi cotización: vacía";
    $("cart-open").setAttribute("aria-label", etiqueta);
    $("cart-fab").setAttribute("aria-label", etiqueta);
    const fc = $("fab-count");
    fc.textContent = n; fc.hidden = n === 0;
    if (animar && n) { fc.classList.remove("pop"); void fc.offsetWidth; fc.classList.add("pop"); }
    sugerir();
    document.querySelectorAll(".cot[data-n]").forEach(el => {
      el.innerHTML = el.classList.contains("sug-cot") ? control(el.dataset.n).replace("Añadir a mi cotización", "Añadir") : control(el.dataset.n);
    });

    const ul = $("cart-lista");
    ul.textContent = "";
    items.forEach(i => {
      const p = porNombre.get(i.nombre);
      const li = document.createElement("li");
      li.className = "linea";
      li.innerHTML = `<div class="mini"><img src="${esc(imgUrl(p.foto, 160))}" alt=""></div>
        <div><h3>${esc(p.nombre)}</h3><span class="cat">${esc(CAT[p.tipo] || "")}</span></div>
        <div class="der">
          <div class="cant" role="group" aria-label="Cantidad de ${esc(p.nombre)}">
            <button type="button" class="menos" aria-label="Quitar una" ${i.cant <= 1 ? "disabled" : ""}>−</button><output>${i.cant}</output><button type="button" class="mas" aria-label="Añadir una" ${i.cant >= MAX ? "disabled" : ""}>+</button></div>
          <button type="button" class="borrar" aria-label="Quitar ${esc(p.nombre)} de la cotización"><svg aria-hidden="true"><use href="#i-trash"/></svg></button>
        </div>`;
      li.querySelector(".menos").addEventListener("click", () => cambiar(i.nombre, -1));
      li.querySelector(".mas").addEventListener("click", () => cambiar(i.nombre, +1));
      li.querySelector(".borrar").addEventListener("click", () => quitar(i.nombre));
      ul.appendChild(li);
    });
    const vacia = items.length === 0;
    $("cart-vacia").hidden = !vacia;
    $("cart-nota-box").hidden = vacia;
    $("cart-pie").hidden = vacia;
    $("cart-resumen").textContent = vacia ? "" : `${piezas(n)} en tu cotización. Te confirmamos precio y disponibilidad por WhatsApp.`;
    actualizarEnlace();
  }

  let avisoTimer = null;
  function aviso(texto, accion, alHacer) {
    const el = $("aviso");
    el.querySelector("span").textContent = texto;
    const b = el.querySelector("button");
    b.textContent = accion; b.hidden = !accion;
    b.onclick = () => { alHacer && alHacer(); ocultar(); };
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add("in"));
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(ocultar, 10000);
    function ocultar() { el.classList.remove("in"); clearTimeout(avisoTimer); setTimeout(() => { el.hidden = true; }, 250); }
  }

  function abrirCajon() {
    const d = $("cart");
    if (lb.open) lb.close();
    d.showModal();
    requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add("in")));
  }
  function cerrarCajon() {
    const d = $("cart");
    if (!d.open) return;
    d.classList.remove("in");
    const fin = () => { d.removeEventListener("transitionend", fin); if (!d.classList.contains("in")) d.close(); };
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) d.close();
    else { d.addEventListener("transitionend", fin); setTimeout(fin, 500); }
  }

  return { iniciar, pintar, activo: () => activo };
})();

/* ---------- catálogo: Mujer | Hombre, filtros por tipo y páginas de 12 ---------- */
const POR_PAGINA = 12;
const LINEAS = [{ slug: "mujer", nombre: "Mujer" }, { slug: "hombre", nombre: "Hombre" }];
const Catalogo = {
  todos: [],
  para: "mujer",
  tipo: "todo",
  pagina: 1
};
// «Unisex» aparece en los dos catálogos; si una pieza no dice para quién, es de Mujer.
const paraDe = p => (p.para === "hombre" || p.para === "unisex" ? p.para : "mujer");
const enLinea = (p, linea) => paraDe(p) === linea || paraDe(p) === "unisex";

function itemCatalogo(p) {
  const li = document.createElement("li");
  li.className = "item" + (p.agotado ? " agotado" : "");
  li.dataset.c = p.tipo;
  li.innerHTML = `<button type="button" class="open" aria-label="Ver ${esc(p.nombre)}${p.agotado ? ", agotado" : ""}">
    <div class="tarjeta">${p.agotado ? '<span class="badge">Agotado</span>' : ""}${ph(p.foto, p.nombre + ", JOHA", 700, true)}${(p.fotos || []).length > 1 ? `<span class="mas-fotos">${p.fotos.length} fotos</span>` : ""}</div>
    <h3>${esc(p.nombre)}</h3><span class="cat">${esc(CAT[p.tipo] || "")}</span></button>`;
  li.querySelector(".open").addEventListener("click", () => abrir(p));
  if (!p.agotado) {
    const cot = document.createElement("div");
    cot.className = "cot cart-ui";
    cot.dataset.n = p.nombre;
    li.appendChild(cot);
  } else {
    const ag = document.createElement("p");
    ag.className = "cot-agot cart-ui";
    ag.textContent = "Agotada por ahora";
    li.appendChild(ag);
  }
  return li;
}

/* selector deslizante Mujer | Hombre (solo si hay piezas de hombre) */
function pintarLineas() {
  const box = $("lineas");
  const hayHombre = Catalogo.todos.some(p => paraDe(p) !== "mujer");
  box.hidden = !hayHombre;
  if (!hayHombre) { Catalogo.para = "mujer"; return; }
  box.innerHTML = `<span class="lineas-ind" aria-hidden="true"></span>` + LINEAS.map(l =>
    `<button type="button" role="tab" data-l="${l.slug}" aria-selected="${l.slug === Catalogo.para}">${l.nombre}</button>`).join("");
  box.querySelectorAll("button").forEach(b => b.addEventListener("click", () => cambiarLinea(b.dataset.l)));
  box.addEventListener("keydown", e => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const i = LINEAS.findIndex(l => l.slug === Catalogo.para);
    const n = LINEAS[(i + (e.key === "ArrowRight" ? 1 : LINEAS.length - 1)) % LINEAS.length].slug;
    cambiarLinea(n); box.querySelector(`[data-l="${n}"]`).focus();
  });
}

/* filtros: «Todo» + los tipos que existen en la línea elegida */
function pintarFiltros() {
  const box = document.querySelector(".filters");
  const usados = new Set(Catalogo.todos.filter(p => enLinea(p, Catalogo.para)).map(p => p.tipo));
  if (Catalogo.tipo !== "todo" && !usados.has(Catalogo.tipo)) Catalogo.tipo = "todo";
  box.innerHTML = `<button type="button" data-f="todo" aria-pressed="${Catalogo.tipo === "todo"}">Todo</button>` +
    TIPOS.filter(t => usados.has(t.slug)).map(t =>
      `<button type="button" data-f="${esc(t.slug)}" aria-pressed="${Catalogo.tipo === t.slug}">${esc(t.nombre)}</button>`).join("");
  box.hidden = usados.size < 2;
  box.querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
    Catalogo.tipo = b.dataset.f; Catalogo.pagina = 1;
    box.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b));
    pintarCatalogo();
  }));
}

function visibles() {
  return Catalogo.todos.filter(p => enLinea(p, Catalogo.para) && (Catalogo.tipo === "todo" || p.tipo === Catalogo.tipo));
}

function pintarCatalogo(direccion) {
  const grid = $("grid");
  const lista = visibles();
  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  Catalogo.pagina = Math.min(Math.max(1, Catalogo.pagina), paginas);
  const desde = (Catalogo.pagina - 1) * POR_PAGINA;

  document.querySelector(".catalog").dataset.para = Catalogo.para;
  grid.textContent = "";
  if (!Catalogo.todos.length) {
    grid.innerHTML = `<li class="vacio">Estamos actualizando el catálogo. Escríbenos por WhatsApp y te mostramos las piezas disponibles.</li>`;
  } else if (!lista.length) {
    grid.innerHTML = `<li class="vacio">Pronto tendremos piezas aquí. Escríbenos por WhatsApp y te contamos qué llega.</li>`;
  } else {
    lista.slice(desde, desde + POR_PAGINA).forEach(p => grid.appendChild(itemCatalogo(p)));
  }
  if (direccion) {
    grid.classList.remove("ent-izq", "ent-der");
    void grid.offsetWidth;
    grid.classList.add(direccion > 0 ? "ent-der" : "ent-izq");
  }
  pintarPaginas(paginas, lista.length);
  if (typeof Carrito !== "undefined" && Carrito.activo()) Carrito.pintar(false);
}

function pintarPaginas(paginas, total) {
  const nav = $("paginas");
  nav.hidden = paginas < 2;
  $("cat-cuenta").textContent = total ? `${total} ${total === 1 ? "pieza" : "piezas"}` : "";
  if (paginas < 2) { nav.innerHTML = ""; return; }
  const a = Catalogo.pagina;
  // números visibles: 1 … a-1 a a+1 … última
  const nums = [...new Set([1, a - 1, a, a + 1, paginas])].filter(n => n >= 1 && n <= paginas).sort((x, y) => x - y);
  let html = `<button type="button" class="pg-flecha" data-p="${a - 1}" aria-label="Página anterior" ${a === 1 ? "disabled" : ""}>‹</button>`;
  nums.forEach((n, k) => {
    if (k && n - nums[k - 1] > 1) html += `<span class="pg-sep" aria-hidden="true">…</span>`;
    html += `<button type="button" data-p="${n}" aria-label="Página ${n}"${n === a ? ' aria-current="page"' : ""}>${n}</button>`;
  });
  html += `<button type="button" class="pg-flecha" data-p="${a + 1}" aria-label="Página siguiente" ${a === paginas ? "disabled" : ""}>›</button>`;
  nav.innerHTML = html;
  nav.querySelectorAll("button").forEach(b => b.addEventListener("click", () => irAPagina(+b.dataset.p)));
}

function irAPagina(n) {
  const antes = Catalogo.pagina;
  Catalogo.pagina = n;
  pintarCatalogo(n > antes ? 1 : -1);
  const top = $("catalogo").getBoundingClientRect().top + window.scrollY - 70;
  window.scrollTo({ top, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  const actual = $("paginas").querySelector('[aria-current="page"]');
  if (actual) actual.focus({ preventScroll: true });
}

function cambiarLinea(linea) {
  if (linea === Catalogo.para || !LINEAS.some(l => l.slug === linea)) return;
  const dir = LINEAS.findIndex(l => l.slug === linea) > LINEAS.findIndex(l => l.slug === Catalogo.para) ? 1 : -1;
  Catalogo.para = linea; Catalogo.pagina = 1;
  const box = $("lineas");
  box.dataset.activa = linea;
  box.querySelectorAll("button").forEach(b => b.setAttribute("aria-selected", b.dataset.l === linea));
  try {
    const u = new URL(location.href);
    if (linea === "mujer") u.searchParams.delete("para"); else u.searchParams.set("para", linea);
    history.replaceState(null, "", u);
  } catch (e) {}
  pintarFiltros();
  pintarCatalogo(dir);
}

/* deslizar el dedo a los lados sobre el catálogo cambia de línea */
function gestoLineas() {
  const zona = $("grid");
  let x0 = null, y0 = null;
  zona.addEventListener("touchstart", e => { const t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; }, { passive: true });
  zona.addEventListener("touchend", e => {
    if (x0 === null || $("lineas").hidden) return;
    const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
    x0 = null;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6) cambiarLinea(dx < 0 ? "hombre" : "mujer");
  }, { passive: true });
}

function iniciarCatalogo(productos) {
  Catalogo.todos = productos;
  let pedida = null;
  try { pedida = new URL(location.href).searchParams.get("para"); } catch (e) {}
  if (pedida === "hombre" && productos.some(p => paraDe(p) !== "mujer")) Catalogo.para = "hombre";
  pintarLineas();
  $("lineas").dataset.activa = Catalogo.para;
  pintarFiltros();
  pintarCatalogo();
  gestoLineas();
}

/* ---------- ruleta de la portada ---------- */
function pintarRuleta(productos, conf) {
  conf = conf || {};
  const disponibles = productos.filter(p => !p.agotado);
  let lista;
  const propias = (Array.isArray(conf.fotos) ? conf.fotos : [])
    .filter(f => f && imgUrl(f.foto, 10))
    .map(f => ({ nombre: f.descripcion || "Pieza JOHA", foto: f.foto }));
  if (conf.origen === "fotos" && propias.length) {
    lista = propias;
  } else {
    lista = disponibles.filter(p => p.destacado);
    if (lista.length < 3) lista = lista.concat(disponibles.filter(p => !p.destacado)).slice(0, Math.max(3, lista.length));
  }
  lista = lista.slice(0, 8);
  const ms = Math.min(10, Math.max(2, Number(conf.segundos) || 4)) * 1000;
  const box = $("ruleta");
  if (!lista.length) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const cards = lista.map(p => {
    const d = document.createElement("div");
    d.className = "tarjeta rc";
    d.innerHTML = ph(p.foto, p.nombre, 900, false);
    box.insertBefore(d, box.firstChild);
    return d;
  });
  const n = cards.length;
  let cur = 0, timer = null;
  function layout() {
    cards.forEach((c, k) => {
      const off = (k - cur + n) % n;            // 0 centro, 1 derecha, n-1 izquierda, resto escondidas
      const pos = off === 0 ? "center" : (off === 1 && n > 1) ? "right" : (off === n - 1 && n > 2) ? "left" : "hidden";
      c.dataset.pos = pos;
      c.setAttribute("aria-hidden", pos !== "center");
    });
  }
  const next = () => { cur = (cur + 1) % n; layout(); };
  // Gira siempre (también con el mouse encima). Con «reducir movimiento» activo
  // en el sistema, cambia con un fundido suave en vez de desplazarse.
  const play = () => { if (n > 1 && !timer && !document.hidden) timer = setInterval(next, reduce.matches ? Math.max(ms, 5000) : ms); };
  const stop = () => { clearInterval(timer); timer = null; };
  document.addEventListener("visibilitychange", () => document.hidden ? stop() : play());
  reduce.addEventListener("change", () => { stop(); play(); });
  layout(); play();
}

/* ---------- ajustes generales ---------- */
function aplicarAjustes(a) {
  if (/^57\d{10}$/.test(a.whatsapp || "")) WHATSAPP = a.whatsapp;
  document.querySelectorAll(".wa").forEach(el => el.href = waLink(el.dataset.msg));
  const ig = $("ig"), user = String(a.instagram || "").replace(/^@/, "");
  if (/^[\w.]{1,30}$/.test(user)) ig.href = "https://instagram.com/" + user; else ig.remove();

  if (!temaElegido && a.tema_inicial === "claro") { document.documentElement.dataset.theme = "light"; temaSync(); }

  const sec = a.secciones || {};
  ["calidad", "cuidado", "esencia", "pedir"].forEach(k => {
    if (sec[k] === false) document.querySelectorAll(`[data-sec="${k}"]`).forEach(el => el.hidden = true);
  });
}

/* ---------- ventana de bienvenida ---------- */
function aplicarPromo(pr, ajustesViejos) {
  // compatibilidad con la versión anterior (promo dentro de ajustes)
  if (!pr || typeof pr !== "object") pr = {
    activa: ajustesViejos.promo_activa, titulo: ajustesViejos.promo_titulo, texto: ajustesViejos.promo_texto
  };
  if (pr.activa === false) return;
  if (pr.hasta) {
    const fin = new Date(pr.hasta + "T23:59:59");
    if (!isNaN(fin) && Date.now() > fin.getTime()) return;
  }
  const clave = "joha-promo-" + String((pr.titulo || "") + (pr.texto || "")).length + "-" + (pr.titulo || "").slice(0, 20);
  try {
    if (pr.frecuencia === "sesion" && sessionStorage.getItem(clave)) return;
    if (pr.frecuencia === "una_vez" && localStorage.getItem(clave)) return;
  } catch (e) {}

  const set = (id, v) => { if (typeof v === "string" && v.trim()) $(id).textContent = v; };
  set("promo-t", pr.titulo); set("promo-frase", pr.frase); set("promo-txt", pr.texto);
  set("promo-cat", pr.boton_catalogo); set("promo-wa-txt", pr.boton_whatsapp);
  if (pr.frase === "") $("promo-frase").hidden = true;
  const img = imgUrl(pr.imagen, 900);
  if (img) { $("promo-img").src = img; $("promo-img").alt = pr.titulo || ""; $("promo-img").hidden = false; $("promo-logo").style.display = "none"; }
  const wa = $("promo-wa");
  if (pr.mostrar_whatsapp === false) wa.remove();
  else if (pr.mensaje_whatsapp) wa.href = waLink(pr.mensaje_whatsapp);

  const promo = $("promo");
  const marcar = () => { try {
    if (pr.frecuencia === "sesion") sessionStorage.setItem(clave, "1");
    if (pr.frecuencia === "una_vez") localStorage.setItem(clave, "1");
  } catch (e) {} };
  promo.addEventListener("close", marcar);
  $("promo-x").addEventListener("click", () => promo.close());
  $("promo-cat").addEventListener("click", () => promo.close());
  promo.addEventListener("click", e => { if (e.target === promo) promo.close(); });
  const espera = Math.min(30, Math.max(0, Number(pr.segundos_espera ?? 1))) * 1000;
  setTimeout(() => { if (!document.querySelector("dialog[open]")) promo.showModal(); }, espera);
}

/* ---------- textos editables ---------- */
const negritas = s => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
function lista(id, items, icono) {
  const ul = $(id);
  if (!ul || !Array.isArray(items) || !items.length) return;
  const iconos = Array.isArray(icono) ? icono : null;
  ul.textContent = "";
  items.forEach((it, i) => {
    if (!it || !it.titulo) return;
    const li = document.createElement("li");
    const ic = iconos ? iconos[i % iconos.length] : icono;
    li.innerHTML = (ic ? `<svg aria-hidden="true"><use href="#${ic}"/></svg>` : "") +
      `<div><h3>${esc(it.titulo)}</h3><p>${esc(it.texto || "")}</p></div>`;
    ul.appendChild(li);
  });
}
function aplicarTextos(t) {
  if (!t || typeof t !== "object") return;
  document.querySelectorAll("[data-t]").forEach(el => {
    const v = el.dataset.t.split(".").reduce((o, k) => (o && o[k] != null ? o[k] : null), t);
    if (typeof v !== "string" || !v.trim()) return;
    if ("md" in el.dataset) el.innerHTML = negritas(v); else el.textContent = v;
  });
  const c = t.calidad || {};
  lista("t-bene", c.beneficios, ["i-drop", "i-shield", "i-mirror"]);
  lista("t-tips", (t.cuidado || {}).consejos, "i-spark");
  lista("t-pasos", (t.pedir || {}).pasos, null);
  const u = imgUrl(c.foto, 900);
  if (u) { $("cal-img").src = u; $("cal-fill").src = u; }
}

/* ---------- arranque ---------- */
(async () => {
  document.querySelectorAll(".wa").forEach(el => el.href = waLink(el.dataset.msg));
  const [datos, ajustes, textos, portada, promo, tipos] = await Promise.all([
    cargar("data/productos.json", { productos: [] }),
    cargar("data/ajustes.json", {}),
    cargar("data/textos.json", {}),
    cargar("data/portada.json", {}),
    cargar("data/promo.json", null),
    cargar("data/tipos.json", null)
  ]);
  if (tipos && Array.isArray(tipos.tipos) && tipos.tipos.length) {
    TIPOS = tipos.tipos.filter(t => t && t.slug && t.nombre);
    CAT = Object.fromEntries(TIPOS.map(t => [t.slug, t.etiqueta || t.nombre]));
  }
  aplicarTextos(Object.assign({}, textos, { portada: Object.assign({}, (textos || {}).portada, portada) }));
  const productos = (Array.isArray(datos.productos) ? datos.productos : [])
    .filter(p => p && p.nombre && p.foto && CAT[p.tipo]);
  aplicarAjustes(ajustes || {});
  aplicarPromo(promo, ajustes || {});
  iniciarCatalogo(productos);
  Carrito.iniciar(productos, (ajustes || {}).carrito_activo);
  pintarRuleta(productos, (portada || {}).ruleta);
})();
