/* Asistente de subida de fotos del panel JOHA.
   Antes de que Decap reciba una foto:
   - limpia el nombre (sin tildes, ñ, espacios ni símbolos), porque Decap
     rechaza en silencio los nombres con caracteres especiales;
   - si la foto es grande (más de 1600 px o 500 KB), la reduce y la
     convierte a WebP de alta calidad, para que suba rápido y la página cargue ágil. */
(function () {
  "use strict";
  var MAX_LADO = 1600;
  var LIMITE = 500 * 1024;

  function limpiarBase(nombre) {
    var base = String(nombre || "foto").replace(/\.[^.]+$/, "");
    base = base.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ñ/gi, "n");
    base = base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
    return base || "foto";
  }
  function extension(nombre) {
    var m = String(nombre || "").match(/\.([a-z0-9]+)$/i);
    var e = m ? m[1].toLowerCase() : "jpg";
    return e === "jpeg" ? "jpg" : e;
  }
  function renombrar(file) {
    return new File([file], limpiarBase(file.name) + "." + extension(file.name), { type: file.type, lastModified: file.lastModified });
  }
  function aBlob(canvas, tipo, calidad) {
    return new Promise(function (ok) { canvas.toBlob(ok, tipo, calidad); });
  }
  async function procesar(file) {
    if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) return renombrar(file);
    try {
      var bmp = await createImageBitmap(file);
      var escala = Math.min(1, MAX_LADO / Math.max(bmp.width, bmp.height));
      if (escala === 1 && file.size <= LIMITE) { bmp.close && bmp.close(); return renombrar(file); }
      var c = document.createElement("canvas");
      c.width = Math.round(bmp.width * escala);
      c.height = Math.round(bmp.height * escala);
      c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
      bmp.close && bmp.close();
      var blob = await aBlob(c, "image/webp", 0.88);
      if (!blob || blob.size >= file.size) return renombrar(file);
      return new File([blob], limpiarBase(file.name) + ".webp", { type: "image/webp" });
    } catch (e) {
      return renombrar(file);
    }
  }

  window.addEventListener("change", function (e) {
    var input = e.target;
    if (!(input instanceof HTMLInputElement) || input.type !== "file") return;
    if (input.dataset.johaListo) { delete input.dataset.johaListo; return; }
    if (!input.files || !input.files.length) return;
    e.stopImmediatePropagation();
    e.stopPropagation();
    var originales = Array.prototype.slice.call(input.files);
    Promise.all(originales.map(procesar)).then(function (listos) {
      var dt = new DataTransfer();
      listos.forEach(function (f) { dt.items.add(f); });
      input.files = dt.files;
      input.dataset.johaListo = "1";
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }, true);
})();
