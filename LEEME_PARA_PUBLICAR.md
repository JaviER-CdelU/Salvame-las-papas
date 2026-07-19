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
