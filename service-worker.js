const CACHE_NAME = "salvame-papas-v78-portada-movil-corregida";
const APP_SHELL = ["./","./index.html","./images/portada-celular-v78.png","./images/portada-celular-v78.webp","./images/portada-escritorio-v78.png","./images/portada-escritorio-v78.webp","./images/cabecera-particulares-v77.png","./images/cabecera-particulares-v77.webp","./images/portada-celular-v76.png","./images/portada-celular-v76.webp","./images/portada-escritorio-v76.webp","./images/cabecera-planes-comercios-v69.png","./images/cabecera-planes-comercios-v69.webp","./images/portada-salvame-papas-v67.png","./images/portada-salvame-papas-v67.webp","./images/portada-salvame-papas.png","./images/portada-salvame-papas.webp","./pago-pro.html","./pago-destacado.html","./pago-basico.html","./pago-particular.html","./publicar-particular.html","./registrar-comercio.html","./planes-comercios.html","./comprar.html","./comercio.html","./admin.html","./seguimiento-comercios.html","./como-usar.html","./diccionario-entrerriano.html","./offline.html","./pago-plan.html","./restablecer-clave.html","./manifest.webmanifest","./version.json"];

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
  if(event.data&&event.data.type==="SKIP_WAITING") 
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
