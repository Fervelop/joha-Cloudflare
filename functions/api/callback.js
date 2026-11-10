/**
 * Inicio de sesión del panel (paso 2 de 2).
 * GitHub vuelve aquí con un código; se cambia por un token de acceso y se le
 * entrega a la ventana del panel (Decap CMS) que abrió la ventana emergente.
 * El token solo se envía a una ventana con el mismo origen que este sitio.
 */
const cabeceras = nonce => ({
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`
});

function pagina(nonce, origen, estado, contenido, mensajeVisible) {
  // Protocolo de Decap CMS: el panel responde a "authorizing:github" y luego
  // recibe "authorization:github:<success|error>:<json>".
  const datos = JSON.stringify(JSON.stringify(contenido)); // texto JSON seguro dentro del script
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>JOHA · Inicio de sesión</title></head>
<body style="font-family:system-ui,sans-serif;background:#FFF9F7;color:#5B2937;display:grid;place-items:center;min-height:90vh;text-align:center">
<p>${mensajeVisible}</p>
<script nonce="${nonce}">
(function () {
  var origen = ${JSON.stringify(origen)};
  var mensaje = "authorization:github:${estado}:" + ${datos};
  function responder(e) {
    if (e.origin !== origen || !window.opener) return;
    window.opener.postMessage(mensaje, origen);
    window.removeEventListener("message", responder);
    setTimeout(function () { window.close(); }, 400);
  }
  window.addEventListener("message", responder, false);
  if (window.opener) window.opener.postMessage("authorizing:github", origen);
})();
</script></body></html>`;
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const borrarCookie = "joha_oauth_state=; Path=/api/callback; Max-Age=0; HttpOnly; Secure; SameSite=Lax";
  const responder = (estado, contenido, texto, status = 200) => {
    const h = new Headers(cabeceras(nonce));
    h.append("Set-Cookie", borrarCookie);
    return new Response(pagina(nonce, url.origin, estado, contenido, texto), { status, headers: h });
  };

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookie = (request.headers.get("Cookie") || "").match(/(?:^|;\s*)joha_oauth_state=([^;]+)/);

  if (url.searchParams.get("error")) {
    return responder("error", { message: "GitHub canceló el inicio de sesión." }, "Inicio de sesión cancelado. Puedes cerrar esta ventana.", 400);
  }
  if (!code || !state || !cookie || cookie[1] !== state) {
    return responder("error", { message: "La sesión expiró o no es válida. Vuelve a intentarlo." }, "La sesión expiró. Cierra esta ventana e inténtalo de nuevo.", 400);
  }

  try {
    const r = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json", "User-Agent": "joha-panel" },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${url.origin}/api/callback`
      })
    });
    const datos = await r.json();
    if (!r.ok || !datos.access_token) {
      return responder("error", { message: datos.error_description || "GitHub no entregó el acceso." }, "No se pudo iniciar sesión. Cierra esta ventana e inténtalo de nuevo.", 401);
    }
    return responder("success", { token: datos.access_token, provider: "github" }, "Listo. Volviendo al panel…");
  } catch (e) {
    return responder("error", { message: "No se pudo contactar a GitHub." }, "No se pudo contactar a GitHub. Inténtalo de nuevo.", 502);
  }
}
