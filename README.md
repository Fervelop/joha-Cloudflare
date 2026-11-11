# JOHA · Brilla con tu esencia

Sitio web y catálogo de **JOHA**, marca de accesorios y joyería femenina con baño de rodio.
Alojado en **Cloudflare Pages** (publicaciones gratuitas, 500 al mes).

| | |
| --- | --- |
| Sitio | https://joha-jw.pages.dev (o el dominio propio cuando se conecte) |
| Panel de administración | `/admin` en la misma dirección |
| Repositorio | https://github.com/Fervelop/joha-Cloudflare |
| Pedidos | WhatsApp, a través de «Mi cotización» y los botones de cada pieza |

---

## 0. Puesta en marcha en Cloudflare (una sola vez)

1. **Subir este repositorio** a `Fervelop/joha-Cloudflare` (rama `main`).
2. **Cloudflare → Workers & Pages → Create → Pages → Connect to Git** → elegir `Fervelop/joha-Cloudflare`.
   - Project name: `joha-jw` (de ahí sale la dirección `joha-jw.pages.dev`)
   - Production branch: `main`
   - Framework preset: `None`
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: *(vacío)*
3. **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**
   - Application name: `Panel JOHA (Cloudflare)`
   - Homepage URL: `https://joha-jw.pages.dev`
   - Authorization callback URL: `https://joha-jw.pages.dev/api/callback`
   - Copiar el **Client ID** y generar un **Client secret**.
4. **Cloudflare → el proyecto → Settings → Variables and Secrets** (entorno *Production*):
   - `GITHUB_CLIENT_ID` = el Client ID (tipo *Text*)
   - `GITHUB_CLIENT_SECRET` = el Client secret (tipo **Secret**)
   - `SITE_URL` = `https://joha-jw.pages.dev` (tipo *Text*)
   - `NODE_VERSION` = `20` (tipo *Text*)
5. **Deployments → Retry deployment** (para que tome las variables).
6. Entrar a `https://joha-jw.pages.dev/admin` → **Iniciar sesión con GitHub**.

Si el nombre `joha-cloudflare` ya está ocupado, Cloudflare asigna otro: usar esa dirección
en los pasos 3 y 4.

---

## 1. Lo que ya está hecho

### Identidad
- Logo JOHA recreado en vector (rosa, nombre, eslogan, corazón y líneas) con degradado dorado.
- Paleta de marca: rosa, rosa suave, rosa acento, dorado y vino. Tipografías: Bodoni Moda (títulos), Pinyon Script (frases manuscritas) y Jost (textos).
- Favicon (rosa dorada sobre vino), ícono para la pantalla de inicio del celular e imagen de vista previa al compartir el enlace (1200×630).

### Página
- **Portada** con el logo, frase, línea del rodio y tarjetas que giran como ruleta.
- **Catálogo** con selector deslizante **Mujer | Hombre** (las piezas Unisex salen en ambos; la línea Hombre usa un acento sobrio dorado), filtros por tipo según la línea, **12 piezas por página** con flechas y números, etiqueta «Agotado» y vista ampliada con galería. En celular se cambia de línea deslizando el dedo; `?para=hombre` abre directo el catálogo de hombre.
- **Calidad que perdura**: baño de rodio, no se oxida, no se mancha, acabado en espejo.
- **Cuida tus piezas**: guía de seis consejos.
- **Nuestra esencia** y **Cómo pedir** (tres pasos).
- **Ventana de bienvenida** configurable (por ahora: precios de lanzamiento).
- **Modo oscuro por defecto**, con botón para cambiar a claro (se recuerda la elección).
- Diseño adaptable a celular, tablet y computador; respeta la preferencia de «reducir movimiento».

### Mi cotización (carrito sin pagos)
- Botón **«Añadir a mi cotización»** en cada pieza y en su vista ampliada, con cantidad en el mismo lugar (máximo 5 por pieza; en 1 el «−» se vuelve basurita).
- Bolsa con contador arriba (computador) y **botón flotante** (celular y tablet).
- Carrito lateral con cantidades, basurita por pieza, nota opcional y sugerencias «Combina con tu cotización».
- **Enviar por WhatsApp** arma el mensaje con la lista y la nota; luego la cotización se vacía, con opción «Recuperar mi lista» durante 10 segundos.
- Las piezas agotadas no se pueden cotizar y salen solas de las listas guardadas.

### Panel de administración (Decap CMS)
- Inicio de sesión con GitHub mediante funciones propias del sitio (`functions/api/auth.js` y `callback.js`); solo entran cuentas con permiso de escritura en el repositorio.
- **Productos** como fichas con miniatura, búsqueda, filtros (Disponibles, Agotados, En la portada) y grupos por tipo.
- Vista previa de la tarjeta, de la ventana de bienvenida y de la portada mientras se edita.
- **Página**: portada, ventana de bienvenida, textos de las secciones y ajustes generales (WhatsApp, Instagram, modo inicial, «Mi cotización» y secciones visibles).
- **Tipos de producto** editables (Aretes, Sets, Anillos…): cada tipo crea su botón de filtro en la página.
- **Publicación directa**: Publicar → Publicar ahora (se quitaron los borradores para simplificar).
- **Asistente de subida de fotos**: limpia los nombres (tildes, ñ, espacios) y reduce las fotos grandes antes de subirlas.
- Apariencia JOHA y tipografía Atkinson Hyperlegible para facilitar la lectura.

### Seguridad y rendimiento
- Cabeceras de seguridad en `public/_headers` (HSTS, anti-incrustación, `nosniff`, política de permisos) y políticas de contenido (CSP) para la página y el panel.
- Inicio de sesión protegido con `state` aleatorio en cookie segura (anti-CSRF); el token solo se entrega a una ventana del mismo sitio; el *Client secret* vive solo en Cloudflare.
- Panel alojado en el propio sitio con versión fija (Decap CMS 3.17.3), fuera de buscadores.
- Solo se publica la carpeta `dist/`: las fichas internas, scripts y configuración no son accesibles desde la web.
- La página solo muestra fotos alojadas en `images/` y trata como texto todo lo que se escribe en el panel.
- Las fotos se reducen (máx. 1600 px) y convierten a WebP al subirlas desde el panel.
- Cada cambio queda registrado en GitHub y se puede revertir.

---

## 2. Cómo se usa el panel

1. Entrar a **/admin** → «Iniciar sesión con GitHub».
2. **Productos** → abrir una ficha o «+ producto».
3. Elegir **¿Para quién es?** (Mujer, Hombre o Unisex) y el tipo.
4. Para la foto: **Elige una imagen → Subir nuevo → elegir la foto → Confirmar selección**.
5. **Publicar → Publicar ahora**. Cloudflare publica en uno o dos minutos (la foto nueva se ve en el panel cuando termina).

¿Falta un tipo (por ejemplo Anillos)? Crearlo primero en **Tipos de producto** y luego elegirlo en la pieza.

Consejos:
- **Orden en el catálogo:** número menor aparece primero (10, 20, 30…; usa 15 para intercalar).
- **Portada:** activar «¿Mostrar en la portada?» en las piezas deseadas, o elegir fotos propias en Página → Portada.
- **Negrita en textos:** escribir la palabra entre `**asteriscos**`.
- **Fotos:** JPG, PNG o WebP. Las grandes se reducen solas al subirlas. Las HEIC del iPhone deben exportarse como JPG.

Para dar acceso a otra persona: GitHub → Fervelop/JOHA → Settings → Collaborators → Add people (permiso Write). Pedirle que active la verificación en dos pasos.

---

## 3. Lo que falta por hacer

### Contenido y marca
- [ ] **Logo oficial en vector** (si existe el archivo original del diseñador) para reemplazar la recreación.
- [ ] **Fotos con modelo** usando las piezas (aretes y collares puestos).
- [ ] **Manual de identidad visual**: uso del logo, colores, tipografías y ejemplos correctos e incorrectos.
- [ ] **Packaging**: bolsas, cajas, tarjetas y etiquetas con la nueva identidad.
- [ ] **Plantillas para redes** (1:1, 4:5 y 9:16) con el mismo estilo de la página.
- [ ] **Colecciones** con nombre propio, cuando se definan.

### Comercial
- [ ] **Precios**: decidir si se muestran en la página o se siguen dando por WhatsApp.
- [ ] **Información práctica**: envíos (ciudades y tiempos), formas de pago y cambios, en una sección de preguntas frecuentes.
- [ ] **Recomendaciones de cuidado** confirmadas por JOHA (las actuales son las habituales para baño de rodio).

### Técnico
- [ ] **Dominio propio** (por ejemplo joha.com.co): conectarlo en Cloudflare → Custom domains, cambiar `SITE_URL` y la dirección de la app OAuth de GitHub.
- [ ] **Redirigir la dirección vieja** `joha-jw.netlify.app` a la nueva cuando Netlify vuelva a permitir publicaciones.
- [ ] **Google Search Console** y, si aplica, **perfil de Google Business**.
- [ ] Revisar la página con **Lighthouse** en celular y ajustar lo que salga.
- [ ] Mantener **Decap CMS** actualizado (cada pocos meses, revisar nuevas versiones).

---

## 4. Ideas de nuevas funcionalidades

**Ventas**
- **Enlace por pieza**: cada pieza con su propio enlace para compartirla; al abrirlo se ve ampliada.
- **Etiqueta «Nuevo»** y sección de novedades, controladas desde el panel.
- **Avísame cuando vuelva**: en piezas agotadas, un botón que envía por WhatsApp el interés en esa pieza.
- **Combos o sets sugeridos**: armar desde el panel combinaciones (aretes + collar) que se añaden a la cotización con un toque.
- **Fechas especiales**: ventana de bienvenida y portada programadas para Amor y Amistad, Día de la Madre o Navidad.
- **Datos de la clienta** (nombre y ciudad, opcionales) incluidos en el mensaje de la cotización.

**Conocer a las clientas**
- **Medición de visitas** con una herramienta sin cookies (por ejemplo GoatCounter): de dónde llegan y qué piezas se cotizan más. Revisar si se necesita aviso de privacidad (Ley 1581).
- **Registro de cotizaciones** en el panel (piezas y fecha) para ver lo más pedido (por ejemplo con una función de Cloudflare).

**Confianza y comunidad**
- **Opiniones de clientas** reales, con su permiso, editables desde el panel.
- **Galería de Instagram** o sección «Así las lucen» con fotos de clientas (con permiso).
- **Tarjeta de regalo** o mensaje para regalo dentro de la cotización.

**Experiencia**
- **Búsqueda** en el catálogo y orden por novedad.
- **Zoom** en las fotos de la vista ampliada.
- **Versión en inglés**, si se proyecta vender fuera de Colombia.

---

## 5. Estructura del proyecto

| Ruta | Contenido |
| --- | --- |
| `public/index.html` | La página (estructura y estilos) |
| `public/js/app.js` | Catálogo, ruleta, ventana de bienvenida, «Mi cotización», textos y ajustes |
| `public/js/tema.js` | Modo oscuro por defecto y elección guardada |
| `public/data/*.json` | Portada, ventana de bienvenida, textos y ajustes (los edita el panel) |
| `public/images/productos/` | Fotos (las sube el panel) |
| `public/admin/` | Panel: configuración, vista previa, apariencia, asistente de subida y Decap CMS |
| `public/_headers` | Cabeceras de seguridad y caché |
| `public/404.html` | Página de «no encontrada» |
| `content/tipos/*.json` | Tipos de producto (los edita el panel) |
| `content/productos/*.json` | Una ficha por pieza (la edita el panel) |
| `functions/api/auth.js`, `callback.js` | Inicio de sesión del panel con GitHub |
| `scripts/build.js` | Construye `dist/` en cada publicación |
| `scripts/compilar.js` | Une tipos y fichas en `dist/data/tipos.json` y `productos.json` |

### Probar en el computador (opcional)
```
npm run build
npx wrangler pages dev dist
```
Para el panel en local se necesita un archivo `.dev.vars` con `GITHUB_CLIENT_ID` y `GITHUB_CLIENT_SECRET` de una app OAuth con callback `http://localhost:8788/api/callback` (no subir ese archivo).

### Subir cambios hechos fuera del panel
```
git pull
# copiar o editar archivos
git add -A
git commit -m "Descripción del cambio"
git push
```
Antes de hacer cambios por código, conviene no publicar desde el panel hasta terminar el `git push`.
