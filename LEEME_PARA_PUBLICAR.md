# Sálvame las Papas — PWA lista para publicar

Subí **todo el contenido de esta carpeta** a la raíz del repositorio de GitHub.

## Archivos principales
- `index.html` — página pública
- `comercio.html` — panel de comercios
- `admin.html` — administración
- `manifest.webmanifest` — configuración de instalación
- `service-worker.js` — caché y modo sin conexión
- `offline.html` — pantalla sin internet
- `icons/` — íconos para celulares y PC

## Después de publicar
1. Activá GitHub Pages desde `Settings → Pages`.
2. Abrí la URL publicada una vez y recargala.
3. Agregá el dominio `usuario.github.io` en Firebase Authentication → Authorized domains.
4. En Android/Chrome aparecerá el botón **Instalar app** cuando el navegador valide la PWA.
5. En iPhone: Safari → Compartir → **Agregar a pantalla de inicio**.

## Nota
El modo sin conexión guarda la interfaz. Las operaciones de Firebase (login, altas, cambios, precios nuevos) necesitan internet.

## Nueva versión: clientes registrados y categorías libres

- El visitante puede mirar y armar el carrito sin cuenta.
- Al confirmar, inicia sesión o crea una cuenta de cliente.
- El pedido se guarda en la colección `pedidos` y luego abre WhatsApp.
- El panel del comercio muestra los pedidos y permite cambiar su estado.
- La categoría del comercio ahora se puede escribir libremente.
- Las categorías de comercios activos se agregan automáticamente a los filtros públicos.

IMPORTANTE: antes de probar pedidos, las reglas de Firestore deben permitir que el cliente autenticado cree su pedido y que el dueño del comercio pueda leer y actualizar los pedidos de su comercio.
