/* Arranca Decap CMS con config.yml + la dirección real del sitio. */
(function () {
  var origen = window.location.origin;
  window.CMS.init({
    config: {
      backend: { name: "github", base_url: origen, auth_endpoint: "api/auth" },
      site_url: origen,
      display_url: origen
    }
  });
})();
