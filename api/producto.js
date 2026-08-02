const PROJECT = 'salvame-las-papas-cdelu';
const TIMEOUT_MS = 6500;

function valor(v) {
  if (!v || typeof v !== 'object') return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('nullValue' in v) return null;
  if (v.arrayValue) return (v.arrayValue.values || []).map(valor);
  if (v.mapValue) return campos(v.mapValue.fields || {});
  return null;
}

function campos(fields) {
  return Object.fromEntries(
    Object.entries(fields || {}).map(([key, value]) => [key, valor(value)])
  );
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

function dinero(value) {
  return Number(value || 0).toLocaleString('es-AR');
}

async function fetchConTiempo(url, opciones = {}, timeout = TIMEOUT_MS) {
  const controlador = new AbortController();
  const reloj = setTimeout(() => controlador.abort(), timeout);

  try {
    return await fetch(url, {
      ...opciones,
      signal: controlador.signal,
      headers: {
        accept: 'application/json',
        ...(opciones.headers || {})
      }
    });
  } finally {
    clearTimeout(reloj);
  }
}

async function documento(path) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${path}`;
  const respuesta = await fetchConTiempo(url, { cache: 'no-store' });

  if (respuesta.status === 404) return null;
  if (!respuesta.ok) {
    const error = new Error(`Firebase respondió ${respuesta.status}`);
    error.status = respuesta.status;
    throw error;
  }

  const json = await respuesta.json();
  return campos(json.fields);
}

function cabecerasComunes(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Accept,Content-Type');
  res.setHeader('Access-Control-Expose-Headers', 'X-SLP-Card-Status');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

function origenSolicitud(req) {
  const protocolo = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${protocolo}://${host}`;
}

module.exports = async (req, res) => {
  cabecerasComunes(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const comercioId = String(req.query.c || '');
  const productoId = String(req.query.p || '');
  const esComprobacion = String(req.query.check || '') === '1';

  if (
    !/^[A-Za-z0-9_-]{1,160}$/.test(comercioId) ||
    !/^[A-Za-z0-9_-]{1,160}$/.test(productoId)
  ) {
    res.setHeader('X-SLP-Card-Status', 'invalid-address');
    return esComprobacion
      ? res.status(400).json({ ok: false, error: 'Dirección de producto inválida' })
      : res.status(400).send('Dirección de producto inválida');
  }

  try {
    const [comercio, producto] = await Promise.all([
      documento(`comercios/${comercioId}`),
      documento(`comercios/${comercioId}/productos/${productoId}`)
    ]);

    if (!comercio || !producto) {
      res.setHeader('X-SLP-Card-Status', 'not-found');
      return esComprobacion
        ? res.status(404).json({ ok: false, error: 'Comercio o producto inexistente' })
        : res.status(404).send('Producto no disponible');
    }

    if (String(comercio.estado || '').toLowerCase() !== 'activo') {
      res.setHeader('X-SLP-Card-Status', 'commerce-inactive');
      return esComprobacion
        ? res.status(404).json({ ok: false, error: 'El comercio no está activo' })
        : res.status(404).send('Comercio no disponible');
    }

    if (producto.disponible === false) {
      res.setHeader('X-SLP-Card-Status', 'product-unavailable');
      return esComprobacion
        ? res.status(404).json({ ok: false, error: 'El producto no está disponible' })
        : res.status(404).send('Producto no disponible');
    }

    const origen = origenSolicitud(req);
    const version = encodeURIComponent(String(req.query.v || '148'));
    const url = `${origen}/api/producto?c=${encodeURIComponent(comercioId)}&p=${encodeURIComponent(productoId)}&v=${version}`;
    const imagen = `${origen}/api/producto-imagen?c=${encodeURIComponent(comercioId)}&p=${encodeURIComponent(productoId)}&i=0&v=${version}`;
    const fotos = Array.isArray(producto.fotos)
      ? producto.fotos.filter(Boolean)
      : (producto.foto ? [producto.foto] : []);
    const tieneImagen = Boolean(fotos[0] || comercio.fotoPortada || comercio.logo);

    if (esComprobacion) {
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('X-SLP-Card-Status', 'ready');
      return res.status(200).json({
        ok: true,
        comercio: comercio.nombre || 'Comercio',
        producto: producto.nombre || 'Producto',
        imagenDisponible: tieneImagen,
        tarjeta: url,
        imagen
      });
    }

    const titulo = `${producto.nombre || 'Producto'} — $${dinero(producto.precio)}`;
    const descripcion =
      `Hacé clic y comprá en ${comercio.nombre || 'este comercio'} desde Sálvame las Papas. ` +
      `${producto.descripcion || 'Consultá disponibilidad, entrega y forma de pago.'}`;
    const ficha = `${origen}/ver-comercio.html?id=${encodeURIComponent(comercioId)}`;
    const telefono = String(comercio.telefono || '').replace(/\D/g, '');
    const whatsapp = telefono
      ? `https://wa.me/${telefono}?text=${encodeURIComponent(
          `Hola ${comercio.nombre}. Vi ${producto.nombre} a $${dinero(producto.precio)} en Sálvame las Papas.`
        )}`
      : '';

    res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-SLP-Card-Status', 'ready');

    if (req.method === 'HEAD') return res.status(200).end();

    return res.status(200).send(`<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(titulo)} | Sálvame las Papas</title>
<meta name="description" content="${esc(descripcion)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="product">
<meta property="og:site_name" content="Sálvame las Papas">
<meta property="og:locale" content="es_AR">
<meta property="og:url" content="${esc(url)}">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descripcion)}">
<meta property="og:image" content="${esc(imagen)}">
<meta property="og:image:secure_url" content="${esc(imagen)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="1200">
<meta property="og:image:alt" content="${esc(producto.nombre || 'Producto')} de ${esc(comercio.nombre || 'comercio')}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(titulo)}">
<meta name="twitter:description" content="${esc(descripcion)}">
<meta name="twitter:image" content="${esc(imagen)}">
<style>
*{box-sizing:border-box}body{margin:0;background:#f2f6fb;color:#17314d;font-family:Arial,sans-serif}
header{background:#0d2544;color:#fff;border-bottom:4px solid #ef0014;padding:18px}
.brand{width:min(980px,100%);margin:auto;font:bold 1.25rem Georgia}.brand b{color:#ff7717}
main{width:min(980px,calc(100% - 28px));margin:28px auto}
.card{background:#fff;border:1px solid #d4dfeb;border-radius:20px;display:grid;grid-template-columns:minmax(280px,46%) 1fr;overflow:hidden;box-shadow:0 14px 38px #1639591c}
.photo{min-height:390px;background:#fff;display:grid;place-items:center}
.photo img{width:100%;height:100%;max-height:470px;object-fit:contain;padding:12px}
.copy{padding:clamp(24px,5vw,50px);display:flex;flex-direction:column;justify-content:center}
.tag{color:#e85b00;font-size:.75rem;font-weight:900;text-transform:uppercase}
.copy h1{font:900 clamp(1.8rem,4vw,3rem) Georgia;color:#063978;margin:8px 0}
.price{font:900 2rem Georgia;color:#d90000}.commerce{font-weight:800;margin:8px 0;color:#3e5e7e}
.desc{line-height:1.55}.actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:18px}
.actions a{padding:12px 15px;border-radius:10px;text-decoration:none;font-weight:800;background:#0b4e96;color:#fff}
.actions .wa{background:#159b54}.notice{margin-top:14px;color:#667b91;font-size:.8rem}
@media(max-width:680px){.card{grid-template-columns:1fr}.photo{min-height:230px}.copy{padding:22px}}
</style>
</head>
<body>
<header><div class="brand">Sálvame <b>las Papas 🥔</b></div></header>
<main><article class="card">
<div class="photo"><img src="${esc(imagen)}" alt="${esc(producto.nombre || 'Producto')}"></div>
<div class="copy">
<span class="tag">Publicado en Sálvame las Papas</span>
<h1>${esc(producto.nombre || 'Producto')}</h1>
<div class="price">$${dinero(producto.precio)}</div>
<div class="commerce">🏪 ${esc(comercio.nombre || 'Comercio')}</div>
<p class="desc">${esc(producto.descripcion || 'Consultá disponibilidad, entrega y forma de pago directamente con el comercio.')}</p>
<div class="actions">
<a href="${esc(ficha)}">Ver todo lo que vende</a>
${whatsapp ? `<a class="wa" href="${esc(whatsapp)}">Consultar por WhatsApp</a>` : ''}
</div>
<p class="notice">La venta, el pago y la entrega se coordinan directamente con el comercio.</p>
</div></article></main>
</body>
</html>`);
  } catch (error) {
    console.error('Tarjeta Facebook V148:', error);
    const demora = error?.name === 'AbortError';
    res.setHeader('X-SLP-Card-Status', demora ? 'timeout' : 'server-error');
    const mensaje = demora
      ? 'Firebase tardó demasiado en responder'
      : 'No se pudo preparar la publicación';

    return esComprobacion
      ? res.status(503).json({ ok: false, error: mensaje })
      : res.status(503).send(mensaje);
  }
};
