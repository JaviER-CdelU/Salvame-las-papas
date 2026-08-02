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

  aplicarLegibilidadMovil();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', crearBarraDeOrientacion, { once: true });
  else crearBarraDeOrientacion();
})();
