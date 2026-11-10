/**
 * Inicio de sesión del panel (paso 1 de 2).
 * Decap CMS abre esta dirección en una ventana emergente; aquí se envía a la
 * persona a GitHub para autorizar el acceso.
 *
 * Variables de entorno necesarias en Cloudflare Pages (Settings → Variables and Secrets):
 *   GITHUB_CLIENT_ID      (texto)
 *   GITHUB_CLIENT_SECRET  (secreto, tipo "Secret")
 */
export async function onRequestGet({ request, env }) {
  const faltan = ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"].filter(k => !String(env[k] || "").trim());
  if (faltan.length) {
    // Diagnóstico sin revelar valores: qué falta y en qué entorno/rama se está ejecutando.
    const entorno = env.CF_PAGES_BRANCH ? `rama «${env.CF_PAGES_BRANCH}»` : "entorno desconocido";
    return new Response(
      `Falta configurar en Cloudflare Pages: ${faltan.join(" y ")}.\n` +
      `Esta publicación corresponde a la ${entorno}.\n` +
      `Revisa Settings → Variables and Secrets en el entorno «Production» y vuelve a publicar.`,
      { status: 500, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
  }
  const url = new URL(request.url);
  if (url.searchParams.get("provider") && url.searchParams.get("provider") !== "github") {
    return new Response("Proveedor no soportado.", { status: 400 });
  }
 
  // Solo se permiten los permisos que necesita el panel.
  const pedido = url.searchParams.get("scope") || "repo";
  const scope = pedido === "public_repo" ? "public_repo" : "repo";
 
  // "state" aleatorio contra ataques CSRF: se guarda en una cookie segura y se
  // comprueba en /api/callback.
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const state = btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, c => ({ "+": "-", "/": "_", "=": "" }[c]));
 
  const destino = new URL("https://github.com/login/oauth/authorize");
  destino.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  destino.searchParams.set("redirect_uri", `${url.origin}/api/callback`);
  destino.searchParams.set("scope", scope);
  destino.searchParams.set("state", state);
  destino.searchParams.set("allow_signup", "false");
 
  return new Response(null, {
    status: 302,
    headers: {
      Location: destino.toString(),
      "Set-Cookie": `joha_oauth_state=${state}; Path=/api/callback; Max-Age=600; HttpOnly; Secure; SameSite=Lax`,
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer"
    }
  });
}