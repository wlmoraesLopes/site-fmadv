// Migração única do site antigo (HTML + artigos.json) para content/*.json e uploads/.
// Executado uma vez no ramo site-novo; a saída é commitada e este script não roda no build.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { basename } from 'node:path';
import { slugify, uniqueSlug, parseDataExtenso } from '../lib/text.mjs';

const ler = (p) => readFileSync(p, 'utf8').replace(/^﻿/, '');
const pega = (s, re) => (s.match(re) || [])[1]?.trim() ?? '';
const textoPuro = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const escapa = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function resumir(texto, max) {
  if (texto.length <= max) return texto;
  const corte = texto.slice(0, max - 1);
  return corte.slice(0, corte.lastIndexOf(' ')).replace(/[,;:.\s]+$/, '') + '…';
}

// ---------- Profissionais ----------
const EQUIPE = [
  ['franceschini', 'fundador', 1], ['cmiranda', 'fundador', 2],
  ['thays', 'socio', 1], ['fernando', 'socio', 2], ['sandra', 'socio', 3],
  ['cristhiane', 'parceiro', 1],
];

function separaObra(txt) {
  // "Direito Concorrencial (Tratado de Direito Empresarial, vol. VII) - 3ª ed., 2022"
  const m = txt.match(/^(.*?)\s*\((.*?)\)\s*(?:-\s*(.*?))?$/);
  if (!m) return { titulo: txt, detalhe: '', ano: '' };
  let [, titulo, entre, depois = ''] = m;
  const partes = [entre];
  let ano = '';
  const anoM = (depois || entre).match(/(\d{2}\/)?(\d{4})\s*\)?$/);
  if (anoM) ano = anoM[2];
  if (/pendente/i.test(entre)) {
    // "Publicação pendente - Thomson Reuters, 01/2026"
    const editora = entre.split('-').slice(1).join('-').replace(/,?\s*\d{2}\/\d{4}$/, '').trim();
    return { titulo, detalhe: `${editora} · publicação pendente`, ano };
  }
  if (depois) partes.push(depois.replace(/,?\s*\d{4}$/, '').trim());
  return { titulo, detalhe: partes.filter(Boolean).join(' · '), ano };
}

mkdirSync('uploads/profissionais', { recursive: true });
const profissionais = EQUIPE.map(([slug, categoria, ordem]) => {
  const html = ler(`profissionais/${slug}.html`);
  const nome = pega(html, /<h1 class="profile-name">([^<]+)<\/h1>/);
  const titulo = pega(html, /<p class="profile-role">([^<]+)<\/p>/);
  const email = pega(html, /class="info-chip email-label">([^<]+)</);
  const fotoOrig = pega(html, /<img src="([^"]+)" alt="[^"]*" class="profile-photo/);
  const curriculo = pega(html, /class="card-content-elegant">([\s\S]*?)<\/div>/)
    .replace(/<span class="highlight-text">([\s\S]*?)<\/span>/g, '<strong>$1</strong>')
    .split(/\n\s*/).filter(Boolean).join('\n');
  const obras = [...html.matchAll(/class="book-item-elegant">([^<]+)</g)].map((m) => separaObra(m[1].trim()));
  const foto = `/uploads/profissionais/${slug}.jpg`;
  copyFileSync(`profissionais/${fotoOrig}`, `.${foto}`);
  return {
    slug, nome, categoria, ordem,
    titulo: categoria === 'parceiro' && slug === 'cristhiane' ? 'Advogada e Economista' : titulo,
    foto, email, links: [], curriculo,
    resumo: resumir(textoPuro(curriculo), 160),
    obras,
  };
});

// ---------- Publicações ----------
function tipoPorTitulo(t) {
  const T = t.toUpperCase();
  if (/PODCAST|WEBINAR/.test(T)) return 'podcast';
  if (/EDIÇÃO DA OBRA|NOVA OBRA/.test(T)) return 'livro';
  if (/ENTREVISTA/.test(T)) return 'entrevista';
  if (/RANKING|MAIS ADMIRADAS/.test(T)) return 'reconhecimento';
  if (/ASSOCIAÇÃO|APRESENTAÇÃO/.test(T)) return 'evento';
  return 'artigo';
}

mkdirSync('uploads/publicacoes', { recursive: true });
function converteConteudo(c) {
  const html = c
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((seg) => seg.trim())
    .filter(Boolean)
    .map((seg) => (/<[a-z]/i.test(seg) ? seg : `<p>${escapa(seg).replace(/\n/g, '<br>')}</p>`))
    .join('\n')
    .replace(/\sstyle="[^"]*"/g, '');
  return html.replace(/\/static\/uploads\/([^"]+)/g, (_, nome) => {
    copyFileSync(`static/uploads/${nome}`, `uploads/publicacoes/${nome}`);
    return `/uploads/publicacoes/${nome}`;
  });
}

const artigos = JSON.parse(ler('artigos.json'));
const slugs = [];
const publicacoes = artigos.map((a) => {
  const slug = uniqueSlug(slugify(a.titulo), slugs);
  slugs.push(slug);
  const conteudo = converteConteudo(a.conteudo);
  const capa = pega(conteudo, /src="(\/uploads\/publicacoes\/[^"]+)"/) || null;
  return {
    slug, titulo: a.titulo.trim(), data: parseDataExtenso(a.data),
    autor: a.autor.replace(/^Dra?\.\s*/, '').trim(),
    tipo: tipoPorTitulo(a.titulo),
    resumo: resumir(textoPuro(a.resumo || conteudo), 220),
    conteudo, capa, legado: { id: String(a.id) },
  };
});

const noticias = JSON.parse(ler('noticias.json'));
for (const numero of [2, 3]) {
  const n = noticias.find((x) => String(x.numero) === String(numero));
  const html = ler(`noticia${numero}.html`);
  const conteudo = pega(html, /class="noticia-texto">([\s\S]*?)<\/div>/)
    .split(/\n\s*/).filter(Boolean).join('\n');
  const slug = uniqueSlug(slugify(n.titulo), slugs);
  slugs.push(slug);
  publicacoes.push({
    slug, titulo: n.titulo.trim(), data: '2025-11-26',
    autor: n.autor.replace(/^Dra?\.\s*/, '').trim(),
    tipo: 'artigo',
    resumo: resumir(textoPuro(conteudo), 220),
    conteudo, capa: null, legado: { noticia: numero },
  });
}

mkdirSync('content', { recursive: true });
writeFileSync('content/profissionais.json', JSON.stringify({ profissionais }, null, 2) + '\n');
writeFileSync('content/publicacoes.json', JSON.stringify({ publicacoes }, null, 2) + '\n');
console.log(`profissionais: ${profissionais.length}, publicações: ${publicacoes.length}`);
for (const p of publicacoes) console.log(`${p.data} ${p.tipo.padEnd(14)} ${p.slug}`);
for (const o of profissionais[0].obras) console.log('obra:', JSON.stringify(o));
if (!existsSync('uploads/publicacoes')) throw new Error('uploads ausente');
void basename;
