/* Funciones públicas compartidas por Comprar y Registrar comercio. */
(function(){
  window.alternarDescripcionParticularV141=btn=>{
    const desc=btn.previousElementSibling,abierta=desc.classList.toggle('completa-v141');
    btn.textContent=abierta?'Ver menos':'Ver descripción completa';
  };
  window.compartirParticularV115=async(tituloCod,id,articulo)=>{
    const titulo=decodeURIComponent(tituloCod),url=location.href.split('#')[0]+'#particular='+encodeURIComponent(id)+'&articulo='+Number(articulo),text=`${titulo} · Venta o alquiler particular\nEncontralo en Sálvame las Papas`;
    try{if(navigator.share)await navigator.share({title:titulo,text,url});else{await navigator.clipboard.writeText(text+'\n'+url);window.toast?.('🔗 Publicación copiada')}}catch(e){if(e.name!=='AbortError')window.toast?.('No se pudo compartir')}
  };
  window.abrirParticularDesdeEnlaceV142=()=>{
    const m=location.hash.match(/^#particular=([^&]+)&articulo=(\d+)$/);if(!m)return;
    const el=document.getElementById('particular-'+decodeURIComponent(m[1])+'-'+m[2]);
    if(el){el.classList.add('enlace-activo-v142');el.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>el.classList.remove('enlace-activo-v142'),5000)}
    else{const grid=document.getElementById('seller-public-grid-v41');if(grid&&!grid.querySelector('.enlace-ausente-v142'))grid.insertAdjacentHTML('afterbegin','<div class="seller-empty-v41 enlace-ausente-v142">La publicación compartida ya no está disponible. Abajo podés ver otros avisos vigentes.</div>')}
  };
  window.denunciarParticularV145=(tituloCod,nombreCod,id,articulo)=>{
    const titulo=decodeURIComponent(tituloCod),nombre=decodeURIComponent(nombreCod),url=location.href.split('#')[0]+'#particular='+encodeURIComponent(id)+'&articulo='+Number(articulo),texto=`Hola. Quiero denunciar una publicación de Sálvame las Papas.\n\nPublicación: ${titulo}\nParticular: ${nombre}\nEnlace: ${url}\n\nMotivo: `;
    window.open('https://wa.me/5493442490585?text='+encodeURIComponent(texto),'_blank','noopener,noreferrer');
  };
  window.addEventListener('hashchange',window.abrirParticularDesdeEnlaceV142);
})();
