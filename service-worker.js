const CACHE_NAME = "salvame-papas-v32-orden-real";
const APP_SHELL = ["./","./index.html","./comercio.html","./admin.html","./seguimiento-comercios.html","./como-usar.html","./diccionario-entrerriano.html","./offline.html","./manifest.webmanifest","./version.json"];

self.addEventListener("install",event=>{
  // La nueva versión queda esperando. Solo se activa cuando el usuario
  // toca el botón “Actualizar ahora”.
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL))
  );
});

self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

self.addEventListener("message",event=>{
  if(event.data&&event.data.type==="SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET") return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin) return;

  if(request.mode==="navigate"||request.headers.get("accept")?.includes("text/html")){
    event.respondWith(
      fetch(request,{cache:"no-store"})
        .then(response=>{
          const copy=response.clone();
          caches.open(CACHE_NAME).then(cache=>cache.put(request,copy));
          return response;
        })
        .catch(()=>caches.match(request).then(r=>r||caches.match("./offline.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached=>{
      const fresh=fetch(request).then(response=>{
        if(response&&response.ok){
          const copy=response.clone();
          caches.open(CACHE_NAME).then(cache=>cache.put(request,copy));
        }
        return response;
      }).catch(()=>cached);
      return cached||fresh;
    })
  );
});
