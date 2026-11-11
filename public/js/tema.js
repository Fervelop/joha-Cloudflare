/* Modo oscuro por defecto. Si la persona eligió otro modo, se respeta.
   Se ejecuta antes de pintar la página para evitar parpadeo. */
try {
  var t = localStorage.getItem("joha-tema");
  if (t === "dark" || t === "light") document.documentElement.dataset.theme = t;
} catch (e) {}

/* Línea Hombre (negro y dorado) si el enlace lo pide: ?para=hombre */
try {
  if (new URLSearchParams(location.search).get("para") === "hombre") document.documentElement.dataset.linea = "hombre";
} catch (e) {}
