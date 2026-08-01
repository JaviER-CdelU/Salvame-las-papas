const PROJECT='salvame-las-papas-cdelu';

function valor(v){
  if(!v||typeof v!=='object')return null;
  if('stringValue'in v)return v.stringValue;
  if('integerValue'in v)return Number(v.integerValue);
  if('doubleValue'in v)return Number(v.doubleValue);
  if('booleanValue'in v)return v.booleanValue;
  if('timestampValue'in v)return v.timestampValue;
  if('nullValue'in v)return null;
  if(v.arrayValue)return(v.arrayValue.values||[]).map(valor);
  if(v.mapValue)return campos(v.mapValue.fields||{});
  return null;
}
function campos(fields){return Object.fromEntries(Object.entries(fields||{}).map(([k,v])=>[k,valor(v)]))}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function dinero(v){return Number(v||0).toLocaleString('es-AR')}
async function documento(path){
  const url=`https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${path}`;
  const r=await fetch(url,{headers:{accept:'application/json'}});
  if(!r.ok)return null;
  const j=await r.json();return campos(j.fields);
}
module.exports=async(req,res)=>{
  const comercioId=String(req.query.c||''),productoId=String(req.query.p||'');
  if(!/^[A-Za-z0-9_-]{1,160}$/.test(comercioId)||!/^[A-Za-z0-9_-]{1,160}$/.test(productoId))return res.status(400).send('Dirección de producto inválida');
  try{
    const [c,p]=await Promise.all([documento(`comercios/${comercioId}`),documento(`comercios/${comercioId}/productos/${productoId}`)]);
    if(!c||!p||c.estado!=='activo'||p.disponible===false)return res.status(404).send('Producto no disponible');
    const proto=req.headers['x-forwarded-proto']||'https',host=req.headers['x-forwarded-host']||req.headers.host;
    const origen=`${proto}://${host}`,url=`${origen}/api/producto?c=${encodeURIComponent(comercioId)}&p=${encodeURIComponent(productoId)}`;
    const imagen=`${origen}/api/producto-imagen?c=${encodeURIComponent(comercioId)}&p=${encodeURIComponent(productoId)}&i=0`;
    const titulo=`${p.nombre||'Producto'} — $${dinero(p.precio)}`;
    const descripcion=`Disponible en ${c.nombre||'este comercio'}. ${p.descripcion||'Consultá disponibilidad, entrega y forma de pago en Sálvame las Papas.'}`;
    const ficha=`${origen}/ver-comercio.html?id=${encodeURIComponent(comercioId)}`;
    const tel=String(c.telefono||'').replace(/\D/g,''),wa=tel?`https://wa.me/${tel}?text=${encodeURIComponent(`Hola ${c.nombre}. Vi ${p.nombre} a $${dinero(p.precio)} en Sálvame las Papas.`)}`:'';
    res.setHeader('Cache-Control','public, s-maxage=300, stale-while-revalidate=900');
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.status(200).send(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(titulo)} | Sálvame las Papas</title><meta name="description" content="${esc(descripcion)}"><link rel="canonical" href="${esc(url)}"><meta property="og:type" content="product"><meta property="og:site_name" content="Sálvame las Papas"><meta property="og:locale" content="es_AR"><meta property="og:url" content="${esc(url)}"><meta property="og:title" content="${esc(titulo)}"><meta property="og:description" content="${esc(descripcion)}"><meta property="og:image" content="${esc(imagen)}"><meta property="og:image:alt" content="${esc(p.nombre||'Producto')} de ${esc(c.nombre||'comercio')}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(titulo)}"><meta name="twitter:description" content="${esc(descripcion)}"><meta name="twitter:image" content="${esc(imagen)}"><style>*{box-sizing:border-box}body{margin:0;background:#f2f6fb;color:#17314d;font-family:Arial,sans-serif}header{background:#0d2544;color:#fff;border-bottom:4px solid #ef0014;padding:18px}.brand{width:min(980px,100%);margin:auto;font:bold 1.25rem Georgia}.brand b{color:#ff7717}main{width:min(980px,calc(100% - 28px));margin:28px auto}.card{background:#fff;border:1px solid #d4dfeb;border-radius:20px;display:grid;grid-template-columns:minmax(280px,46%) 1fr;overflow:hidden;box-shadow:0 14px 38px #1639591c}.photo{min-height:390px;background:#fff;display:grid;place-items:center}.photo img{width:100%;height:100%;max-height:470px;object-fit:contain;padding:12px}.copy{padding:clamp(24px,5vw,50px);display:flex;flex-direction:column;justify-content:center}.tag{color:#e85b00;font-size:.75rem;font-weight:900;text-transform:uppercase}.copy h1{font:900 clamp(1.8rem,4vw,3rem) Georgia;color:#063978;margin:8px 0}.price{font:900 2rem Georgia;color:#d90000}.commerce{font-weight:800;margin:8px 0;color:#3e5e7e}.desc{line-height:1.55}.actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:18px}.actions a{padding:12px 15px;border-radius:10px;text-decoration:none;font-weight:800;background:#0b4e96;color:#fff}.actions .wa{background:#159b54}.notice{margin-top:14px;color:#667b91;font-size:.8rem}@media(max-width:680px){.card{grid-template-columns:1fr}.photo{min-height:230px}.copy{padding:22px}}</style></head><body><header><div class="brand">Sálvame <b>las Papas 🥔</b></div></header><main><article class="card"><div class="photo"><img src="${esc(imagen)}" alt="${esc(p.nombre||'Producto')}"></div><div class="copy"><span class="tag">Publicado en Sálvame las Papas</span><h1>${esc(p.nombre||'Producto')}</h1><div class="price">$${dinero(p.precio)}</div><div class="commerce">🏪 ${esc(c.nombre||'Comercio')}</div><p class="desc">${esc(p.descripcion||'Consultá disponibilidad, entrega y forma de pago directamente con el comercio.')}</p><div class="actions"><a href="${esc(ficha)}">Ver todo lo que vende</a>${wa?`<a class="wa" href="${esc(wa)}">Consultar por WhatsApp</a>`:''}</div><p class="notice">La venta, el pago y la entrega se coordinan directamente con el comercio.</p></div></article></main></body></html>`);
  }catch(e){console.error(e);res.status(500).send('No se pudo preparar la publicación')}
};
