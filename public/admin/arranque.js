/* Arranca Decap CMS con config.yml + la dirección real del sitio. */
(function () {
  var origen = window.location.origin;
  var config = {
    backend: { name: "github", base_url: origen, auth_endpoint: "api/auth" },
    site_url: origen,
    display_url: origen
  };
  // En el computador (localhost) el panel trabaja sobre los archivos locales
  // si está corriendo «npx decap-server». En internet esto no tiene efecto.
  if (/^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)) config.local_backend = true;
  window.CMS.init({ config: config });
})();
