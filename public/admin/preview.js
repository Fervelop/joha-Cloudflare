/* Vista previa del panel: muestra cada producto como se verá en la página. */
(function () {
  if (!window.CMS || !window.h || !window.createClass) return;
  var CAT = { aretes: "Aretes", sets: "Set de collar y aretes", collares: "Collares y pulseras" };
  // nombres actuales de los tipos (publicados)
  fetch("/data/tipos.json", { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
    if (d && d.tipos) d.tipos.forEach(function (t) { CAT[t.slug] = t.etiqueta || t.nombre; });
  }).catch(function () {});

  var Producto = createClass({
    asset: function (p) { return p ? String(this.props.getAsset(p)) : ""; },
    render: function () {
      var e = this.props.entry;
      var d = function (k) { return e.getIn(["data", k]); };
      var self = this;
      var img = this.asset(d("image"));
      var gal = d("galeria");
      var extras = gal && gal.toJS ? gal.toJS().map(function (g) { return self.asset(g && g.foto); }).filter(Boolean) : [];
      var fotos = (img ? [img] : []).concat(extras);
      var agotado = d("agotado") === true, destacado = d("destacado") === true;
      var nombre = d("nombre") || "Nombre de la pieza";

      var foto = function (src, cls) {
        return src
          ? h("div", { className: "ph " + (cls || "") },
              h("img", { className: "fill", src: src, alt: "" }),
              h("img", { className: "main", src: src, alt: "" }))
          : h("div", { className: "ph vacio" }, "Sube la foto principal");
      };

      return h("div", { className: "pv" },
        h("p", { className: "rot" }, "Así se verá en el catálogo"),
        h("div", { className: "card" },
          h("div", { className: "tarjeta" },
            agotado ? h("span", { className: "badge" }, "Agotado") : null,
            foto(img, agotado ? "gris" : ""),
            fotos.length > 1 ? h("span", { className: "mas" }, fotos.length + " fotos") : null),
          h("h3", null, nombre),
          h("span", { className: "cat" }, CAT[d("tipo")] || d("tipo") || "Elige el tipo")),
        h("ul", { className: "estado" },
          h("li", { className: agotado ? "no" : "si" }, agotado ? "Agotado: se muestra con etiqueta y no sale en la portada" : "Disponible"),
          h("li", { className: destacado && !agotado ? "si" : "off" },
            destacado ? (agotado ? "Marcado para la portada, pero no saldrá porque está agotado" : "Sale en la ruleta de la portada") : "No sale en la portada"),
          h("li", { className: "off" }, "Catálogo: " + ({ mujer: "Mujer", hombre: "Hombre", unisex: "Mujer y Hombre (unisex)" }[d("para") || "mujer"] || "Mujer")),
          h("li", { className: "off" }, "Posición en el catálogo: " + (d("orden") != null ? d("orden") : "100"))),
        fotos.length > 1
          ? h("div", null,
              h("p", { className: "rot" }, "Fotos al abrir la pieza"),
              h("div", { className: "galeria" }, fotos.map(function (f, i) {
                return h("div", { key: i, className: "mini" }, h("img", { src: f, alt: "" }));
              })))
          : null
      );
    }
  });

  CMS.registerPreviewStyle("/admin/preview.css");
  CMS.registerPreviewTemplate("productos", Producto);
  /* ---------- ventana de bienvenida ---------- */
  var Promo = createClass({
    render: function () {
      var e = this.props.entry, d = function (k) { return e.getIn(["data", k]); };
      var img = d("imagen") ? String(this.props.getAsset(d("imagen"))) : "";
      var frec = { visita: "cada vez que abren la página", sesion: "una vez por visita", una_vez: "solo la primera vez" }[d("frecuencia")] || "cada vez que abren la página";
      return h("div", { className: "pv" },
        h("p", { className: "rot" }, d("activa") === false ? "La ventana está apagada: no se mostrará." : "Así se verá la ventana (" + frec + ")"),
        h("div", { className: "promo" + (d("activa") === false ? " off" : "") },
          img ? h("img", { className: "promo-img", src: img, alt: "" }) : h("img", { className: "promo-logo", src: "/admin/logo-joha.svg", alt: "" }),
          h("h2", null, d("titulo") || "Título"),
          d("frase") ? h("p", { className: "frase" }, d("frase")) : null,
          h("p", { className: "txt" }, d("texto") || ""),
          h("span", { className: "b1" }, d("boton_catalogo") || "Ver el catálogo"),
          d("mostrar_whatsapp") === false ? null : h("span", { className: "b2" }, d("boton_whatsapp") || "Pedir por WhatsApp")),
        d("hasta") ? h("p", { className: "rot" }, "Se deja de mostrar después del " + String(d("hasta"))) : null
      );
    }
  });

  /* ---------- portada ---------- */
  var Portada = createClass({
    render: function () {
      var e = this.props.entry, self = this;
      var r = e.getIn(["data", "ruleta"]);
      var origen = r && r.get("origen");
      var fotos = r && r.get("fotos") ? r.get("fotos").toJS() : [];
      return h("div", { className: "pv" },
        h("p", { className: "rot" }, "Frase de la portada"),
        h("p", { className: "lede" }, e.getIn(["data", "texto"]) || ""),
        h("p", { className: "rodio" }, "◆ " + (e.getIn(["data", "rodio"]) || "")),
        h("p", { className: "rot" }, origen === "fotos"
          ? (fotos.length ? "Tarjetas que giran: tus fotos" : "Elegiste fotos propias pero no hay ninguna: se usarán las piezas marcadas")
          : "Tarjetas que giran: las piezas marcadas «Mostrar en la portada» que no estén agotadas"),
        origen === "fotos" && fotos.length
          ? h("div", { className: "galeria" }, fotos.map(function (f, i) {
              return h("div", { key: i, className: "mini grande" }, f.foto ? h("img", { src: String(self.props.getAsset(f.foto)), alt: "" }) : null);
            }))
          : null,
        h("p", { className: "rot" }, "Cambian cada " + ((r && r.get("segundos")) || 4) + " segundos")
      );
    }
  });

  CMS.registerPreviewTemplate("promo", Promo);
  CMS.registerPreviewTemplate("portada", Portada);
})();