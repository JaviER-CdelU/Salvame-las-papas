#!/usr/bin/env node
/*
  Control previo de Sálvame las Papas.
  No modifica archivos: solamente informa errores y advertencias.
*/
const fs = require('fs');
const path = require('path');

const RAIZ = __dirname;
const ignorarCarpetas = new Set(['.git', 'node_modules', '.vercel']);
const errores = [];
const avisos = [];
let referenciasRevisadas = 0;

function recorrer(carpeta) {
  const encontrados = [];
  for (const entrada of fs.readdirSync(carpeta, { withFileTypes: true })) {
    if (ignorarCarpetas.has(entrada.name)) continue;
    const absoluto = path.join(carpeta, entrada.name);
    if (entrada.isDirectory()) encontrados.push(...recorrer(absoluto));
    else encontrados.push(absoluto);
  }
  return encontrados;
}

function relativo(archivo) {
  return path.relative(RAIZ, archivo).split(path.sep).join('/');
}

function esExterno(valor) {
  return /^(?:https?:|mailto:|tel:|sms:|whatsapp:|data:|blob:|javascript:|about:|#|\/\/)/i.test(valor);
}

function limpiarReferencia(valor) {
  let limpia = valor.trim().replace(/&amp;/g, '&');
  if (!limpia || esExterno(limpia) || /[`${}]/.test(limpia)) return null;
  limpia = limpia.split('#')[0].split('?')[0];
  if (!limpia) return null;
  try { limpia = decodeURIComponent(limpia); } catch (_) {}
  return limpia;
}

function resolverReferencia(origen, referencia) {
  const base = referencia.startsWith('/') ? RAIZ : path.dirname(origen);
  let destino = path.resolve(base, referencia.replace(/^\/+/, ''));
  if (!destino.startsWith(RAIZ + path.sep) && destino !== RAIZ) return null;
  if (fs.existsSync(destino) && fs.statSync(destino).isDirectory()) destino = path.join(destino, 'index.html');
  return destino;
}

function revisarReferenciasHTML(archivo, contenido) {
  const patron = /\b(?:href|src|action|poster)\s*=\s*(["'])(.*?)\1/gi;
  for (const coincidencia of contenido.matchAll(patron)) {
    const referencia = limpiarReferencia(coincidencia[2]);
    if (!referencia) continue;
    referenciasRevisadas++;
    const destino = resolverReferencia(archivo, referencia);
    if (!destino) {
      errores.push(`${relativo(archivo)}: la referencia sale de la carpeta del sitio: ${referencia}`);
    } else if (!fs.existsSync(destino)) {
      errores.push(`${relativo(archivo)}: falta el archivo usado en ${coincidencia[0]} → ${relativo(destino)}`);
    }
  }
}

function revisarIds(archivo, contenido) {
  const vistos = new Map();
  for (const coincidencia of contenido.matchAll(/\bid\s*=\s*(["'])(.*?)\1/gi)) {
    const id = coincidencia[2].trim();
    if (!id) continue;
    vistos.set(id, (vistos.get(id) || 0) + 1);
  }
  for (const [id, cantidad] of vistos) {
    if (cantidad > 1) errores.push(`${relativo(archivo)}: el identificador id="${id}" está repetido ${cantidad} veces.`);
  }
}

function revisarEstructuraHTML(archivo, contenido) {
  if (!/<html\b/i.test(contenido)) errores.push(`${relativo(archivo)}: falta la etiqueta <html>.`);
  if (!/<title>[^<]+<\/title>/i.test(contenido)) avisos.push(`${relativo(archivo)}: falta un título visible para la pestaña del navegador.`);
  if (!/<meta\s+[^>]*charset=/i.test(contenido)) avisos.push(`${relativo(archivo)}: falta declarar la codificación de caracteres.`);
}

function revisarReferenciasCSS(archivo, contenido) {
  for (const coincidencia of contenido.matchAll(/url\(\s*(["']?)([^)'"\s]+)\1\s*\)/gi)) {
    const referencia = limpiarReferencia(coincidencia[2]);
    if (!referencia) continue;
    referenciasRevisadas++;
    const destino = resolverReferencia(archivo, referencia);
    if (destino && !fs.existsSync(destino)) errores.push(`${relativo(archivo)}: falta el archivo indicado en CSS: ${relativo(destino)}`);
  }
}

const archivos = recorrer(RAIZ);
const paginas = archivos.filter(a => a.endsWith('.html'));

for (const archivo of paginas) {
  const contenido = fs.readFileSync(archivo, 'utf8');
  const htmlSinProgramas = contenido.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  revisarReferenciasHTML(archivo, htmlSinProgramas);
  for (const bloque of contenido.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    revisarReferenciasCSS(archivo, bloque[1]);
  }
  revisarIds(archivo, htmlSinProgramas);
  revisarEstructuraHTML(archivo, contenido);
}

for (const archivo of archivos.filter(a => a.endsWith('.css'))) {
  revisarReferenciasCSS(archivo, fs.readFileSync(archivo, 'utf8'));
}

console.log('\nCONTROL DEL SITIO — SÁLVAME LAS PAPAS');
console.log(`Páginas revisadas: ${paginas.length}`);
console.log(`Enlaces, imágenes y archivos revisados: ${referenciasRevisadas}`);

if (avisos.length) {
  console.log(`\nAVISOS (${avisos.length})`);
  avisos.forEach((x, i) => console.log(`${i + 1}. ${x}`));
}

if (errores.length) {
  console.log(`\nERRORES QUE HAY QUE CORREGIR (${errores.length})`);
  errores.forEach((x, i) => console.log(`${i + 1}. ${x}`));
  console.log('\nRESULTADO: NO PREPARAR EL ZIP TODAVÍA.');
  process.exitCode = 1;
} else {
  console.log('\nRESULTADO: CONTROL APROBADO. No se encontraron archivos ni enlaces internos rotos.');
  if (avisos.length) console.log('Los avisos conviene revisarlos, pero no bloquean el ZIP.');
}
