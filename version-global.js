(function () {
  'use strict';

  const paginasSinBarra = new Set(['admin.html', 'seguimiento-comercios.html']);

  function aplicarLegibilidadMovil() {
    if (document.getElementById('slp-legibilidad-movil')) return;
    const estilos = document.createElement('style');
    estilos.id = 'slp-legibilidad-movil';
    estilos.textContent = `
      :where(button,a,input,select,textarea,[role="button"]):focus-visible{outline:3px solid #ff8a18!important;outline-offset:2px!important}
      :where(main,section,article,form,fieldset,div){min-width:0}
      :where(p,li,label,small,strong,h1,h2,h3,h4){overflow-wrap:anywhere}
      :where(img,video,canvas){max-width:100%}
      @media(max-width:700px){
        :where(input:not([type="checkbox"]):not([type="radio"]),select,textarea){font-size:16px!important;min-height:44px}
        :where(button,[role="button"],.btn,.button,.boton,.action,.quick a){min-height:44px}
        :where(button,[role="button"],.btn,.button,.boton){padding-top:10px;padding-bottom:10px}
        :where(table){display:block;max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}
        :where(pre,code){max-width:100%;overflow-x:auto}
      }
    `;
    document.head.appendChild(estilos);
  }

  function paginaActual() {
    const nombre = location.pathname.split('/').pop();
    return (nombre || 'index.html').toLowerCase();
  }

  function crearBarraDeOrientacion() {
    if (!document.body || paginasSinBarra.has(paginaActual()) || document.querySelector('.slp-orientacion-global')) return;

    const estilos = document.createElement('style');
    estilos.id = 'slp-orientacion-estilos';
    estilos.textContent = `
      .slp-orientacion-global{position:relative;z-index:10020;background:#062d68;color:#fff;border-bottom:3px solid #f28a18;font-family:Arial,sans-serif}
      .slp-orientacion-interior{max-width:1280px;margin:auto;display:flex;align-items:center;gap:5px;padding:6px 12px;overflow-x:auto;scrollbar-width:thin}
      .slp-orientacion-titulo{font-weight:900;white-space:nowrap;margin-right:8px;font-size:14px}
      .slp-orientacion-global a{display:inline-flex;align-items:center;justify-content:center;min-height:35px;padding:6px 10px;border-radius:9px;color:#fff!important;text-decoration:none!important;font-size:13px;font-weight:800;white-space:nowrap;border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.08)}
      .slp-orientacion-global a:hover,.slp-orientacion-global a:focus-visible{background:#fff;color:#062d68!important;outline:2px solid #f28a18;outline-offset:1px}
      .slp-orientacion-global a[aria-current="page"]{background:#f28a18;color:#102d55!important;border-color:#ffd29c}
      @media(max-width:700px){.slp-orientacion-interior{padding:5px 7px}.slp-orientacion-titulo{font-size:0;margin-right:1px}.slp-orientacion-titulo::after{content:'🥔';font-size:20px}.slp-orientacion-global a{min-height:44px;padding:8px 10px;font-size:13px}}
    `;

    const enlaces = [
      { texto: '🏠 Inicio', href: './index.html', paginas: ['index.html', 'inicio.html'] },
      { texto: '🏪 Comercios', href: './comprar.html', paginas: ['comprar.html', 'comercios.html', 'ver-comercio.html'] },
      { texto: '🏷️ Particulares', href: './publicar-particular.html', paginas: ['publicar-particular.html', 'vendedor.html', 'mis-publicaciones.html', 'pago-particular.html'] },
      { texto: '📣 Publicar', href: './planes-comercios.html', paginas: ['planes-comercios.html', 'registrar-comercio.html', 'pago-basico.html', 'pago-destacado.html', 'pago-pro.html', 'pago-plan.html'] },
      { texto: '🔐 Mi comercio', href: './comercio.html', paginas: ['comercio.html'] },
      { texto: '📖 Ayuda', href: './como-usar.html', paginas: ['como-usar.html'] }
    ];

    const barra = document.createElement('nav');
    barra.className = 'slp-orientacion-global';
    barra.setAttribute('aria-label', 'Accesos principales de Sálvame las Papas');
    const interior = document.createElement('div');
    interior.className = 'slp-orientacion-interior';
    const titulo = document.createElement('span');
    titulo.className = 'slp-orientacion-titulo';
    titulo.textContent = 'Sálvame las Papas';
    interior.appendChild(titulo);

    const actual = paginaActual();
    enlaces.forEach(datos => {
      const enlace = document.createElement('a');
      enlace.href = datos.href;
      enlace.textContent = datos.texto;
      if (datos.paginas.includes(actual)) enlace.setAttribute('aria-current', 'page');
      interior.appendChild(enlace);
    });
    barra.appendChild(interior);
    document.head.appendChild(estilos);
    document.body.prepend(barra);
  }

  function aplicarVersion(version) {
    if (!/^V\d+$/.test(version)) return;
    document.querySelectorAll('meta[name="app-version"]').forEach(meta => {
      meta.setAttribute('content', version);
    });
    document.querySelectorAll('[data-app-version]').forEach(elemento => {
      elemento.textContent = version;
    });
  }

  fetch('./version.json', { cache: 'no-store' })
    .then(respuesta => {
      if (!respuesta.ok) throw new Error('No se pudo leer version.json');
      return respuesta.json();
    })
    .then(datos => aplicarVersion(String(datos.version || '').trim()))
    .catch(error => console.warn('Versión del sitio:', error.message));

  /* V148 — comprobación real antes de abrir Facebook */
  function crearAvisoFacebook() {
    let aviso = document.getElementById('slp-facebook-estado-v148');
    if (aviso) return aviso;

    const estilos = document.createElement('style');
    estilos.textContent = `
      #slp-facebook-estado-v148{
        position:fixed;right:18px;bottom:18px;z-index:100000;
        width:min(430px,calc(100% - 36px));padding:14px 16px;border-radius:14px;
        background:#fff8df;color:#654500;border:1px solid #e5bd55;
        box-shadow:0 18px 45px rgba(15,35,60,.24);font:700 14px/1.45 Arial,sans-serif;
        opacity:0;transform:translateY(25px);pointer-events:none;transition:.25s ease
      }
      #slp-facebook-estado-v148.visible{opacity:1;transform:none}
      #slp-facebook-estado-v148.ok{background:#e9f8ee;color:#176237;border-color:#9bd0ae}
      #slp-facebook-estado-v148.error{background:#fff0f0;color:#922932;border-color:#e5aeb3}
    `;
    document.head.appendChild(estilos);

    aviso = document.createElement('div');
    aviso.id = 'slp-facebook-estado-v148';
    aviso.setAttribute('role', 'status');
    aviso.setAttribute('aria-live', 'polite');
    document.body.appendChild(aviso);
    return aviso;
  }

  let temporizadorFacebook = null;
  function estadoFacebook(texto, tipo = '') {
    const aviso = crearAvisoFacebook();
    clearTimeout(temporizadorFacebook);
    aviso.className = `visible ${tipo}`.trim();
    aviso.textContent = texto;
    temporizadorFacebook = setTimeout(() => {
      aviso.className = '';
    }, tipo === 'error' ? 9000 : 5200);
  }

  function escribirVentanaPreparando(ventana, titulo, detalle) {
    try {
      ventana.document.open();
      ventana.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>${titulo}</title>
        <style>
          *{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;
          background:#f2f6fb;color:#17314d;font-family:Arial,sans-serif;padding:24px}
          .caja{max-width:560px;text-align:center;background:#fff;border:1px solid #d7e2ed;
          border-radius:22px;padding:36px;box-shadow:0 16px 45px #17314d22}
          .rueda{width:54px;height:54px;margin:0 auto 22px;border:6px solid #dbe8f4;
          border-top-color:#f27a1a;border-radius:50%;animation:girar .8s linear infinite}
          h1{color:#063b73;font-size:1.65rem}p{line-height:1.5;color:#65788c}
          @keyframes girar{to{transform:rotate(360deg)}}
        </style></head><body><main class="caja"><div class="rueda"></div>
        <h1>${titulo}</h1><p>${detalle}</p></main></body></html>`);
      ventana.document.close();
    } catch (_) {}
  }

  function escribirVentanaError(ventana, mensaje) {
    try {
      ventana.document.open();
      ventana.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>No se pudo preparar Facebook</title>
        <style>
          *{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;
          background:#fff3f3;color:#5b252a;font-family:Arial,sans-serif;padding:24px}
          .caja{max-width:600px;background:#fff;border:1px solid #e9b8bd;border-radius:22px;
          padding:34px;box-shadow:0 16px 45px #5b252a20}
          h1{color:#a32933}p{line-height:1.55}.cerrar{display:inline-block;margin-top:12px;
          border:0;border-radius:11px;padding:12px 18px;background:#063b73;color:#fff;font-weight:800;cursor:pointer}
        </style></head><body><main class="caja"><h1>Facebook no pudo recibir la tarjeta</h1>
        <p>${mensaje}</p><button class="cerrar" onclick="window.close()">Cerrar esta ventana</button>
        </main></body></html>`);
      ventana.document.close();
    } catch (_) {}
  }

  function mensajeErrorFacebook(error) {
    const codigo = String(error?.message || error || '');
    if (codigo.includes('timeout')) return 'La preparación tardó demasiado. Volvé a probar dentro de un minuto.';
    if (codigo.includes('404')) return 'El comercio o el producto no está activo, disponible o correctamente guardado.';
    if (codigo.includes('503')) return 'Vercel o Firebase demoraron en responder. No se publicó nada.';
    if (codigo.includes('popup')) return 'El navegador bloqueó la ventana de Facebook. Permití ventanas emergentes para este sitio.';
    return 'No se pudo comprobar la tarjeta del producto. No se publicó nada en Facebook.';
  }

  function instalarReparacionFacebook() {
    if (paginaActual() !== 'comercio.html') return;

    let intentos = 0;
    const esperar = setInterval(() => {
      intentos += 1;
      const original = window.compartirProductoRedV117;

      if (typeof original !== 'function') {
        if (intentos >= 80) clearInterval(esperar);
        return;
      }
      if (original.__slpFacebookV148) {
        clearInterval(esperar);
        return;
      }

      async function compartirReparado(id, red) {
        if (red !== 'facebook') return original.apply(this, arguments);

        const ventana = window.open('about:blank', 'facebook-share', 'width=760,height=680');
        if (!ventana) {
          estadoFacebook('El navegador bloqueó Facebook. Habilitá las ventanas emergentes para Sálvame las Papas.', 'error');
          return;
        }

        escribirVentanaPreparando(
          ventana,
          'Preparando la publicación…',
          'Estamos comprobando el producto, el comercio y la imagen antes de abrir Facebook.'
        );
        estadoFacebook('Preparando y comprobando la tarjeta de Facebook…');

        let direccionFacebook = '';
        const abrirReal = window.open;
        window.open = function(url) {
          direccionFacebook = String(url || '');
          return ventana;
        };

        try {
          await original.call(this, id, red);
        } finally {
          window.open = abrirReal;
        }

        try {
          if (!direccionFacebook.includes('facebook.com/sharer')) {
            throw new Error('popup-url');
          }

          const urlFacebook = new URL(direccionFacebook);
          const tarjeta = urlFacebook.searchParams.get('u');
          if (!tarjeta) throw new Error('404 tarjeta');

          const comprobar = new URL(tarjeta);
          comprobar.searchParams.set('check', '1');
          comprobar.searchParams.set('_v', String(Date.now()));

          const controlador = new AbortController();
          const reloj = setTimeout(() => controlador.abort('timeout'), 9000);

          let respuesta;
          try {
            respuesta = await fetch(comprobar.href, {
              cache: 'no-store',
              signal: controlador.signal,
              headers: { 'Accept': 'application/json' }
            });
          } catch (error) {
            if (controlador.signal.aborted) throw new Error('timeout');
            throw error;
          } finally {
            clearTimeout(reloj);
          }

          const datos = await respuesta.json().catch(() => ({}));
          if (!respuesta.ok || datos.ok !== true) {
            throw new Error(String(respuesta.status || 503));
          }

          estadoFacebook('✓ Tarjeta comprobada. Abriendo Facebook.', 'ok');
          try { ventana.opener = null; } catch (_) {}
          ventana.location.replace(direccionFacebook);
        } catch (error) {
          const mensaje = mensajeErrorFacebook(error);
          estadoFacebook(mensaje, 'error');
          escribirVentanaError(ventana, mensaje);
          console.error('Facebook V148:', error);
        }
      }

      compartirReparado.__slpFacebookV148 = true;
      window.compartirProductoRedV117 = compartirReparado;
      clearInterval(esperar);
    }, 250);
  }

  aplicarLegibilidadMovil();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      crearBarraDeOrientacion();
      instalarReparacionFacebook();
    }, { once: true });
  } else {
    crearBarraDeOrientacion();
    instalarReparacionFacebook();
  }
})();
