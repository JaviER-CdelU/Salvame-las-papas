const CACHE_PREFIX = 'salvame-las-papas-';
const OFFLINE_URL = './offline.html';
const ARCHIVOS_ESENCIALES = [
  './',
  './index.html',
  './comprar.html',
  './planes-comercios.html',
  './publicar-particular.html',
  './como-usar.html',
  './offline.html',
  './manifest.webmanifest',
  './version.json',
  './version-global.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png'
];

async function nombreCacheActual() {
  try {
    const respuesta = await fetch('./version.json', { cache: 'no-store' });
    const datos = await respuesta.json();
    const version = String(datos.version || 'actual').replace(/[^a-z0-9_-]/gi, '');
    return CACHE_PREFIX + version;
  } catch (_error) {
    const existentes = (await caches.keys()).filter(nombre => nombre.startsWith(CACHE_PREFIX));
    return existentes.at(-1) || (CACHE_PREFIX + 'actual');
  }
}

self.addEventListener('install', evento => {
  evento.waitUntil((async () => {
    const cache = await caches.open(await nombreCacheActual());
    await Promise.allSettled(ARCHIVOS_ESENCIALES.map(async archivo => {
      const respuesta = await fetch(archivo, { cache: 'reload' });
      if (respuesta.ok) await cache.put(archivo, respuesta);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', evento => {
  evento.waitUntil((async () => {
    const cacheActual = await nombreCacheActual();
    const nombres = await caches.keys();
    await Promise.all(nombres
      .filter(nombre => nombre.startsWith(CACHE_PREFIX) && nombre !== cacheActual)
      .map(nombre => caches.delete(nombre)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', evento => {
  if (evento.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', evento => {
  const solicitud = evento.request;
  if (solicitud.method !== 'GET') return;

  const url = new URL(solicitud.url);
  if (url.origin !== self.location.origin) return;

  const esPagina = solicitud.mode === 'navigate' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.json');

  if (esPagina) {
    evento.respondWith((async () => {
      try {
        const respuesta = await fetch(solicitud, { cache: 'no-store' });
        if (respuesta.ok) {
          const cache = await caches.open(await nombreCacheActual());
          await cache.put(solicitud, respuesta.clone());
        }
        return respuesta;
      } catch (_error) {
        const guardada = await caches.match(solicitud, { ignoreSearch: true });
        if (guardada) return guardada;
        return (await caches.match(OFFLINE_URL)) || Response.error();
      }
    })());
    return;
  }

  evento.respondWith((async () => {
    const guardada = await caches.match(solicitud, { ignoreSearch: true });
    const actualizar = fetch(solicitud).then(async respuesta => {
      if (respuesta.ok) {
        const cache = await caches.open(await nombreCacheActual());
        await cache.put(solicitud, respuesta.clone());
      }
      return respuesta;
    }).catch(() => null);

    if (guardada) {
      evento.waitUntil(actualizar);
      return guardada;
    }
    return (await actualizar) || Response.error();
  })());
});
