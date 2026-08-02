const PROJECT = 'salvame-las-papas-cdelu';
const TIMEOUT_MS = 6500;
const FALLBACK = '/icon-512.png';

function valor(v) {
  if (!v || typeof v !== 'object') return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('booleanValue' in v) return v.booleanValue;
  if (v.arrayValue) return (v.arrayValue.values || []).map(valor);
  if (v.mapValue) {
    return Object.fromEntries(
      Object.entries(v.mapValue.fields || {}).map(([key, value]) => [key, valor(value)])
    );
  }
  return null;
}

async function fetchConTiempo(url, timeout = TIMEOUT_MS) {
  const controlador = new AbortController();
  const reloj = setTimeout(() => controlador.abort(), timeout);
  try {
    return await fetch(url, {
      signal: controlador.signal,
      cache: 'no-store',
      headers: { accept: 'application/json' }
    });
  } finally {
    clearTimeout(reloj);
  }
}

async function documento(path) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${path}`;
  const respuesta = await fetchConTiempo(url);
  if (!respuesta.ok) return null;
  const json = await respuesta.json();
  return Object.fromEntries(
    Object.entries(json.fields || {}).map(([key, value]) => [key, valor(value)])
  );
}

function cabeceras(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Accept,Content-Type');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=600');
}

function usarFallback(res, motivo) {
  res.setHeader('X-SLP-Image-Status', motivo);
  return res.redirect(302, FALLBACK);
}

module.exports = async (req, res) => {
  cabeceras(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const comercioId = String(req.query.c || '');
  const productoId = String(req.query.p || '');
  const indice = Math.max(0, Math.min(3, Number(req.query.i || 0)));

  if (
    !/^[A-Za-z0-9_-]{1,160}$/.test(comercioId) ||
    !/^[A-Za-z0-9_-]{1,160}$/.test(productoId)
  ) {
    return usarFallback(res, 'invalid-address');
  }

  try {
    const [comercio, producto] = await Promise.all([
      documento(`comercios/${comercioId}`),
      documento(`comercios/${comercioId}/productos/${productoId}`)
    ]);

    if (!comercio || !producto) return usarFallback(res, 'not-found');
    if (String(comercio.estado || '').toLowerCase() !== 'activo') {
      return usarFallback(res, 'commerce-inactive');
    }
    if (producto.disponible === false) return usarFallback(res, 'product-unavailable');

    const fotos = Array.isArray(producto.fotos)
      ? producto.fotos.filter(Boolean)
      : (producto.foto ? [producto.foto] : []);
    const origenImagen =
      fotos[indice] || fotos[0] || comercio.fotoPortada || comercio.logo;

    if (!origenImagen) return usarFallback(res, 'missing-image');

    if (/^data:image\/(png|jpeg|jpg|webp);base64,/i.test(origenImagen)) {
      const coincidencia = origenImagen.match(
        /^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/i
      );
      if (!coincidencia?.[2]) return usarFallback(res, 'invalid-base64');

      const tipo = coincidencia[1].toLowerCase() === 'jpg'
        ? 'jpeg'
        : coincidencia[1].toLowerCase();
      const buffer = Buffer.from(coincidencia[2], 'base64');

      if (!buffer.length) return usarFallback(res, 'empty-image');

      res.setHeader('Content-Type', `image/${tipo}`);
      res.setHeader('Content-Length', String(buffer.length));
      res.setHeader('X-SLP-Image-Status', 'ready');

      if (req.method === 'HEAD') return res.status(200).end();
      return res.status(200).send(buffer);
    }

    if (/^https?:\/\//i.test(origenImagen)) {
      res.setHeader('X-SLP-Image-Status', 'external-image');
      return res.redirect(302, origenImagen);
    }

    return usarFallback(res, 'unsupported-image');
  } catch (error) {
    console.error('Imagen Facebook V148:', error);
    return usarFallback(res, error?.name === 'AbortError' ? 'timeout' : 'server-error');
  }
};
